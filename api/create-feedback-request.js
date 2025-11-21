import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Rate limiting: Track requests by IP
const requestCounts = new Map();
const RATE_LIMIT = 20; // 20 requests per week
const RATE_LIMIT_WINDOW = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds

/**
 * Create a feedback request and send email invitations
 *
 * POST /api/create-feedback-request
 * Body: {
 *   userEmail: string (optional),
 *   userName: string (required),
 *   skills: array of skill objects (required),
 *   contacts: array of {email, relationship} (required),
 *   personalMessage: string (optional)
 * }
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error: Supabase not configured' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('Missing Resend API key');
    return res.status(500).json({ error: 'Server configuration error: Email service not configured' });
  }

  // Initialize clients (inside handler to avoid initialization errors)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { userEmail, userName, skills, contacts, personalMessage } = req.body;

    // Validation
    if (!userName || !skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'userName and skills are required' });
    }

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'At least one contact is required' });
    }

    if (contacts.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 contacts per request' });
    }

    if (skills.length > 15) {
      return res.status(400).json({ error: 'Maximum 15 skills per request' });
    }

    // Rate limiting by IP
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();

    if (requestCounts.has(clientIp)) {
      const { count, firstRequest } = requestCounts.get(clientIp);

      if (now - firstRequest < RATE_LIMIT_WINDOW) {
        if (count >= RATE_LIMIT) {
          return res.status(429).json({
            error: 'Rate limit exceeded. Maximum 20 requests per week.'
          });
        }
        requestCounts.set(clientIp, { count: count + 1, firstRequest });
      } else {
        // Reset counter after window expires
        requestCounts.set(clientIp, { count: 1, firstRequest: now });
      }
    } else {
      requestCounts.set(clientIp, { count: 1, firstRequest: now });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const contact of contacts) {
      if (!contact.email || !emailRegex.test(contact.email)) {
        return res.status(400).json({
          error: `Invalid email address: ${contact.email}`
        });
      }
      if (!contact.relationship) {
        return res.status(400).json({
          error: 'Relationship is required for each contact'
        });
      }
    }

    // Create feedback request in database
    const { data: request, error: dbError } = await supabase
      .from('feedback_requests')
      .insert([
        {
          user_email: userEmail || null,
          user_name: userName,
          skills: skills,
          contacts: contacts,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          status: 'active'
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to create feedback request' });
    }

    const requestId = request.id;

    // Generate feedback URL
    const feedbackUrl = `${process.env.VERCEL_URL || 'http://localhost:5173'}/feedback/${requestId}`;

    // Send email invitations to all contacts
    const emailPromises = contacts.map(async (contact) => {
      try {
        const emailHtml = generateFeedbackEmail({
          userName,
          contactName: contact.name || 'there',
          relationship: contact.relationship,
          skills,
          feedbackUrl,
          personalMessage,
          expiresInDays: 30
        });

        await resend.emails.send({
          from: process.env.FEEDBACK_FROM_EMAIL || 'noreply@resend.dev',
          to: contact.email,
          subject: `${userName} is requesting your feedback on their professional skills`,
          html: emailHtml
        });

        return { email: contact.email, status: 'sent' };
      } catch (emailError) {
        console.error(`Failed to send email to ${contact.email}:`, emailError);
        return { email: contact.email, status: 'failed', error: emailError.message };
      }
    });

    const emailResults = await Promise.all(emailPromises);

    // Check if any emails failed
    const failedEmails = emailResults.filter(r => r.status === 'failed');
    if (failedEmails.length > 0) {
      console.warn('Some emails failed to send:', failedEmails);
    }

    return res.status(200).json({
      success: true,
      requestId,
      feedbackUrl,
      emailsSent: emailResults.filter(r => r.status === 'sent').length,
      emailsFailed: failedEmails.length,
      failedEmails: failedEmails.map(e => e.email)
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Generate HTML email template for feedback request
 */
function generateFeedbackEmail({ userName, contactName, relationship, skills, feedbackUrl, personalMessage, expiresInDays }) {
  const skillsList = skills.slice(0, 6).map(s => s.name).join(', ');
  const moreSkills = skills.length > 6 ? ` and ${skills.length - 6} more` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedback Request from ${userName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Skill Validation Request</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">

    <p style="font-size: 16px; margin-top: 0;">Hi ${contactName},</p>

    <p style="font-size: 16px;">
      <strong>${userName}</strong> has asked for your input on their professional skills as part of their career development assessment.
    </p>

    ${personalMessage ? `
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-style: italic; color: #1e40af;">"${personalMessage}"</p>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">— ${userName}</p>
    </div>
    ` : ''}

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e5e7eb;">
      <h2 style="margin-top: 0; font-size: 18px; color: #111827;">Skills to Validate:</h2>
      <p style="color: #6b7280; margin: 10px 0;">
        ${skillsList}${moreSkills}
      </p>
      <p style="font-size: 14px; color: #9ca3af; margin: 10px 0 0 0;">
        Total: ${skills.length} skill${skills.length > 1 ? 's' : ''}
      </p>
    </div>

    <p style="font-size: 16px;">
      Your feedback will help ${userName} understand how others perceive their skills and identify areas for development.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${feedbackUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Provide Feedback
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; text-align: center;">
      ⏱️ This should take about 3-5 minutes
    </p>

    <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 25px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⚠️ This link expires in ${expiresInDays} days.</strong><br>
        Please provide your feedback soon.
      </p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 13px; color: #9ca3af;">
        Your feedback will be shared with ${userName}. You can choose to remain anonymous or provide your name.
      </p>
      <p style="font-size: 13px; color: #9ca3af;">
        If you have any questions, please contact ${userName} directly${relationship ? ` (they listed you as: ${relationship})` : ''}.
      </p>
    </div>

  </div>

  <div style="text-align: center; margin-top: 20px; padding: 20px;">
    <p style="font-size: 12px; color: #9ca3af;">
      Powered by Career Path Navigator<br>
      <a href="${feedbackUrl}" style="color: #667eea; text-decoration: none;">View feedback form</a>
    </p>
  </div>

</body>
</html>
  `.trim();
}

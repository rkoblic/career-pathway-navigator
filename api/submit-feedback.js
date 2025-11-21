import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Rate limiting: Track submissions by IP
const submissionCounts = new Map();
const RATE_LIMIT = 10; // 10 submissions per day per IP
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Submit feedback for a feedback request
 *
 * POST /api/submit-feedback
 * Body: {
 *   requestId: string (required),
 *   providerEmail: string (optional - for verification),
 *   providerName: string (optional),
 *   providerRelationship: string (required),
 *   skillRatings: array of {skillName, rating, confidence, comments, examples} (required),
 *   overallComments: string (optional),
 *   anonymous: boolean (default: false)
 * }
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      requestId,
      providerEmail,
      providerName,
      providerRelationship,
      skillRatings,
      overallComments,
      anonymous = false
    } = req.body;

    // Validation
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    if (!providerRelationship) {
      return res.status(400).json({ error: 'Relationship is required' });
    }

    if (!skillRatings || !Array.isArray(skillRatings) || skillRatings.length === 0) {
      return res.status(400).json({ error: 'At least one skill rating is required' });
    }

    // Validate skill ratings
    const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    for (const rating of skillRatings) {
      if (!rating.skillName) {
        return res.status(400).json({ error: 'Skill name is required for each rating' });
      }
      if (!rating.rating || !validLevels.includes(rating.rating)) {
        return res.status(400).json({
          error: `Invalid proficiency rating for ${rating.skillName}. Must be: Beginner, Intermediate, Advanced, or Expert`
        });
      }
      if (rating.confidence !== undefined && (rating.confidence < 0 || rating.confidence > 100)) {
        return res.status(400).json({
          error: `Confidence must be between 0 and 100 for ${rating.skillName}`
        });
      }
    }

    // Validate email if provided
    if (providerEmail && !anonymous) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(providerEmail)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }
    }

    // Rate limiting by IP
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();

    if (submissionCounts.has(clientIp)) {
      const { count, firstSubmission } = submissionCounts.get(clientIp);

      if (now - firstSubmission < RATE_LIMIT_WINDOW) {
        if (count >= RATE_LIMIT) {
          return res.status(429).json({
            error: 'Rate limit exceeded. Maximum 10 submissions per day.'
          });
        }
        submissionCounts.set(clientIp, { count: count + 1, firstSubmission });
      } else {
        // Reset counter after window expires
        submissionCounts.set(clientIp, { count: 1, firstSubmission: now });
      }
    } else {
      submissionCounts.set(clientIp, { count: 1, firstSubmission: now });
    }

    // Check if feedback request exists and is active
    const { data: request, error: requestError } = await supabase
      .from('feedback_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Feedback request not found' });
    }

    // Check if request is expired
    const expiresAt = new Date(request.expires_at);
    if (expiresAt < new Date()) {
      return res.status(410).json({ error: 'This feedback request has expired' });
    }

    // Check if request is cancelled
    if (request.status !== 'active') {
      return res.status(410).json({ error: 'This feedback request is no longer active' });
    }

    // Check for duplicate submissions (same email/IP for same request)
    if (providerEmail) {
      const { data: existingFeedback } = await supabase
        .from('feedback_responses')
        .select('id')
        .eq('request_id', requestId)
        .eq('provider_email', providerEmail)
        .maybeSingle();

      if (existingFeedback) {
        return res.status(409).json({
          error: 'You have already submitted feedback for this request'
        });
      }
    }

    // Calculate credibility score
    const credibilityScore = calculateCredibilityScore({
      relationship: providerRelationship,
      hasEmail: !!providerEmail,
      hasName: !!providerName,
      anonymous,
      skillRatings
    });

    // Insert feedback response
    const { data: response, error: insertError } = await supabase
      .from('feedback_responses')
      .insert([
        {
          request_id: requestId,
          provider_email: anonymous ? null : (providerEmail || null),
          provider_name: anonymous ? null : (providerName || null),
          provider_relationship: providerRelationship,
          skill_ratings: skillRatings,
          overall_comments: overallComments || null,
          submitted_at: new Date().toISOString(),
          verified: !!providerEmail, // Email provided = verified
          anonymous
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      return res.status(500).json({ error: 'Failed to submit feedback' });
    }

    return res.status(200).json({
      success: true,
      responseId: response.id,
      credibilityScore,
      message: 'Thank you for your feedback!'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Calculate credibility score for feedback
 * Score ranges from 0.0 to 1.0
 */
function calculateCredibilityScore({ relationship, hasEmail, hasName, anonymous, skillRatings }) {
  let score = 0.5; // Base score

  // Relationship weight (0.0 - 0.4)
  const relationshipWeights = {
    'Manager': 0.4,
    'Former Manager': 0.4,
    'Direct Report': 0.35,
    'Colleague': 0.35,
    'Peer': 0.3,
    'Client': 0.3,
    'Mentor': 0.35,
    'Mentee': 0.25,
    'Friend': 0.2,
    'Other': 0.15
  };
  score += relationshipWeights[relationship] || 0.2;

  // Verification weight (0.0 - 0.3)
  if (hasEmail && !anonymous) {
    score += 0.3; // Email verification
  } else if (hasEmail && anonymous) {
    score += 0.15; // Email provided but anonymous
  }

  // Detail quality weight (0.0 - 0.2)
  const avgCommentLength = skillRatings.reduce((sum, r) =>
    sum + (r.comments?.length || 0) + (r.examples?.length || 0), 0
  ) / skillRatings.length;

  if (avgCommentLength > 100) {
    score += 0.2; // Detailed comments
  } else if (avgCommentLength > 50) {
    score += 0.15; // Some comments
  } else if (avgCommentLength > 20) {
    score += 0.1; // Brief comments
  }

  // Name provided (0.0 - 0.1)
  if (hasName && !anonymous) {
    score += 0.1;
  }

  // Confidence in ratings (if provided)
  const avgConfidence = skillRatings.reduce((sum, r) =>
    sum + (r.confidence || 50), 0
  ) / skillRatings.length;

  if (avgConfidence >= 80) {
    score += 0.05;
  }

  // Normalize to 0.0 - 1.0 range
  return Math.min(Math.max(score, 0), 1);
}

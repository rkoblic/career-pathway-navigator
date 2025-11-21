# Peer Feedback Validation System - Setup Guide

This guide will help you set up the infrastructure needed for the peer feedback validation feature.

## Prerequisites

- Vercel account (for hosting)
- GitHub account (for deployment)

## Step 1: Set up Supabase (Database)

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: career-path-navigator-feedback
   - **Database Password**: (generate a strong password - save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free
5. Click "Create new project" (takes ~2 minutes to provision)

### 1.2 Create Database Tables

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-schema.sql` from your project
4. Click "Run" to execute the schema

You should see: "Success. No rows returned"

### 1.3 Get Supabase Credentials

1. Go to **Settings** > **API** in your Supabase dashboard
2. Copy these values (you'll need them for Vercel):
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public API key** (starts with `eyJ...`)

---

## Step 2: Set up Resend (Email Service)

### 2.1 Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up with your email
3. Verify your email address

### 2.2 Get API Key

1. In Resend dashboard, go to **API Keys**
2. Click "Create API Key"
3. Name it: `career-path-navigator`
4. Copy the API key (starts with `re_...`)
5. **Save it immediately** - you won't be able to see it again!

### 2.3 Configure Sending Domain (Optional but Recommended)

**For production:**
1. Go to **Domains** in Resend
2. Click "Add Domain"
3. Enter your domain (e.g., `careerpathnavigator.com`)
4. Follow DNS configuration instructions
5. Wait for verification (usually 5-10 minutes)

**For testing:**
- You can use the default Resend domain
- Free tier: 100 emails/day, 3,000/month
- Emails will be sent from `noreply@resend.dev`

---

## Step 3: Configure Vercel Environment Variables

### 3.1 Add Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** > **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Where to get it |
|--------------|-------|-----------------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Settings > API |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJ...` | Supabase Settings > API (anon/public key) |
| `RESEND_API_KEY` | `re_...` | Resend API Keys |
| `FEEDBACK_FROM_EMAIL` | `noreply@yourdomain.com` | Your verified domain or `noreply@resend.dev` |

4. Click "Save" for each variable

### 3.2 Redeploy Application

After adding environment variables:
1. Go to **Deployments** tab in Vercel
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. Environment variables will now be available to your serverless functions

---

## Step 4: Test the Setup

### 4.1 Verify Database Connection

You can test the database connection by running:

```bash
npm run dev
```

Then visit your local app and try to create a feedback request (once the UI is implemented).

### 4.2 Verify Email Sending

The first feedback request you create will test email sending. Check:
- Resend dashboard > **Emails** tab to see sent emails
- Your recipient's inbox (might be in spam first time)

### 4.3 Check Logs

Monitor for errors:
- **Supabase**: Dashboard > **Logs** > **Postgres Logs**
- **Resend**: Dashboard > **Emails** tab shows delivery status
- **Vercel**: Dashboard > **Functions** > Click function to see logs

---

## Troubleshooting

### Database Connection Fails

**Error**: "Failed to connect to Supabase"

**Solutions**:
1. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
2. Check that your IP isn't blocked (Supabase > Settings > Database > Connection Pooling)
3. Ensure RLS policies are enabled (they should be from the schema)

### Emails Not Sending

**Error**: "Failed to send email" or emails not received

**Solutions**:
1. Verify `RESEND_API_KEY` is correct
2. Check Resend dashboard > Emails for delivery status
3. Verify `FEEDBACK_FROM_EMAIL` is a verified domain or use `noreply@resend.dev`
4. Check spam folder
5. Verify you haven't exceeded free tier limits (100/day)

### CORS Errors

**Error**: "CORS policy blocked"

**Solutions**:
1. Make sure API routes are in `/api` directory
2. Vercel automatically handles CORS for API routes
3. Check that you're calling the API from the same domain

### Row Level Security Blocking Access

**Error**: "Permission denied" or "Row level security violation"

**Solutions**:
1. Verify RLS policies were created correctly from schema
2. For public access (feedback form), policies should allow anonymous access
3. Check Supabase > Authentication > Policies

---

## Security Best Practices

### Environment Variables

- ✅ **Never commit** API keys to GitHub
- ✅ Use Vercel environment variables for all secrets
- ✅ Rotate API keys periodically (every 90 days)

### Database Security

- ✅ Row Level Security (RLS) is enabled by default
- ✅ Public can only read active, non-expired requests
- ✅ Feedback submission is rate-limited in API functions
- ✅ Auto-deletion of old data after 90 days (GDPR compliance)

### Email Security

- ✅ Rate limit feedback requests (20/week per user in API)
- ✅ Validate email addresses before sending
- ✅ Include unsubscribe link in email templates
- ✅ Monitor Resend dashboard for spam complaints

---

## Monitoring & Maintenance

### Weekly Tasks

- Check Resend email delivery rates
- Monitor Supabase database size (free tier: 500MB)
- Review error logs in Vercel

### Monthly Tasks

- Run cleanup function: `SELECT delete_old_data();` in Supabase SQL Editor
- Review and rotate API keys if needed
- Check for Supabase/Resend service updates

---

## Free Tier Limits

### Supabase Free Tier
- **Database**: 500MB storage
- **Requests**: 50,000/month
- **Bandwidth**: 5GB/month
- **Should support**: ~1,000-5,000 users

### Resend Free Tier
- **Emails**: 100/day, 3,000/month
- **Should support**: ~100 feedback requests/day

### Scaling

If you exceed free tiers:
- **Supabase**: $25/month for Pro (8GB DB, 500K requests)
- **Resend**: $20/month for 50,000 emails

---

## Next Steps

Once environment variables are set up:

1. ✅ Database schema created
2. ✅ Email service configured
3. ✅ Environment variables added to Vercel
4. ✅ Application redeployed
5. 🔨 Implement API functions (in progress)
6. 🔨 Build UI components
7. 🧪 Test feedback workflow

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Resend Docs**: https://resend.com/docs
- **Vercel Docs**: https://vercel.com/docs

For issues specific to this implementation, check the API function code comments or create an issue in the repository.

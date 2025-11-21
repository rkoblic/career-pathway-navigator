-- Career Path Navigator - Feedback Validation System
-- Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Feedback Requests Table
CREATE TABLE feedback_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255),
  user_name VARCHAR(255) NOT NULL,
  skills JSONB NOT NULL, -- Array of skill objects to validate
  contacts JSONB NOT NULL, -- Array of contact objects {email, relationship}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled'))
);

-- Feedback Responses Table
CREATE TABLE feedback_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES feedback_requests(id) ON DELETE CASCADE,
  provider_email VARCHAR(255),
  provider_name VARCHAR(255),
  provider_relationship VARCHAR(100) NOT NULL, -- Colleague, Manager, Peer, Friend, Client, etc.
  skill_ratings JSONB NOT NULL, -- Array of {skillName, rating, confidence, comments, examples}
  overall_comments TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  anonymous BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_feedback_requests_user_email ON feedback_requests(user_email);
CREATE INDEX idx_feedback_requests_created_at ON feedback_requests(created_at);
CREATE INDEX idx_feedback_requests_status ON feedback_requests(status);
CREATE INDEX idx_feedback_responses_request_id ON feedback_responses(request_id);
CREATE INDEX idx_feedback_responses_submitted_at ON feedback_responses(submitted_at);

-- Row Level Security Policies
ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active feedback requests (needed for public feedback form)
CREATE POLICY "Public can read active requests" ON feedback_requests
  FOR SELECT
  USING (status = 'active' AND expires_at > NOW());

-- Allow anyone to insert feedback requests (anonymous app usage)
CREATE POLICY "Anyone can create feedback requests" ON feedback_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own requests (for cancellation)
CREATE POLICY "Users can update own requests" ON feedback_requests
  FOR UPDATE
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Allow anyone to submit feedback (public access)
CREATE POLICY "Anyone can submit feedback" ON feedback_responses
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read feedback for their requests
CREATE POLICY "Users can read feedback for their requests" ON feedback_responses
  FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM feedback_requests
      WHERE user_email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Function to auto-expire old requests (run via cron job)
CREATE OR REPLACE FUNCTION expire_old_requests()
RETURNS void AS $$
BEGIN
  UPDATE feedback_requests
  SET status = 'expired'
  WHERE expires_at < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to delete old data (GDPR compliance - run via cron job)
CREATE OR REPLACE FUNCTION delete_old_data()
RETURNS void AS $$
BEGIN
  -- Delete feedback responses older than 90 days
  DELETE FROM feedback_responses
  WHERE submitted_at < NOW() - INTERVAL '90 days';

  -- Delete expired requests older than 90 days
  DELETE FROM feedback_requests
  WHERE expires_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE feedback_requests IS 'Stores peer feedback validation requests for user skills';
COMMENT ON TABLE feedback_responses IS 'Stores feedback submissions from peers';
COMMENT ON COLUMN feedback_requests.skills IS 'JSON array of skill objects: [{name, lightcastId, currentLevel, etc}]';
COMMENT ON COLUMN feedback_requests.contacts IS 'JSON array of contacts: [{email, relationship}]';
COMMENT ON COLUMN feedback_responses.skill_ratings IS 'JSON array: [{skillName, rating, confidence, comments, examples}]';

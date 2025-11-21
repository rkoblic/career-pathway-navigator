import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Get feedback for a user's skills
 *
 * GET /api/get-feedback?requestId=xxx
 * or
 * GET /api/get-feedback?userEmail=xxx
 *
 * Returns aggregated feedback data for all skills
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { requestId, userEmail } = req.query;

    if (!requestId && !userEmail) {
      return res.status(400).json({
        error: 'Either requestId or userEmail is required'
      });
    }

    let feedbackRequests = [];

    // Get feedback request(s)
    if (requestId) {
      const { data, error } = await supabase
        .from('feedback_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Feedback request not found' });
      }

      feedbackRequests = [data];
    } else {
      // Get all requests for this user email
      const { data, error } = await supabase
        .from('feedback_requests')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to fetch feedback requests' });
      }

      feedbackRequests = data || [];
    }

    if (feedbackRequests.length === 0) {
      return res.status(200).json({
        requests: [],
        totalFeedback: 0,
        skillFeedback: {}
      });
    }

    // Get all feedback responses for these requests
    const requestIds = feedbackRequests.map(r => r.id);

    const { data: responses, error: responsesError } = await supabase
      .from('feedback_responses')
      .select('*')
      .in('request_id', requestIds)
      .order('submitted_at', { ascending: false });

    if (responsesError) {
      console.error('Database error:', responsesError);
      return res.status(500).json({ error: 'Failed to fetch feedback responses' });
    }

    // Aggregate feedback by skill
    const skillFeedback = aggregateFeedbackBySkill(responses || []);

    // Format request data with response counts
    const formattedRequests = feedbackRequests.map(request => {
      const requestResponses = (responses || []).filter(r => r.request_id === request.id);
      const contactCount = request.contacts?.length || 0;

      return {
        id: request.id,
        userName: request.user_name,
        skills: request.skills,
        contactCount,
        responseCount: requestResponses.length,
        responseRate: contactCount > 0 ? (requestResponses.length / contactCount) : 0,
        createdAt: request.created_at,
        expiresAt: request.expires_at,
        status: request.status,
        isExpired: new Date(request.expires_at) < new Date(),
        responses: requestResponses.map(r => ({
          id: r.id,
          providerName: r.anonymous ? 'Anonymous' : (r.provider_name || 'Anonymous'),
          relationship: r.provider_relationship,
          anonymous: r.anonymous,
          verified: r.verified,
          submittedAt: r.submitted_at,
          skillRatings: r.skill_ratings,
          overallComments: r.overall_comments
        }))
      };
    });

    return res.status(200).json({
      requests: formattedRequests,
      totalFeedback: responses?.length || 0,
      skillFeedback
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Aggregate feedback responses by skill
 * Returns comprehensive statistics for each skill
 */
function aggregateFeedbackBySkill(responses) {
  const skillMap = new Map();

  // Collect all ratings for each skill
  responses.forEach(response => {
    const skillRatings = response.skill_ratings || [];

    skillRatings.forEach(rating => {
      const skillName = rating.skillName;

      if (!skillMap.has(skillName)) {
        skillMap.set(skillName, {
          skillName,
          ratings: [],
          comments: [],
          examples: []
        });
      }

      const skillData = skillMap.get(skillName);

      skillData.ratings.push({
        level: rating.rating,
        confidence: rating.confidence || 50,
        providerRelationship: response.provider_relationship,
        providerName: response.anonymous ? 'Anonymous' : (response.provider_name || 'Anonymous'),
        verified: response.verified,
        submittedAt: response.submitted_at
      });

      if (rating.comments) {
        skillData.comments.push({
          text: rating.comments,
          providerName: response.anonymous ? 'Anonymous' : (response.provider_name || 'Anonymous'),
          relationship: response.provider_relationship,
          submittedAt: response.submitted_at
        });
      }

      if (rating.examples) {
        skillData.examples.push({
          text: rating.examples,
          providerName: response.anonymous ? 'Anonymous' : (response.provider_name || 'Anonymous'),
          submittedAt: response.submitted_at
        });
      }
    });
  });

  // Calculate statistics for each skill
  const skillFeedback = {};
  const levelValues = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 };
  const levelNames = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  skillMap.forEach((data, skillName) => {
    const ratings = data.ratings;
    const ratingCounts = { 'Beginner': 0, 'Intermediate': 0, 'Advanced': 0, 'Expert': 0 };

    ratings.forEach(r => {
      ratingCounts[r.level]++;
    });

    // Calculate average rating (numeric)
    const avgNumeric = ratings.reduce((sum, r) => sum + levelValues[r.level], 0) / ratings.length;
    const avgLevel = levelNames[Math.round(avgNumeric) - 1];

    // Calculate weighted average (by confidence)
    const weightedSum = ratings.reduce((sum, r) => sum + (levelValues[r.level] * r.confidence), 0);
    const totalConfidence = ratings.reduce((sum, r) => sum + r.confidence, 0);
    const weightedAvgNumeric = totalConfidence > 0 ? weightedSum / totalConfidence : avgNumeric;
    const weightedAvgLevel = levelNames[Math.round(weightedAvgNumeric) - 1];

    // Find most common rating (mode)
    const mode = Object.entries(ratingCounts)
      .reduce((a, b) => b[1] > a[1] ? b : a)[0];

    // Calculate consensus (what % agree with mode)
    const consensus = ratingCounts[mode] / ratings.length;

    // Calculate credibility score (average of provider credibility)
    const avgCredibility = ratings.reduce((sum, r) => {
      const credibility = calculateProviderCredibility(r);
      return sum + credibility;
    }, 0) / ratings.length;

    // Identify highest credibility rating
    const highestCredibilityRating = ratings.reduce((best, current) => {
      const currentCred = calculateProviderCredibility(current);
      const bestCred = calculateProviderCredibility(best);
      return currentCred > bestCred ? current : best;
    });

    skillFeedback[skillName] = {
      feedbackCount: ratings.length,
      distribution: ratingCounts,
      averageRating: avgLevel,
      averageNumeric: avgNumeric.toFixed(2),
      weightedAverageRating: weightedAvgLevel,
      weightedNumeric: weightedAvgNumeric.toFixed(2),
      mostCommonRating: mode,
      consensus: consensus.toFixed(2),
      credibilityScore: avgCredibility.toFixed(2),
      highestCredibilityRating: {
        level: highestCredibilityRating.level,
        providerName: highestCredibilityRating.providerName,
        relationship: highestCredibilityRating.providerRelationship,
        credibility: calculateProviderCredibility(highestCredibilityRating).toFixed(2)
      },
      ratings: ratings.sort((a, b) =>
        new Date(b.submittedAt) - new Date(a.submittedAt)
      ),
      comments: data.comments.sort((a, b) =>
        new Date(b.submittedAt) - new Date(a.submittedAt)
      ),
      examples: data.examples.sort((a, b) =>
        new Date(b.submittedAt) - new Date(a.submittedAt)
      )
    };
  });

  return skillFeedback;
}

/**
 * Calculate credibility score for a feedback provider
 */
function calculateProviderCredibility(rating) {
  let score = 0.5;

  // Relationship weight
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
  score += relationshipWeights[rating.providerRelationship] || 0.2;

  // Verification weight
  if (rating.verified) {
    score += 0.3;
  }

  // Confidence weight
  if (rating.confidence >= 80) {
    score += 0.2;
  } else if (rating.confidence >= 60) {
    score += 0.1;
  }

  return Math.min(Math.max(score, 0), 1);
}

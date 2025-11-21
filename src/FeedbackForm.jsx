import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Send, Star } from 'lucide-react';

export default function FeedbackForm() {
  const { requestId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [request, setRequest] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [providerName, setProviderName] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [providerRelationship, setProviderRelationship] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [skillRatings, setSkillRatings] = useState({});
  const [overallComments, setOverallComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch feedback request details
  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/get-feedback?requestId=${requestId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load feedback request');
      }

      if (!data.requests || data.requests.length === 0) {
        throw new Error('Feedback request not found');
      }

      const req = data.requests[0];

      // Check if expired
      if (req.isExpired) {
        throw new Error('This feedback request has expired');
      }

      setRequest(req);

      // Initialize skill ratings
      const initialRatings = {};
      req.skills.forEach(skill => {
        initialRatings[skill.name] = {
          rating: '',
          confidence: 70,
          comments: '',
          examples: ''
        };
      });
      setSkillRatings(initialRatings);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSkillRating = (skillName, field, value) => {
    setSkillRatings(prev => ({
      ...prev,
      [skillName]: {
        ...prev[skillName],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!providerRelationship) {
      alert('Please select your relationship');
      return;
    }

    // Check that at least one skill is rated
    const ratedSkills = Object.entries(skillRatings).filter(([_, rating]) => rating.rating !== '');
    if (ratedSkills.length === 0) {
      alert('Please rate at least one skill');
      return;
    }

    if (!anonymous && providerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(providerEmail)) {
        alert('Please enter a valid email address');
        return;
      }
    }

    setSubmitting(true);

    try {
      const formattedRatings = ratedSkills.map(([skillName, rating]) => ({
        skillName,
        rating: rating.rating,
        confidence: rating.confidence,
        comments: rating.comments,
        examples: rating.examples
      }));

      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          providerEmail: anonymous ? null : providerEmail,
          providerName: anonymous ? null : providerName,
          providerRelationship,
          skillRatings: formattedRatings,
          overallComments,
          anonymous
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSubmitted(true);

    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feedback request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Request Not Available</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-4">
            Your feedback has been submitted successfully.
          </p>
          <p className="text-sm text-gray-500">
            {request.userName} will receive your feedback to help with their career development.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Skill Feedback Request
            </h1>
            <p className="text-gray-600">
              <strong>{request.userName}</strong> has requested your feedback on their professional skills
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-gray-700">
              Your honest feedback will help {request.userName} understand their strengths and areas for development.
              This should take about 3-5 minutes.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Information */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Relationship <span className="text-red-500">*</span>
                </label>
                <select
                  value={providerRelationship}
                  onChange={(e) => setProviderRelationship(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select your relationship</option>
                  <option value="Manager">Manager</option>
                  <option value="Former Manager">Former Manager</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Peer">Peer</option>
                  <option value="Direct Report">Direct Report</option>
                  <option value="Client">Client</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Mentee">Mentee</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    disabled={anonymous}
                    placeholder="Your name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={providerEmail}
                    onChange={(e) => setProviderEmail(e.target.value)}
                    disabled={anonymous}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => {
                      setAnonymous(e.target.checked);
                      if (e.target.checked) {
                        setProviderName('');
                        setProviderEmail('');
                      }
                    }}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Submit anonymously</span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  Your feedback will be shared, but your identity will remain private
                </p>
              </div>
            </div>
          </div>

          {/* Skill Ratings */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Rate Skills</h2>
            <p className="text-sm text-gray-600 mb-6">
              Rate each skill based on your observation of {request.userName}'s proficiency. You can skip skills you're not familiar with.
            </p>

            <div className="space-y-6">
              {request.skills.map((skill, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{skill.name}</h3>
                    {skill.category && (
                      <p className="text-sm text-gray-500">{skill.category}</p>
                    )}
                  </div>

                  {/* Proficiency Rating */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Proficiency Level
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => updateSkillRating(skill.name, 'rating', level)}
                          className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                            skillRatings[skill.name]?.rating === level
                              ? 'bg-purple-100 border-purple-500 text-purple-800'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-purple-300'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Confidence */}
                  {skillRatings[skill.name]?.rating && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Your Confidence in This Rating: {skillRatings[skill.name]?.confidence}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={skillRatings[skill.name]?.confidence}
                          onChange={(e) => updateSkillRating(skill.name, 'confidence', parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Not sure</span>
                          <span>Very confident</span>
                        </div>
                      </div>

                      {/* Comments */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Comments (Optional)
                        </label>
                        <textarea
                          value={skillRatings[skill.name]?.comments}
                          onChange={(e) => updateSkillRating(skill.name, 'comments', e.target.value)}
                          placeholder="Why did you rate this way? Any specific observations?"
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                      </div>

                      {/* Examples */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Specific Examples (Optional)
                        </label>
                        <textarea
                          value={skillRatings[skill.name]?.examples}
                          onChange={(e) => updateSkillRating(skill.name, 'examples', e.target.value)}
                          placeholder="Any specific examples or projects that demonstrate this skill level?"
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Overall Comments */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Overall Feedback</h2>
            <textarea
              value={overallComments}
              onChange={(e) => setOverallComments(e.target.value)}
              placeholder="Any additional comments or feedback for the candidate? (Optional)"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <button
              type="submit"
              disabled={submitting || !providerRelationship}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-semibold"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Feedback
                </>
              )}
            </button>
            <p className="text-xs text-center text-gray-500 mt-4">
              Your feedback will be shared with {request.userName} to support their professional development
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Static proficiency level definitions for skills
 * Used to provide consistent guidance to users when assessing their skill levels
 */

export const PROFICIENCY_LEVELS = {
  'Beginner': {
    title: 'Beginner',
    shortLabel: 'B',
    description: 'Learning the fundamentals',
    color: 'gray',
    criteria: [
      'Basic understanding of core concepts',
      'Can complete simple tasks with guidance or reference materials',
      'Limited practical experience (typically 0-1 years)',
      'Still building foundational knowledge'
    ],
    examples: 'Following tutorials, completing coursework, first-time practical use'
  },
  'Intermediate': {
    title: 'Intermediate',
    shortLabel: 'I',
    description: 'Comfortable with regular tasks',
    color: 'blue',
    criteria: [
      'Solid working knowledge of key concepts',
      'Can work independently on routine tasks and challenges',
      'Some practical experience (typically 1-3 years)',
      'Understands common patterns, tools, and best practices'
    ],
    examples: 'Building projects independently, solving common problems, applying skills in work context'
  },
  'Advanced': {
    title: 'Advanced',
    shortLabel: 'A',
    description: 'Deep expertise and problem-solving',
    color: 'green',
    criteria: [
      'Expert-level knowledge in most areas',
      'Can tackle complex challenges independently',
      'Significant practical experience (typically 3-5+ years)',
      'Teaches others and helps set team standards'
    ],
    examples: 'Architecting complex systems, mentoring others, optimizing sophisticated workflows'
  },
  'Expert': {
    title: 'Expert',
    shortLabel: 'E',
    description: 'Recognized authority and innovator',
    color: 'purple',
    criteria: [
      'Mastery across all aspects of the skill',
      'Industry-recognized expertise or thought leadership',
      'Extensive practical experience (typically 5-10+ years)',
      'Contributes to advancing the field or practice'
    ],
    examples: 'Thought leadership, creating new frameworks/methodologies, speaking at conferences, publishing research'
  }
};

/**
 * Get proficiency level definition by name
 * @param {string} level - The proficiency level name
 * @returns {Object} The proficiency level definition
 */
export const getProficiencyLevel = (level) => {
  return PROFICIENCY_LEVELS[level] || PROFICIENCY_LEVELS['Beginner'];
};

/**
 * Get all proficiency levels in order
 * @returns {Array} Array of proficiency level objects
 */
export const getAllProficiencyLevels = () => {
  return ['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(level => ({
    name: level,
    ...PROFICIENCY_LEVELS[level]
  }));
};

/**
 * Get proficiency level color class for Tailwind CSS
 * @param {string} level - The proficiency level name
 * @returns {string} Tailwind color class
 */
export const getProficiencyColorClass = (level) => {
  const colors = {
    'Beginner': 'bg-gray-100 text-gray-700 border-gray-300',
    'Intermediate': 'bg-blue-100 text-blue-700 border-blue-300',
    'Advanced': 'bg-green-100 text-green-700 border-green-300',
    'Expert': 'bg-purple-100 text-purple-700 border-purple-300'
  };
  return colors[level] || colors['Beginner'];
};

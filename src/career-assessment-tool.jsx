import React, { useState } from 'react';
import { Upload, Plus, X, CheckCircle, Briefcase, TrendingUp, BookOpen, GraduationCap, Clock, DollarSign, ChevronDown, ChevronUp, MapPin, Building, ExternalLink, Users } from 'lucide-react';

export default function CareerAssessmentTool() {
  const [step, setStep] = useState(1);
  const [resumeText, setResumeText] = useState('');
  const [skills, setSkills] = useState([]);
  const [careerPaths, setCareerPaths] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [expandedPathways, setExpandedPathways] = useState({});
  const [loadingPathway, setLoadingPathway] = useState(null);
  const [jobListings, setJobListings] = useState({});
  const [loadingJobs, setLoadingJobs] = useState(null);
  const [userLocation, setUserLocation] = useState('United States');

  // Sample resume for testing
  const sampleResume = `John Doe
Senior Software Engineer

EXPERIENCE
Senior Software Engineer at Tech Corp (2020-Present)
- Led team of 5 developers building React web applications
- Implemented CI/CD pipelines using Jenkins and Docker
- Reduced application load time by 40% through optimization
- Mentored junior developers and conducted code reviews

Software Engineer at StartupXYZ (2017-2020)
- Developed RESTful APIs using Node.js and Express
- Built responsive frontend interfaces with React and TypeScript
- Managed PostgreSQL databases and wrote complex SQL queries
- Collaborated with product team using Agile methodology

EDUCATION
B.S. Computer Science, State University (2017)

SKILLS
- Programming: JavaScript, TypeScript, Python, Java
- Frontend: React, Vue.js, HTML, CSS, Tailwind
- Backend: Node.js, Express, Django
- Databases: PostgreSQL, MongoDB, Redis
- Tools: Git, Docker, Jenkins, AWS
- Soft Skills: Leadership, Communication, Problem Solving, Team Collaboration`;

  const loadSampleResume = () => {
    setResumeText(sampleResume);
  };

  // Helper function to extract JSON from Claude's response
  const extractJSON = (text) => {
    // Remove markdown code blocks
    let cleaned = text.trim();
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Try to find JSON array or object
    const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    const objectMatch = cleaned.match(/\{\s*"[\s\S]*\}\s*$/);

    if (arrayMatch) {
      return arrayMatch[0];
    } else if (objectMatch) {
      return objectMatch[0];
    }

    // If no match, return cleaned text
    return cleaned;
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      let text = '';
      
      // Handle different file types
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // Plain text file
        text = await file.text();
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 file.name.endsWith('.docx') || 
                 file.type === 'application/msword' || 
                 file.name.endsWith('.doc')) {
        // Word document - use mammoth to extract text
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // PDF file
        alert('PDF support coming soon. Please convert to .txt or .docx, or paste your resume text.');
        setIsProcessing(false);
        return;
      } else {
        // Try to read as text for other formats
        text = await file.text();
      }
      
      if (text && text.trim()) {
        setResumeText(text);
        await extractSkills(text);
      } else {
        alert('Could not read file content. Please try a .txt or .docx file, or paste your resume below.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try a .txt or .docx file, or paste your resume text below.');
      setIsProcessing(false);
    }
  };

  // Extract skills from resume and map to Lightcast taxonomy
  const extractSkills = async (text) => {
    console.log('extractSkills called');
    
    if (!text || !text.trim()) {
      alert('Please provide resume text first.');
      return;
    }

    console.log('Text length:', text.length);
    setIsProcessing(true);
    
    try {
      console.log('Step 1: Extracting skills from resume...');
      
      // Step 1: Extract raw skills from resume
      const extractResponse = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `Analyze this resume and extract all skills, competencies, and areas of expertise. Return ONLY a valid JSON array of skill names.

Resume:
${text}

IMPORTANT: Return ONLY a JSON array of skill name strings, with no markdown, no backticks, no explanation:
["JavaScript", "Leadership", "Project Management", "Python"]`
          }]
        })
      });

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        throw new Error(`Skill extraction failed: ${extractResponse.status}`);
      }

      const extractData = await extractResponse.json();
      let rawSkillsText = extractData.content[0].text;

      console.log('Raw API response (first 500 chars):', rawSkillsText.substring(0, 500));
      console.log('Raw API response (last 200 chars):', rawSkillsText.substring(rawSkillsText.length - 200));

      // Use helper to extract JSON
      rawSkillsText = extractJSON(rawSkillsText);
      console.log('Cleaned JSON string (first 500 chars):', rawSkillsText.substring(0, 500));

      let rawSkills;
      try {
        rawSkills = JSON.parse(rawSkillsText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Failed to parse text:', rawSkillsText);
        throw new Error(`Failed to parse skills from response: ${parseError.message}`);
      }

      console.log('Extracted raw skills:', rawSkills);
      console.log('Step 2: Mapping to Lightcast taxonomy...');
      
      // Step 2: Map to Lightcast taxonomy
      const mappingResponse = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          messages: [{
            role: 'user',
            content: `Map these skills to the Lightcast (formerly Emsi Burning Glass) skills taxonomy. For each skill, provide:
- "name": The standardized Lightcast skill name
- "lightcastId": A plausible Lightcast skill ID (format: KS followed by alphanumeric, e.g., "KS125LS6N7WL4S6JWKHS")
- "category": Skill type (Hard Skills, Soft Skills, Software and Applications, Specialized Skills, or Certifications)
- "level": Proficiency level based on context (Beginner, Intermediate, Advanced, Expert)
- "type": Lightcast skill type (Specialized Knowledge, Core Competency, or Common Skill)

Skills to map:
${JSON.stringify(rawSkills)}

Use actual Lightcast taxonomy conventions. Common examples:
- JavaScript → "JavaScript (Programming Language)" [KS125LS6N7WL4S6JWKHS]
- Communication → "Communication" [KS120FG6YP8QYTY9TQ2R]
- Project Management → "Project Management" [KS440M26YDGYY84T9X5Y]
- Python → "Python (Programming Language)" [KS1200364C9C1LK3V5Q1]
- Leadership → "Leadership" [KS125QD6K0QLLCS5GZ0Q]

Return ONLY valid JSON array with no other text:
[{"name": "JavaScript (Programming Language)", "lightcastId": "KS125LS6N7WL4S6JWKHS", "category": "Software and Applications", "level": "Advanced", "type": "Specialized Knowledge"}]`
          }]
        })
      });

      if (!mappingResponse.ok) {
        throw new Error(`Lightcast mapping failed: ${mappingResponse.status}`);
      }

      const mappingData = await mappingResponse.json();
      let mappedSkillsText = mappingData.content[0].text;

      console.log('Mapping response (first 500 chars):', mappedSkillsText.substring(0, 500));

      // Use helper to extract JSON
      mappedSkillsText = extractJSON(mappedSkillsText);
      console.log('Cleaned mapping JSON (first 500 chars):', mappedSkillsText.substring(0, 500));

      let mappedSkills;
      try {
        mappedSkills = JSON.parse(mappedSkillsText);
      } catch (parseError) {
        console.error('JSON Parse Error in mapping:', parseError);
        console.error('Failed to parse mapping text:', mappedSkillsText);
        throw new Error(`Failed to parse skill mapping from response: ${parseError.message}`);
      }

      console.log('Mapped to Lightcast skills:', mappedSkills);
      
      if (Array.isArray(mappedSkills) && mappedSkills.length > 0) {
        setSkills(mappedSkills);
        setStep(2);
      } else {
        alert('No skills were extracted. Please check your resume format and try again.');
      }
    } catch (error) {
      console.error('Error in extractSkills:', error);
      alert(`Error processing resume: ${error.message}. Check the console for details.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add a new skill
  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, { 
        name: newSkill.trim(), 
        lightcastId: 'KS' + Math.random().toString(36).substr(2, 18).toUpperCase(),
        category: 'Hard Skills', 
        level: 'Intermediate',
        type: 'Core Competency'
      }]);
      setNewSkill('');
    }
  };

  // Remove a skill
  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // Update skill property
  const updateSkill = (index, field, value) => {
    const updated = [...skills];
    updated[index][field] = value;
    setSkills(updated);
  };

  // Generate educational pathway for missing skills
  const generateEducationalPathway = async (careerIndex, career) => {
    setLoadingPathway(careerIndex);
    
    try {
      console.log('Generating educational pathway for:', career.title);
      
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          messages: [{
            role: 'user',
            content: `Create a detailed educational pathway to help someone learn these skills for a ${career.title} role.

Skills to Learn:
${JSON.stringify(career.skillsToLearn, null, 2)}

User's Current Skills (for context):
${JSON.stringify(skills.map(s => s.name), null, 2)}

Create a comprehensive learning pathway with the following structure:

Return a JSON object with:
- "timeline": Estimated time to complete (e.g., "3-6 months", "6-12 months")
- "difficulty": Overall difficulty level (Beginner-Friendly, Intermediate, Advanced)
- "learningSteps": Array of learning steps, each with:
  - "step": Step number
  - "title": What you'll learn
  - "duration": Estimated time (e.g., "2-4 weeks")
  - "resources": Array of 2-4 specific resources with:
    - "name": Resource name
    - "type": Resource type (Online Course, Book, Certification, Practice Platform, Tutorial Series, Bootcamp)
    - "provider": Provider name (e.g., Coursera, Udemy, LinkedIn Learning, specific website)
    - "cost": Cost category (Free, Paid, Freemium)
    - "url": A plausible URL (use real platforms)
  - "skills": Array of skill names covered in this step
  - "projects": 1-2 hands-on project ideas to practice

DO NOT include any text outside the JSON. Return only valid JSON.

Example format:
{
  "timeline": "4-6 months",
  "difficulty": "Intermediate",
  "learningSteps": [
    {
      "step": 1,
      "title": "Foundation in JavaScript",
      "duration": "3-4 weeks",
      "resources": [
        {
          "name": "JavaScript Fundamentals",
          "type": "Online Course",
          "provider": "Codecademy",
          "cost": "Freemium",
          "url": "https://www.codecademy.com/learn/introduction-to-javascript"
        }
      ],
      "skills": ["JavaScript (Programming Language)", "ES6+"],
      "projects": ["Build a to-do list app", "Create an interactive calculator"]
    }
  ]
}`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;

      console.log('Educational pathway response (first 500 chars):', responseText.substring(0, 500));

      // Use helper to extract JSON
      responseText = extractJSON(responseText);

      let pathway;
      try {
        pathway = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error in educational pathway:', parseError);
        console.error('Failed to parse pathway text:', responseText);
        throw new Error(`Failed to parse educational pathway: ${parseError.message}`);
      }

      console.log('Educational pathway parsed successfully:', pathway);
      
      setExpandedPathways(prev => ({
        ...prev,
        [careerIndex]: pathway
      }));
      
    } catch (error) {
      console.error('Error generating educational pathway:', error);
      alert(`Error generating pathway: ${error.message}`);
    } finally {
      setLoadingPathway(null);
    }
  };

  // Toggle educational pathway display
  const togglePathway = (careerIndex, career) => {
    if (expandedPathways[careerIndex]) {
      // Collapse
      setExpandedPathways(prev => {
        const newState = { ...prev };
        delete newState[careerIndex];
        return newState;
      });
    } else {
      // Expand and generate if not already generated
      generateEducationalPathway(careerIndex, career);
    }
  };

  // Search for job listings for a specific career
  const searchJobListings = async (careerIndex, career) => {
    setLoadingJobs(careerIndex);
    
    try {
      console.log('Searching job listings for:', career.title);
      
      // First, use web search to find job listings
      const searchQuery = `${career.title} jobs ${userLocation} remote`;
      
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          messages: [{
            role: 'user',
            content: `Search for current job listings for "${career.title}" positions. Focus on positions in ${userLocation} and remote opportunities.

Create a job market summary with:

Return a JSON object with:
- "totalEstimate": Estimated number of current openings (e.g., "2,500+", "500-1,000")
- "remotePercentage": Percentage of jobs offering remote work (e.g., "35%")
- "averageSalary": Average salary range for this role in this location
- "topCompanies": Array of 5-7 top companies hiring for this role
- "sampleListings": Array of 3-5 realistic job listings, each with:
  - "title": Job title
  - "company": Company name
  - "location": Location (City, State or "Remote")
  - "salary": Salary range if typically posted
  - "type": Employment type (Full-time, Contract, Part-time)
  - "remote": true/false
  - "description": Brief 1-2 sentence description
  - "keyRequirements": Array of 3-4 key requirements
  - "url": A plausible job board URL (use real job sites like LinkedIn, Indeed, Glassdoor)
- "insights": Object with:
  - "trending": Whether this role is trending up/stable/down
  - "competitiveness": Hiring competition level (High, Moderate, Low)
  - "timeToHire": Average time from application to offer
  
Base this on realistic job market data for ${career.title} roles. Use real company names and realistic requirements.

DO NOT include any text outside the JSON. Return only valid JSON.

Example format:
{
  "totalEstimate": "1,500+",
  "remotePercentage": "45%",
  "averageSalary": "$90,000 - $130,000",
  "topCompanies": ["Google", "Microsoft", "Amazon", "Meta", "Apple"],
  "sampleListings": [
    {
      "title": "Senior Software Developer",
      "company": "TechCorp",
      "location": "Remote",
      "salary": "$110,000 - $140,000",
      "type": "Full-time",
      "remote": true,
      "description": "Build scalable web applications using modern frameworks.",
      "keyRequirements": ["5+ years experience", "React expertise", "Cloud platforms"],
      "url": "https://www.linkedin.com/jobs/..."
    }
  ],
  "insights": {
    "trending": "Growing",
    "competitiveness": "Moderate",
    "timeToHire": "4-6 weeks"
  }
}`
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;

      console.log('Job listings response (first 500 chars):', responseText.substring(0, 500));

      // Use helper to extract JSON
      responseText = extractJSON(responseText);

      let listings;
      try {
        listings = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error in job listings:', parseError);
        console.error('Failed to parse listings text:', responseText);
        throw new Error(`Failed to parse job listings: ${parseError.message}`);
      }

      console.log('Job listings parsed successfully:', listings);
      
      setJobListings(prev => ({
        ...prev,
        [careerIndex]: listings
      }));
      
    } catch (error) {
      console.error('Error searching job listings:', error);
      alert(`Error searching jobs: ${error.message}`);
    } finally {
      setLoadingJobs(null);
    }
  };

  // Reset all state and go back to step 1
  const handleStartOver = () => {
    setStep(1);
    setResumeText('');
    setSkills([]);
    setCareerPaths([]);
    setNewSkill('');
    setExpandedPathways({});
    setJobListings({});
    setLoadingPathway(null);
    setLoadingJobs(null);
  };

  // Generate career paths based on skills using Lightcast/O*NET matching
  const generateCareerPaths = async () => {
    console.log('=== generateCareerPaths CALLED ===');
    console.log('Current step:', step);
    console.log('Current skills:', skills);
    console.log('isProcessing before:', isProcessing);

    setIsProcessing(true);
    console.log('isProcessing set to true');
    
    try {
      console.log('Generating career paths with advanced matching...');
      console.log('Skills being sent:', skills);
      
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: `You are a career counselor using Lightcast (formerly Emsi Burning Glass) labor market data and O*NET occupational taxonomy. Based on these Lightcast-standardized skills, suggest 5-7 potential career paths using real O*NET SOC codes and titles.

User's Lightcast Skills:
${JSON.stringify(skills, null, 2)}

MATCHING METHODOLOGY:
1. Calculate skill overlap: Count how many of the user's skills appear in each occupation's skill profile
2. Weight by proficiency: Advanced/Expert skills contribute more to match score
3. Consider skill types: Specialized Knowledge skills are weighted higher for technical roles
4. Use O*NET SOC taxonomy for occupation titles and codes
5. Reference actual Lightcast labor market data for salary ranges and outlook

Return a JSON array where each career path has:
- "title": O*NET occupation title
- "socCode": 6-digit O*NET SOC code (e.g., "15-1252" for Software Developers)
- "match": Match percentage (0-100) based on skill overlap calculation
- "matchedSkillsCount": Number of user skills that match this occupation
- "totalRequiredSkills": Total number of skills typically needed for this occupation
- "description": Brief description (2-3 sentences) based on O*NET occupation definition
- "requiredSkills": Array of skill names from user's list that match this occupation
- "skillsToLearn": Array of 3-5 Lightcast standardized skills they should learn (with Lightcast format)
- "salaryRange": Actual median salary range from Lightcast data as string
- "outlook": Job market outlook based on Lightcast projections (Excellent, Good, Fair, Declining)
- "growthRate": Projected annual growth rate percentage as string
- "postingsCount": Approximate number of job postings (High, Medium, Low)

IMPORTANT: Base your recommendations on actual labor market data patterns. Match scores should reflect genuine skill overlap. DO NOT include any text outside the JSON. Your response must start with [ and end with ].

Example format:
[{"title": "Software Developer", "socCode": "15-1252", "match": 85, "matchedSkillsCount": 12, "totalRequiredSkills": 15, ...}]`
          }]
        })
      });

      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);

      if (!data.content || !data.content[0] || !data.content[0].text) {
        console.error('Invalid API response structure:', data);
        throw new Error('Invalid API response structure');
      }

      let responseText = data.content[0].text;
      console.log('Raw response text (first 500 chars):', responseText.substring(0, 500));

      // Use helper to extract JSON
      responseText = extractJSON(responseText);
      console.log('Cleaned response text (first 500 chars):', responseText.substring(0, 500));

      let paths;
      try {
        paths = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error in career paths:', parseError);
        console.error('Failed to parse career paths text:', responseText);
        throw new Error(`Failed to parse career paths: ${parseError.message}`);
      }

      console.log('Parsed career paths successfully');
      console.log('Number of paths:', paths.length);
      
      // Log each path to inspect structure
      paths.forEach((path, idx) => {
        console.log(`Path ${idx}:`, {
          title: typeof path.title,
          match: typeof path.match,
          requiredSkills: Array.isArray(path.requiredSkills) ? `array[${path.requiredSkills.length}]` : typeof path.requiredSkills,
          skillsToLearn: Array.isArray(path.skillsToLearn) ? `array[${path.skillsToLearn.length}]` : typeof path.skillsToLearn
        });
        
        // Check if any skills are objects instead of strings
        if (Array.isArray(path.requiredSkills)) {
          path.requiredSkills.forEach((skill, si) => {
            if (typeof skill !== 'string') {
              console.warn(`requiredSkills[${si}] is not a string:`, skill);
            }
          });
        }
        
        if (Array.isArray(path.skillsToLearn)) {
          path.skillsToLearn.forEach((skill, si) => {
            if (typeof skill !== 'string') {
              console.warn(`skillsToLearn[${si}] is not a string:`, skill);
            }
          });
        }
      });
      
      if (!Array.isArray(paths) || paths.length === 0) {
        throw new Error('No career paths were generated');
      }
      
      const sortedPaths = paths.sort((a, b) => (b.match || 0) - (a.match || 0));
      console.log('Sorted paths successfully');
      
      console.log('About to set career paths state...');
      setCareerPaths(sortedPaths);
      console.log('Career paths state set');
      
      console.log('About to set step to 3...');
      setStep(3);
      console.log('Step set to 3');
      console.log('=== generateCareerPaths COMPLETED SUCCESSFULLY ===');
      
    } catch (error) {
      console.error('=== ERROR IN generateCareerPaths ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert(`Error generating career paths: ${error.message}. Check the browser console for details.`);
    } finally {
      console.log('Setting isProcessing to false');
      setIsProcessing(false);
      console.log('isProcessing set to false');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Career Path Navigator</h1>
          <p className="text-gray-600">Discover your potential based on your existing skills</p>
          <p className="text-sm text-indigo-600 mt-1">Powered by Lightcast Skills Taxonomy</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Upload Resume</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Review Skills</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Career Paths</span>
            </div>
          </div>
        </div>

        {/* Step 1: Upload Resume */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <Upload className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload Your Resume</h2>
              <p className="text-gray-600 mb-6">
                Upload a text file of your resume or paste your resume content below.
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
                <div className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                  {isProcessing ? 'Processing...' : 'Choose File'}
                </div>
              </label>
              <p className="text-sm text-gray-500 mt-2">Supported formats: TXT, DOC, DOCX</p>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Paste Your Resume
                </label>
                <button
                  onClick={loadSampleResume}
                  className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                  disabled={isProcessing}
                >
                  Load Sample Resume
                </button>
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume content here..."
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                disabled={isProcessing}
              />
              <button
                onClick={() => {
                  console.log('Button clicked!');
                  console.log('Resume text length:', resumeText.length);
                  console.log('Is processing:', isProcessing);
                  if (!resumeText.trim()) {
                    alert('Please paste or load a resume first!');
                    return;
                  }
                  extractSkills(resumeText);
                }}
                disabled={isProcessing || !resumeText.trim()}
                className="mt-4 w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Analyzing Resume...' : 'Analyze Resume'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review and Edit Skills */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Review Your Skills</h2>
            <p className="text-gray-600 mb-2">
              We've identified {skills.length} skills from your resume and mapped them to the Lightcast skills taxonomy.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Lightcast (formerly Emsi Burning Glass) provides standardized skill names and IDs used by employers and educators worldwide. Review, edit, or add more skills below.
            </p>

            {/* Add New Skill */}
            <div className="mb-6 flex gap-2">
              <input
                type="text"
                placeholder="Add a skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={addSkill}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-96 overflow-y-auto">
              {skills.map((skill, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => updateSkill(index, 'name', e.target.value)}
                        className="font-semibold text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none w-full"
                      />
                      {skill.lightcastId && (
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          ID: {skill.lightcastId}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeSkill(index)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={skill.category}
                      onChange={(e) => updateSkill(index, 'category', e.target.value)}
                      className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option>Hard Skills</option>
                      <option>Soft Skills</option>
                      <option>Software and Applications</option>
                      <option>Specialized Skills</option>
                      <option>Certifications</option>
                    </select>
                    <select
                      value={skill.level}
                      onChange={(e) => updateSkill(index, 'level', e.target.value)}
                      className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                      <option>Expert</option>
                    </select>
                    {skill.type && (
                      <select
                        value={skill.type}
                        onChange={(e) => updateSkill(index, 'type', e.target.value)}
                        className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option>Specialized Knowledge</option>
                        <option>Core Competency</option>
                        <option>Common Skill</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleStartOver}
                  className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Start Over
                </button>
              </div>
              <button
                onClick={generateCareerPaths}
                disabled={isProcessing || skills.length === 0}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? 'Analyzing...' : 'Generate Career Paths'}
                <TrendingUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Career Paths */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Career Path Options</h2>
              <p className="text-gray-600 mb-4">
                Based on your {skills.length} Lightcast-standardized skills, here are potential career paths ranked by match percentage.
              </p>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 mb-2">How Career Matching Works</h3>
                <ul className="text-sm text-indigo-800 space-y-1">
                  <li>• <strong>Skill Overlap Analysis:</strong> We compare your skills against O*NET occupation profiles</li>
                  <li>• <strong>Weighted Scoring:</strong> Advanced/Expert skills and Specialized Knowledge contribute more to match scores</li>
                  <li>• <strong>Labor Market Data:</strong> Salary ranges, growth rates, and demand based on Lightcast analytics</li>
                  <li>• <strong>O*NET Taxonomy:</strong> Career titles use standardized SOC (Standard Occupational Classification) codes</li>
                </ul>
              </div>
            </div>

            {careerPaths.map((path, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {typeof path.title === 'string' ? path.title : 'Career Path'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      {path.socCode && typeof path.socCode === 'string' && (
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          SOC: {path.socCode}
                        </span>
                      )}
                      {path.salaryRange && typeof path.salaryRange === 'string' && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {path.salaryRange}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {path.outlook && typeof path.outlook === 'string' && (
                        <span className={`px-2 py-1 rounded ${
                          path.outlook === 'Excellent' ? 'bg-green-100 text-green-800' :
                          path.outlook === 'Good' ? 'bg-blue-100 text-blue-800' :
                          path.outlook === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {path.outlook} Outlook
                        </span>
                      )}
                      {path.growthRate && (typeof path.growthRate === 'string' || typeof path.growthRate === 'number') && (
                        <span className="text-gray-600">
                          Growth: {String(path.growthRate)}
                        </span>
                      )}
                      {path.postingsCount && (typeof path.postingsCount === 'string' || typeof path.postingsCount === 'number') && (
                        <span className="text-gray-600">
                          Demand: {String(path.postingsCount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-indigo-600">
                      {typeof path.match === 'number' ? path.match : 0}%
                    </div>
                    <div className="text-sm text-gray-500">Match</div>
                    {path.matchedSkillsCount && path.totalRequiredSkills && (
                      <div className="text-xs text-gray-500 mt-1">
                        {path.matchedSkillsCount}/{path.totalRequiredSkills} skills
                      </div>
                    )}
                  </div>
                </div>

                {path.description && typeof path.description === 'string' && (
                  <p className="text-gray-700 mb-4">{path.description}</p>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Your Matching Skills ({Array.isArray(path.requiredSkills) ? path.requiredSkills.length : 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(path.requiredSkills) && path.requiredSkills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {typeof skill === 'string' ? skill : typeof skill === 'object' && skill.name ? skill.name : 'Skill'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Skills to Learn ({Array.isArray(path.skillsToLearn) ? path.skillsToLearn.length : 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(path.skillsToLearn) && path.skillsToLearn.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {typeof skill === 'string' ? skill : typeof skill === 'object' && skill.name ? skill.name : 'Skill'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Educational Pathway Button */}
                {Array.isArray(path.skillsToLearn) && path.skillsToLearn.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => togglePathway(index, path)}
                      disabled={loadingPathway === index}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                      <GraduationCap className="w-5 h-5" />
                      {loadingPathway === index ? 'Generating Learning Path...' : 
                       expandedPathways[index] ? 'Hide Educational Pathway' : 
                       'View Educational Pathway'}
                      {expandedPathways[index] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Educational Pathway Content */}
                    {expandedPathways[index] && (
                      <div className="mt-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" />
                            Your Learning Journey
                          </h3>
                          <div className="flex gap-3 text-sm">
                            {expandedPathways[index].timeline && (
                              <span className="flex items-center gap-1 text-purple-700">
                                <Clock className="w-4 h-4" />
                                {expandedPathways[index].timeline}
                              </span>
                            )}
                            {expandedPathways[index].difficulty && (
                              <span className="px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-medium">
                                {expandedPathways[index].difficulty}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Learning Steps */}
                        {Array.isArray(expandedPathways[index].learningSteps) && (
                          <div className="space-y-4">
                            {expandedPathways[index].learningSteps.map((step, stepIdx) => (
                              <div key={stepIdx} className="bg-white rounded-lg p-5 shadow-sm border border-purple-100">
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                    {step.step || stepIdx + 1}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 mb-1">
                                      {typeof step.title === 'string' ? step.title : 'Learning Step'}
                                    </h4>
                                    {step.duration && typeof step.duration === 'string' && (
                                      <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {step.duration}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Skills Covered */}
                                {Array.isArray(step.skills) && step.skills.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Skills Covered:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {step.skills.map((skill, si) => (
                                        <span key={si} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                          {typeof skill === 'string' ? skill : 'Skill'}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Resources */}
                                {Array.isArray(step.resources) && step.resources.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Learning Resources:</p>
                                    <div className="space-y-2">
                                      {step.resources.map((resource, ri) => (
                                        <div key={ri} className="flex items-start gap-2 text-sm bg-gray-50 p-2 rounded">
                                          <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              {resource.url && typeof resource.url === 'string' ? (
                                                <a 
                                                  href={resource.url} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="font-medium text-indigo-600 hover:text-indigo-800 underline"
                                                >
                                                  {typeof resource.name === 'string' ? resource.name : 'Resource'}
                                                </a>
                                              ) : (
                                                <span className="font-medium text-gray-900">
                                                  {typeof resource.name === 'string' ? resource.name : 'Resource'}
                                                </span>
                                              )}
                                              {resource.cost && typeof resource.cost === 'string' && (
                                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                                  resource.cost === 'Free' ? 'bg-green-100 text-green-700' :
                                                  resource.cost === 'Paid' ? 'bg-orange-100 text-orange-700' :
                                                  'bg-blue-100 text-blue-700'
                                                }`}>
                                                  {resource.cost}
                                                </span>
                                              )}
                                            </div>
                                            {resource.provider && typeof resource.provider === 'string' && (
                                              <p className="text-xs text-gray-600">
                                                {resource.provider}
                                                {resource.type && typeof resource.type === 'string' && ` • ${resource.type}`}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Projects */}
                                {Array.isArray(step.projects) && step.projects.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Practice Projects:</p>
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                                      {step.projects.map((project, pi) => (
                                        <li key={pi}>{typeof project === 'string' ? project : 'Project'}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Job Listings Section */}
                <div className="mt-4">
                  <button
                    onClick={() => searchJobListings(index, path)}
                    disabled={loadingJobs === index}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <Briefcase className="w-5 h-5" />
                    {loadingJobs === index ? 'Finding Jobs...' : 
                     jobListings[index] ? 'Refresh Job Listings' : 
                     'View Available Jobs'}
                  </button>

                  {/* Job Listings Content */}
                  {jobListings[index] && (
                    <div className="mt-4 bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-lg p-6">
                      {/* Market Overview */}
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Job Market Overview
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {jobListings[index].totalEstimate && (
                            <div className="bg-white rounded-lg p-3 border border-green-100">
                              <p className="text-xs text-gray-600 mb-1">Open Positions</p>
                              <p className="text-lg font-bold text-green-700">
                                {typeof jobListings[index].totalEstimate === 'string' ? jobListings[index].totalEstimate : 'N/A'}
                              </p>
                            </div>
                          )}
                          {jobListings[index].remotePercentage && (
                            <div className="bg-white rounded-lg p-3 border border-green-100">
                              <p className="text-xs text-gray-600 mb-1">Remote Options</p>
                              <p className="text-lg font-bold text-green-700">
                                {typeof jobListings[index].remotePercentage === 'string' ? jobListings[index].remotePercentage : 'N/A'}
                              </p>
                            </div>
                          )}
                          {jobListings[index].averageSalary && (
                            <div className="bg-white rounded-lg p-3 border border-green-100">
                              <p className="text-xs text-gray-600 mb-1">Avg. Salary</p>
                              <p className="text-sm font-bold text-green-700">
                                {typeof jobListings[index].averageSalary === 'string' ? jobListings[index].averageSalary : 'N/A'}
                              </p>
                            </div>
                          )}
                          {jobListings[index].insights && jobListings[index].insights.competitiveness && (
                            <div className="bg-white rounded-lg p-3 border border-green-100">
                              <p className="text-xs text-gray-600 mb-1">Competition</p>
                              <p className="text-lg font-bold text-green-700">
                                {typeof jobListings[index].insights.competitiveness === 'string' ? jobListings[index].insights.competitiveness : 'N/A'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Market Insights */}
                      {jobListings[index].insights && (
                        <div className="mb-6 bg-white rounded-lg p-4 border border-green-100">
                          <h4 className="font-semibold text-gray-800 mb-2">Market Insights</h4>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            {jobListings[index].insights.trending && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Trend:</span>
                                <span className={`font-medium ${
                                  jobListings[index].insights.trending === 'Growing' ? 'text-green-600' :
                                  jobListings[index].insights.trending === 'Stable' ? 'text-blue-600' :
                                  'text-orange-600'
                                }`}>
                                  {jobListings[index].insights.trending}
                                </span>
                              </div>
                            )}
                            {jobListings[index].insights.timeToHire && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-600">Time to Hire:</span>
                                <span className="font-medium">{jobListings[index].insights.timeToHire}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Top Companies */}
                      {Array.isArray(jobListings[index].topCompanies) && jobListings[index].topCompanies.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Top Hiring Companies
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {jobListings[index].topCompanies.map((company, ci) => (
                              <span key={ci} className="px-3 py-1 bg-white border border-green-200 text-gray-700 rounded-full text-sm">
                                {typeof company === 'string' ? company : 'Company'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sample Job Listings */}
                      {Array.isArray(jobListings[index].sampleListings) && jobListings[index].sampleListings.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Sample Job Listings
                          </h4>
                          <div className="space-y-3">
                            {jobListings[index].sampleListings.map((job, ji) => (
                              <div key={ji} className="bg-white rounded-lg p-4 border border-green-100 hover:border-green-300 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 mb-1">
                                      {typeof job.title === 'string' ? job.title : 'Job Title'}
                                    </h5>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                                      {job.company && typeof job.company === 'string' && (
                                        <span className="flex items-center gap-1">
                                          <Building className="w-3 h-3" />
                                          {job.company}
                                        </span>
                                      )}
                                      {job.location && typeof job.location === 'string' && (
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {job.location}
                                        </span>
                                      )}
                                      {job.remote && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                          Remote
                                        </span>
                                      )}
                                      {job.type && typeof job.type === 'string' && (
                                        <span className="text-xs">{job.type}</span>
                                      )}
                                    </div>
                                  </div>
                                  {job.url && typeof job.url === 'string' && (
                                    <a
                                      href={job.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-shrink-0 ml-2 text-green-600 hover:text-green-800"
                                    >
                                      <ExternalLink className="w-5 h-5" />
                                    </a>
                                  )}
                                </div>

                                {job.salary && typeof job.salary === 'string' && (
                                  <p className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    {job.salary}
                                  </p>
                                )}

                                {job.description && typeof job.description === 'string' && (
                                  <p className="text-sm text-gray-700 mb-2">{job.description}</p>
                                )}

                                {Array.isArray(job.keyRequirements) && job.keyRequirements.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Key Requirements:</p>
                                    <ul className="text-xs text-gray-600 space-y-0.5">
                                      {job.keyRequirements.map((req, ri) => (
                                        <li key={ri} className="flex items-start gap-1">
                                          <span className="text-green-600 mt-0.5">•</span>
                                          <span>{typeof req === 'string' ? req : 'Requirement'}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600">
                              Search on{' '}
                              <a href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(path.title)}&location=${encodeURIComponent(userLocation)}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 underline">
                                LinkedIn
                              </a>
                              {' • '}
                              <a href={`https://www.indeed.com/jobs?q=${encodeURIComponent(path.title)}&l=${encodeURIComponent(userLocation)}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 underline">
                                Indeed
                              </a>
                              {' • '}
                              <a href={`https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(path.title)}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 underline">
                                Glassdoor
                              </a>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setStep(2);
                  setCareerPaths([]);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Refine Skills & Regenerate
              </button>
              <button
                onClick={handleStartOver}
                className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
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
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [contactInfo, setContactInfo] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    linkedIn: ''
  });
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingSkill, setEditingSkill] = useState(null); // null or skill index
  const [editFormData, setEditFormData] = useState(null); // skill data being edited

  // Sample resume for testing
  const sampleResume = `John Doe
Senior Software Engineer
Email: john.doe@email.com | Phone: (555) 123-4567
Location: San Francisco, CA | LinkedIn: https://linkedin.com/in/johndoe

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
    setUploadedFileName('');
    setContactInfo({
      name: '',
      phone: '',
      email: '',
      city: '',
      linkedIn: ''
    });
  };

  // Update contact info field
  const updateContactInfo = (field, value) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function to get level order for sorting
  const getLevelOrder = (level) => {
    const order = { 'Expert': 0, 'Advanced': 1, 'Intermediate': 2, 'Beginner': 3 };
    return order[level] !== undefined ? order[level] : 4;
  };

  // Helper function to get level badge colors
  const getLevelColor = (level) => {
    const colors = {
      'Expert': 'bg-purple-100 text-purple-800 border-purple-200',
      'Advanced': 'bg-green-100 text-green-800 border-green-200',
      'Intermediate': 'bg-blue-100 text-blue-800 border-blue-200',
      'Beginner': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[level] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Group skills by category and sort by level within each category
  const groupSkillsByCategory = () => {
    const grouped = {};
    const categories = ['Hard Skills', 'Soft Skills', 'Software and Applications', 'Specialized Skills', 'Certifications'];

    // Initialize all categories
    categories.forEach(cat => {
      grouped[cat] = [];
    });

    // Group skills
    skills.forEach(skill => {
      const category = skill.category || 'Hard Skills';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(skill);
    });

    // Sort skills within each category by level (Expert to Beginner)
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => getLevelOrder(a.level) - getLevelOrder(b.level));
    });

    return grouped;
  };

  // Calculate skill statistics
  const getSkillStats = () => {
    const stats = {
      total: skills.length,
      byLevel: { 'Expert': 0, 'Advanced': 0, 'Intermediate': 0, 'Beginner': 0 },
      byCategory: {}
    };

    skills.forEach(skill => {
      // Count by level
      if (skill.level && stats.byLevel[skill.level] !== undefined) {
        stats.byLevel[skill.level]++;
      }

      // Count by category
      const category = skill.category || 'Hard Skills';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });

    return stats;
  };

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Open edit modal for a skill
  const openEditModal = (index) => {
    setEditingSkill(index);
    setEditFormData({ ...skills[index] });
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingSkill(null);
    setEditFormData(null);
  };

  // Save edited skill
  const saveEditedSkill = () => {
    if (editingSkill !== null && editFormData) {
      const updated = [...skills];
      updated[editingSkill] = editFormData;
      setSkills(updated);
      closeEditModal();
    }
  };

  // Update field in edit form
  const updateEditForm = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function to extract and sanitize JSON from Claude's response
  const extractJSON = (text) => {
    // Remove markdown code blocks
    let cleaned = text.trim();
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    cleaned = cleaned.replace(/```/g, '');

    // Find the first { or [ to start JSON extraction
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');

    let startChar = '';
    let startIndex = -1;

    // Determine which comes first - object or array
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startChar = '{';
      startIndex = firstBrace;
    } else if (firstBracket !== -1) {
      startChar = '[';
      startIndex = firstBracket;
    }

    if (startIndex === -1) {
      return cleaned; // No JSON found
    }

    // Find matching closing bracket using a counter
    const endChar = startChar === '{' ? '}' : ']';
    let depth = 0;
    let endIndex = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = startIndex; i < cleaned.length; i++) {
      const char = cleaned[i];

      // Handle string literals (ignore brackets inside strings)
      if (char === '"' && !escapeNext) {
        inString = !inString;
      }

      if (char === '\\' && !escapeNext) {
        escapeNext = true;
        continue;
      }

      escapeNext = false;

      if (!inString) {
        if (char === startChar) {
          depth++;
        } else if (char === endChar) {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }
    }

    if (endIndex !== -1) {
      return cleaned.substring(startIndex, endIndex + 1);
    }

    // If we couldn't find the end, return what we have
    return cleaned.substring(startIndex);
  };

  // Safe JSON parse with better error messages
  const safeJSONParse = (text, context = 'unknown') => {
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error(`JSON Parse Error in ${context}:`, error);
      console.error(`Failed text (first 1000 chars):`, text.substring(0, 1000));
      console.error(`Failed text (around error position):`, text.substring(Math.max(0, error.message.match(/\d+/)?.[0] - 100 || 0), (error.message.match(/\d+/)?.[0] || 0) + 100));

      // Try to identify the specific issue
      const lines = text.split('\n');
      console.error(`Total lines: ${lines.length}`);
      if (error.message.includes('line')) {
        const lineMatch = error.message.match(/line (\d+)/);
        if (lineMatch) {
          const lineNum = parseInt(lineMatch[1]) - 1;
          console.error(`Problem at line ${lineNum + 1}:`, lines[lineNum]);
          console.error(`Context:`, lines.slice(Math.max(0, lineNum - 2), Math.min(lines.length, lineNum + 3)));
        }
      }

      throw new Error(`Failed to parse JSON in ${context}: ${error.message}`);
    }
  };

  // Extract contact information from resume text
  const extractContactInfo = async (text) => {
    try {
      console.log('Extracting contact information...');

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Extract contact information from this resume. Return ONLY valid JSON with these fields (use empty string if not found):

Resume:
${text}

Return format (no markdown, no explanation):
{"name": "Full Name", "phone": "Phone Number", "email": "Email", "city": "City/Location", "linkedIn": "LinkedIn URL"}`
          }]
        })
      });

      if (!response.ok) {
        console.error('Contact info extraction failed:', response.status);
        return;
      }

      const data = await response.json();
      let responseText = data.content[0].text.trim();
      responseText = extractJSON(responseText);

      const info = safeJSONParse(responseText, 'contact extraction');

      if (info) {
        setContactInfo({
          name: info.name || '',
          phone: info.phone || '',
          email: info.email || '',
          city: info.city || '',
          linkedIn: info.linkedIn || ''
        });
      }
    } catch (error) {
      console.error('Error extracting contact info:', error);
      // Don't show alert - contact info extraction is optional
    }
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
        setUploadedFileName(file.name);
        // Extract contact information
        await extractContactInfo(text);
        setIsProcessing(false);
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

      const rawSkills = safeJSONParse(rawSkillsText, 'skill extraction');
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
          max_tokens: 10000,
          messages: [{
            role: 'user',
            content: `Map these skills to the Lightcast (formerly Emsi Burning Glass) skills taxonomy. For each skill, provide:
- "name": The standardized Lightcast skill name
- "lightcastId": A plausible Lightcast skill ID (format: KS followed by alphanumeric, e.g., "KS125LS6N7WL4S6JWKHS")
- "category": Skill type (Hard Skills, Soft Skills, Software and Applications, Specialized Skills, or Certifications)
- "level": Proficiency level based on context (Beginner, Intermediate, Advanced, Expert)
- "type": Lightcast skill type (Specialized Knowledge, Core Competency, or Common Skill)
- "definition": Brief Lightcast-style skill definition (1-2 sentences describing what this skill entails)
- "evidence": The EXACT text from the resume that led to identifying this skill (quote verbatim, keep under 100 characters)
- "confidence": Confidence score (0-100) indicating certainty of this skill inference

Confidence Scoring Guidelines:
- 90-100: Skill explicitly stated with context (e.g., "5+ years of Python development")
- 70-89: Skill directly mentioned in skills list or experience
- 50-69: Skill strongly implied by related work or tools mentioned
- 30-49: Skill inferred from related competencies or responsibilities
- 0-29: Weak inference or tangential connection

Skills to map:
${JSON.stringify(rawSkills)}

Resume text for evidence extraction:
${text.substring(0, 3000)}

Use actual Lightcast taxonomy conventions. Common examples:
- JavaScript → "JavaScript (Programming Language)" [KS125LS6N7WL4S6JWKHS]
- Communication → "Communication" [KS120FG6YP8QYTY9TQ2R]
- Project Management → "Project Management" [KS440M26YDGYY84T9X5Y]
- Python → "Python (Programming Language)" [KS1200364C9C1LK3V5Q1]
- Leadership → "Leadership" [KS125QD6K0QLLCS5GZ0Q]

Return ONLY valid JSON array with no other text:
[{
  "name": "JavaScript (Programming Language)",
  "lightcastId": "KS125LS6N7WL4S6JWKHS",
  "category": "Software and Applications",
  "level": "Advanced",
  "type": "Specialized Knowledge",
  "definition": "A high-level, interpreted programming language used for web development, featuring dynamic typing and first-class functions.",
  "evidence": "Led team building React web applications",
  "confidence": 92
}]`
          }]
        })
      });

      if (!mappingResponse.ok) {
        throw new Error(`Lightcast mapping failed: ${mappingResponse.status}`);
      }

      const mappingData = await mappingResponse.json();

      // Validate response structure
      if (!mappingData || !mappingData.content || !mappingData.content[0] || !mappingData.content[0].text) {
        console.error('Invalid mapping response structure:', mappingData);
        throw new Error('Invalid API response structure for Lightcast mapping');
      }

      let mappedSkillsText = mappingData.content[0].text;

      console.log('Mapping response length:', mappedSkillsText.length);
      console.log('Mapping response (first 500 chars):', mappedSkillsText.substring(0, 500));
      console.log('Mapping response (last 200 chars):', mappedSkillsText.substring(Math.max(0, mappedSkillsText.length - 200)));

      // Check if response is empty
      if (!mappedSkillsText || mappedSkillsText.trim().length === 0) {
        console.error('Empty response from Lightcast mapping API');
        throw new Error('Received empty response from Lightcast mapping API. This might be due to too many skills or API limits.');
      }

      // Use helper to extract JSON
      mappedSkillsText = extractJSON(mappedSkillsText);
      console.log('Cleaned mapping JSON length:', mappedSkillsText.length);
      console.log('Cleaned mapping JSON (first 500 chars):', mappedSkillsText.substring(0, 500));

      // Check if cleaned response is empty
      if (!mappedSkillsText || mappedSkillsText.trim().length === 0) {
        console.error('Empty JSON after cleaning');
        throw new Error('Unable to extract valid JSON from Lightcast mapping response');
      }

      const mappedSkills = safeJSONParse(mappedSkillsText, 'Lightcast mapping');
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
        type: 'Core Competency',
        definition: '',
        evidence: 'Manually added',
        confidence: 50
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
          max_tokens: 16000,
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
      console.log('Response length:', responseText.length);
      console.log('Stop reason:', data.stop_reason);

      // Check if response was truncated
      if (data.stop_reason === 'max_tokens') {
        console.warn('⚠️ Response was truncated due to token limit. Consider increasing max_tokens.');
        alert('Warning: The educational pathway response was truncated. The data may be incomplete. Please try again or contact support.');
      }

      // Use helper to extract JSON
      responseText = extractJSON(responseText);

      const pathway = safeJSONParse(responseText, 'educational pathway');
      console.log('Educational pathway parsed successfully:', pathway);

      // Comprehensive debugging
      console.log('=== EDUCATIONAL PATHWAY DEBUG ===');
      console.log('Full pathway object:', JSON.stringify(pathway, null, 2));
      console.log('Has timeline?', pathway?.hasOwnProperty('timeline'), '→', pathway?.timeline);
      console.log('Has difficulty?', pathway?.hasOwnProperty('difficulty'), '→', pathway?.difficulty);
      console.log('Has learningSteps?', pathway?.hasOwnProperty('learningSteps'));
      console.log('learningSteps is array?', Array.isArray(pathway?.learningSteps));
      console.log('learningSteps length:', pathway?.learningSteps?.length);
      if (pathway?.learningSteps) {
        console.log('First learning step:', pathway.learningSteps[0]);
      }
      console.log('=== END DEBUG ===');

      // Validate critical fields
      if (!pathway || typeof pathway !== 'object') {
        console.error('❌ Educational pathway is not a valid object');
        throw new Error('Invalid educational pathway data structure');
      }
      if (!Array.isArray(pathway.learningSteps) || pathway.learningSteps.length === 0) {
        console.warn('⚠️ Educational pathway missing learningSteps array or it is empty');
        console.warn('This will result in an empty display. Check API response structure.');
      }

      setExpandedPathways(prev => ({
        ...prev,
        [careerIndex]: pathway
      }));
      
    } catch (error) {
      console.error('Error generating educational pathway:', error);

      // Provide more helpful error messages to users
      let userMessage = 'Failed to generate educational pathway. ';

      if (error.message.includes('Failed to parse JSON')) {
        userMessage += 'The response from the AI was incomplete or malformed. This might be due to a network issue or the response being too large. Please try again.';
      } else if (error.message.includes('API request failed')) {
        userMessage += 'The API request failed. Please check your internet connection and try again.';
      } else if (error.message.includes('fetch')) {
        userMessage += 'Network error. Please check your internet connection and try again.';
      } else {
        userMessage += error.message;
      }

      alert(userMessage);

      // Keep the expanded state so user can see there was an attempt
      setExpandedPathways(prev => ({
        ...prev,
        [careerIndex]: null
      }));
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
          max_tokens: 12000,
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
      console.log('Response length:', responseText.length);
      console.log('Stop reason:', data.stop_reason);

      // Check if response was truncated
      if (data.stop_reason === 'max_tokens') {
        console.warn('⚠️ Response was truncated due to token limit. Consider increasing max_tokens.');
        alert('Warning: The job listings response was truncated. The data may be incomplete. Please try again or contact support.');
      }

      // Use helper to extract JSON
      responseText = extractJSON(responseText);

      const listings = safeJSONParse(responseText, 'job listings');
      console.log('Job listings parsed successfully:', listings);

      // Comprehensive debugging
      console.log('=== JOB LISTINGS DEBUG ===');
      console.log('Full listings object:', JSON.stringify(listings, null, 2));
      console.log('Has totalEstimate?', listings?.hasOwnProperty('totalEstimate'), '→', listings?.totalEstimate);
      console.log('Has remotePercentage?', listings?.hasOwnProperty('remotePercentage'), '→', listings?.remotePercentage);
      console.log('Has averageSalary?', listings?.hasOwnProperty('averageSalary'), '→', listings?.averageSalary);
      console.log('Has topCompanies?', listings?.hasOwnProperty('topCompanies'));
      console.log('topCompanies is array?', Array.isArray(listings?.topCompanies));
      console.log('topCompanies length:', listings?.topCompanies?.length);
      console.log('Has sampleListings?', listings?.hasOwnProperty('sampleListings'));
      console.log('sampleListings is array?', Array.isArray(listings?.sampleListings));
      console.log('sampleListings length:', listings?.sampleListings?.length);
      console.log('Has insights?', listings?.hasOwnProperty('insights'));
      if (listings?.insights) {
        console.log('Insights:', listings.insights);
      }
      if (listings?.sampleListings?.[0]) {
        console.log('First sample listing:', listings.sampleListings[0]);
      }
      console.log('=== END DEBUG ===');

      // Validate critical fields
      if (!listings || typeof listings !== 'object') {
        console.error('❌ Job listings is not a valid object');
        throw new Error('Invalid job listings data structure');
      }
      if (!Array.isArray(listings.sampleListings) || listings.sampleListings.length === 0) {
        console.warn('⚠️ Job listings missing sampleListings array or it is empty');
        console.warn('This will result in an empty or incomplete display.');
      }
      if (!Array.isArray(listings.topCompanies) || listings.topCompanies.length === 0) {
        console.warn('⚠️ Job listings missing topCompanies array or it is empty');
      }

      setJobListings(prev => ({
        ...prev,
        [careerIndex]: listings
      }));
      
    } catch (error) {
      console.error('Error searching job listings:', error);

      // Provide more helpful error messages to users
      let userMessage = 'Failed to search job listings. ';

      if (error.message.includes('Failed to parse JSON')) {
        userMessage += 'The response from the AI was incomplete or malformed. This might be due to a network issue or the response being too large. Please try again.';
      } else if (error.message.includes('API request failed')) {
        userMessage += 'The API request failed. Please check your internet connection and try again.';
      } else if (error.message.includes('fetch')) {
        userMessage += 'Network error. Please check your internet connection and try again.';
      } else {
        userMessage += error.message;
      }

      alert(userMessage);

      // Keep the expanded state so user can see there was an attempt
      setJobListings(prev => ({
        ...prev,
        [careerIndex]: null
      }));
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

      const paths = safeJSONParse(responseText, 'career paths');
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
              {uploadedFileName && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">File uploaded:</span> {uploadedFileName}
                  </p>
                </div>
              )}
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Contact Information Fields */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={contactInfo.name}
                    onChange={(e) => updateContactInfo('name', e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => updateContactInfo('email', e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => updateContactInfo('phone', e.target.value)}
                    placeholder="(123) 456-7890"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City/Location</label>
                  <input
                    type="text"
                    value={contactInfo.city}
                    onChange={(e) => updateContactInfo('city', e.target.value)}
                    placeholder="City, State"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={contactInfo.linkedIn}
                    onChange={(e) => updateContactInfo('linkedIn', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
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
                onChange={(e) => {
                  setResumeText(e.target.value);
                  if (uploadedFileName) setUploadedFileName('');
                }}
                placeholder="Paste your resume content here..."
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                disabled={isProcessing}
              />
              <button
                onClick={async () => {
                  console.log('Button clicked!');
                  console.log('Resume text length:', resumeText.length);
                  console.log('Is processing:', isProcessing);
                  if (!resumeText.trim()) {
                    alert('Please paste or load a resume first!');
                    return;
                  }
                  // Extract contact info if not already extracted
                  const hasContactInfo = contactInfo.name || contactInfo.phone || contactInfo.email || contactInfo.city || contactInfo.linkedIn;
                  if (!hasContactInfo) {
                    await extractContactInfo(resumeText);
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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Review Your Skills</h2>
            <p className="text-gray-600 mb-2">
              We've identified {skills.length} skills from your resume and mapped them to the Lightcast skills taxonomy.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Lightcast (formerly Emsi Burning Glass) provides standardized skill names and IDs used by employers and educators worldwide. Review, edit, or add more skills below.
            </p>

            {/* Summary Dashboard */}
            {(() => {
              const stats = getSkillStats();
              return (
                <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Skill Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="text-xs text-gray-600 mb-1">Expert</div>
                      <div className="text-2xl font-bold text-purple-600">{stats.byLevel['Expert']}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="text-xs text-gray-600 mb-1">Advanced</div>
                      <div className="text-2xl font-bold text-green-600">{stats.byLevel['Advanced']}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="text-xs text-gray-600 mb-1">Intermediate</div>
                      <div className="text-2xl font-bold text-blue-600">{stats.byLevel['Intermediate']}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">Beginner</div>
                      <div className="text-2xl font-bold text-gray-600">{stats.byLevel['Beginner']}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.byCategory).map(([category, count]) => (
                      <span key={category} className="text-xs bg-white px-2 py-1 rounded border border-indigo-200 text-gray-700">
                        {category}: <span className="font-semibold">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

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

            {/* Collapsible Category Sections */}
            <div className="space-y-4 mb-6">
              {(() => {
                const grouped = groupSkillsByCategory();
                const categories = ['Hard Skills', 'Soft Skills', 'Software and Applications', 'Specialized Skills', 'Certifications'];

                return categories.map(category => {
                  const categorySkills = grouped[category] || [];
                  if (categorySkills.length === 0) return null;

                  const isExpanded = expandedCategories[category];
                  const levelCounts = categorySkills.reduce((acc, skill) => {
                    acc[skill.level] = (acc[skill.level] || 0) + 1;
                    return acc;
                  }, {});

                  return (
                    <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-800">
                            {category} ({categorySkills.length})
                          </span>
                          <div className="flex gap-1">
                            {levelCounts['Expert'] > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                                {levelCounts['Expert']} Expert
                              </span>
                            )}
                            {levelCounts['Advanced'] > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                                {levelCounts['Advanced']} Adv
                              </span>
                            )}
                            {levelCounts['Intermediate'] > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                {levelCounts['Intermediate']} Int
                              </span>
                            )}
                            {levelCounts['Beginner'] > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                {levelCounts['Beginner']} Beg
                              </span>
                            )}
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>

                      {/* Category Content - Chip Display */}
                      {isExpanded && (
                        <div className="p-4 bg-white">
                          <div className="flex flex-wrap gap-2">
                            {categorySkills.map((skill, idx) => {
                              const originalIndex = skills.findIndex(s =>
                                s.name === skill.name && s.lightcastId === skill.lightcastId
                              );

                              const getLevelAbbrev = (level) => {
                                const abbrev = { 'Expert': 'E', 'Advanced': 'A', 'Intermediate': 'I', 'Beginner': 'B' };
                                return abbrev[level] || '?';
                              };

                              return (
                                <div
                                  key={idx}
                                  className="group relative inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-full hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
                                  onClick={() => openEditModal(originalIndex)}
                                >
                                  <span className="text-sm font-medium text-gray-800">{skill.name}</span>
                                  <span className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full ${getLevelColor(skill.level)}`}>
                                    {getLevelAbbrev(skill.level)}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Delete "${skill.name}"?`)) {
                                        removeSkill(originalIndex);
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                  >
                                    <X className="w-4 h-4 text-red-500 hover:text-red-700" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Edit Skill Modal */}
            {editingSkill !== null && editFormData && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={closeEditModal}
              >
                <div
                  className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') closeEditModal();
                    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                      e.preventDefault();
                      saveEditedSkill();
                    }
                  }}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800">Edit Skill</h3>
                    <button
                      onClick={closeEditModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-6">
                    {/* Skill Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Skill Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => updateEditForm('name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                        autoFocus
                      />
                    </div>

                    {/* Proficiency Level - PRIMARY EDIT */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Proficiency Level <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Expert', 'Advanced', 'Intermediate', 'Beginner'].map((level) => (
                          <button
                            key={level}
                            onClick={() => updateEditForm('level', level)}
                            className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                              editFormData.level === level
                                ? `${getLevelColor(level)} border-current`
                                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Skill Definition */}
                    {editFormData.definition && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Skill Definition
                        </label>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-gray-700">
                          {editFormData.definition}
                        </div>
                      </div>
                    )}

                    {/* Evidence from Resume */}
                    {editFormData.evidence && editFormData.evidence !== 'Manually added' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Evidence from Resume
                        </label>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-gray-600 italic">
                          "{editFormData.evidence}"
                        </div>
                      </div>
                    )}

                    {/* AI Confidence Score */}
                    {editFormData.confidence !== undefined && editFormData.confidence !== null && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          AI Confidence Score
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Confidence in this skill assessment</span>
                            <span className="font-bold text-gray-800">{editFormData.confidence}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                editFormData.confidence >= 90
                                  ? 'bg-green-500'
                                  : editFormData.confidence >= 70
                                  ? 'bg-blue-500'
                                  : editFormData.confidence >= 50
                                  ? 'bg-yellow-500'
                                  : editFormData.confidence >= 30
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${editFormData.confidence}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {editFormData.confidence >= 90 && 'Very High - Explicitly stated with context'}
                            {editFormData.confidence >= 70 && editFormData.confidence < 90 && 'High - Directly mentioned in resume'}
                            {editFormData.confidence >= 50 && editFormData.confidence < 70 && 'Medium - Strongly implied by experience'}
                            {editFormData.confidence >= 30 && editFormData.confidence < 50 && 'Low - Inferred from related skills'}
                            {editFormData.confidence < 30 && 'Very Low - Weak inference'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Details - Collapsible */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Details</h4>

                      {/* Category */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Category
                        </label>
                        <select
                          value={editFormData.category}
                          onChange={(e) => updateEditForm('category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                          <option>Hard Skills</option>
                          <option>Soft Skills</option>
                          <option>Software and Applications</option>
                          <option>Specialized Skills</option>
                          <option>Certifications</option>
                        </select>
                      </div>

                      {/* Type */}
                      {editFormData.type && (
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Type
                          </label>
                          <select
                            value={editFormData.type}
                            onChange={(e) => updateEditForm('type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          >
                            <option>Specialized Knowledge</option>
                            <option>Core Competency</option>
                            <option>Common Skill</option>
                          </select>
                        </div>
                      )}

                      {/* Lightcast ID - Read Only */}
                      {editFormData.lightcastId && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Lightcast ID
                          </label>
                          <div className="text-sm text-gray-500 font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200">
                            {editFormData.lightcastId}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${editFormData.name}"?`)) {
                          removeSkill(editingSkill);
                          closeEditModal();
                        }
                      }}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                      Delete Skill
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={closeEditModal}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEditedSkill}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                        {Array.isArray(expandedPathways[index].learningSteps) && expandedPathways[index].learningSteps.length > 0 ? (
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
                        ) : (
                          <div className="bg-white rounded-lg p-6 border border-purple-200 text-center">
                            <p className="text-gray-600 mb-2">Unable to load learning pathway data.</p>
                            <p className="text-sm text-gray-500">Please check the browser console for details or try clicking the button again.</p>
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
                      {Array.isArray(jobListings[index].sampleListings) && jobListings[index].sampleListings.length > 0 ? (
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
                      ) : (
                        <div className="bg-white rounded-lg p-6 border border-green-200 text-center mt-4">
                          <p className="text-gray-600 mb-2">Unable to load job listings data.</p>
                          <p className="text-sm text-gray-500">Please check the browser console for details or try clicking the button again.</p>
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
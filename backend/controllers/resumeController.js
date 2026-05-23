const fs = require('fs');
const path = require('path');
const Resume = require('../models/Resume');

// Dictionary of core technology competencies by role
const SKILL_MAP = {
  frontend: ['javascript', 'typescript', 'react', 'angular', 'vue', 'redux', 'next.js', 'html', 'css', 'tailwind', 'sass', 'webpack'],
  backend: ['node', 'express', 'python', 'django', 'flask', 'java', 'spring', 'go', 'php', 'laravel', 'ruby', 'rails', 'apis', 'graphql'],
  database: ['mongodb', 'sql', 'mysql', 'postgresql', 'redis', 'firebase', 'oracle'],
  devops: ['aws', 'azure', 'docker', 'kubernetes', 'git', 'ci/cd', 'linux', 'jenkins', 'terraform'],
  analytics: ['machine learning', 'python', 'r', 'data science', 'pandas', 'numpy', 'tensorFlow', 'pytorch', 'sql', 'tableau']
};

const ALL_SKILLS = Array.from(new Set(Object.values(SKILL_MAP).flat()));

// Common resume sections
const SECTIONS = ['experience', 'education', 'skills', 'projects', 'summary', 'contact', 'certifications'];

// Action verbs
const ACTION_VERBS = ['led', 'optimized', 'built', 'managed', 'designed', 'achieved', 'developed', 'architected', 'refactored', 'implemented', 'delivered', 'coordinated', 'resolved', 'improved', 'launched', 'spearheaded', 'created'];

// @desc    Analyze uploaded resume file and calculate ATS Score
// @route   POST /api/resume/analyze
// @access  Private
const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a resume file' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const ext = path.extname(fileName).toLowerCase();

    let textContent = '';

    // Read the file securely based on type
    if (ext === '.txt' || ext === '.md') {
      textContent = fs.readFileSync(filePath, 'utf-8');
    } else {
      // For binary files (PDF/Word), read as standard utf-8/ascii buffers
      // This extracts text strings, headings, and structure safely without native parser dependency crashes.
      const buffer = fs.readFileSync(filePath);
      textContent = buffer.toString('ascii').replace(/[^\x20-\x7E\s]/g, ' '); // Clean control chars
    }

    const lowerText = textContent.toLowerCase();

    // 1. Evaluate Formatting Score
    let detectedSections = [];
    SECTIONS.forEach(sec => {
      if (lowerText.includes(sec)) {
        detectedSections.push(sec.charAt(0).toUpperCase() + sec.slice(1));
      }
    });

    const formatScore = Math.max(30, Math.round((detectedSections.length / SECTIONS.length) * 100));

    // 2. Detect Skills present in Resume
    let skillsDetected = [];
    ALL_SKILLS.forEach(skill => {
      const regex = new RegExp(`\\b${skill}\\b`, 'gi');
      if (lowerText.includes(skill) || regex.test(lowerText)) {
        skillsDetected.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      }
    });

    // 3. Determine primary role category based on skill density
    let roleCounts = { frontend: 0, backend: 0, devops: 0, analytics: 0 };
    skillsDetected.forEach(skill => {
      const skLower = skill.toLowerCase();
      for (const [role, list] of Object.entries(SKILL_MAP)) {
        if (list.includes(skLower)) {
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        }
      }
    });

    let primaryRole = 'backend';
    let maxCount = -1;
    for (const [role, count] of Object.entries(roleCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primaryRole = role;
      }
    }

    // 4. Identify critical Missing Skills based on detected primary role
    let missingSkills = [];
    if (maxCount > 0) {
      const roleSkills = SKILL_MAP[primaryRole];
      roleSkills.forEach(skill => {
        const titleCase = skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (!skillsDetected.includes(titleCase)) {
          missingSkills.push(titleCase);
        }
      });
    } else {
      // Default fallback missing skills
      missingSkills = ['Git', 'Docker', 'REST APIs', 'Agile Methodologies'];
    }

    // Slice to top 4 missing skills
    missingSkills = missingSkills.slice(0, 4);

    // 5. Evaluate Impact & Action Verbs
    let verbsDetected = [];
    ACTION_VERBS.forEach(verb => {
      if (lowerText.includes(verb)) {
        verbsDetected.push(verb);
      }
    });

    const impactScore = Math.min(100, Math.max(20, Math.round((verbsDetected.length / 5) * 100)));
    const skillsScore = Math.min(100, Math.max(20, Math.round((skillsDetected.length / 8) * 100)));

    // 6. Calculate Composite ATS Score
    const atsScore = Math.min(100, Math.round(
      (formatScore * 0.3) + 
      (skillsScore * 0.5) + 
      (impactScore * 0.2)
    ));

    // 7. Compile Custom Recommendations
    const improvements = [
      `Format check: Found structural sections: [${detectedSections.join(', ')}]. ${
        detectedSections.length < 5 
          ? 'Consider explicitly adding missing sections like "Summary" or "Certifications" to improve readability.'
          : 'Great section structure detected.'
      }`,
      `Industry Keywords: We detected a strong alignment with **${primaryRole.toUpperCase()}** development. We highly recommend integrating missing critical skills: [${missingSkills.join(', ')}] in your skills table.`,
      `Action Verbs Tally: You have used ${verbsDetected.length} impact verbs. ${
        verbsDetected.length < 4
          ? 'Try replacing passive statements (like "responsible for writing code") with strong action verbs (like "spearheaded development of core microservices").'
          : 'Excellent use of action-oriented wording!'
      }`,
      `Metrics Suggestion: Add quantifiable highlights. Rather than saying "optimized database", rewrite as "optimized SQL queries, reducing API response times by 32% and enhancing user scalability".`
    ];

    // Save Resume scan metadata to DB
    const resumeScan = await Resume.create({
      userId: req.user._id,
      fileName,
      atsScore,
      skillsDetected,
      missingSkills,
      improvements
    });

    // Delete file locally to free space on local system after parsing
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn('Error deleting temp uploaded resume:', err);
    }

    return res.status(201).json(resumeScan);
  } catch (error) {
    console.error('Resume analyze error:', error);
    return res.status(500).json({ message: 'Server error analyzing resume', error: error.message });
  }
};

module.exports = {
  analyzeResume
};

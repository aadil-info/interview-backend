const Question = require('../models/Question');
const Interview = require('../models/Interview');
const AptitudeTest = require('../models/AptitudeTest');
const User = require('../models/User');

// Large collection of seed questions to make the platform immediately functional
const SEED_QUESTIONS = [
  // Technical - Beginner
  {
    category: 'technical',
    topic: 'Javascript',
    difficulty: 'beginner',
    questionText: 'What is a closure in JavaScript and how does it work?',
    suggestedKeywords: ['closure', 'lexical scope', 'outer function', 'inner function', 'encapsulation', 'variable access'],
    idealResponse: 'A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment). In other words, a closure gives an inner function access to the outer function\'s scope even after the outer function has returned. This is useful for data privacy (encapsulation) and maintaining state in asynchronous callbacks.',
    explanation: 'Closures are a fundamental JS concept where nested functions retain access to parent scopes.'
  },
  {
    category: 'technical',
    topic: 'CSS',
    difficulty: 'beginner',
    questionText: 'Explain the CSS Box Model.',
    suggestedKeywords: ['box model', 'content', 'padding', 'border', 'margin', 'box-sizing', 'border-box'],
    idealResponse: 'The CSS box model is a container that wraps around every HTML element. It consists of: content, padding (space around content), border (line wrapping the padding), and margin (space outside the border). By default, width and height only apply to the content. Using "box-sizing: border-box" incorporates padding and borders into the element\'s total specified width/height.',
    explanation: 'The box model is the foundational layout structure of HTML elements on screen.'
  },
  // Technical - Intermediate
  {
    category: 'technical',
    topic: 'Web Services',
    difficulty: 'intermediate',
    questionText: 'What are the main differences between REST APIs and GraphQL?',
    suggestedKeywords: ['rest', 'graphql', 'endpoints', 'over-fetching', 'under-fetching', 'single endpoint', 'queries', 'schema'],
    idealResponse: 'REST APIs use multiple endpoints representing resources (e.g. /users, /posts) and return fixed payloads, which often causes over-fetching or under-fetching. GraphQL uses a single HTTP endpoint where clients send queries specifying the exact fields they need, reducing network payload sizes. REST relies on HTTP methods (GET, POST), while GraphQL relies on a strongly-typed schema and queries/mutations.',
    explanation: 'REST uses structured resource-based routing; GraphQL uses client-specified querying on a unified schema.'
  },
  {
    category: 'technical',
    topic: 'Node.js',
    difficulty: 'intermediate',
    questionText: 'Explain the Node.js Event Loop.',
    suggestedKeywords: ['event loop', 'single threaded', 'non-blocking', 'asynchronous', 'call stack', 'callback queue', 'libuv', 'thread pool'],
    idealResponse: 'Node.js is single-threaded but handles highly concurrent asynchronous operations using the Event Loop (powered by libuv). When an async operation occurs, Node delegates it to the system kernel or thread pool. Once complete, the callback is pushed to a callback queue. The event loop continuously checks if the Call Stack is empty; if so, it pushes the callback to the stack for execution.',
    explanation: 'The event loop allows Node.js to achieve high-performance asynchronous I/O.'
  },
  // Technical - Advanced
  {
    category: 'technical',
    topic: 'React',
    difficulty: 'advanced',
    questionText: 'How does React\'s reconciliation algorithm and the Virtual DOM work under the hood?',
    suggestedKeywords: ['virtual dom', 'reconciliation', 'diffing', 'fiber', 'render', 'keys', 'state update', 'patching'],
    idealResponse: 'React maintains a Virtual DOM, which is a lightweight JavaScript representation of the actual DOM. When state changes, a new Virtual DOM tree is created. React uses a diffing algorithm (Reconciliation, now managed by React Fiber) to compare the new Virtual DOM tree with the previous one. It identifies changes with O(N) complexity using heuristics (like component types and keys) and applies only the necessary changes to the real DOM in a single batched repaint.',
    explanation: 'Reconciliation minimizes expensive real-DOM manipulations using key-based diffing.'
  },

  // HR Behavioral - Beginner
  {
    category: 'hr',
    topic: 'Introduction',
    difficulty: 'beginner',
    questionText: 'Tell me about yourself and your background.',
    suggestedKeywords: ['background', 'experience', 'passionate', 'career', 'education', 'skills', 'achievements', 'growth'],
    idealResponse: 'Focus on the "Present-Past-Future" formula. Start with your current role or studies, highlight a few key achievements or projects, explain how you got here (your education/background), and conclude with why you are excited about this specific opportunity and how it aligns with your future career growth.',
    explanation: 'Introduce yourself concisely, highlighting professional details that match the target role.'
  },
  {
    category: 'hr',
    topic: 'Career Fit',
    difficulty: 'beginner',
    questionText: 'Why should we hire you for this role?',
    suggestedKeywords: ['alignment', 'unique value', 'skills', 'problem solver', 'contribute', 'culture fit', 'drive', 'goals'],
    idealResponse: 'Explain that you possess the exact combination of skills, experience, and drive required. Share an example of how you solved a similar problem in the past, and explain that you are enthusiastic about their product/mission, making you both a high-value technical contributor and a great culture fit.',
    explanation: 'Connect your unique competencies directly to the company\'s pain points.'
  },
  // HR Behavioral - Intermediate
  {
    category: 'hr',
    topic: 'Conflict Resolution',
    difficulty: 'intermediate',
    questionText: 'Describe a challenging conflict you had with a team member and how you resolved it.',
    suggestedKeywords: ['conflict', 'communication', 'listening', 'empathy', 'compromise', 'professionalism', 'star method', 'result'],
    idealResponse: 'Use the STAR method. Describe a Situation where there was a disagreement (e.g., technical direction). Explain the Task (finding a resolution). Detail your Actions: listening actively, speaking privately, discussing pros/cons objectively, and compromising. End with a positive Result: finishing the project successfully and building a stronger working relationship.',
    explanation: 'Showcase emotional intelligence, team collaboration, and objective problem-solving.'
  },
  // HR Behavioral - Advanced
  {
    category: 'hr',
    topic: 'Leadership',
    difficulty: 'advanced',
    questionText: 'Tell me about a time you had to lead a project under tight deadlines and ambiguous requirements.',
    suggestedKeywords: ['ambiguity', 'leadership', 'prioritization', 'agile', 'deadlines', 'stakeholders', 'delegation', 'risk mitigation'],
    idealResponse: 'I was assigned to build a core feature with highly fluid specs. First, I aligned the stakeholders on a core MVP. I broken down the backlog, delegated tasks, set daily stand-ups to handle blocks, and maintained transparent communication. We delivered the MVP 2 days early, mitigating risk and enabling rapid user feedback loops.',
    explanation: 'Emphasize your adaptability, structure, delegation, and clear communication under pressure.'
  },

  // Aptitude - Beginner
  {
    category: 'aptitude',
    topic: 'Quantitative',
    difficulty: 'beginner',
    questionText: 'A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?',
    options: ['120 meters', '150 meters', '324 meters', '180 meters'],
    correctOptionIndex: 1, // 150 meters
    explanation: 'Speed in m/s = 60 * (5/18) = 50/3 m/s. Length (Distance) = Speed * Time = (50/3) * 9 = 150 meters.',
    suggestedKeywords: []
  },
  {
    category: 'aptitude',
    topic: 'Logical Reasoning',
    difficulty: 'beginner',
    questionText: 'Find the next number in the sequence: 3, 5, 9, 17, 33, ...',
    options: ['60', '50', '65', '49'],
    correctOptionIndex: 2, // 65
    explanation: 'The pattern is (Previous number * 2) - 1. So, (33 * 2) - 1 = 65.',
    suggestedKeywords: []
  },
  // Aptitude - Intermediate
  {
    category: 'aptitude',
    topic: 'Quantitative',
    difficulty: 'intermediate',
    questionText: 'A boat can travel with a speed of 13 km/hr in still water. If the speed of the stream is 4 km/hr, find the time taken by the boat to go 68 km downstream.',
    options: ['2 hours', '3 hours', '4 hours', '5 hours'],
    correctOptionIndex: 2, // 4 hours
    explanation: 'Downstream speed = Speed of boat + Speed of stream = 13 + 4 = 17 km/hr. Time = Distance / Speed = 68 / 17 = 4 hours.',
    suggestedKeywords: []
  },
  {
    category: 'aptitude',
    topic: 'Logical Reasoning',
    difficulty: 'intermediate',
    questionText: 'If A + B means A is the brother of B; A - B means A is the sister of B and A * B means A is the father of B. Which of the following means that C is the son of M?',
    options: ['M - N * C + F', 'F - C + N * M', 'M * N - C + F', 'M * C - N + F'],
    correctOptionIndex: 2, // M * N - C + F is wrong? Wait. M * C means M is father of C. C + F means C is brother of F. So C is male. M * C + F: M is father of C, C is brother of F (so C is son). Option 3: M * N - C: M is father of N, N - C: N is sister of C. C + F: C is brother of F. Yes, C is brother of F and sister of N, M is father of N, so M is father of C! Correct is M * N - C + F (since N is sister of C, C is brother of F. So N, C, F are siblings. M is father of N, thus M is father of C, and C is male, hence son). Wait, let\'s look at option 4: M * C - N: M is father of C, C is sister of N. C is female (sister), so C is daughter. Thus Option 3 (index 2) is indeed C is son of M.',
    explanation: 'In M * N - C + F: N is sister of C, and C is brother of F (hence C is male). M is the father of N. Since N, C, and F are siblings, M is the father of C. Thus, C is the son of M.',
    suggestedKeywords: []
  }
];

// Helper to check and seed questions if database is empty
const seedQuestionsIfNeeded = async () => {
  try {
    const count = await Question.find({});
    if (count.length === 0) {
      console.log('🌱 Question database is empty! Autoseeding standard high-quality practice questions...');
      for (const q of SEED_QUESTIONS) {
        await Question.create(q);
      }
      console.log('✅ Question database successfully seeded.');
    }
  } catch (error) {
    console.error('Error auto-seeding questions:', error);
  }
};

// Auto seed on startup
setTimeout(seedQuestionsIfNeeded, 2000);

// @desc    Get randomized questions for a mock interview
// @route   POST /api/interviews/session/start
// @access  Private
const startSession = async (req, res) => {
  try {
    const { category, difficulty, count = 5 } = req.body;

    if (!category || !difficulty) {
      return res.status(400).json({ message: 'Category and difficulty are required' });
    }

    // Ensure database has questions
    await seedQuestionsIfNeeded();

    // Query questions matching conditions
    const matchedQuestions = await Question.find({ category, difficulty });

    if (matchedQuestions.length === 0) {
      // Fallback: draw any questions in that category
      const fallbackQs = await Question.find({ category });
      if (fallbackQs.length === 0) {
        return res.status(404).json({ message: 'No questions found for this category' });
      }
      
      // Shuffle & Slice fallback
      const shuffled = fallbackQs.sort(() => 0.5 - Math.random());
      return res.json(shuffled.slice(0, count));
    }

    // Shuffle matched questions & slice
    const shuffled = matchedQuestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    return res.json(selected);
  } catch (error) {
    console.error('Start interview session error:', error);
    return res.status(500).json({ message: 'Server error starting interview', error: error.message });
  }
};

// @desc    Submit mock interview responses & run local AI feedback
// @route   POST /api/interviews/session/submit
// @access  Private
const submitSession = async (req, res) => {
  try {
    const { category, difficulty, durationSeconds, answers } = req.body;

    if (!category || !difficulty || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Missing session criteria' });
    }

    const processedQuestions = [];
    let cumulativeScore = 0;

    // AI Analyzer parameters
    const positiveWords = ['solve', 'optimize', 'implement', 'collaborate', 'lead', 'achieve', 'manage', 'deliver', 'growth', 'impact', 'team', 'design', 'learn', 'create', 'structured', 'professional', 'coordinate', 'resolved'];
    const fillerWords = ['like', 'actually', 'basically', 'literally', 'um', 'uh', 'maybe', 'sort of', 'kind of', 'probably', 'dunno', 'i guess'];

    for (const ans of answers) {
      const { questionId, userAnswer } = ans;
      const question = await Question.findById(questionId);

      if (!question) continue;

      const qText = question.questionText;
      const response = userAnswer ? userAnswer.trim() : '';

      // AI grading variables
      let score = 50; // Base score
      const matchingKeywords = [];
      const missedKeywords = [];
      const fillerDeductions = [];

      if (response.length === 0) {
        score = 0;
      } else {
        // 1. Length grading
        const wordCount = response.split(/\s+/).length;
        let lengthScore = 0;
        if (wordCount >= 80) lengthScore = 30; // Solid length
        else if (wordCount >= 40) lengthScore = 20; // Acceptable length
        else if (wordCount >= 10) lengthScore = 10; // Too short
        else lengthScore = 5;

        // 2. Technical Keyword density (for technical)
        let keywordScore = 0;
        if (question.suggestedKeywords && question.suggestedKeywords.length > 0) {
          const lowerResponse = response.toLowerCase();
          question.suggestedKeywords.forEach(kw => {
            if (lowerResponse.includes(kw.toLowerCase())) {
              matchingKeywords.push(kw);
            } else {
              missedKeywords.push(kw);
            }
          });

          const matchRatio = matchingKeywords.length / question.suggestedKeywords.length;
          keywordScore = Math.round(matchRatio * 50); // Up to 50 points
        } else {
          // Behavioral/HR: Score based on STAR positive verbs
          const lowerResponse = response.toLowerCase();
          const positiveMatches = positiveWords.filter(pw => lowerResponse.includes(pw));
          keywordScore = Math.min(50, positiveMatches.length * 10); // Up to 50 points
        }

        // 3. Filler word penalty
        let fillerDeduction = 0;
        const lowerResponse = response.toLowerCase();
        fillerWords.forEach(fw => {
          const regex = new RegExp(`\\b${fw}\\b`, 'gi');
          const count = (lowerResponse.match(regex) || []).length;
          if (count > 0) {
            fillerDeduction += count * 2.5; // 2.5 points deduction per filler
            fillerDeductions.push(`${fw} (x${count})`);
          }
        });
        fillerDeduction = Math.min(25, fillerDeduction); // Cap penalty at 25 points

        // Calculate final single answer score
        score = Math.min(100, Math.max(10, 20 + lengthScore + keywordScore - Math.round(fillerDeduction)));
      }

      // Calculate speed pacing (WPM)
      // Assuming average 12 seconds read + response duration per question in the session
      const timeAllocated = durationSeconds / answers.length;
      const wordCount = response ? response.split(/\s+/).length : 0;
      const wpm = timeAllocated > 0 ? Math.round(wordCount / (timeAllocated / 60)) : 0;

      // Classify Sentiment / Confidence
      let sentiment = 'Neutral';
      if (score >= 80) sentiment = 'Confident & Articulate';
      else if (score >= 60) sentiment = 'Professional';
      else if (score > 10) sentiment = 'Hesitant';
      else sentiment = 'No Response';

      // Generate structural AI response feedback
      let feedback = '';
      if (score === 0) {
        feedback = 'No response was provided for this question. Interviewers look for proactive participation; even an incomplete attempt shows courage.';
      } else {
        feedback = `**Communication Delivery:** Your pacing was calculated at roughly ${wpm} WPM. `;
        if (wpm < 80) feedback += `This is on the slower side. Aim for standard speaking speeds (120-150 WPM) to project fluidity. `;
        else if (wpm > 180) feedback += `This is quite rapid. Slow down slightly, use strategic pauses to let your key structural points sink in. `;
        else feedback += `Your answer delivery pace was excellent, sounding conversational and clear. `;

        if (fillerDeductions.length > 0) {
          feedback += `Be cautious of conversational fillers like ${fillerDeductions.join(', ')} which dilute technical clarity. `;
        } else {
          feedback += `Outstanding structural delivery with zero filler words! `;
        }

        feedback += `\n\n**Technical/Structural Content:** `;
        if (matchingKeywords.length > 0) {
          feedback += `You successfully hit key industry target concepts: *${matchingKeywords.join(', ')}*. `;
        }
        if (missedKeywords.length > 0) {
          feedback += `To achieve maximum impact, we recommend weaving in: *${missedKeywords.join(', ')}*. `;
        }

        feedback += `\n\n**Key Suggestion for Improvement:** `;
        if (score < 60) {
          feedback += `Elaborate with actual architectural or historical examples using the STAR framework (Situation, Task, Action, Result) to support your concepts. Try to double your response details.`;
        } else if (score < 85) {
          feedback += `Refine your terminology structure. Connect your definition directly to a real-world project highlight or design choice.`;
        } else {
          feedback += `Exceptional response. Maintain this standard of precision and keyword mapping in the actual interview.`;
        }
      }

      cumulativeScore += score;

      processedQuestions.push({
        questionId,
        questionText: qText,
        userAnswer: response,
        score,
        feedback,
        sentiment,
        speed: wpm,
        matchingKeywords
      });
    }

    const overallScore = answers.length > 0 ? Math.round(cumulativeScore / answers.length) : 0;

    // Generate Overall feedback
    let overallFeedback = '';
    if (overallScore >= 85) {
      overallFeedback = `Outstanding performance! You showcased high technical expertise, strong keyword mapping, and articulate structure. Your communication tone felt highly confident. Keep practicing to maintain this edge.`;
    } else if (overallScore >= 65) {
      overallFeedback = `Solid performance, showing a good baseline understanding. To push into the top-tier, focus on minimizing filler phrases, increasing response details, and ensuring you hit all suggested industry keywords for tech terms.`;
    } else {
      overallFeedback = `An excellent practice session. Currently, you need to work on adding technical depth and explanation length. Try structure-based speaking (STAR method), and practice speaking slowly but continuously to reduce hesitations.`;
    }

    // Save Mock Interview to Database
    const interviewSession = await Interview.create({
      userId: req.user._id,
      category,
      difficulty,
      questions: processedQuestions,
      overallScore,
      overallFeedback,
      durationSeconds
    });

    return res.status(201).json(interviewSession);
  } catch (error) {
    console.error('Submit interview error:', error);
    return res.status(500).json({ message: 'Server error grading interview response', error: error.message });
  }
};

// @desc    Get user interview session logs
// @route   GET /api/interviews/history
// @access  Private
const getHistory = async (req, res) => {
  try {
    const history = await Interview.find({ userId: req.user._id });
    
    // Sort descending
    const sorted = history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(sorted);
  } catch (error) {
    console.error('Get interview history error:', error);
    return res.status(500).json({ message: 'Server error retrieving history', error: error.message });
  }
};

// @desc    Toggle question bookmarks for a user
// @route   POST /api/interviews/questions/:id/bookmark
// @access  Private
const toggleBookmark = async (req, res) => {
  try {
    const questionId = req.params.id;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let bookmarks = user.bookmarks || [];
    const index = bookmarks.indexOf(questionId);

    if (index > -1) {
      bookmarks.splice(index, 1); // Remove
    } else {
      bookmarks.push(questionId); // Add
    }

    // Mongoose markModified warning bypass
    await User.findByIdAndUpdate(user._id, { bookmarks });

    return res.json({
      bookmarks,
      message: index > -1 ? 'Bookmark removed' : 'Bookmark added successfully'
    });
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    return res.status(500).json({ message: 'Server error editing bookmark', error: error.message });
  }
};

// @desc    Save personal user study notes for a question
// @route   POST /api/interviews/questions/:id/note
// @access  Private
const saveNote = async (req, res) => {
  try {
    const questionId = req.params.id;
    const { noteText } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let notes = user.notes || {};
    
    // Check if Mongoose Map or standard JSON object
    if (typeof notes.set === 'function') {
      notes.set(questionId, noteText);
    } else {
      notes[questionId] = noteText;
    }

    await User.findByIdAndUpdate(user._id, { notes });

    return res.json({
      notes,
      message: 'Study note saved successfully'
    });
  } catch (error) {
    console.error('Save study note error:', error);
    return res.status(500).json({ message: 'Server error saving personal notes', error: error.message });
  }
};

// @desc    Retrieve global leaderboard ranking by aggregate metrics
// @route   GET /api/interviews/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    // Find all users (works for Mongo/JSON)
    const users = await User.find({});
    const leaderboard = [];

    for (const u of users) {
      // Find interviews taken
      const userInterviews = await Interview.find({ userId: String(u._id) });
      const userAptitude = await AptitudeTest.find({ userId: String(u._id) });

      const totalSessions = userInterviews.length + userAptitude.length;

      let scoreSum = 0;
      userInterviews.forEach(i => scoreSum += (i.overallScore || 0));
      userAptitude.forEach(a => scoreSum += (a.score || 0));

      const averageScore = totalSessions > 0 ? Math.round(scoreSum / totalSessions) : 0;
      
      // Calculate rank weighting
      const xpPoints = totalSessions * 100 + scoreSum * 2.5;

      leaderboard.push({
        _id: u._id,
        name: u.name,
        totalSessions,
        averageScore,
        xpPoints: Math.round(xpPoints)
      });
    }

    // Sort by XP Points descending
    leaderboard.sort((a, b) => b.xpPoints - a.xpPoints);

    // Limit to top 15 ranks
    return res.json(leaderboard.slice(0, 15));
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return res.status(500).json({ message: 'Server error compiling leaderboard stats', error: error.message });
  }
};

module.exports = {
  startSession,
  submitSession,
  getHistory,
  toggleBookmark,
  saveNote,
  getLeaderboard
};

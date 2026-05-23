const User = require('../models/User');
const Question = require('../models/Question');
const Interview = require('../models/Interview');
const AptitudeTest = require('../models/AptitudeTest');
const Resume = require('../models/Resume');

// @desc    Get global platform analytics & activity log
// @route   GET /api/admin/stats
// @access  Private/Admin
const getGlobalStats = async (req, res) => {
  try {
    const totalUsers = (await User.find({})).length;
    const allQuestions = await Question.find({});
    const totalQuestions = allQuestions.length;
    const allInterviews = await Interview.find({});
    const totalInterviews = allInterviews.length;
    const allAptitudeTests = await AptitudeTest.find({});
    const totalAptitude = allAptitudeTests.length;
    const allResumes = await Resume.find({});
    const totalResumes = allResumes.length;

    // Calculate global mock interview average
    let globalInterviewAverage = 0;
    if (totalInterviews > 0) {
      const sum = allInterviews.reduce((acc, curr) => acc + (curr.overallScore || 0), 0);
      globalInterviewAverage = Math.round(sum / totalInterviews);
    }

    // Category breakdown counts
    const technicalCount = allQuestions.filter(q => q.category === 'technical').length;
    const hrCount = allQuestions.filter(q => q.category === 'hr').length;
    const aptitudeCount = allQuestions.filter(q => q.category === 'aptitude').length;

    // Aggregate recent activity across ALL platform users
    const adminActivityFeed = [];

    // Map profiles for quick lookup in the loop (resilient for JSON and Mongo)
    const usersList = await User.find({});
    const userMap = {};
    usersList.forEach(u => {
      userMap[String(u._id)] = u.name;
    });

    // Populate interviews into feed
    allInterviews.forEach(i => {
      adminActivityFeed.push({
        type: 'Mock Interview',
        userName: userMap[i.userId] || 'Deleted User',
        label: `${i.category.toUpperCase()} (${i.difficulty})`,
        score: i.overallScore,
        date: i.createdAt
      });
    });

    // Populate aptitude into feed
    allAptitudeTests.forEach(a => {
      adminActivityFeed.push({
        type: 'Aptitude Test',
        userName: userMap[a.userId] || 'Deleted User',
        label: `MCQ Practice`,
        score: a.score,
        date: a.createdAt
      });
    });

    // Populate resume scans into feed
    allResumes.forEach(r => {
      adminActivityFeed.push({
        type: 'Resume ATS Scan',
        userName: userMap[r.userId] || 'Deleted User',
        label: r.fileName,
        score: r.atsScore,
        date: r.createdAt
      });
    });

    // Sort active feed by date descending
    adminActivityFeed.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.json({
      metrics: {
        totalUsers,
        totalQuestions,
        totalInterviews,
        totalAptitude,
        totalResumes,
        globalInterviewAverage
      },
      categoryDist: {
        technical: technicalCount,
        hr: hrCount,
        aptitude: aptitudeCount
      },
      recentActivity: adminActivityFeed.slice(0, 15) // Limit to top 15 events
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({ message: 'Server error loading admin analytics', error: error.message });
  }
};

// @desc    Retrieve all questions for Admin listing
// @route   GET /api/admin/questions
// @access  Private/Admin
const listAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find({});
    // Sort descending by creation
    const sorted = questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(sorted);
  } catch (error) {
    console.error('List admin questions error:', error);
    return res.status(500).json({ message: 'Server error loading question library', error: error.message });
  }
};

// @desc    Add a new question to the bank
// @route   POST /api/admin/questions
// @access  Private/Admin
const createQuestion = async (req, res) => {
  try {
    const { category, topic, difficulty, questionText, options, correctOptionIndex, explanation, suggestedKeywords, idealResponse } = req.body;

    if (!category || !topic || !questionText) {
      return res.status(400).json({ message: 'Category, Topic, and Question Text are required.' });
    }

    const question = await Question.create({
      category,
      topic,
      difficulty: difficulty || 'beginner',
      questionText,
      options: options || [],
      correctOptionIndex: correctOptionIndex !== undefined ? Number(correctOptionIndex) : undefined,
      explanation: explanation || '',
      suggestedKeywords: suggestedKeywords || [],
      idealResponse: idealResponse || ''
    });

    return res.status(201).json({
      question,
      message: 'Question added successfully to the library.'
    });
  } catch (error) {
    console.error('Create question error:', error);
    return res.status(500).json({ message: 'Server error adding question', error: error.message });
  }
};

// @desc    Update a question in the bank
// @route   PUT /api/admin/questions/:id
// @access  Private/Admin
const updateQuestion = async (req, res) => {
  try {
    const questionId = req.params.id;
    const { category, topic, difficulty, questionText, options, correctOptionIndex, explanation, suggestedKeywords, idealResponse } = req.body;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const updateFields = {
      category: category || question.category,
      topic: topic || question.topic,
      difficulty: difficulty || question.difficulty,
      questionText: questionText || question.questionText,
      options: options !== undefined ? options : question.options,
      correctOptionIndex: correctOptionIndex !== undefined ? Number(correctOptionIndex) : question.correctOptionIndex,
      explanation: explanation !== undefined ? explanation : question.explanation,
      suggestedKeywords: suggestedKeywords !== undefined ? suggestedKeywords : question.suggestedKeywords,
      idealResponse: idealResponse !== undefined ? idealResponse : question.idealResponse
    };

    const updatedQuestion = await Question.findByIdAndUpdate(questionId, updateFields, { new: true });

    return res.json({
      question: updatedQuestion,
      message: 'Question updated successfully.'
    });
  } catch (error) {
    console.error('Update question error:', error);
    return res.status(500).json({ message: 'Server error updating question', error: error.message });
  }
};

// @desc    Delete a question from the bank
// @route   DELETE /api/admin/questions/:id
// @access  Private/Admin
const deleteQuestion = async (req, res) => {
  try {
    const questionId = req.params.id;
    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    await Question.findByIdAndDelete(questionId);

    return res.json({ message: 'Question deleted successfully from library.' });
  } catch (error) {
    console.error('Delete question error:', error);
    return res.status(500).json({ message: 'Server error deleting question', error: error.message });
  }
};

// @desc    List all platform users
// @route   GET /api/admin/users
// @access  Private/Admin
const listAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    // Remove passwords before returning
    const safeUsers = users.map(u => {
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt
      };
    });
    return res.json(safeUsers);
  } catch (error) {
    console.error('List admin users error:', error);
    return res.status(500).json({ message: 'Server error loading user base', error: error.message });
  }
};

// @desc    Delete a user account
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Do not allow deleting own admin profile
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ message: 'Self-deletion not allowed.' });
    }

    await User.findByIdAndDelete(userId);

    // Clean up user activity logs (interviews, tests, resumes) in background
    try {
      await Interview.deleteOne({ userId });
      await AptitudeTest.deleteOne({ userId });
      await Resume.deleteOne({ userId });
    } catch (e) {
      console.warn('Error cleanup logs of deleted user:', e);
    }

    return res.json({ message: 'User account and historical logs deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Server error deleting user', error: error.message });
  }
};

module.exports = {
  getGlobalStats,
  listAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  listAllUsers,
  deleteUser
};

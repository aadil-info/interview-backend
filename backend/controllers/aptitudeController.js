const Question = require('../models/Question');
const AptitudeTest = require('../models/AptitudeTest');

// @desc    Retrieve randomized Aptitude MCQs for a session
// @route   GET /api/aptitude/start
// @access  Private
const startAptitudeSession = async (req, res) => {
  try {
    const { count = 5 } = req.query;

    // Retrieve all aptitude questions
    let questions = await Question.find({ category: 'aptitude' });

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No aptitude questions available in the question bank' });
    }

    // Shuffle and slice
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Number(count));

    // Strip correct answers & explanation blocks before sending to frontend (prevention of devtools cheating)
    const secureQuestions = selected.map(q => {
      return {
        _id: q._id,
        category: q.category,
        topic: q.topic,
        difficulty: q.difficulty,
        questionText: q.questionText,
        options: q.options
      };
    });

    return res.json(secureQuestions);
  } catch (error) {
    console.error('Start aptitude test error:', error);
    return res.status(500).json({ message: 'Server error loading aptitude test', error: error.message });
  }
};

// @desc    Submit aptitude answers and grade session
// @route   POST /api/aptitude/submit
// @access  Private
const submitAptitudeSession = async (req, res) => {
  try {
    const { answers, durationSeconds } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Please provide test answers' });
    }

    let correctCount = 0;
    const gradedAnswers = [];

    for (const ans of answers) {
      const { questionId, selectedOptionIndex } = ans;
      const question = await Question.findById(questionId);

      if (!question) continue;

      const isCorrect = Number(selectedOptionIndex) === Number(question.correctOptionIndex);
      if (isCorrect) correctCount++;

      gradedAnswers.push({
        questionId,
        questionText: question.questionText,
        selectedOptionIndex: Number(selectedOptionIndex),
        correctOptionIndex: Number(question.correctOptionIndex),
        isCorrect,
        explanation: question.explanation || 'No explanation provided.'
      });
    }

    const totalQuestions = answers.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Create Aptitude log
    const testSession = await AptitudeTest.create({
      userId: req.user._id,
      answers: gradedAnswers,
      score,
      correctCount,
      totalQuestions,
      durationSeconds
    });

    return res.status(201).json(testSession);
  } catch (error) {
    console.error('Submit aptitude test error:', error);
    return res.status(500).json({ message: 'Server error grading test results', error: error.message });
  }
};

module.exports = {
  startAptitudeSession,
  submitAptitudeSession
};

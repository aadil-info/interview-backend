let testQuestions = [];
let currentQuestionIndex = 0;
let userSelections = []; // Stores index of selected options, e.g. [1, null, 3, 0...]

// Clock Timers
let timeRemainingSeconds = 600; // 10 minutes default
let timerInterval = null;
let elapsedSeconds = 0;
let elapsedTicker = null;

// Starts an aptitude practice test
async function startAptitudeTest() {
  const count = document.getElementById('cfgCount').value;
  const configState = document.getElementById('configState');
  const processingState = document.getElementById('processingState');

  configState.style.display = 'none';
  processingState.style.display = 'block';

  try {
    // 1. Fetch randomized MCQs
    testQuestions = await API.get(`/aptitude/start?count=${count}`);
    
    currentQuestionIndex = 0;
    // Pre-initialize empty selections
    userSelections = new Array(testQuestions.length).fill(null);
    timeRemainingSeconds = count * 120; // 2 minutes per question allocation
    elapsedSeconds = 0;

    processingState.style.display = 'none';
    document.getElementById('activeTestState').style.display = 'block';

    // 2. Launch Timer loops & pagination
    startTestTimer();
    renderJumpGrid();
    loadQuestion(0);

  } catch (error) {
    console.error('Error starting aptitude test:', error);
    processingState.style.display = 'none';
    configState.style.display = 'block';
    alert(error.message || 'Failed to initialize aptitude test. Try again.');
  }
}

// Load current question card
function loadQuestion(index) {
  if (index >= testQuestions.length) return;
  currentQuestionIndex = index;

  const q = testQuestions[index];
  document.getElementById('topicLabel').textContent = `${q.topic.toUpperCase()} DIFFICULTY &bull; ${q.difficulty.toUpperCase()}`;
  document.getElementById('questionTextLabel').textContent = q.questionText;

  // Build Option cards
  const optionsContainer = document.getElementById('optionsContainer');
  optionsContainer.innerHTML = '';

  const letters = ['A', 'B', 'C', 'D'];
  q.options.forEach((opt, optIndex) => {
    const card = document.createElement('div');
    card.className = 'option-card';
    if (userSelections[index] === optIndex) {
      card.classList.add('selected');
    }

    card.onclick = () => selectOption(optIndex);

    card.innerHTML = `
      <div class="option-radio"></div>
      <span class="option-letter">${letters[optIndex]}</span>
      <span style="font-size: 14px;">${opt}</span>
    `;
    optionsContainer.appendChild(card);
  });

  // Toggle Next/Prev buttons disabled states
  document.getElementById('prevBtn').disabled = index === 0;
  
  const nextBtn = document.getElementById('nextBtn');
  if (index === testQuestions.length - 1) {
    nextBtn.innerHTML = 'Review & Submit <i class="fa-solid fa-square-check"></i>';
  } else {
    nextBtn.innerHTML = 'Next <i class="fa-solid fa-arrow-right"></i>';
  }

  // Update Active index card grids
  updateJumpGridUI();
}

function selectOption(optIndex) {
  // Save selections
  userSelections[currentQuestionIndex] = optIndex;
  
  // Re-load question card to update CSS classes
  loadQuestion(currentQuestionIndex);
  
  // Update Jump grid styling to reflect answered
  renderJumpGrid();
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    loadQuestion(currentQuestionIndex - 1);
  }
}

function nextQuestion() {
  if (currentQuestionIndex < testQuestions.length - 1) {
    loadQuestion(currentQuestionIndex + 1);
  } else {
    // Reached final question: submit answers
    submitAptitudeAnswers();
  }
}

// Build Question Jump Navigation squares
function renderJumpGrid() {
  const container = document.getElementById('jumpGridContainer');
  if (!container) return;

  container.innerHTML = '';
  testQuestions.forEach((_, index) => {
    const btn = document.createElement('button');
    btn.className = 'jump-btn';
    btn.id = `jumpBtn-${index}`;
    btn.textContent = index + 1;
    
    // Set answered style if selected
    if (userSelections[index] !== null) {
      btn.classList.add('answered');
    }

    btn.onclick = () => loadQuestion(index);
    container.appendChild(btn);
  });
  updateJumpGridUI();
}

function updateJumpGridUI() {
  testQuestions.forEach((_, index) => {
    const btn = document.getElementById(`jumpBtn-${index}`);
    if (btn) {
      if (index === currentQuestionIndex) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

// Start timers
function startTestTimer() {
  clearInterval(timerInterval);
  clearInterval(elapsedTicker);

  timerInterval = setInterval(() => {
    timeRemainingSeconds--;
    updateTimerUI();
    if (timeRemainingSeconds <= 0) {
      submitAptitudeAnswers(); // Force automatic submit when time is up
    }
  }, 1000);

  elapsedTicker = setInterval(() => {
    elapsedSeconds++;
  }, 1000);
}

function updateTimerUI() {
  const m = Math.floor(timeRemainingSeconds / 60);
  const s = timeRemainingSeconds % 60;
  const formattedTime = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  
  const timerLabel = document.getElementById('timerLabel');
  if (timerLabel) {
    timerLabel.textContent = formattedTime;
    if (timeRemainingSeconds < 60) {
      timerLabel.style.color = 'var(--danger)';
    } else {
      timerLabel.style.color = 'var(--warning)';
    }
  }
}

// Submit answers for grading
async function submitAptitudeAnswers() {
  clearInterval(timerInterval);
  clearInterval(elapsedTicker);

  const activeTestState = document.getElementById('activeTestState');
  const processingState = document.getElementById('processingState');

  activeTestState.style.display = 'none';
  processingState.style.display = 'block';

  // Format payload
  const formattedAnswers = testQuestions.map((q, index) => {
    return {
      questionId: q._id,
      selectedOptionIndex: userSelections[index] !== null ? userSelections[index] : -1 // -1 represents skipped/unanswered
    };
  });

  try {
    const gradedResults = await API.post('/aptitude/submit', {
      answers: formattedAnswers,
      durationSeconds: elapsedSeconds
    });

    processingState.style.display = 'none';
    renderResultsSheet(gradedResults);

  } catch (error) {
    console.error('Submit test error:', error);
    processingState.style.display = 'none';
    activeTestState.style.display = 'block';
    alert(error.message || 'Failed to grade assessment. Check database connections.');
  }
}

// Render dynamic Results Scorecard View
function renderResultsSheet(results) {
  document.getElementById('resultsState').style.display = 'block';

  // Set meta description
  const m = Math.floor(results.durationSeconds / 60);
  const s = results.durationSeconds % 60;
  const durStr = `${m}m ${s}s`;
  document.getElementById('resultsMetaLabel').textContent = `Questions Graded: ${results.totalQuestions} &bull; Time Taken: ${durStr} &bull; Correct: ${results.correctCount}`;

  // Score circular gauge
  const percent = results.score;
  document.getElementById('gaugeScoreText').textContent = `${percent}%`;
  
  const circle = document.getElementById('gaugeCircle');
  const dashoffset = 440 - (440 * percent) / 100;
  circle.style.strokeDashoffset = dashoffset;

  // Grade Rating Feedbacks
  let rating = '';
  if (percent >= 80) rating = '🎉 Outstanding aptitude mastery! You demonstrated high quantitative logical skills. Ready for placement tests.';
  else if (percent >= 60) rating = '👍 Decent performance, displaying solid logical foundations. Practice arithmetic formulas slightly more to ensure top speed.';
  else rating = '📚 Base logical concepts require study. Focus on quantitative formula drills and logical patterns review to increase speed.';
  
  document.getElementById('resultsRatingFeedback').textContent = rating;

  // Solutions review list
  const container = document.getElementById('solutionsContainer');
  container.innerHTML = '';

  const letters = ['A', 'B', 'C', 'D'];

  results.answers.forEach((ans, index) => {
    const matchedQ = testQuestions.find(item => String(item._id) === String(ans.questionId));
    const allOptions = matchedQ ? matchedQ.options : [];

    const item = document.createElement('div');
    item.className = 'glass-card review-item';

    const selectedLetter = ans.selectedOptionIndex === -1 ? 'SKIPPED' : letters[ans.selectedOptionIndex];
    const correctLetter = letters[ans.correctOptionIndex];

    let iconColor = 'var(--danger)';
    let checkIcon = 'fa-circle-xmark';
    let statusLabel = 'INCORRECT';
    if (ans.isCorrect) {
      iconColor = 'var(--success)';
      checkIcon = 'fa-circle-check';
      statusLabel = 'CORRECT';
    }

    item.innerHTML = `
      <div class="review-header">
        <div>
          <span style="color: var(--accent-primary); margin-right: 12px;">Q${index + 1}</span>
          <span>${ans.questionText}</span>
        </div>
        <span style="color: ${iconColor}; display: inline-flex; align-items: center; gap: 8px; font-size: 13px;">
          <i class="fa-solid ${checkIcon}"></i> ${statusLabel}
        </span>
      </div>

      <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 20px; font-size: 13px;">
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 8px 16px; border-radius: 8px;">
          <span style="color: var(--text-secondary);">Your Selection:</span> 
          <strong style="color: ${ans.isCorrect ? 'var(--success)' : 'var(--danger)'};">${selectedLetter}</strong> 
          <span style="color: var(--text-muted); margin-left: 8px;">(${ans.selectedOptionIndex === -1 ? 'No answer' : allOptions[ans.selectedOptionIndex]})</span>
        </div>
        <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid var(--success); padding: 8px 16px; border-radius: 8px;">
          <span style="color: var(--text-secondary);">Correct Option:</span> 
          <strong style="color: var(--success);">${correctLetter}</strong> 
          <span style="color: var(--text-muted); margin-left: 8px;">(${allOptions[ans.correctOptionIndex]})</span>
        </div>
      </div>

      <div style="background: rgba(99,102,241,0.03); border: 1px solid var(--glass-border); padding: 16px 20px; border-radius: 10px;">
        <h4 style="font-size: 13px; color: var(--accent-primary); margin-bottom: 8px;"><i class="fa-solid fa-graduation-cap"></i> Calculation Explanation Blueprint:</h4>
        <p style="font-size: 13px; line-height: 1.6; color: var(--text-secondary);">${ans.explanation}</p>
      </div>
    `;
    container.appendChild(item);
  });
}

function resetAptitudeCenter() {
  document.getElementById('resultsState').style.display = 'none';
  document.getElementById('configState').style.display = 'block';
}

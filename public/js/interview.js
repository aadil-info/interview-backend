let sessionQuestions = [];
let currentQuestionIndex = 0;
let sessionAnswers = [];

// Session Timers
let totalDurationSeconds = 0;
let questionTimer = null;
let secondsRemaining = 120; // 2 minutes per question
let elapsedTicker = null;

// Speech Recognition Variables
let recognition = null;
let isRecording = false;

// Initialize Speech Recognition API
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Web Speech API is not supported in this browser.');
    const alertText = document.getElementById('speechSupportAlert');
    if (alertText) {
      alertText.textContent = '⚠️ Voice recording is not supported in this browser. Please type your responses manually.';
      alertText.style.color = 'var(--danger)';
    }
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isRecording = true;
    document.getElementById('micBtn').classList.add('recording');
    document.getElementById('recIndicator').style.display = 'block';
    document.getElementById('recLabelText').textContent = 'RECORDING ACTIVE';
    document.getElementById('recLabelText').style.color = '#fff';
    document.getElementById('micWaveform').style.display = 'flex';
  };

  recognition.onerror = (e) => {
    console.error('Speech recognition error:', e.error);
    stopRecordingState();
  };

  recognition.onend = () => {
    stopRecordingState();
  };

  recognition.onresult = (event) => {
    const responseArea = document.getElementById('responseArea');
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      // Append transcribed text
      if (responseArea.value && !responseArea.value.endsWith(' ')) {
        responseArea.value += ' ';
      }
      responseArea.value += finalTranscript;
      updateWordCount();
    }
  };
}

function stopRecordingState() {
  isRecording = false;
  const micBtn = document.getElementById('micBtn');
  if (micBtn) micBtn.classList.remove('recording');
  
  const recInd = document.getElementById('recIndicator');
  if (recInd) recInd.style.display = 'none';
  
  const recLabel = document.getElementById('recLabelText');
  if (recLabel) {
    recLabel.textContent = 'CAMERA STREAM ACTIVE';
    recLabel.style.color = 'var(--text-secondary)';
  }
  
  const wave = document.getElementById('micWaveform');
  if (wave) wave.style.display = 'none';
}

function toggleSpeechRecognition() {
  if (!recognition) {
    initSpeechRecognition();
  }
  if (!recognition) return;

  if (isRecording) {
    recognition.stop();
  } else {
    recognition.start();
  }
}

// Track words count dynamically in response area
function updateWordCount() {
  const val = document.getElementById('responseArea').value.trim();
  const count = val ? val.split(/\s+/).length : 0;
  document.getElementById('pacingIndexIndicator').textContent = `Words: ${count}`;
}

document.getElementById('responseArea').addEventListener('input', updateWordCount);

// Initialize a new AI Mock session
async function startMockSession() {
  const category = document.getElementById('cfgCategory').value;
  const difficulty = document.getElementById('cfgDifficulty').value;
  const count = document.getElementById('cfgCount').value;

  const configState = document.getElementById('configState');
  const processingState = document.getElementById('processingState');

  configState.style.display = 'none';
  processingState.style.display = 'block';

  try {
    // 1. Fetch randomized questions
    sessionQuestions = await API.post('/interviews/session/start', { category, difficulty, count });
    
    currentQuestionIndex = 0;
    sessionAnswers = [];
    totalDurationSeconds = 0;

    // Transition elements
    processingState.style.display = 'none';
    document.getElementById('activeMockState').style.display = 'block';
    
    // Set camera label overlay
    document.getElementById('recLabelText').textContent = 'CAMERA STREAM ACTIVE';
    document.getElementById('recLabelText').style.color = 'var(--text-secondary)';

    // Launch Session Tickers
    startSessionTimers();
    loadQuestion(0);

  } catch (error) {
    console.error('Error starting session:', error);
    processingState.style.display = 'none';
    configState.style.display = 'block';
    alert(error.message || 'Failed to start interview. Try again.');
  }
}

// Load specific question details
function loadQuestion(index) {
  if (index >= sessionQuestions.length) return;

  const q = sessionQuestions[index];
  document.getElementById('questionCounterLabel').textContent = `QUESTION ${index + 1} OF ${sessionQuestions.length}`;
  document.getElementById('questionTextLabel').textContent = q.questionText;
  document.getElementById('responseArea').value = '';
  document.getElementById('pacingIndexIndicator').textContent = `Words: 0`;
  
  // Update Next Button label on final step
  const nextBtn = document.getElementById('nextBtn');
  if (index === sessionQuestions.length - 1) {
    nextBtn.innerHTML = 'Finish Mock <i class="fa-solid fa-flag-checkered"></i>';
  } else {
    nextBtn.innerHTML = 'Next Question <i class="fa-solid fa-arrow-right"></i>';
  }

  // Check and update bookmark icon status
  updateBookmarkButtonIcon(q._id);

  // Stop recording if active
  if (isRecording && recognition) {
    recognition.stop();
  }

  // Reset Question level countdowns
  secondsRemaining = 120; // 2 minutes
  updateTimerUI();
}

// Rotates to the next question or submits responses
async function nextQuestion() {
  // Save answer
  const answerVal = document.getElementById('responseArea').value.trim();
  sessionAnswers.push({
    questionId: sessionQuestions[currentQuestionIndex]._id,
    userAnswer: answerVal
  });

  if (currentQuestionIndex < sessionQuestions.length - 1) {
    currentQuestionIndex++;
    loadQuestion(currentQuestionIndex);
  } else {
    // Final question completed -> dispatch submissions
    await submitInterviewResponses();
  }
}

// Submits responses to grading engine
async function submitInterviewResponses() {
  // Terminate active timer tickers
  clearInterval(questionTimer);
  clearInterval(elapsedTicker);

  if (isRecording && recognition) {
    recognition.stop();
  }

  const activeMockState = document.getElementById('activeMockState');
  const processingState = document.getElementById('processingState');

  activeMockState.style.display = 'none';
  processingState.style.display = 'block';

  try {
    const category = document.getElementById('cfgCategory').value;
    const difficulty = document.getElementById('cfgDifficulty').value;

    // Send payload
    const feedbackResponse = await API.post('/interviews/session/submit', {
      category,
      difficulty,
      durationSeconds: totalDurationSeconds,
      answers: sessionAnswers
    });

    // Load AI Report Cards
    processingState.style.display = 'none';
    renderReportCard(feedbackResponse);

  } catch (error) {
    console.error('Error submitting interview response:', error);
    processingState.style.display = 'none';
    activeMockState.style.display = 'block';
    alert(error.message || 'Failed to submit responses. Check database connections.');
  }
}

// Toggle Bookmarking for current question
async function bookmarkCurrentQuestion() {
  if (sessionQuestions.length === 0) return;
  const qId = sessionQuestions[currentQuestionIndex]._id;

  try {
    const res = await API.post(`/interviews/questions/${qId}/bookmark`);
    
    // Save updated bookmarks array in profile cache
    const profile = API.getProfile();
    if (profile) {
      profile.bookmarks = res.bookmarks;
      API.setProfile(profile);
    }
    
    updateBookmarkButtonIcon(qId);
  } catch (error) {
    console.error('Bookmark error:', error);
  }
}

function updateBookmarkButtonIcon(qId) {
  const bookmarkBtn = document.getElementById('bookmarkBtn');
  const profile = API.getProfile();
  if (!profile || !bookmarkBtn) return;

  const isBookmarked = (profile.bookmarks || []).includes(qId);
  if (isBookmarked) {
    bookmarkBtn.innerHTML = '<i class="fa-solid fa-bookmark" style="color: var(--accent-primary);"></i> Bookmarked';
  } else {
    bookmarkBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i> Bookmark';
  }
}

// Start timers
function startSessionTimers() {
  clearInterval(questionTimer);
  clearInterval(elapsedTicker);

  // 1. Question level countdown
  questionTimer = setInterval(() => {
    secondsRemaining--;
    updateTimerUI();
    if (secondsRemaining <= 0) {
      // Force next question when time is up
      nextQuestion();
    }
  }, 1000);

  // 2. Session cumulative ticker
  elapsedTicker = setInterval(() => {
    totalDurationSeconds++;
  }, 1000);
}

function updateTimerUI() {
  const m = Math.floor(secondsRemaining / 60);
  const s = secondsRemaining % 60;
  const formattedTime = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  
  const timerLabel = document.getElementById('timerLabel');
  if (timerLabel) {
    timerLabel.innerHTML = `<i class="fa-regular fa-clock"></i> ${formattedTime}`;
    // Warning styling for low durations
    if (secondsRemaining < 20) {
      timerLabel.style.color = 'var(--danger)';
    } else {
      timerLabel.style.color = 'var(--warning)';
    }
  }
}

// Render dynamic AI Report Card View
function renderReportCard(session) {
  document.getElementById('reportCardState').style.display = 'block';
  
  // Set meta title details
  const dateStr = new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('reportMetaLabel').textContent = `Domain: ${session.category.toUpperCase()} &bull; Difficulty: ${session.difficulty.toUpperCase()} &bull; Date: ${dateStr}`;
  
  // Overall feedback text
  document.getElementById('reportOverallFeedback').textContent = session.overallFeedback;

  // Grade svg gauge computation
  const percent = session.overallScore;
  document.getElementById('gaugeScoreText').textContent = `${percent}%`;
  
  const circle = document.getElementById('gaugeCircle');
  // SVG Circumference = 2 * PI * r = 2 * 3.14 * 70 = 440 approx
  const dashoffset = 440 - (440 * percent) / 100;
  circle.style.strokeDashoffset = dashoffset;

  // Render question-by-question accordion items
  const container = document.getElementById('accordionContainer');
  container.innerHTML = '';

  session.questions.forEach((q, index) => {
    const item = document.createElement('div');
    item.className = 'glass-card accordion-item';

    item.innerHTML = `
      <div class="accordion-header" onclick="toggleAccordion(${index})">
        <div>
          <span style="color: var(--accent-primary); margin-right: 12px; font-weight: bold;">Q${index + 1}</span>
          <span>${q.questionText.length > 60 ? q.questionText.substr(0, 60) + '...' : q.questionText}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 12px; font-weight: bold; color: ${q.score >= 80 ? 'var(--success)' : q.score >= 60 ? 'var(--warning)' : 'var(--danger)'};">
            Score: ${q.score}%
          </span>
          <i class="fa-solid fa-chevron-down" id="chevron-${index}"></i>
        </div>
      </div>
      <div class="accordion-content" id="content-${index}">
        <div style="margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 10px; border: 1px solid var(--glass-border);">
          <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px; font-weight: bold;">YOUR TRANSCRIPT / RESPONSE:</div>
          <p style="font-size: 13px; line-height: 1.6; color: var(--text-primary); font-style: italic;">
            "${q.userAnswer || 'No response was provided.'}"
          </p>
        </div>

        <div class="feedback-grid">
          
          <div style="background: rgba(99, 102, 241, 0.03); padding: 20px; border-radius: 12px; border: 1px solid var(--glass-border);">
            <h4 style="color: var(--accent-primary); margin-bottom: 12px; font-size: 14px;"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Assessment Diagnostic</h4>
            <div style="font-size: 13px; line-height: 1.6; color: var(--text-secondary);">
              ${q.feedback.replace(/\n/g, '<br>')}
            </div>
            
            <div style="display: flex; gap: 16px; margin-top: 16px; border-top: 1px solid var(--glass-border); padding-top: 12px;">
              <div>
                <span style="font-size: 10px; color: var(--text-muted); display: block;">PACING SPEED</span>
                <strong style="color: var(--text-primary); font-size: 13px;">${q.speed} WPM</strong>
              </div>
              <div>
                <span style="font-size: 10px; color: var(--text-muted); display: block;">DELIVERY TONE</span>
                <strong style="color: var(--text-primary); font-size: 13px;">${q.sentiment}</strong>
              </div>
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.01); padding: 20px; border-radius: 12px; border: 1px solid var(--glass-border);">
            <h4 style="color: var(--success); margin-bottom: 12px; font-size: 14px;"><i class="fa-solid fa-graduation-cap"></i> Ideal Industry Blueprint</h4>
            <p style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); font-style: italic;" id="idealResponse-${index}">
              Retrieving suggested reference answer...
            </p>
          </div>

        </div>
      </div>
    `;
    container.appendChild(item);

    // Dynamic extraction of reference ideal answers in accordion rows
    fetchIdealResponse(q.questionId, index);
  });
}

async function fetchIdealResponse(qId, index) {
  try {
    const questions = await API.get('/admin/questions'); // Cache helper or standard endpoint
    const matched = questions.find(item => String(item._id) === String(qId));
    const label = document.getElementById(`idealResponse-${index}`);
    if (matched && label) {
      label.textContent = matched.idealResponse || 'Ideal blueprint response not preloaded.';
    }
  } catch (e) {
    // fallback gracefully
  }
}

function toggleAccordion(index) {
  const content = document.getElementById(`content-${index}`);
  const chevron = document.getElementById(`chevron-${index}`);
  
  if (content.classList.contains('active')) {
    content.classList.remove('active');
    chevron.className = 'fa-solid fa-chevron-down';
  } else {
    content.classList.add('active');
    chevron.className = 'fa-solid fa-chevron-up';
  }
}

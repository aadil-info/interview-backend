// Admin Panel JavaScript Controller
let allQuestions = [];
let allUsers = [];
let editingQuestionId = null;

// ─── Initialization ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadAdminStats();
  loadQuestions();
  loadUsers();
});

// ─── Tab Switching ──────────────────────────────────────────────────────────
function switchTab(tab) {
  ['questions', 'users', 'activity'].forEach(t => {
    document.getElementById('tab-' + t).style.display = t === tab ? 'block' : 'none';
    document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1)).classList.toggle('active', t === tab);
  });
}

// ─── Load Global Stats ──────────────────────────────────────────────────────
async function loadAdminStats() {
  try {
    const data = await API.get('/admin/stats');

    document.getElementById('statUsers').textContent       = data.metrics.totalUsers;
    document.getElementById('statQuestions').textContent   = data.metrics.totalQuestions;
    document.getElementById('statInterviews').textContent  = data.metrics.totalInterviews;
    document.getElementById('statAvgScore').textContent    = data.metrics.globalInterviewAverage + '%';

    // Render activity feed
    renderActivityFeed(data.recentActivity || []);
  } catch (err) {
    console.error('Load admin stats error:', err);
  }
}

function renderActivityFeed(activities) {
  const container = document.getElementById('activityFeedContainer');
  if (!activities || activities.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-secondary);">No platform activity recorded yet.</p>';
    return;
  }

  const iconMap = { 'Mock Interview': 'fa-video', 'Aptitude Test': 'fa-calculator', 'Resume ATS Scan': 'fa-file-invoice' };
  const colorMap = { 'Mock Interview': 'var(--accent-primary)', 'Aptitude Test': 'var(--accent-secondary)', 'Resume ATS Scan': 'var(--warning)' };

  container.innerHTML = activities.map(act => {
    const dateStr = new Date(act.date).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    return `
      <div class="activity-feed-item">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:34px;height:34px;border-radius:8px;border:1px solid var(--glass-border);
            display:flex;align-items:center;justify-content:center;font-size:14px;color:${colorMap[act.type]||'var(--accent-primary)'}">
            <i class="fa-solid ${iconMap[act.type]||'fa-circle'}"></i>
          </div>
          <div>
            <strong style="display:block;">${act.userName}</strong>
            <span style="font-size:11px;color:var(--text-secondary);">${act.type} &bull; ${act.label} &bull; ${dateStr}</span>
          </div>
        </div>
        <span style="font-weight:700;font-family:var(--font-heading);
          color:${act.score >= 80 ? 'var(--success)' : act.score >= 60 ? 'var(--warning)' : 'var(--danger)'};">
          ${act.score}%
        </span>
      </div>`;
  }).join('');
}

// ─── Questions Management ────────────────────────────────────────────────────
async function loadQuestions() {
  try {
    allQuestions = await API.get('/admin/questions');
    renderQuestionsTable(allQuestions);
  } catch (err) {
    document.getElementById('questionsTableBody').innerHTML =
      `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--danger);">Failed to load questions: ${err.message}</td></tr>`;
  }
}

function renderQuestionsTable(questions) {
  const tbody = document.getElementById('questionsTableBody');
  if (!questions || questions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-secondary);">
      No questions found. Click <strong>Add New Question</strong> to get started.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = questions.map(q => `
    <tr>
      <td style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${q.questionText}">
        ${q.questionText}
      </td>
      <td><span class="category-chip chip-${q.category}">${q.category.toUpperCase()}</span></td>
      <td style="color:var(--text-secondary);">${q.topic}</td>
      <td><span class="category-chip chip-${q.difficulty}">${q.difficulty}</span></td>
      <td style="text-align:center;">
        <button class="action-btn edit" onclick="editQuestion('${q._id}')" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="action-btn delete" onclick="deleteQuestion('${q._id}', this)" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function filterQuestions() {
  const q = document.getElementById('questionSearch').value.toLowerCase();
  const filtered = allQuestions.filter(item =>
    item.questionText.toLowerCase().includes(q) ||
    item.topic.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q)
  );
  renderQuestionsTable(filtered);
}

// ─── Question Modal ──────────────────────────────────────────────────────────
function openQuestionModal(id = null) {
  editingQuestionId = id;
  document.getElementById('modalTitle').textContent = id ? 'Edit Question' : 'Add New Question';
  document.getElementById('modalAlert').style.display = 'none';

  if (id) {
    const q = allQuestions.find(item => String(item._id) === String(id));
    if (q) {
      document.getElementById('mCategory').value       = q.category;
      document.getElementById('mTopic').value          = q.topic;
      document.getElementById('mDifficulty').value     = q.difficulty;
      document.getElementById('mQuestionText').value   = q.questionText;
      document.getElementById('mKeywords').value       = (q.suggestedKeywords || []).join(', ');
      document.getElementById('mIdealResponse').value  = q.idealResponse || '';
      document.getElementById('mOptions').value        = (q.options || []).join('\n');
      document.getElementById('mCorrectIndex').value   = q.correctOptionIndex !== undefined ? q.correctOptionIndex : 0;
      document.getElementById('mExplanation').value    = q.explanation || '';
      toggleAptitudeFields();
    }
  } else {
    document.getElementById('mCategory').value       = 'technical';
    document.getElementById('mTopic').value          = '';
    document.getElementById('mDifficulty').value     = 'intermediate';
    document.getElementById('mQuestionText').value   = '';
    document.getElementById('mKeywords').value       = '';
    document.getElementById('mIdealResponse').value  = '';
    document.getElementById('mOptions').value        = '';
    document.getElementById('mCorrectIndex').value   = '0';
    document.getElementById('mExplanation').value    = '';
    toggleAptitudeFields();
  }

  document.getElementById('questionModal').classList.add('active');
}

function editQuestion(id) {
  openQuestionModal(id);
}

function closeQuestionModal() {
  document.getElementById('questionModal').classList.remove('active');
  editingQuestionId = null;
}

function toggleAptitudeFields() {
  const cat = document.getElementById('mCategory').value;
  document.getElementById('aptitudeFields').style.display = cat === 'aptitude' ? 'block' : 'none';
  document.getElementById('techHrFields').style.display   = cat !== 'aptitude' ? 'block' : 'none';
}

async function saveQuestion() {
  const btn = document.getElementById('saveQuestionBtn');
  const alertEl = document.getElementById('modalAlert');
  alertEl.style.display = 'none';

  const category    = document.getElementById('mCategory').value;
  const topic       = document.getElementById('mTopic').value.trim();
  const difficulty  = document.getElementById('mDifficulty').value;
  const questionText= document.getElementById('mQuestionText').value.trim();

  if (!topic || !questionText) {
    alertEl.className = 'auth-alert danger';
    alertEl.textContent = 'Topic and Question Text are required.';
    alertEl.style.display = 'block';
    return;
  }

  const payload = { category, topic, difficulty, questionText };

  if (category === 'aptitude') {
    const rawOptions = document.getElementById('mOptions').value.trim().split('\n').map(o => o.trim()).filter(Boolean);
    payload.options = rawOptions;
    payload.correctOptionIndex = Number(document.getElementById('mCorrectIndex').value);
  } else {
    payload.suggestedKeywords = document.getElementById('mKeywords').value.split(',').map(k => k.trim()).filter(Boolean);
    payload.idealResponse = document.getElementById('mIdealResponse').value.trim();
  }

  payload.explanation = document.getElementById('mExplanation').value.trim();

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';

  try {
    if (editingQuestionId) {
      await API.put(`/admin/questions/${editingQuestionId}`, payload);
    } else {
      await API.post('/admin/questions', payload);
    }
    closeQuestionModal();
    await loadQuestions();
    await loadAdminStats();
  } catch (err) {
    alertEl.className = 'auth-alert danger';
    alertEl.textContent = err.message || 'Save failed. Try again.';
    alertEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Question';
  }
}

async function deleteQuestion(id, btn) {
  if (!confirm('Permanently delete this question from the bank?')) return;
  btn.disabled = true;
  try {
    await API.delete(`/admin/questions/${id}`);
    allQuestions = allQuestions.filter(q => String(q._id) !== String(id));
    renderQuestionsTable(allQuestions);
    await loadAdminStats();
  } catch (err) {
    alert(err.message || 'Delete failed.');
    btn.disabled = false;
  }
}

// ─── Users Management ────────────────────────────────────────────────────────
async function loadUsers() {
  try {
    allUsers = await API.get('/admin/users');
    document.getElementById('userCountLabel').textContent = `${allUsers.length} registered accounts`;
    renderUsersTable(allUsers);
  } catch (err) {
    document.getElementById('usersTableBody').innerHTML =
      `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--danger);">Failed to load users: ${err.message}</td></tr>`;
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!users || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-secondary);">No user accounts found.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const date = new Date(u.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
    const roleColor = u.role === 'admin' ? 'var(--warning)' : 'var(--success)';
    return `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td style="color:var(--text-secondary);">${u.email}</td>
        <td>
          <span class="category-chip" style="background:rgba(0,0,0,0.2);color:${roleColor};border:1px solid ${roleColor}30;">
            ${u.role.toUpperCase()}
          </span>
        </td>
        <td style="color:var(--text-secondary);font-size:12px;">${date}</td>
        <td style="text-align:center;">
          <button class="action-btn delete" onclick="deleteUser('${u._id}', '${u.name}', this)" title="Delete User">
            <i class="fa-solid fa-user-minus"></i>
          </button>
        </td>
      </tr>`;
  }).join('');
}

function filterUsers() {
  const q = document.getElementById('userSearch').value.toLowerCase();
  const filtered = allUsers.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  renderUsersTable(filtered);
}

async function deleteUser(id, name, btn) {
  if (!confirm(`Remove user "${name}" and all their activity logs permanently?`)) return;
  btn.disabled = true;
  try {
    await API.delete(`/admin/users/${id}`);
    allUsers = allUsers.filter(u => String(u._id) !== String(id));
    document.getElementById('userCountLabel').textContent = `${allUsers.length} registered accounts`;
    renderUsersTable(allUsers);
    await loadAdminStats();
  } catch (err) {
    alert(err.message || 'Delete failed.');
    btn.disabled = false;
  }
}

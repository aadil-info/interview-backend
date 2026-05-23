document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
});

let performanceChartInstance = null;
let ratioChartInstance = null;

async function loadDashboardData() {
  try {
    // 1. Fetch user profile and comprehensive stats from unified endpoint
    const data = await API.get('/auth/profile');
    const { profile, stats, recentActivity } = data;

    // 2. Set user card badges and administrative drawer toggle
    document.getElementById('userNameLabel').textContent = profile.name;
    document.getElementById('greetingLabel').textContent = `Welcome Back, ${profile.name.split(' ')[0]}!`;
    document.getElementById('avatarLetter').textContent = profile.name.charAt(0).toUpperCase();
    
    const roleLabel = document.getElementById('userRoleLabel');
    roleLabel.textContent = profile.role === 'admin' ? 'Administrator' : 'Placement Candidate';

    if (profile.role === 'admin') {
      const adminNav = document.getElementById('adminNav');
      if (adminNav) adminNav.style.display = 'block';
    }

    // Today's formatted date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('todayDateLabel').textContent = new Date().toLocaleDateString('en-US', options);

    // 3. Bind card metric data
    document.getElementById('cardMocks').textContent = stats.totalInterviews;
    document.getElementById('cardScore').textContent = `${stats.avgInterviewScore}%`;
    document.getElementById('cardAptitude').textContent = stats.totalAptitudeTests;
    document.getElementById('cardATS').textContent = `${stats.latestResumeATS}%`;

    // 4. Render timeline activity feeds
    renderActivityFeed(recentActivity);

    // 5. Fetch and render Global Leaderboards
    await loadLeaderboard();

    // 6. Assemble Chart.js charts
    renderPerformanceCharts(recentActivity, stats);

  } catch (error) {
    console.error('Error loading dashboard telemetry:', error);
  }
}

// Build timeline log list
function renderActivityFeed(activities) {
  const container = document.getElementById('activityFeedContainer');
  if (!container) return;

  if (!activities || activities.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fa-solid fa-folder-open" style="font-size: 32px; color: var(--text-muted); margin-bottom: 12px; display: block;"></i>
        No practice sessions taken yet. Ready to take your first mock?
        <a href="/interview" class="btn btn-primary" style="margin-top: 16px; font-size: 12px; padding: 8px 16px;">Start Interview</a>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  activities.forEach(act => {
    const item = document.createElement('div');
    item.className = 'activity-item';

    // Set colors & icons based on activity type
    let color = 'var(--accent-primary)';
    let icon = 'fa-video';
    if (act.type === 'Aptitude Test') {
      color = 'var(--accent-secondary)';
      icon = 'fa-calculator';
    } else if (act.type === 'Resume ATS Scan') {
      color = 'var(--warning)';
      icon = 'fa-file-invoice';
    }

    const dateStr = new Date(act.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    item.innerHTML = `
      <div class="activity-meta">
        <div class="activity-icon" style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); color: ${color};">
          <i class="fa-solid ${icon}"></i>
        </div>
        <div>
          <strong style="display: block;">${act.type}</strong>
          <span style="font-size: 11px; color: var(--text-secondary);">${act.label} &bull; ${dateStr}</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-family: var(--font-heading); font-weight: 700; color: ${act.score >= 80 ? 'var(--success)' : act.score >= 60 ? 'var(--warning)' : 'var(--text-secondary)'};">
          ${act.score}%
        </span>
      </div>
    `;
    container.appendChild(item);
  });
}

// Fetch global placement rankings leaderboard
async function loadLeaderboard() {
  const container = document.getElementById('leaderboardContainer');
  if (!container) return;

  try {
    const leaderboard = await API.get('/interviews/leaderboard');
    container.innerHTML = '';

    if (!leaderboard || leaderboard.length === 0) {
      container.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No leaderboard entries logged.</td></tr>`;
      return;
    }

    leaderboard.forEach((user, index) => {
      const rank = index + 1;
      const row = document.createElement('tr');

      let rankClass = '';
      let medalIcon = rank;
      if (rank === 1) {
        rankClass = 'rank-num rank-1';
        medalIcon = '<i class="fa-solid fa-trophy"></i>';
      } else if (rank === 2) {
        rankClass = 'rank-num rank-2';
        medalIcon = '<i class="fa-solid fa-trophy"></i>';
      } else if (rank === 3) {
        rankClass = 'rank-num rank-3';
        medalIcon = '<i class="fa-solid fa-trophy"></i>';
      } else {
        rankClass = 'rank-num';
      }

      row.innerHTML = `
        <td class="${rankClass}">${medalIcon}</td>
        <td><strong>${user.name}</strong></td>
        <td style="text-align: center;">${user.totalSessions}</td>
        <td style="text-align: right; font-weight: bold; color: var(--accent-primary);">${user.xpPoints} <span style="font-size:9px; color:var(--text-muted);">XP</span></td>
      `;
      container.appendChild(row);
    });
  } catch (error) {
    console.error('Error compiling leaderboard rows:', error);
    container.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger);">Failed to load leaderboard database.</td></tr>`;
  }
}

// Render dynamic Chart.js charts
function renderPerformanceCharts(activities, stats) {
  // --- 1. PERFORMANCE CURVE (Line Chart) ---
  const perfCanvas = document.getElementById('performanceChart');
  if (perfCanvas) {
    const ctx = perfCanvas.getContext('2d');
    
    // Sort chronological ascending (older first) for rendering curves
    const chronActivities = [...activities]
      .filter(a => a.type !== 'Resume ATS Scan') // exclude resume uploads
      .reverse();

    const chartLabels = chronActivities.map(a => new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const chartScores = chronActivities.map(a => a.score);

    // Default seed points if no tests are taken to make chart load beautifully
    if (chartLabels.length === 0) {
      chartLabels.push('Baseline Target');
      chartScores.push(50);
    }

    if (performanceChartInstance) {
      performanceChartInstance.destroy();
    }

    performanceChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Performance Score %',
          data: chartScores,
          borderColor: '#6366f1', // Indigo
          backgroundColor: 'rgba(99, 102, 241, 0.05)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#a855f7',
          pointBorderColor: '#ffffff',
          pointHoverRadius: 7,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: { color: '#a1a1aa' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#a1a1aa' }
          }
        }
      }
    });
  }

  // --- 2. PRACTICE RATIOS BREAKDOWN (Doughnut Chart) ---
  const ratioCanvas = document.getElementById('ratioChart');
  if (ratioCanvas) {
    const ctx = ratioCanvas.getContext('2d');

    if (ratioChartInstance) {
      ratioChartInstance.destroy();
    }

    const totalMocks = stats.totalInterviews;
    const totalApts = stats.totalAptitudeTests;
    
    // Default placeholder data if both are zero
    const mocksVal = totalMocks === 0 && totalApts === 0 ? 1 : totalMocks;
    const aptsVal = totalMocks === 0 && totalApts === 0 ? 1 : totalApts;

    ratioChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Mock Interviews', 'Aptitude Tests'],
        datasets: [{
          data: [mocksVal, aptsVal],
          backgroundColor: ['#6366f1', '#ec4899'],
          borderColor: 'rgba(22, 22, 26, 0.9)',
          borderWidth: 4,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#a1a1aa',
              font: { family: 'Outfit', size: 11 }
            }
          }
        },
        cutout: '70%'
      }
    });
  }
}

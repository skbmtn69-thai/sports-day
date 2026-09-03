// ====== State ======
let state = {
  scores: [],
  totalScores: { orange: 0, pink: 0 },
  eventScores: {},
  events: [...DEFAULT_EVENTS],
  selectedTeam: null
};

let editing = false;
let editingRow = null;

// ====== Init ======
document.addEventListener('DOMContentLoaded', function () {
  loadData();
});

// ====== API Helper ======
async function callAPI(action, params = {}) {
  const url = new URL(APP_SCRIPT_URL);
  url.searchParams.append('action', action);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors'
  });

  if (!response.ok) {
    throw new Error('HTTP Error: ' + response.status);
  }

  const text = await response.text();
  return JSON.parse(text);
}



// ====== Load Data ======
async function loadData() {
  showLoading('loadAdd');
  showLoading('loadHistory');

  try {
    const result = await callAPI('getScores');
    if (result.success) {
      state.scores = result.scores || [];
      state.totalScores = result.totalScores || { orange: 0, pink: 0 };
      state.eventScores = result.eventScores || {};
      if (result.events && result.events.length > 0) {
        state.events = result.events;
      }
    }
  } catch (e) {
    console.error('Error loading data:', e);
    showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
  }

  renderScoreboard();
  renderEventSelect();
  renderScoreTable();
  renderQuickAdd();
  hideLoading('loadAdd');
  hideLoading('loadHistory');
}

// ====== Render: Scoreboard ======
function renderScoreboard() {
  const orangeScore = state.totalScores['orange'] || 0;
  const pinkScore = state.totalScores['pink'] || 0;

  document.getElementById('orangeScore').textContent = orangeScore;
  document.getElementById('pinkScore').textContent = pinkScore;

  const orangeWinner = document.getElementById('orangeWinner');
  const pinkWinner = document.getElementById('pinkWinner');

  orangeWinner.classList.remove('show');
  pinkWinner.classList.remove('show');

  if (orangeScore > pinkScore) {
    orangeWinner.classList.add('show');
  } else if (pinkScore > orangeScore) {
    pinkWinner.classList.add('show');
  }
}

// ====== Render: Event Select ======
function renderEventSelect() {
  const select = document.getElementById('eventSelect');
  select.innerHTML = '';

  state.events.forEach(function (event) {
    const option = document.createElement('option');
    option.value = event.name;
    option.textContent = event.name;
    select.appendChild(option);
  });

  // กรณีไม่มี event
  if (state.events.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'ไม่มีรายการ';
    select.appendChild(option);
  }
}

// ====== Render: Score Table ======
function renderScoreTable() {
  const tbody = document.getElementById('scoreTableBody');
  tbody.innerHTML = '';

  if (!state.scores || state.scores.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="emoji">📭</div>
            <p>ยังไม่มีข้อมูลคะแนน</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  // เรียงจากใหม่ไปเก่า
  const sorted = [...state.scores].sort(function (a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  sorted.forEach(function (score, index) {
    const teamInfo = TEAMS[score.team] || { name: score.team, color: '#999', emoji: '🏳️' };
    const row = document.createElement('tr');
    const globalRow = state.scores.indexOf(score) + 2; // +2 เพราะ row 1 คือ header และ array 0-indexed

    row.innerHTML = `
      <td>${formatDateTime(score.timestamp)}</td>
      <td><span class="team-chip ${score.team}">${teamInfo.emoji} ${teamInfo.name}</span></td>
      <td>${escapeHTML(score.event)}</td>
      <td><strong>${score.score}</strong></td>
      <td>
        <button class="btn-delete" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:1rem;" onclick="deleteScoreEntry(${globalRow}, '${score.team}', '${escapeJS(score.event)}', ${score.score})">🗑️</button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

// ====== Render: Quick Add ======
function renderQuickAdd() {
  const container = document.getElementById('quickButtons');
  container.innerHTML = '';

  if (state.events.length === 0) return;

  const card = document.getElementById('quickAddCard');
  card.style.display = 'block';

  // สร้างปุ่ม quick add สำหรับแต่ละ event และแต่ละทีม
  state.events.forEach(function (event) {
    Object.keys(TEAMS).forEach(function (team) {
      const teamInfo = TEAMS[team];
      const btn = document.createElement('button');
      btn.className = 'quick-btn';
      btn.style.cssText = `
        padding: 12px;
        border: none;
        border-radius: 12px;
        background: ${team === 'orange' ? 'var(--gradient-orange)' : 'var(--gradient-pink)'};
        color: white;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        font-size: 0.9rem;
        transition: transform 0.2s ease;
      `;
      btn.onmouseover = function () { btn.style.transform = 'translateY(-2px)'; };
      btn.onmouseout = function () { btn.style.transform = ''; };
      btn.onclick = function () {
        quickAddScore(team, event.name);
      };
      btn.innerHTML = `${teamInfo.emoji} ${escapeHTML(event.name)} +10`;
      container.appendChild(btn);
    });
  });
}

// ====== Team Select ======
function selectTeam(el) {
  document.querySelectorAll('.team-option').forEach(function (opt) {
    opt.classList.remove('selected');
  });
  el.classList.add('selected');
  state.selectedTeam = el.dataset.team;
}

// ====== Submit Score ======
async function submitScore(e) {
  e.preventDefault();

  if (!state.selectedTeam) {
    showToast('กรุณาเลือกทีมก่อน', 'error');
    return;
  }

  const event = document.getElementById('eventSelect').value;
  const score = document.getElementById('scoreInput').value;

  if (!event || !score) {
    showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ กำลังบันทึก...';

  try {
    const result = await callAPI('addScore', {
      team: state.selectedTeam,
      event: event,
      score: score
    });

    if (result.success) {
      showToast('✅ บันทึกคะแนนเรียบร้อย', 'success');
      clearForm();
      await loadData();
    } else {
      showToast(result.error || 'บันทึกไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Submit error:', err);
    showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '💾 บันทึกคะแนน';
  }
}

async function quickAddScore(team, eventName) {
  try {
    const result = await callAPI('addScore', {
      team: team,
      event: eventName,
      score: 10
    });

    if (result.success) {
      showToast('✅ +10 คะแนนให้ทีม ' + (TEAMS[team] ? TEAMS[team].name : team), 'success');
      await loadData();
    } else {
      showToast(result.error || 'บันทึกไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Quick add error:', err);
    showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
  }
}

// ====== Delete Score ======
async function deleteScoreEntry(row, team, event, score) {
  if (!confirm('ต้องการลบคะแนนนี้หรือไม่?\n' + TEAMS[team].name + ' - ' + event + ' +' + score)) {
    return;
  }

  try {
    const result = await callAPI('deleteScore', { row: row });
    if (result.success) {
      showToast('✅ ลบรายการเรียบร้อย', 'success');
      await loadData();
    } else {
      showToast(result.error || 'ลบไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Delete error:', err);
    showToast('เกิดข้อผิดพลาดในการลบ', 'error');
  }
}

// ====== Reset Scores ======
async function resetScores() {
  if (!confirm('⚠️ ต้องการล้างคะแนนทั้งหมด?\nการกระทำนี้ไม่สามารถกู้คืนได้')) {
    return;
  }

  try {
    const result = await callAPI('resetScores', {});
    if (result.success) {
      showToast('✅ ล้างคะแนนทั้งหมดเรียบร้อย', 'success');
      await loadData();
    } else {
      showToast(result.error || 'ล้างไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Reset error:', err);
    showToast('เกิดข้อผิดพลาดในการล้าง', 'error');
  }
}

// ====== Clear Form ======
function clearForm() {
  state.selectedTeam = null;
  document.querySelectorAll('.team-option').forEach(function (opt) {
    opt.classList.remove('selected');
  });
  document.getElementById('scoreInput').value = '';
  document.getElementById('eventSelect').selectedIndex = 0;
}

// ====== Tab Switching ======
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.classList.remove('active');
    if (btn.dataset.tab === tab) {
      btn.classList.add('active');
    }
  });

  document.querySelectorAll('.tab-content').forEach(function (section) {
    section.style.display = 'none';
  });

  document.getElementById('tab-' + tab).style.display = 'block';
}

// ====== Toast ======
function showToast(message, type) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'success');
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add('hide');
    setTimeout(function () {
      toast.remove();
    }, 300);
  }, 3000);
}

// ====== Loading ======
function showLoading(id) {
  document.getElementById(id).classList.add('show');
}

function hideLoading(id) {
  document.getElementById(id).classList.remove('show');
}

// ====== Utils ======
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    const pad = function (n) { return n < 10 ? '0' + n : n; };
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear() + 543; // พ.ศ.
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    return `${day}/${month}/${year} ${hour}:${minute}`;
  } catch (e) {
    return dateStr;
  }
}

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeJS(str) {
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
}

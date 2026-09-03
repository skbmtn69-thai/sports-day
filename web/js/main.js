// ====== State ======
let state = {
  scores: [],
  totalScores: { orange: 0, pink: 0 },
  eventScores: {},
  events: [...DEFAULT_EVENTS],
  selectedTeam: null,
  currentCategoryFilter: 'all',
  currentQuickCategoryFilter: 'all'
};

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

  const response = await fetch(url);
  const text = await response.text();
  return JSON.parse(text);
}

// ====== Load Data ======
async function loadData() {
  showLoading('loadAdd');
  showLoading('loadHistory');
  showLoading('loadEvents');

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
  renderEventTable();
  hideLoading('loadAdd');
  hideLoading('loadHistory');
  hideLoading('loadEvents');
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

  const filtered = getFilteredEvents(state.currentCategoryFilter);

  if (filtered.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'ไม่มีรายการ';
    select.appendChild(option);
    return;
  }

  filtered.forEach(function (event) {
    const catInfo = CATEGORIES[event.category] || CATEGORIES['mixed'];
    const option = document.createElement('option');
    option.value = event.name;
    option.dataset.category = event.category;
    option.textContent = catInfo.emoji + ' ' + event.name;
    select.appendChild(option);
  });
}

function getFilteredEvents(category) {
  if (category === 'all') return state.events;
  return state.events.filter(function (e) { return e.category === category; });
}

// ====== Category Filter ======
function filterByCategory(category, btn) {
  state.currentCategoryFilter = category;

  document.querySelectorAll('#categoryTabs .cat-tab').forEach(function (tab) {
    tab.classList.remove('active');
  });
  btn.classList.add('active');

  renderEventSelect();
}

function filterQuickButtons(category, btn) {
  state.currentQuickCategoryFilter = category;

  document.querySelectorAll('#quickCategoryTabs .cat-tab').forEach(function (tab) {
    tab.classList.remove('active');
  });
  btn.classList.add('active');

  renderQuickButtons();
}

// ====== Render: Event Table ======
function renderEventTable() {
  const tbody = document.getElementById('eventTableBody');
  tbody.innerHTML = '';

  if (state.events.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3"><div class="empty-state"><div class="emoji">📭</div><p>ยังไม่มีรายการกีฬา</p></div></td></tr>';
    return;
  }

  state.events.forEach(function (event) {
    const catInfo = CATEGORIES[event.category] || CATEGORIES['mixed'];
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${escapeHTML(event.name)}</strong></td>
      <td><span class="category-chip" style="background:${catInfo.color};">${catInfo.emoji} ${catInfo.name}</span></td>
      <td>
        <button class="btn-icon" onclick="deleteEventEntry('${event.id}', '${escapeJS(event.name)}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ====== Render: Score Table ======
function renderScoreTable() {
  const tbody = document.getElementById('scoreTableBody');
  tbody.innerHTML = '';

  if (!state.scores || state.scores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="emoji">📭</div><p>ยังไม่มีข้อมูลคะแนน</p></div></td></tr>';
    return;
  }

  const sorted = [...state.scores].sort(function (a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  sorted.forEach(function (score) {
    const teamInfo = TEAMS[score.team] || { name: score.team, emoji: '🏳️' };
    const catInfo = CATEGORIES[score.category] || CATEGORIES['mixed'];
    const row = document.createElement('tr');
    const globalRow = state.scores.indexOf(score) + 2;

    row.innerHTML = `
      <td>${formatDateTime(score.timestamp)}</td>
      <td><span class="team-chip ${score.team}">${teamInfo.emoji} ${teamInfo.name}</span></td>
      <td>${escapeHTML(score.event)}</td>
      <td><span class="category-chip" style="background:${catInfo.color};">${catInfo.emoji} ${catInfo.name}</span></td>
      <td><strong>${score.score}</strong></td>
      <td>
        <button class="btn-icon" onclick="deleteScoreEntry(${globalRow}, '${score.team}', '${escapeJS(score.event)}', ${score.score})">🗑️</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ====== Render: Quick Add ======
function renderQuickAdd() {
  const container = document.getElementById('quickButtons');
  container.innerHTML = '';

  const filtered = getFilteredEvents(state.currentQuickCategoryFilter);
  if (filtered.length === 0) {
    document.getElementById('quickAddCard').style.display = 'none';
    return;
  }

  document.getElementById('quickAddCard').style.display = 'block';

  filtered.forEach(function (event) {
    Object.keys(TEAMS).forEach(function (team) {
      const teamInfo = TEAMS[team];
      const btn = document.createElement('button');
      btn.className = 'quick-btn';
      btn.style.cssText = 'padding:12px;border:none;border-radius:12px;background:' +
        (team === 'orange' ? 'var(--gradient-orange)' : 'var(--gradient-pink)') +
        ';color:white;font-weight:600;cursor:pointer;font-family:inherit;font-size:0.9rem;transition:transform 0.2s ease;';
      btn.onmouseover = function () { btn.style.transform = 'translateY(-2px)'; };
      btn.onmouseout = function () { btn.style.transform = ''; };
      btn.onclick = function () {
        quickAddScore(team, event.name, event.category);
      };
      btn.innerHTML = teamInfo.emoji + ' ' + escapeHTML(event.name) + ' +10';
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

  const eventSelect = document.getElementById('eventSelect');
  const event = eventSelect.value;
  const score = document.getElementById('scoreInput').value;
  const category = eventSelect.selectedOptions[0]
    ? eventSelect.selectedOptions[0].dataset.category || 'mixed'
    : 'mixed';

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
      category: category,
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

async function quickAddScore(team, eventName, category) {
  try {
    const result = await callAPI('addScore', {
      team: team,
      event: eventName,
      category: category || 'mixed',
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

// ====== Submit Event ======
async function submitEvent(e) {
  e.preventDefault();

  const name = document.getElementById('eventNameInput').value.trim();
  const category = document.getElementById('eventCategorySelect').value;

  if (!name) {
    showToast('กรุณากรอกชื่อกีฬา', 'error');
    return;
  }

  const submitBtn = document.getElementById('submitEventBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ กำลังเพิ่ม...';

  try {
    const result = await callAPI('addEvent', {
      name: name,
      category: category
    });

    if (result.success) {
      showToast('✅ เพิ่มกีฬา "' + name + '" เรียบร้อย', 'success');
      document.getElementById('eventForm').reset();
      await loadData();
    } else {
      showToast(result.error || 'เพิ่มไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Add event error:', err);
    showToast('เกิดข้อผิดพลาดในการเพิ่มกีฬา', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '➕ เพิ่มกีฬา';
  }
}

// ====== Delete Event ======
async function deleteEventEntry(id, name) {
  if (!confirm('ต้องการลบกีฬา "' + name + '" หรือไม่?')) return;

  try {
    const result = await callAPI('deleteEvent', { id: id });
    if (result.success) {
      showToast('✅ ลบกีฬาเรียบร้อย', 'success');
      await loadData();
    } else {
      showToast(result.error || 'ลบไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Delete event error:', err);
    showToast('เกิดข้อผิดพลาดในการลบ', 'error');
  }
}

// ====== Delete Score ======
async function deleteScoreEntry(row, team, event, score) {
  if (!confirm('ต้องการลบคะแนนนี้หรือไม่?\n' + (TEAMS[team] ? TEAMS[team].name : team) + ' - ' + event + ' +' + score)) return;

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
  if (!confirm('⚠️ ต้องการล้างคะแนนทั้งหมด?\nการกระทำนี้ไม่สามารถกู้คืนได้')) return;

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
    setTimeout(function () { toast.remove(); }, 300);
  }, 3000);
}

// ====== Loading ======
function showLoading(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('show');
}

function hideLoading(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

// ====== Utils ======
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    const pad = function (n) { return n < 10 ? '0' + n : n; };
    return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + (date.getFullYear() + 543) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
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

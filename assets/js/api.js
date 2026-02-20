// assets/js/api.js
// ── Central fetch wrapper  ──────────────────────────────────────

const API_BASE = '../backend/api';

async function apiCall(url, method = 'GET', body = null) {
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  try {
    const res  = await fetch(url, opts);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, message: 'Network error. Is XAMPP running?' };
  }
}

// ── Named endpoints ─────────────────────────────────────────────
const API = {
  // Auth
  login:        b => apiCall(`${API_BASE}/auth.php?action=login`, 'POST', b),
  register:     b => apiCall(`${API_BASE}/auth.php?action=register`, 'POST', b),
  logout:       () => apiCall(`${API_BASE}/auth.php?action=logout`),
  checkSession: () => apiCall(`${API_BASE}/auth.php?action=check`),

  // Expenses
  getExpenses:    ()      => apiCall(`${API_BASE}/expenses.php`),
  getRecent:      (n = 5) => apiCall(`${API_BASE}/expenses.php?action=recent&limit=${n}`),
  getSummary:     ()      => apiCall(`${API_BASE}/expenses.php?action=summary`),
  searchExpenses: q       => apiCall(`${API_BASE}/expenses.php?action=search&q=${encodeURIComponent(q)}`),
  addExpense:     b       => apiCall(`${API_BASE}/expenses.php`, 'POST', b),
  updateExpense:  b       => apiCall(`${API_BASE}/expenses.php`, 'PUT', b),
  deleteExpense:  id      => apiCall(`${API_BASE}/expenses.php?id=${id}`, 'DELETE'),

  // Categories
  getCategories: () => apiCall(`${API_BASE}/categories.php`),

  // Settings
  getProfile:          ()  => apiCall(`${API_BASE}/settings.php?action=profile`),
  updateProfile:       b   => apiCall(`${API_BASE}/settings.php?action=profile`, 'POST', b),
  updatePassword:      b   => apiCall(`${API_BASE}/settings.php?action=password`, 'POST', b),
  getNotifications:    ()  => apiCall(`${API_BASE}/settings.php?action=notifications`),
  updateNotifications: b   => apiCall(`${API_BASE}/settings.php?action=notifications`, 'POST', b),
  exportData:          ()  => apiCall(`${API_BASE}/settings.php?action=export`),
  deleteAccount:       ()  => apiCall(`${API_BASE}/settings.php?action=delete`, 'POST'),
};

// ── Shared helpers ──────────────────────────────────────────────
function fmt$(n) {
  return '$' + parseFloat(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US',
    { month: 'short', day: 'numeric', year: 'numeric' });
}

function esc(s) {
  const el = document.createElement('div');
  el.textContent = s;
  return el.innerHTML;
}

function showAlert(id, msg, type = 'danger') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type} rounded-3`;
  el.textContent = msg;
  el.classList.remove('d-none');
  setTimeout(() => el.classList.add('d-none'), 4500);
}

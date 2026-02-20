// assets/js/settings.js

async function initSettings() {
  await loadProfile();
  await loadNotifications();
}

// ── Profile ──────────────────────────────────────────────────────
async function loadProfile() {
  const r = await API.getProfile();
  if (r.success && r.data) {
    document.getElementById('firstName').value    = r.data.first_name || '';
    document.getElementById('lastName').value     = r.data.last_name  || '';
    document.getElementById('profileEmail').value = r.data.email      || '';
  }
}

async function saveProfile() {
  const first_name = document.getElementById('firstName').value.trim();
  const last_name  = document.getElementById('lastName').value.trim();
  const email      = document.getElementById('profileEmail').value.trim();

  if (!first_name || !last_name || !email) {
    showAlert('profileAlert', 'All profile fields are required.'); return;
  }

  const r = await API.updateProfile({ first_name, last_name, email });
  if (r.success) showAlert('profileAlert', '✓ Profile updated successfully!', 'success');
  else           showAlert('profileAlert', r.message || 'Update failed.');
}

// ── Password ─────────────────────────────────────────────────────
async function updatePassword() {
  const current_password = document.getElementById('currentPwd').value;
  const new_password     = document.getElementById('newPwd').value;
  const confirm_password = document.getElementById('confirmPwd').value;

  if (!current_password || !new_password || !confirm_password) {
    showAlert('passwordAlert', 'All password fields are required.'); return;
  }
  if (new_password !== confirm_password) {
    showAlert('passwordAlert', 'New passwords do not match.'); return;
  }
  if (new_password.length < 6) {
    showAlert('passwordAlert', 'Password must be at least 6 characters.'); return;
  }

  const r = await API.updatePassword({ current_password, new_password, confirm_password });
  if (r.success) {
    showAlert('passwordAlert', '✓ Password updated successfully!', 'success');
    ['currentPwd','newPwd','confirmPwd'].forEach(id => document.getElementById(id).value = '');
  } else {
    showAlert('passwordAlert', r.message || 'Password update failed.');
  }
}

// ── Notifications ────────────────────────────────────────────────
async function loadNotifications() {
  const r = await API.getNotifications();
  if (r.success && r.data) {
    document.getElementById('emailNotif').checked   = !!+r.data.email_notifications;
    document.getElementById('dailySummary').checked = !!+r.data.daily_summary;
    document.getElementById('budgetAlerts').checked = !!+r.data.budget_alerts;
  }
}

async function saveNotifications() {
  await API.updateNotifications({
    email_notifications: document.getElementById('emailNotif').checked   ? 1 : 0,
    daily_summary:       document.getElementById('dailySummary').checked ? 1 : 0,
    budget_alerts:       document.getElementById('budgetAlerts').checked ? 1 : 0
  });
  // Silent save – no toast needed for toggle
}

// ── Export CSV ────────────────────────────────────────────────────
async function exportCSV() {
  const r = await API.exportData();
  if (!r.success || !r.data.length) { alert('No expense data to export.'); return; }

  const header = 'Date,Description,Category,Amount';
  const rows   = r.data.map(x =>
    `${x.date},"${(x.description||'').replace(/"/g,'""')}",${x.category},${x.amount}`
  );
  const csv    = [header, ...rows].join('\n');
  const blob   = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url    = URL.createObjectURL(blob);
  const a      = Object.assign(document.createElement('a'), {
    href: url, download: `expenses_${new Date().toISOString().slice(0,10)}.csv`
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Delete Account ────────────────────────────────────────────────
async function confirmDeleteAccount() {
  if (document.getElementById('delConfirmInput').value !== 'DELETE') {
    alert('Please type DELETE to confirm.'); return;
  }
  const r = await API.deleteAccount();
  if (r.success) location.href = 'login.html';
  else alert(r.message || 'Deletion failed. Please try again.');
}

// Boot
initSettings();

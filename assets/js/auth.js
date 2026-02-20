// assets/js/auth.js
// ── Session guard + login / register / logout ───────────────────

const PUBLIC = ['login.html'];

(async () => {
  const page    = location.pathname.split('/').pop() || 'login.html';
  const isPublic = PUBLIC.some(p => page.endsWith(p));
  const res      = await API.checkSession();

  if (!isPublic && (!res.success || !res.logged_in)) {
    location.href = 'login.html'; return;
  }
  if (isPublic && res.success && res.logged_in) {
    location.href = 'dashboard.html';
  }
})();

// ── Login ────────────────────────────────────────────────────────
async function handleLogin() {
  const email    = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;

  if (!email || !password) {
    showAlert('loginAlert', 'Please enter your email and password.'); return;
  }

  const r = await API.login({ email, password });
  if (r.success) location.href = 'dashboard.html';
  else showAlert('loginAlert', r.message || 'Login failed.');
}

// ── Register ─────────────────────────────────────────────────────
async function handleRegister() {
  const first_name = document.getElementById('regFirst')?.value.trim();
  const last_name  = document.getElementById('regLast')?.value.trim();
  const email      = document.getElementById('regEmail')?.value.trim();
  const password   = document.getElementById('regPassword')?.value;

  if (!first_name || !last_name || !email || !password) {
    showAlert('registerAlert', 'Please fill in all fields.'); return;
  }
  if (password.length < 6) {
    showAlert('registerAlert', 'Password must be at least 6 characters.'); return;
  }

  const r = await API.register({ first_name, last_name, email, password });
  if (r.success) location.href = 'dashboard.html';
  else showAlert('registerAlert', r.message || 'Registration failed.');
}

// ── Logout ───────────────────────────────────────────────────────
async function handleLogout(e) {
  if (e) e.preventDefault();
  await API.logout();
  location.href = 'login.html';
}

// ── Switch forms ─────────────────────────────────────────────────
function switchForm(target) {
  document.getElementById('loginForm').classList.toggle('d-none',    target !== 'login');
  document.getElementById('registerForm').classList.toggle('d-none', target !== 'register');
}

// ── Password eye toggle ──────────────────────────────────────────
function togglePwd(id, btn) {
  const inp  = document.getElementById(id);
  const icon = btn.querySelector('i');
  if (inp.type === 'password') {
    inp.type = 'text'; icon.className = 'bi bi-eye-slash text-muted';
  } else {
    inp.type = 'password'; icon.className = 'bi bi-eye text-muted';
  }
}

// ── Enter key ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const lf = document.getElementById('loginForm');
  const rf = document.getElementById('registerForm');
  if (lf && !lf.classList.contains('d-none')) handleLogin();
  if (rf && !rf.classList.contains('d-none')) handleRegister();
});

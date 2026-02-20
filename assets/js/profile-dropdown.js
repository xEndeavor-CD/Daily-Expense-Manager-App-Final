// assets/js/profile-dropdown.js
// ── Profile Dropdown Logic ──────────────────────────────────────

async function initProfileDropdown() {

  // ── DOM refs ────────────────────────────────────────────────────
  const btn     = document.getElementById("profileBtn");
  const menu    = document.getElementById("profileDropdown");
  const chevron = document.getElementById("profileChevron");
  const wrap    = document.getElementById("profileWrap");

  if (!btn || !menu) return;

  // ── 1. Get user data ────────────────────────────────────────────
  let user = null;

  try {
    const res = await API.getProfile();
    if (res.success && res.data) {
      user = res.data;
    }
  } catch (_) {}

  if (!user) {
    try {
      const sess = await API.checkSession();
      if (sess.success && sess.logged_in && sess.user) {
        const parts = (sess.user.name || "").trim().split(" ");
        user = {
          first_name: parts[0] || "",
          last_name:  parts.slice(1).join(" ") || "",
          email:      sess.user.email || ""
        };
      }
    } catch (_) {}
  }

  // ── 2. Populate UI ──────────────────────────────────────────────
  if (user) {
    const firstName = (user.first_name || "").trim();
    const lastName  = (user.last_name  || "").trim();
    const fullName  = (firstName + " " + lastName).trim() || "User";
    const email     = user.email || "";
    const initials  = ((firstName[0] || "") + (lastName[0] || "")).toUpperCase()
                      || fullName[0].toUpperCase();

    setText("profileName",   fullName);
    setText("profileAvatar", initials);
    setText("pdName",        fullName);
    setText("pdAvatar",      initials);
    setText("pdEmail",       email);

    const sub = document.querySelector(".page-sub");
    if (sub && sub.closest(".page-header")) {
      sub.textContent = "Welcome back, " + (firstName || fullName) + " \uD83D\uDC4B Here's your spending overview.";
    }
  }

  // ── 3. Open / close ─────────────────────────────────────────────
  function openMenu() {
    menu.classList.add("pd-visible");
    menu.getBoundingClientRect();
    menu.classList.add("pd-open");
    if (chevron) chevron.classList.add("pd-chevron-open");
    btn.setAttribute("aria-expanded", "true");
    menu.removeAttribute("aria-hidden");
  }

  function closeMenu() {
    menu.classList.remove("pd-open");
    if (chevron) chevron.classList.remove("pd-chevron-open");
    btn.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
    setTimeout(function() {
      if (!menu.classList.contains("pd-open")) {
        menu.classList.remove("pd-visible");
      }
    }, 200);
  }

  function isOpen() { return menu.classList.contains("pd-open"); }

  // ── 4. Click toggle ─────────────────────────────────────────────
  btn.addEventListener("click", function(e) {
    e.stopPropagation();
    isOpen() ? closeMenu() : openMenu();
  });

  // ── 5. Close on outside click / Escape ──────────────────────────
  document.addEventListener("click", function(e) {
    if (isOpen() && wrap && !wrap.contains(e.target)) closeMenu();
  });

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && isOpen()) closeMenu();
  });

  // ── 6. Dropdown logout ──────────────────────────────────────────
  // DO NOT add a separate click listener that calls e.stopPropagation()
  // or redirects immediately — that would block the walking animation.
  //
  // initLogoutBtn('dropdownLogout') in dashboard.html already owns this
  // button's click event: it runs the full animation then calls
  // handleLogout() → API.logout() → redirect to login.html.
  //
  // All we do here is close the dropdown panel so it doesn't sit open
  // while the figure walks off.
  var dropLogout = document.getElementById("dropdownLogout")
                || document.getElementById("dropdownLogoutBtn");

  // ── 6. Dropdown logout ──────────────────────────────────────────
  // IMPORTANT: do NOT call closeMenu() here.
  // The logout button lives INSIDE the dropdown panel. If we close the
  // dropdown (display:none after 200ms) the button disappears and the
  // walking animation is cut off mid-frame.
  //
  // Instead: leave the dropdown open while the animation plays (~2.3s).
  // The page will redirect to login.html at the end of the animation
  // via initLogoutBtn → runLogoutAnimation → handleLogout() in auth.js.
  // The dropdown disappears naturally when the page navigates away.
  //
  // No extra listener needed here — initLogoutBtn() in dashboard.html
  // already owns the full click → animate → redirect flow.
}

function setText(id, value) {
  var el = document.getElementById(id);
  if (el && value) el.textContent = value;
}

document.addEventListener("DOMContentLoaded", initProfileDropdown);

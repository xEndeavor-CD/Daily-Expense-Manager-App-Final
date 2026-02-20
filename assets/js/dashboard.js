// assets/js/dashboard.js
// ── Dashboard: stat cards + pie chart + recent transactions ──────

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16','#6b7280'];
let pieChart = null;

// helpers: fmt$, esc, fmtDate are defined in api.js

// ── Trend badge helper ────────────────────────────────────────────
// Renders a small ↑/↓ percentage line under each stat card value.
function trendBadge(pct, invert = false) {
  if (pct === null || pct === undefined) return '';
  const up   = pct >= 0;
  // For expenses, up = bad (red); for transactions/count, up = neutral (blue)
  const good = invert ? up : !up;
  const icon = up ? '↑' : '↓';
  const color = good ? 'var(--success)' : 'var(--danger)';
  const abs = Math.abs(pct).toFixed(1);
  return `<div style="font-size:.78rem;font-weight:600;color:${color};margin-top:6px;">${icon} ${abs}% from last period</div>`;
}

// ── Main loader ───────────────────────────────────────────────────
async function loadDashboard() {

  // Show skeleton state
  ['todayTotal','monthTotal','totalTx','avgExpense'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });

  let summary;
  try {
    const res = await API.getSummary();
    if (!res.success) throw new Error(res.message || 'getSummary failed');
    summary = res.data;
  } catch (err) {
    console.error('[Dashboard] getSummary error:', err);
    showStatError();
    return;
  }

  // ── Stat cards ──────────────────────────────────────────────────
  setCard('todayTotal', fmt$(summary.today_total),       trendBadge(summary.today_pct));
  setCard('monthTotal', fmt$(summary.month_total),       trendBadge(summary.month_pct));
  setCard('totalTx',   summary.total_transactions ?? 0, trendBadge(summary.tx_pct, true));
  setCard('avgExpense', fmt$(summary.average_expense),   trendBadge(summary.avg_pct));

  // ── Pie chart ────────────────────────────────────────────────────
  buildPie(summary.categories);

  // ── Recent transactions ──────────────────────────────────────────
  let recent = [];
  try {
    const rec = await API.getRecent(5);
    recent = rec.data || rec.expenses || [];
  } catch (err) {
    console.error('[Dashboard] getRecent error:', err);
  }
  buildRecent(recent);
}

// Sets the text of a stat card; also appends an optional sub-line (trend badge)
function setCard(id, value, subHtml = '') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
  // Append trend badge as a sibling <div> inside the same parent
  const parent = el.parentElement;
  const existing = parent && parent.querySelector('.stat-trend');
  if (existing) existing.remove();
  if (subHtml && parent) {
    const tmp = document.createElement('div');
    tmp.className = 'stat-trend';
    tmp.innerHTML = subHtml;
    parent.appendChild(tmp);
  }
}

function showStatError() {
  ['todayTotal','monthTotal','totalTx','avgExpense'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = 'Error'; el.style.fontSize = '1rem'; el.style.color = '#94a3b8'; }
  });
}

// ── Pie chart ─────────────────────────────────────────────────────
function buildPie(cats) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;
  if (pieChart) { pieChart.destroy(); pieChart = null; }

  if (!cats || !cats.length) {
    const wrap = ctx.closest('.chart-wrap');
    if (wrap) wrap.innerHTML = '<p class="text-muted text-center pt-5">No category data yet.</p>';
    return;
  }

  const total  = cats.reduce((s, c) => s + parseFloat(c.total || 0), 0);
  const labels = cats.map(c =>
    `${c.name} ${total > 0 ? Math.round(parseFloat(c.total) / total * 100) : 0}%`
  );
  const vals   = cats.map(c => parseFloat(c.total || 0));
  const colors = cats.map((c, i) => c.color || COLORS[i % COLORS.length]);

  pieChart = new Chart(ctx, {
    type: 'doughnut',               // doughnut looks cleaner than plain pie
    data: {
      labels,
      datasets: [{
        data: vals,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { size: 12 },
            padding: 14,
            usePointStyle: true,
            pointStyleWidth: 10,
            color: '#475569'
          }
        },
        tooltip: {
          callbacks: {
            label: (item) => ` ${item.label.split(' ')[0]}: ${fmt$(item.raw)}`
          }
        }
      }
    }
  });
}

// ── Recent transactions list ──────────────────────────────────────
function buildRecent(list) {
  const wrap = document.getElementById('recentList');
  if (!wrap) return;

  if (!list || !list.length) {
    wrap.innerHTML = `
      <p class="text-muted text-center py-5">
        No expenses yet. <a href="add-expense.html">Add one!</a>
      </p>`;
    return;
  }

  // Search bar above the list
  const searchId = 'txSearch';
  wrap.innerHTML = `
    <div class="search-wrap mb-3" style="position:relative;">
      <i class="bi bi-search search-ico"></i>
      <input id="${searchId}" type="text" class="form-control"
             placeholder="Search transactions..." style="padding-left:38px;border-radius:10px;">
    </div>
    <div id="txRows"></div>
    <div style="text-align:right;margin-top:14px;">
      <a href="expense-list.html" style="font-size:.83rem;font-weight:600;color:#2563eb;text-decoration:none;">
        View All <i class="bi bi-arrow-right"></i>
      </a>
    </div>
  `;

  renderRows(list, document.getElementById('txRows'));

  // Live search filter
  document.getElementById(searchId).addEventListener('input', function () {
    const q = this.value.toLowerCase();
    const filtered = q
      ? list.filter(e =>
          (e.description || '').toLowerCase().includes(q) ||
          (e.category_name || '').toLowerCase().includes(q)
        )
      : list;
    renderRows(filtered, document.getElementById('txRows'));
  });
}

function renderRows(list, container) {
  if (!container) return;
  if (!list.length) {
    container.innerHTML = '<p class="text-muted text-center py-3">No matching transactions.</p>';
    return;
  }
  container.innerHTML = list.map(e => {
    const color = e.category_color || '#6b7280';
    return `
      <div class="tx-row">
        <div>
          <div class="tx-name">${esc(e.description || 'No description')}</div>
          <div class="tx-meta">
            <span class="cat-badge"
              style="background:${color}22;color:${color};">
              ${esc(e.category_name || 'Uncategorised')}
            </span>
            &nbsp;•&nbsp;${fmtDate(e.date)}
          </div>
        </div>
        <div class="tx-amount">-${fmt$(e.amount)}</div>
      </div>`;
  }).join('');
}

// ── Boot: wait for DOM then run ───────────────────────────────────
// Uses DOMContentLoaded so the function runs regardless of
// where this <script> tag sits in the HTML.
document.addEventListener('DOMContentLoaded', loadDashboard);

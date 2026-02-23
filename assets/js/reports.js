// assets/js/reports.js
// ── Reports page: summary cards + daily bar + category doughnut + monthly bars ──

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16','#6b7280'];

let barChart = null;
let pieChart = null;

async function loadReports() {
  const res = await API.getSummary();
  if (!res.success) return;
  const d = res.data;

  // Summary cards
  document.getElementById('rTotal').textContent = fmt$(d.month_total);
  document.getElementById('rAvg').textContent   = fmt$(d.average_expense);
  document.getElementById('rCats').textContent  = d.categories.length;

  // Build 7-day dataset (fill gaps with 0)
  const dayMap = {};
  (d.daily || []).forEach(r => { dayMap[r.day] = parseFloat(r.total); });

  const labels = [], vals = [];
  for (let i = 6; i >= 0; i--) {
    const dt  = new Date();
    dt.setDate(dt.getDate() - i);
    const key = dt.toISOString().split('T')[0];
    labels.push(dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    vals.push(dayMap[key] || 0);
  }

  buildBar(labels, vals);
  buildDoughnut(d.categories);
  buildMonthly(d.monthly);
}

// ── Daily Bar Chart ──────────────────────────────────────────────
function buildBar(labels, data) {
  const ctx = document.getElementById('dailyChart');
  if (!ctx) return;
  if (barChart) barChart.destroy();

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Daily ($)',
        data,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        borderSkipped: false,
        hoverBackgroundColor: '#1d4ed8'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` ${fmt$(c.raw)}` } }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9', drawBorder: false },
          ticks: { callback: v => '$' + v, color: '#64748b' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#64748b' }
        }
      }
    }
  });
}

// ── Category Doughnut Chart ──────────────────────────────────────
function buildDoughnut(cats) {
  const ctx = document.getElementById('reportPieChart');
  if (!ctx) return;
  if (pieChart) pieChart.destroy();

  if (!cats || !cats.length) {
    ctx.closest('.chart-wrap').innerHTML =
      '<p class="text-muted text-center pt-5">No data yet.</p>';
    return;
  }

  const total  = cats.reduce((s, c) => s + parseFloat(c.total), 0);
  const labels = cats.map(c => `${c.name} (${total > 0 ? Math.round(c.total / total * 100) : 0}%)`);
  const vals   = cats.map(c => parseFloat(c.total));
  const colors = cats.map((c, i) => c.color || COLORS[i % COLORS.length]);

  // Custom plugin: total label in centre
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw(chart) {
      const { ctx: c, chartArea: { top, bottom, left, right } } = chart;
      const cx = (left + right) / 2;
      const cy = (top + bottom) / 2;
      c.save();
      c.textAlign    = 'center';
      c.textBaseline = 'middle';
      c.fillStyle    = '#1e293b';
      c.font         = 'bold 15px Inter, sans-serif';
      c.fillText('Total', cx, cy - 10);
      c.font      = 'bold 18px Inter, sans-serif';
      c.fillStyle = '#3b82f6';
      c.fillText(fmt$(total), cx, cy + 12);
      c.restore();
    }
  };

  pieChart = new Chart(ctx, {
    type: 'doughnut',
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
      cutout: '62%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { size: 11 },
            padding: 12,
            usePointStyle: true,
            pointStyleWidth: 10
          }
        },
        tooltip: {
          callbacks: {
            label: c => ` ${fmt$(c.raw)}  (${total > 0 ? Math.round(c.raw / total * 100) : 0}%)`
          }
        }
      }
    },
    plugins: [centerTextPlugin]
  });
}

// ── Monthly Breakdown bars ───────────────────────────────────────
function buildMonthly(monthly) {
  const el = document.getElementById('monthlyBreakdown');
  if (!monthly || !monthly.length) {
    el.innerHTML = '<p class="text-muted text-center py-5">No monthly data yet.</p>'; return;
  }

  const max = Math.max(...monthly.map(m => parseFloat(m.total)));

  // Most recent month first
  el.innerHTML = [...monthly].reverse().map(m => {
    const pct = max > 0 ? (parseFloat(m.total) / max * 100) : 0;
    return `
      <div class="month-row">
        <div class="month-label">
          <span>${m.month}</span>
          <span>${fmt$(m.total)}</span>
        </div>
        <div class="month-bar">
          <div class="month-fill" style="width:${pct.toFixed(1)}%"></div>
        </div>
      </div>`;
  }).join('');
}

// Boot
loadReports();

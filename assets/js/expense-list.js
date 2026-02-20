// assets/js/expense-list.js

let allExpenses = [];
let categories  = [];
let editModal, deleteModal;

async function initList() {
  editModal   = new bootstrap.Modal(document.getElementById('editModal'));
  deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

  // Load categories for edit dropdown
  const catRes = await API.getCategories();
  if (catRes.success) {
    categories = catRes.data;
    fillCatSelect('editCategory');
  }

  await loadExpenses();
}

async function loadExpenses() {
  const res = await API.getExpenses();
  if (res.success) { allExpenses = res.data; renderTable(allExpenses); }
}

function fillCatSelect(id) {
  const sel = document.getElementById(id);
  sel.innerHTML = categories.map(c =>
    `<option value="${c.id}">${esc(c.name)}</option>`
  ).join('');
}

// ── Render table ─────────────────────────────────────────────────
function renderTable(list) {
  const tbody = document.getElementById('expenseTableBody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-5">
      No expenses found. <a href="add-expense.html">Add one!</a></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr>
      <td class="text-nowrap">${fmtDate(e.date)}</td>
      <td>${esc(e.description || '–')}</td>
      <td>
        <span class="cat-badge" style="background:${e.category_color}22;color:${e.category_color};">
          ${esc(e.category_name)}
        </span>
      </td>
      <td class="text-end amount-red text-nowrap">${fmt$(e.amount)}</td>
      <td class="text-center text-nowrap">
        <button class="act-btn edit" onclick="openEdit(${e.id})" title="Edit">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="act-btn del" onclick="openDelete(${e.id})" title="Delete">
          <i class="bi bi-trash3"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// ── Search ───────────────────────────────────────────────────────
function searchExpenses(q) {
  if (!q.trim()) { renderTable(allExpenses); return; }
  const lq  = q.toLowerCase();
  renderTable(allExpenses.filter(e =>
    (e.description || '').toLowerCase().includes(lq) ||
    e.category_name.toLowerCase().includes(lq)
  ));
}

// ── Edit ─────────────────────────────────────────────────────────
function openEdit(id) {
  const e = allExpenses.find(x => x.id == id);
  if (!e) return;

  document.getElementById('editId').value          = e.id;
  document.getElementById('editAmount').value      = parseFloat(e.amount).toFixed(2);
  document.getElementById('editDate').value        = e.date;
  document.getElementById('editDescription').value = e.description || '';
  document.getElementById('editCategory').value    = e.category_id;

  editModal.show();
}

async function updateExpense() {
  const id          = parseInt(document.getElementById('editId').value);
  const amount      = parseFloat(document.getElementById('editAmount').value);
  const category_id = parseInt(document.getElementById('editCategory').value);
  const date        = document.getElementById('editDate').value;
  const description = document.getElementById('editDescription').value.trim();

  if (!amount || amount <= 0 || !category_id || !date) {
    alert('Please fill in all required fields.'); return;
  }

  const r = await API.updateExpense({ id, amount, category_id, date, description });
  if (r.success) { editModal.hide(); await loadExpenses(); }
  else alert(r.message || 'Update failed.');
}

// ── Delete ───────────────────────────────────────────────────────
function openDelete(id) {
  document.getElementById('deleteId').value = id;
  deleteModal.show();
}

async function confirmDelete() {
  const id = parseInt(document.getElementById('deleteId').value);
  const r  = await API.deleteExpense(id);
  if (r.success) { deleteModal.hide(); await loadExpenses(); }
  else alert(r.message || 'Delete failed.');
}

// Boot
initList();

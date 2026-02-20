// assets/js/add-expense.js

async function initAddExpense() {
  // Default date = today, max = today
  const today = new Date().toISOString().split('T')[0];
  const inp   = document.getElementById('expDate');
  inp.value   = today;
  inp.max     = today;

  // Load categories into dropdown
  const res = await API.getCategories();
  if (res.success && res.data) {
    const sel = document.getElementById('category');
    res.data.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.name;
      sel.appendChild(o);
    });
  }
}

async function saveExpense() {
  const amount      = parseFloat(document.getElementById('amount').value);
  const category_id = parseInt(document.getElementById('category').value);
  const date        = document.getElementById('expDate').value;
  const description = document.getElementById('description').value.trim();

  if (isNaN(amount) || amount <= 0) {
    showAlert('formAlert', 'Please enter a valid amount greater than 0.'); return;
  }
  if (!category_id) {
    showAlert('formAlert', 'Please select a category.'); return;
  }
  if (!date) {
    showAlert('formAlert', 'Please select a date.'); return;
  }

  const r = await API.addExpense({ amount, category_id, date, description });

  if (r.success) {
    showAlert('formAlert', '✓ Expense saved successfully!', 'success');
    clearForm();
  } else {
    showAlert('formAlert', r.message || 'Failed to save expense.');
  }
}

function clearForm() {
  document.getElementById('amount').value      = '';
  document.getElementById('category').value    = '';
  document.getElementById('description').value = '';
  document.getElementById('expDate').value     = new Date().toISOString().split('T')[0];
}

// Boot
initAddExpense();

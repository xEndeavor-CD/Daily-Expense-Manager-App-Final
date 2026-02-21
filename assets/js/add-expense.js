// assets/js/add-expense.js

async function initAddExpense() {
  const today = new Date().toISOString().split('T')[0];
  const inp   = document.getElementById('expDate');
  inp.value   = today;
  inp.max     = today;

  const res = await API.getCategories();
  if (res.success && res.data) {
    const sel = document.getElementById('category');
    res.data.forEach(c => {
      const o       = document.createElement('option');
      o.value       = c.id;
      o.textContent = c.name;
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
    showAlert('formAlert', 'Please enter a valid amount greater than 0.', 'danger'); return;
  }
  if (!category_id) {
    showAlert('formAlert', 'Please select a category.', 'danger'); return;
  }
  if (!date) {
    showAlert('formAlert', 'Please select a date.', 'danger'); return;
  }

  const r = await API.addExpense({ amount, category_id, date, description });

  if (r.success) {
    const el = document.getElementById('formAlert');
    if (el) {
      el.className   = 'alert alert-success rounded-3';
      el.textContent = '✓ Expense saved successfully!';
      el.classList.remove('d-none');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el.classList.add('d-none'), 5000);
    }
    clearForm();
  } else {
    showAlert('formAlert', r.message || 'Failed to save expense.', 'danger');
  }
}

function clearForm() {
  document.getElementById('amount').value      = '';
  document.getElementById('category').value    = '';
  document.getElementById('description').value = '';
  document.getElementById('expDate').value     = new Date().toISOString().split('T')[0];
}

document.addEventListener('DOMContentLoaded', initAddExpense);
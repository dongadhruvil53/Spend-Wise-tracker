const STORAGE_KEY = "spendwise_transactions";
const USERS_STORAGE_KEY = "spendwise_users";
const CURRENT_USER_KEY = "spendwise_current_user";

const CATEGORIES = {
  income: [
    "Salary",
    "Freelance",
    "Investments",
    "Business",
    "Rental Income",
    "Gift",
    "Other Income",
  ],
  expense: [
    "Food & Dining",
    "Shopping",
    "Housing & Rent",
    "Transportation",
    "Utilities",
    "Entertainment",
    "Health & Medical",
    "Education",
    "Personal Care",
    "Other Expense",
  ],
};

const SAMPLE_TRANSACTIONS = [
  {
    id: "tx_sample_1",
    userId: 101,
    title: "Monthly Salary",
    amount: 3800.0,
    type: "income",
    category: "Salary",
    date: "2026-10-01",
    notes: "Direct deposit from company",
  },
  {
    id: "tx_sample_2",
    userId: 101,
    title: "Apartment Rent",
    amount: 1200.0,
    type: "expense",
    category: "Housing & Rent",
    date: "2026-10-02",
    notes: "Monthly apartment lease",
  },
  {
    id: "tx_sample_3",
    userId: 101,
    title: "Supermarket Groceries",
    amount: 145.8,
    type: "expense",
    category: "Food & Dining",
    date: "2026-10-03",
    notes: "Weekly food supplies",
  },
  {
    id: "tx_sample_4",
    userId: 101,
    title: "Freelance UI Design",
    amount: 650.0,
    type: "income",
    category: "Freelance",
    date: "2026-10-04",
    notes: "Website redesign project",
  },
  {
    id: "tx_sample_5",
    userId: 101,
    title: "Internet & Utility Bill",
    amount: 85.0,
    type: "expense",
    category: "Utilities",
    date: "2026-10-04",
    notes: "High-speed broadband",
  },
  {
    id: "tx_sample_6",
    userId: 101,
    title: "Dining Out with Friends",
    amount: 62.5,
    type: "expense",
    category: "Food & Dining",
    date: "2026-10-05",
    notes: "Dinner downtown",
  },
];

let currentEditId = null;

const totalBalanceEl = document.getElementById("total-balance");
const totalIncomeEl = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expense");
const totalCountEl = document.getElementById("total-count");
const balanceBadgeEl = document.getElementById("balance-status-badge");

const recentListEl = document.getElementById("recent-transactions-list");
const emptyRecentEl = document.getElementById("empty-recent-state");

const transactionForm = document.getElementById("transaction-form");
const txTitleInput = document.getElementById("tx-title");
const txAmountInput = document.getElementById("tx-amount");
const txCategorySelect = document.getElementById("tx-category");
const txDateInput = document.getElementById("tx-date");
const txNotesInput = document.getElementById("tx-notes");
const typeToggleButtons = document.querySelectorAll(".type-toggle-btn");

const incomeExpenseMeter = document.getElementById("income-expense-meter");
const incomeRatioText = document.getElementById("income-ratio-text");
const expenseRatioText = document.getElementById("expense-ratio-text");
const categoryBreakdownContainer = document.getElementById("category-breakdown-list");

const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-transaction-form");
const editIdInput = document.getElementById("edit-tx-id");
const editTitleInput = document.getElementById("edit-tx-title");
const editAmountInput = document.getElementById("edit-tx-amount");
const editTypeInputs = document.querySelectorAll('input[name="edit-tx-type"]');
const editCategorySelect = document.getElementById("edit-tx-category");
const editDateInput = document.getElementById("edit-tx-date");
const editNotesInput = document.getElementById("edit-tx-notes");
const closeEditModalBtn = document.getElementById("close-edit-modal");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const toastContainer = document.getElementById("toast-container");
const clearAllDataBtn = document.getElementById("clear-all-data-btn");

const navUserName = document.getElementById("nav-user-name");
const navUserAvatar = document.getElementById("user-avatar");
const logoutBtn = document.getElementById("logout-btn");

let selectedFormType = "expense";

function getCurrentUserId() {
  return localStorage.getItem(CURRENT_USER_KEY);
}

function getCurrentUser() {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return null;

  const usersData = localStorage.getItem(USERS_STORAGE_KEY);
  if (!usersData) return null;

  try {
    const users = JSON.parse(usersData);
    for (let i = 0; i < users.length; i++) {
      if (String(users[i].id) === String(currentUserId)) {
        return users[i];
      }
    }
    return null;
  } catch (error) {
    console.error("Error reading users:", error);
    return null;
  }
}

function checkAuthAndRedirect() {
  const user = getCurrentUser();
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.replace("login.html");
    return null;
  }
  return user;
}

function updateNavbar(user) {
  if (!user) return;

  if (navUserName) {
    navUserName.textContent = user.name || "User";
  }

  if (navUserAvatar && user.name) {
    navUserAvatar.textContent = user.name.charAt(0).toUpperCase();
  }
}

function handleLogout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = "login.html?logout=true";
}

/**
 * Returns all transactions stored in LocalStorage across all users.
 * Automatically backfills sample data if storage is completely empty.
 * @returns {Array}
 */
function getAllTransactionsFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_TRANSACTIONS));
    return SAMPLE_TRANSACTIONS;
  }

  try {
    const transactions = JSON.parse(data);
    if (Array.isArray(transactions)) {
      return transactions;
    }
    throw new Error("Saved transactions are not a list.");
  } catch (error) {
    console.error("Error reading LocalStorage transactions:", error);
    showToast("Could not read saved transactions.", "danger");
    return [];
  }
}

/**
 * Returns ONLY the transactions belonging to the currently logged-in user.
 * @returns {Array} List of transactions for this user
 */
function getUserTransactions() {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return [];

  const allTransactions = getAllTransactionsFromStorage();
  const userTransactions = [];
  for (let i = 0; i < allTransactions.length; i++) {
    if (String(allTransactions[i].userId) === String(currentUserId)) {
      userTransactions.push(allTransactions[i]);
    }
  }
  return userTransactions;
}

function saveAllTransactionsToStorage(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error("Error saving transactions:", error);
    showToast("Failed to save data to LocalStorage!", "danger");
    return false;
  }
}

function formatCurrency(amount) {
  const absoluteAmount = Math.abs(Number(amount) || 0);
  const formatted = absoluteAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted}`;
}

function formatDate(dateString) {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const year = parseInt(parts[0], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const dateObj = new Date(year, monthIndex, day);
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function generateUniqueId() {
  return "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

function showToast(message, type = "success") {
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let iconSvg = "";
  if (type === "success") {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === "danger") {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function updateDashboardMetrics(userTransactions) {
  let income = 0;
  let expense = 0;

  for (let i = 0; i < userTransactions.length; i++) {
    const tx = userTransactions[i];
    const val = parseFloat(tx.amount) || 0;
    if (tx.type === "income") {
      income += val;
    } else if (tx.type === "expense") {
      expense += val;
    }
  }

  const balance = income - expense;
  const count = userTransactions.length;

  if (totalBalanceEl) {
    if (balance < 0) {
      totalBalanceEl.textContent = `-${formatCurrency(balance)}`;
      totalBalanceEl.style.color = "var(--danger)";
    } else {
      totalBalanceEl.textContent = formatCurrency(balance);
      totalBalanceEl.style.color = "var(--text-main)";
    }
  }

  if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(income);
  if (totalExpenseEl) totalExpenseEl.textContent = formatCurrency(expense);
  if (totalCountEl) totalCountEl.textContent = count;

  if (balanceBadgeEl) {
    if (balance > 0) {
      balanceBadgeEl.textContent = "Positive Balance";
      balanceBadgeEl.className = "status-badge positive";
    } else if (balance < 0) {
      balanceBadgeEl.textContent = "Deficit / Negative";
      balanceBadgeEl.className = "status-badge negative";
    } else {
      balanceBadgeEl.textContent = "Balanced";
      balanceBadgeEl.className = "status-badge neutral";
    }
  }

  updateAnalyticsMeter(income, expense);
  updateCategoryBreakdown(userTransactions, expense);
}

function updateAnalyticsMeter(income, expense) {
  if (!incomeExpenseMeter) return;

  const total = income + expense;
  let incomePct = 50;
  let expensePct = 50;

  if (total > 0) {
    incomePct = Math.round((income / total) * 100);
    expensePct = 100 - incomePct;
  }

  incomeExpenseMeter.style.width = `${incomePct}%`;
  if (incomeRatioText) incomeRatioText.textContent = `Income: ${incomePct}%`;
  if (expenseRatioText) expenseRatioText.textContent = `Expense: ${expensePct}%`;
}

function updateCategoryBreakdown(userTransactions, totalExpense) {
  if (!categoryBreakdownContainer) return;

  const expenseByCategory = {};
  for (let i = 0; i < userTransactions.length; i++) {
    const transaction = userTransactions[i];
    if (transaction.type === "expense") {
      const category = transaction.category || "Other Expense";
      const amount = parseFloat(transaction.amount) || 0;

      if (!expenseByCategory[category]) {
        expenseByCategory[category] = 0;
      }
      expenseByCategory[category] += amount;
    }
  }

  const sortedCategories = [];
  for (const category in expenseByCategory) {
    sortedCategories.push({
      name: category,
      amount: expenseByCategory[category],
      percent: totalExpense > 0
        ? Math.round((expenseByCategory[category] / totalExpense) * 100)
        : 0,
    });
  }

  sortedCategories.sort(function (first, second) {
    return second.amount - first.amount;
  });

  categoryBreakdownContainer.innerHTML = "";

  if (sortedCategories.length === 0) {
    categoryBreakdownContainer.innerHTML = `
      <p style="font-size: 0.8125rem; color: var(--text-muted); text-align: center; padding: 1rem 0;">
        No expense data recorded yet.
      </p>`;
    return;
  }

  for (let i = 0; i < sortedCategories.length && i < 4; i++) {
    const cat = sortedCategories[i];
    const item = document.createElement("div");
    item.className = "category-bar-item";
    item.innerHTML = `
      <div class="category-bar-header">
        <span>${escapeHtml(cat.name)}</span>
        <span>${formatCurrency(cat.amount)} (${cat.percent}%)</span>
      </div>
      <div class="category-bar-track">
        <div class="category-bar-fill" style="width: ${cat.percent}%;"></div>
      </div>
    `;
    categoryBreakdownContainer.appendChild(item);
  }
}

function renderRecentTransactions(userTransactions) {
  if (!recentListEl) return;

  recentListEl.innerHTML = "";

  if (!userTransactions || userTransactions.length === 0) {
    if (emptyRecentEl) emptyRecentEl.style.display = "block";
    return;
  }

  if (emptyRecentEl) emptyRecentEl.style.display = "none";

  const sorted = userTransactions.slice();
  sorted.sort(function (first, second) {
    return new Date(second.date) - new Date(first.date);
  });

  for (let i = 0; i < sorted.length && i < 5; i++) {
    const tx = sorted[i];
    const isIncome = tx.type === "income";
    const amountSign = isIncome ? "+" : "-";
    const amountClass = isIncome ? "amount-positive" : "amount-negative";
    const iconClass = isIncome ? "income" : "expense";

    const iconSvg = isIncome
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>`;

    const li = document.createElement("li");
    li.className = "transaction-list-item";
    li.innerHTML = `
      <div class="tx-left">
        <div class="tx-icon-bubble ${iconClass}">
          ${iconSvg}
        </div>
        <div class="tx-info">
          <h4>${escapeHtml(tx.title)}</h4>
          <div class="tx-meta">
            <span class="badge-category">${escapeHtml(tx.category)}</span>
            <span>•</span>
            <span>${formatDate(tx.date)}</span>
          </div>
        </div>
      </div>
      <div class="tx-right">
        <span class="tx-amount ${amountClass}">${amountSign} ${formatCurrency(tx.amount)}</span>
        <button class="btn-icon btn-icon-edit" title="Edit Transaction" onclick="openEditModal('${tx.id}')">
          ✏️
        </button>
        <button class="btn-icon btn-icon-danger" title="Delete Transaction" onclick="deleteTransaction('${tx.id}')">
          🗑️
        </button>
      </div>
    `;
    recentListEl.appendChild(li);
  }
}

function populateCategorySelect(selectElement, type, selectedValue = null) {
  if (!selectElement) return;
  selectElement.innerHTML = "";

  const list = CATEGORIES[type] || [];
  for (let i = 0; i < list.length; i++) {
    const categoryName = list[i];
    const opt = document.createElement("option");
    opt.value = categoryName;
    opt.textContent = categoryName;
    if (selectedValue && selectedValue === categoryName) {
      opt.selected = true;
    }
    selectElement.appendChild(opt);
  }
}

function setFormType(type) {
  selectedFormType = type;

  for (let i = 0; i < typeToggleButtons.length; i++) {
    const btn = typeToggleButtons[i];
    if (btn.dataset.type === type) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  }

  populateCategorySelect(txCategorySelect, selectedFormType);
}

/**
 * Handles submission of the Quick Add Transaction form.
 * Tags the new transaction with the currently logged-in user's userId.
 * @param {Event} e
 */
function handleAddTransaction(e) {
  e.preventDefault();

  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    checkAuthAndRedirect();
    return;
  }

  const title = txTitleInput.value.trim();
  const amount = parseFloat(txAmountInput.value);
  const category = txCategorySelect.value;
  const date = txDateInput.value || getTodayDateString();
  const notes = txNotesInput ? txNotesInput.value.trim() : "";

  if (!title) {
    showToast("Please enter a transaction title.", "danger");
    txTitleInput.focus();
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    showToast("Please enter a valid amount greater than 0.", "danger");
    txAmountInput.focus();
    return;
  }

  if (!category) {
    showToast("Please select a category.", "danger");
    return;
  }

  const newTransaction = {
    id: generateUniqueId(),
    userId: Number(currentUserId) || currentUserId,
    title: title,
    amount: amount,
    type: selectedFormType,
    category: category,
    date: date,
    notes: notes,
  };

  const allTransactions = getAllTransactionsFromStorage();
  allTransactions.unshift(newTransaction);
  if (!saveAllTransactionsToStorage(allTransactions)) return;

  refreshDashboard();

  transactionForm.reset();
  setFormType("expense");
  if (txDateInput) txDateInput.value = getTodayDateString();

  showToast(`Transaction "${title}" added successfully!`, "success");
}

/**
 * Opens edit modal with pre-filled transaction data.
 * Only allows editing if the transaction belongs to the current user.
 * @param {string} id
 */
window.openEditModal = function (id) {
  const currentUserId = getCurrentUserId();
  const userTransactions = getUserTransactions();
  let tx = null;
  for (let i = 0; i < userTransactions.length; i++) {
    if (userTransactions[i].id === id
      && String(userTransactions[i].userId) === String(currentUserId)) {
      tx = userTransactions[i];
      break;
    }
  }

  if (!tx) {
    showToast("Transaction not found or access denied.", "danger");
    return;
  }

  currentEditId = id;
  editIdInput.value = tx.id;
  editTitleInput.value = tx.title;
  editAmountInput.value = tx.amount;
  editDateInput.value = tx.date;
  if (editNotesInput) editNotesInput.value = tx.notes || "";

  for (let i = 0; i < editTypeInputs.length; i++) {
    const radio = editTypeInputs[i];
    radio.checked = radio.value === tx.type;
  }

  populateCategorySelect(editCategorySelect, tx.type, tx.category);

  editModal.classList.add("active");
};

function closeEditModal() {
  if (editModal) editModal.classList.remove("active");
  currentEditId = null;
  if (editForm) editForm.reset();
}

/**
 * Handles save on the Edit form.
 * Ensures the transaction belongs to the currently logged in user.
 * @param {Event} e
 */
function handleSaveEdit(e) {
  e.preventDefault();

  if (!currentEditId) return;

  const currentUserId = getCurrentUserId();
  const title = editTitleInput.value.trim();
  const amount = parseFloat(editAmountInput.value);
  let selectedType = "expense";
  for (let i = 0; i < editTypeInputs.length; i++) {
    const radio = editTypeInputs[i];
    if (radio.checked) selectedType = radio.value;
  }
  const category = editCategorySelect.value;
  const date = editDateInput.value || getTodayDateString();
  const notes = editNotesInput ? editNotesInput.value.trim() : "";

  if (!title) {
    showToast("Please enter a title.", "danger");
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showToast("Please enter a valid amount.", "danger");
    return;
  }

  const allTransactions = getAllTransactionsFromStorage();
  let index = -1;
  for (let i = 0; i < allTransactions.length; i++) {
    if (allTransactions[i].id === currentEditId
      && String(allTransactions[i].userId) === String(currentUserId)) {
      index = i;
      break;
    }
  }

  if (index === -1) {
    showToast("Could not find transaction to update.", "danger");
    closeEditModal();
    return;
  }

  allTransactions[index].title = title;
  allTransactions[index].amount = amount;
  allTransactions[index].type = selectedType;
  allTransactions[index].category = category;
  allTransactions[index].date = date;
  allTransactions[index].notes = notes;

  if (!saveAllTransactionsToStorage(allTransactions)) return;
  closeEditModal();
  refreshDashboard();
  showToast("Transaction updated successfully!", "success");
}

/**
 * Deletes a transaction by ID after confirmation.
 * Only deletes if transaction belongs to current user.
 * Other users' transactions remain completely intact.
 * @param {string} id
 */
window.deleteTransaction = function (id) {
  const currentUserId = getCurrentUserId();
  const userTransactions = getUserTransactions();
  let tx = null;
  for (let i = 0; i < userTransactions.length; i++) {
    if (userTransactions[i].id === id
      && String(userTransactions[i].userId) === String(currentUserId)) {
      tx = userTransactions[i];
      break;
    }
  }

  if (!tx) {
    showToast("Transaction not found or access denied.", "danger");
    return;
  }

  const title = `"${tx.title}"`;
  const confirmDelete = window.confirm(`Are you sure you want to delete ${title}?`);
  if (!confirmDelete) return;

  const allTransactions = getAllTransactionsFromStorage();
  const updatedTransactions = [];
  for (let i = 0; i < allTransactions.length; i++) {
    const transaction = allTransactions[i];
    const belongsToUser = String(transaction.userId) === String(currentUserId);
    if (transaction.id !== id || !belongsToUser) {
      updatedTransactions.push(transaction);
    }
  }

  if (!saveAllTransactionsToStorage(updatedTransactions)) return;
  refreshDashboard();
  showToast("Transaction deleted.", "danger");
};

/**
 * Resets sample data for the current user without touching other users' data
 */
function handleClearAllData() {
  const confirmClear = window.confirm(
    "Are you sure you want to reset your transactions? This will reload default sample records for your account."
  );
  if (!confirmClear) return;

  const currentUserId = getCurrentUserId();
  const allTransactions = getAllTransactionsFromStorage();

  const otherUsersTransactions = [];
  for (let i = 0; i < allTransactions.length; i++) {
    if (String(allTransactions[i].userId) !== String(currentUserId)) {
      otherUsersTransactions.push(allTransactions[i]);
    }
  }

  const userSamples = [];
  for (let i = 0; i < SAMPLE_TRANSACTIONS.length; i++) {
    const sample = SAMPLE_TRANSACTIONS[i];
    userSamples.push({
      id: `tx_sample_${currentUserId}_${i + 1}_${Date.now()}`,
      userId: Number(currentUserId) || currentUserId,
      title: sample.title,
      amount: sample.amount,
      type: sample.type,
      category: sample.category,
      date: sample.date,
      notes: sample.notes,
    });
  }

  const resetTransactions = userSamples.concat(otherUsersTransactions);
  if (!saveAllTransactionsToStorage(resetTransactions)) return;
  refreshDashboard();
  showToast("Account data reset to default samples.", "info");
}

/**
 * Sanitizes strings before rendering in HTML to prevent XSS issues
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function refreshDashboard() {
  const userTransactions = getUserTransactions();
  updateDashboardMetrics(userTransactions);
  renderRecentTransactions(userTransactions);
}

document.addEventListener("DOMContentLoaded", () => {

  const user = checkAuthAndRedirect();
  if (!user) return;

  updateNavbar(user);

  if (txDateInput) txDateInput.value = getTodayDateString();

  populateCategorySelect(txCategorySelect, selectedFormType);

  for (let i = 0; i < typeToggleButtons.length; i++) {
    const btn = typeToggleButtons[i];
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      setFormType(type);
    });
  }

  if (transactionForm) {
    transactionForm.addEventListener("submit", handleAddTransaction);
  }

  if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener("click", closeEditModal);
  }
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", closeEditModal);
  }
  if (editModal) {
    editModal.addEventListener("click", (e) => {
      if (e.target === editModal) closeEditModal();
    });
  }

  for (let i = 0; i < editTypeInputs.length; i++) {
    const radio = editTypeInputs[i];
    radio.addEventListener("change", (e) => {
      if (e.target.checked) {
        populateCategorySelect(editCategorySelect, e.target.value);
      }
    });
  }

  if (editForm) {
    editForm.addEventListener("submit", handleSaveEdit);
  }

  if (clearAllDataBtn) {
    clearAllDataBtn.addEventListener("click", handleClearAllData);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && editModal && editModal.classList.contains("active")) {
      closeEditModal();
    }
  });

  refreshDashboard();
});

/**
 * ==============================================================================
 * SpendWise - Expense Tracker Application
 * File: js/main.js
 * Description: Main JavaScript file for the Dashboard page.
 *              Handles user authentication check, multi-user transactions,
 *              dashboard calculations, recent transactions, quick add form,
 *              and LocalStorage synchronization.
 * ==============================================================================
 */

// ==============================================================================
// 1. CONSTANTS & INITIAL DATA
// ==============================================================================

// Storage keys specified by SpendWise requirements
const STORAGE_KEY = "spendwise_transactions";
const USERS_STORAGE_KEY = "spendwise_users";
const CURRENT_USER_KEY = "spendwise_current_user";

// Predefined categories for Income and Expense
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

// Default sample transactions tagged with default user ID 101
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

// Active transaction ID being edited (null when not editing)
let currentEditId = null;

// ==============================================================================
// 2. DOM ELEMENT REFERENCES
// ==============================================================================
const totalBalanceEl = document.getElementById("total-balance");
const totalIncomeEl = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expense");
const totalCountEl = document.getElementById("total-count");
const balanceBadgeEl = document.getElementById("balance-status-badge");

const recentListEl = document.getElementById("recent-transactions-list");
const emptyRecentEl = document.getElementById("empty-recent-state");

// Quick Add Form Elements
const transactionForm = document.getElementById("transaction-form");
const txTitleInput = document.getElementById("tx-title");
const txAmountInput = document.getElementById("tx-amount");
const txCategorySelect = document.getElementById("tx-category");
const txDateInput = document.getElementById("tx-date");
const txNotesInput = document.getElementById("tx-notes");
const typeToggleButtons = document.querySelectorAll(".type-toggle-btn");

// Analytics Breakdown Elements
const incomeExpenseMeter = document.getElementById("income-expense-meter");
const incomeRatioText = document.getElementById("income-ratio-text");
const expenseRatioText = document.getElementById("expense-ratio-text");
const categoryBreakdownContainer = document.getElementById("category-breakdown-list");

// Edit Modal Elements
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

// Toast Container & Clear Data Button
const toastContainer = document.getElementById("toast-container");
const clearAllDataBtn = document.getElementById("clear-all-data-btn");

// Navbar User Profile & Logout Elements
const navUserName = document.getElementById("nav-user-name");
const navUserAvatar = document.getElementById("user-avatar");
const logoutBtn = document.getElementById("logout-btn");

// Current selected type in Quick Add form ('income' or 'expense')
let selectedFormType = "expense";

// ==============================================================================
// 3. AUTHENTICATION & SESSION MANAGEMENT
// ==============================================================================

/**
 * Retrieves the currently logged-in user's ID
 * @returns {string|null}
 */
function getCurrentUserId() {
  return localStorage.getItem(CURRENT_USER_KEY);
}

/**
 * Retrieves the full user record from LocalStorage for the current session
 * @returns {Object|null}
 */
function getCurrentUser() {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) return null;

  const usersData = localStorage.getItem(USERS_STORAGE_KEY);
  if (!usersData) return null;

  try {
    const users = JSON.parse(usersData);
    return users.find((u) => String(u.id) === String(currentUserId)) || null;
  } catch (error) {
    console.error("Error reading users:", error);
    return null;
  }
}

/**
 * Enforces Login Protection. If user is not authenticated, redirects to login.html.
 * @returns {Object|null} The authenticated user object
 */
function checkAuthAndRedirect() {
  const user = getCurrentUser();
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.replace("login.html");
    return null;
  }
  return user;
}

/**
 * Updates navbar with current user's name and avatar initials
 * @param {Object} user
 */
function updateNavbar(user) {
  if (!user) return;

  if (navUserName) {
    navUserName.textContent = user.name || "User";
  }

  if (navUserAvatar && user.name) {
    navUserAvatar.textContent = user.name.charAt(0).toUpperCase();
  }
}

/**
 * Logs out user, removes current session, and redirects to Login page
 */
function handleLogout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = "login.html?logout=true";
}

// ==============================================================================
// 4. USER-WISE LOCAL STORAGE FUNCTIONS
// ==============================================================================

/**
 * Returns all transactions stored in LocalStorage across all users.
 * Automatically backfills sample data if storage is completely empty.
 * @returns {Array}
 */
function getAllTransactionsFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // Initialize sample transactions for default user 101 on first run
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_TRANSACTIONS));
    return [...SAMPLE_TRANSACTIONS];
  }

  try {
    return JSON.parse(data) || [];
  } catch (error) {
    console.error("Error reading LocalStorage transactions:", error);
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
  return allTransactions.filter(
    (tx) => String(tx.userId) === String(currentUserId)
  );
}

/**
 * Saves all transactions back to LocalStorage
 * @param {Array} transactions
 */
function saveAllTransactionsToStorage(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Error saving transactions:", error);
    showToast("Failed to save data to LocalStorage!", "danger");
  }
}

// ==============================================================================
// 5. FORMATTING UTILITIES
// ==============================================================================

/**
 * Formats a numeric value into a clean currency string (e.g. $1,250.00)
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  const absoluteAmount = Math.abs(Number(amount) || 0);
  const formatted = absoluteAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted}`;
}

/**
 * Formats a date string (YYYY-MM-DD) into readable format (e.g. "Oct 4, 2026")
 * @param {string} dateString
 * @returns {string}
 */
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

/**
 * Returns today's date formatted as YYYY-MM-DD for date inputs
 * @returns {string}
 */
function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Generates a unique ID for new transactions
 * @returns {string}
 */
function generateUniqueId() {
  return "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

// ==============================================================================
// 6. TOAST NOTIFICATIONS
// ==============================================================================

/**
 * Displays a non-intrusive floating toast notification
 * @param {string} message - Message to show
 * @param {'success'|'danger'|'info'} type - Toast type styling
 */
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

// ==============================================================================
// 7. DASHBOARD CALCULATIONS & METRICS (USER-WISE)
// ==============================================================================

/**
 * Recalculates Total Balance, Total Income, Total Expense, and Count
 * and updates the dashboard metric cards for the logged-in user.
 * @param {Array} userTransactions
 */
function updateDashboardMetrics(userTransactions) {
  let income = 0;
  let expense = 0;

  userTransactions.forEach((tx) => {
    const val = parseFloat(tx.amount) || 0;
    if (tx.type === "income") {
      income += val;
    } else if (tx.type === "expense") {
      expense += val;
    }
  });

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

/**
 * Updates the Income vs Expense progress bar
 * @param {number} income
 * @param {number} expense
 */
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

/**
 * Computes category breakdown for expenses for the current user
 * @param {Array} userTransactions
 * @param {number} totalExpense
 */
function updateCategoryBreakdown(userTransactions, totalExpense) {
  if (!categoryBreakdownContainer) return;

  const expenseByCategory = {};
  userTransactions
    .filter((tx) => tx.type === "expense")
    .forEach((tx) => {
      const cat = tx.category || "Other Expense";
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (parseFloat(tx.amount) || 0);
    });

  const sortedCategories = Object.keys(expenseByCategory)
    .map((cat) => ({
      name: cat,
      amount: expenseByCategory[cat],
      percent: totalExpense > 0 ? Math.round((expenseByCategory[cat] / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  categoryBreakdownContainer.innerHTML = "";

  if (sortedCategories.length === 0) {
    categoryBreakdownContainer.innerHTML = `
      <p style="font-size: 0.8125rem; color: var(--text-muted); text-align: center; padding: 1rem 0;">
        No expense data recorded yet.
      </p>`;
    return;
  }

  sortedCategories.slice(0, 4).forEach((cat) => {
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
  });
}

// ==============================================================================
// 8. RENDER RECENT TRANSACTIONS (USER-WISE)
// ==============================================================================

/**
 * Renders the most recent 5 transactions for the current user
 * @param {Array} userTransactions
 */
function renderRecentTransactions(userTransactions) {
  if (!recentListEl) return;

  recentListEl.innerHTML = "";

  if (!userTransactions || userTransactions.length === 0) {
    if (emptyRecentEl) emptyRecentEl.style.display = "block";
    return;
  }

  if (emptyRecentEl) emptyRecentEl.style.display = "none";

  const sorted = [...userTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = sorted.slice(0, 5);

  recent.forEach((tx) => {
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>
        <button class="btn-icon btn-icon-danger" title="Delete Transaction" onclick="deleteTransaction('${tx.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;
    recentListEl.appendChild(li);
  });
}

// ==============================================================================
// 9. CATEGORY DROPDOWN POPULATION
// ==============================================================================

/**
 * Fills category options into a select element based on type
 * @param {HTMLSelectElement} selectElement
 * @param {'income'|'expense'} type
 * @param {string|null} selectedValue
 */
function populateCategorySelect(selectElement, type, selectedValue = null) {
  if (!selectElement) return;
  selectElement.innerHTML = "";

  const list = CATEGORIES[type] || [];
  list.forEach((categoryName) => {
    const opt = document.createElement("option");
    opt.value = categoryName;
    opt.textContent = categoryName;
    if (selectedValue && selectedValue === categoryName) {
      opt.selected = true;
    }
    selectElement.appendChild(opt);
  });
}

// ==============================================================================
// 10. FORM INTERACTIONS & ADD TRANSACTION
// ==============================================================================

/**
 * Switches the selected type in the quick add form
 * @param {'income'|'expense'} type
 */
function setFormType(type) {
  selectedFormType = type;

  typeToggleButtons.forEach((btn) => {
    if (btn.dataset.type === type) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

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

  // Validation
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

  // Create new transaction stamped with current user's userId
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

  // Prepend to all transactions in LocalStorage
  const allTransactions = getAllTransactionsFromStorage();
  allTransactions.unshift(newTransaction);
  saveAllTransactionsToStorage(allTransactions);

  // Refresh dashboard views
  refreshDashboard();

  // Reset form fields
  transactionForm.reset();
  setFormType("expense");
  if (txDateInput) txDateInput.value = getTodayDateString();

  showToast(`Transaction "${title}" added successfully!`, "success");
}

// ==============================================================================
// 11. EDIT TRANSACTION MODAL (USER-WISE)
// ==============================================================================

/**
 * Opens edit modal with pre-filled transaction data.
 * Only allows editing if the transaction belongs to the current user.
 * @param {string} id
 */
window.openEditModal = function (id) {
  const currentUserId = getCurrentUserId();
  const userTransactions = getUserTransactions();
  const tx = userTransactions.find(
    (item) => item.id === id && String(item.userId) === String(currentUserId)
  );

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

  editTypeInputs.forEach((radio) => {
    radio.checked = radio.value === tx.type;
  });

  populateCategorySelect(editCategorySelect, tx.type, tx.category);

  editModal.classList.add("active");
};

/**
 * Closes the edit modal and resets edit state
 */
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
  editTypeInputs.forEach((radio) => {
    if (radio.checked) selectedType = radio.value;
  });
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
  const index = allTransactions.findIndex(
    (tx) => tx.id === currentEditId && String(tx.userId) === String(currentUserId)
  );

  if (index === -1) {
    showToast("Could not find transaction to update.", "danger");
    closeEditModal();
    return;
  }

  allTransactions[index] = {
    ...allTransactions[index],
    title: title,
    amount: amount,
    type: selectedType,
    category: category,
    date: date,
    notes: notes,
  };

  saveAllTransactionsToStorage(allTransactions);
  closeEditModal();
  refreshDashboard();
  showToast("Transaction updated successfully!", "success");
}

// ==============================================================================
// 12. DELETE TRANSACTION (USER-WISE)
// ==============================================================================

/**
 * Deletes a transaction by ID after confirmation.
 * Only deletes if transaction belongs to current user.
 * Other users' transactions remain completely intact.
 * @param {string} id
 */
window.deleteTransaction = function (id) {
  const currentUserId = getCurrentUserId();
  const userTransactions = getUserTransactions();
  const tx = userTransactions.find(
    (item) => item.id === id && String(item.userId) === String(currentUserId)
  );

  if (!tx) {
    showToast("Transaction not found or access denied.", "danger");
    return;
  }

  const title = `"${tx.title}"`;
  const confirmDelete = window.confirm(`Are you sure you want to delete ${title}?`);
  if (!confirmDelete) return;

  const allTransactions = getAllTransactionsFromStorage();
  const updatedTransactions = allTransactions.filter(
    (item) => !(item.id === id && String(item.userId) === String(currentUserId))
  );

  saveAllTransactionsToStorage(updatedTransactions);
  refreshDashboard();
  showToast("Transaction deleted.", "danger");
};

// ==============================================================================
// 13. CLEAR ALL DATA / RESET (USER-WISE)
// ==============================================================================

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

  // Keep other users' transactions
  const otherUsersTransactions = allTransactions.filter(
    (tx) => String(tx.userId) !== String(currentUserId)
  );

  // Re-seed sample data with this user's userId
  const userSamples = SAMPLE_TRANSACTIONS.map((sample, index) => ({
    ...sample,
    id: `tx_sample_${currentUserId}_${index + 1}_${Date.now()}`,
    userId: Number(currentUserId) || currentUserId,
  }));

  saveAllTransactionsToStorage([...userSamples, ...otherUsersTransactions]);
  refreshDashboard();
  showToast("Account data reset to default samples.", "info");
}

// ==============================================================================
// 14. SECURITY / HTML ESCAPING
// ==============================================================================

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

// ==============================================================================
// 15. REFRESH DASHBOARD (USER-WISE)
// ==============================================================================

/**
 * Reads only the logged-in user's transactions and updates dashboard metrics
 */
function refreshDashboard() {
  const userTransactions = getUserTransactions();
  updateDashboardMetrics(userTransactions);
  renderRecentTransactions(userTransactions);
}

// ==============================================================================
// 16. INITIALIZATION & EVENT LISTENERS
// ==============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Enforce Login Protection immediately on page load
  const user = checkAuthAndRedirect();
  if (!user) return;

  // Display user profile in navbar
  updateNavbar(user);

  // Set default date to today in quick add form
  if (txDateInput) txDateInput.value = getTodayDateString();

  // Populate initial categories for the default 'expense' type
  populateCategorySelect(txCategorySelect, selectedFormType);

  // Type toggle button listeners (Income / Expense) in Quick Add
  typeToggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      setFormType(type);
    });
  });

  // Listen to form submit for Add Transaction
  if (transactionForm) {
    transactionForm.addEventListener("submit", handleAddTransaction);
  }

  // Edit Modal Event Listeners
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

  // Edit type radio changes update category options dynamically
  editTypeInputs.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (e.target.checked) {
        populateCategorySelect(editCategorySelect, e.target.value);
      }
    });
  });

  // Edit form submission
  if (editForm) {
    editForm.addEventListener("submit", handleSaveEdit);
  }

  // Clear / Reset Data button
  if (clearAllDataBtn) {
    clearAllDataBtn.addEventListener("click", handleClearAllData);
  }

  // Logout button listener
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Keyboard shortcut: ESC closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && editModal && editModal.classList.contains("active")) {
      closeEditModal();
    }
  });

  // Initial dashboard load with current user's data
  refreshDashboard();
});

// SpendWise - Transactions JavaScript
// Features:
// User Authentication & Protection
// User-Wise Transactions (Add, Edit, Delete)
// Search, Filter, Sort
// Multi-User LocalStorage Persistence

const STORAGE_KEY = "spendwise_transactions";
const USERS_STORAGE_KEY = "spendwise_users";
const CURRENT_USER_KEY = "spendwise_current_user";

// -------------------- Categories --------------------

const categories = {
  income: [
    "Salary",
    "Freelance",
    "Investments",
    "Business",
    "Rental Income",
    "Gift",
    "Other Income"
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
    "Other Expense"
  ]
};

// -------------------- Variables --------------------

let searchText = "";
let selectedType = "all";
let selectedCategory = "all";
let selectedSort = "date-desc";

let editId = null;
let addType = "expense";

// -------------------- HTML Elements --------------------

const searchInput = document.getElementById("search-input");
const clearSearchButton = document.getElementById("clear-search-btn");

const typeButtons = document.querySelectorAll(".filter-tab-btn");
const categoryFilter = document.getElementById("filter-category");
const sortFilter = document.getElementById("filter-sort");
const resetButton = document.getElementById("reset-filters-btn");

const tableBody = document.getElementById("transactions-table-body");
const emptyMessage = document.getElementById("empty-transactions-state");

const countText = document.getElementById("tx-count-summary");
const totalText = document.getElementById("filtered-total-amount");

// Edit Elements
const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-transaction-form");

const editIdInput = document.getElementById("edit-tx-id");
const editTitle = document.getElementById("edit-tx-title");
const editAmount = document.getElementById("edit-tx-amount");
const editType = document.querySelectorAll('input[name="edit-tx-type"]');
const editCategory = document.getElementById("edit-tx-category");
const editDate = document.getElementById("edit-tx-date");
const editNotes = document.getElementById("edit-tx-notes");

const closeEditButton = document.getElementById("close-edit-modal");
const cancelEditButton = document.getElementById("cancel-edit-btn");

// Add Elements
const addButton = document.getElementById("open-add-modal-btn");
const addModal = document.getElementById("add-modal");
const addForm = document.getElementById("add-transaction-form");

const addTitle = document.getElementById("add-tx-title");
const addAmount = document.getElementById("add-tx-amount");
const addCategory = document.getElementById("add-tx-category");
const addDate = document.getElementById("add-tx-date");
const addNotes = document.getElementById("add-tx-notes");

const addTypeButtons = document.querySelectorAll(".add-type-toggle-btn");

const closeAddButton = document.getElementById("close-add-modal");
const cancelAddButton = document.getElementById("cancel-add-btn");

const toastBox = document.getElementById("toast-container");

// Navbar Elements
const navUserName = document.getElementById("nav-user-name");
const navUserAvatar = document.getElementById("user-avatar");
const logoutBtn = document.getElementById("logout-btn");

// -------------------- AUTHENTICATION --------------------

function getCurrentUserId() {
  return localStorage.getItem(CURRENT_USER_KEY);
}

function getCurrentUser() {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    return null;
  }

  const usersData = localStorage.getItem(USERS_STORAGE_KEY);
  if (!usersData) {
    return null;
  }

  try {
    const users = JSON.parse(usersData);
    return users.find(function(user) {
      return String(user.id) === String(currentUserId);
    }) || null;
  } catch {
    return null;
  }
}

function checkAuth() {
  const user = getCurrentUser();
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.replace("../login.html");
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
  window.location.href = "../login.html?logout=true";
}

// -------------------- LocalStorage (Multi-User) --------------------

// Get ALL transactions across all users from LocalStorage
function getAllTransactions() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data) || [];
  } catch {
    return [];
  }
}

// Save ALL transactions to LocalStorage
function saveAllTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Get ONLY current user's transactions
function getUserTransactions() {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    return [];
  }

  const all = getAllTransactions();
  return all.filter(function(tx) {
    return String(tx.userId) === String(currentUserId);
  });
}

// -------------------- Helper Functions --------------------

// Today's date
function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Create ID
function makeId() {
  return "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

// Format money
function money(amount) {
  return "$" + Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Format date
function showDate(date) {
  if (!date) return "";
  const parts = date.split("-");
  if (parts.length !== 3) return date;

  const newDate = new Date(parts[0], parts[1] - 1, parts[2]);
  return newDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

// Show message
function showMessage(message, type = "success") {
  if (!toastBox) return;

  const box = document.createElement("div");
  box.className = `toast toast-${type}`;
  box.textContent = message;

  toastBox.appendChild(box);

  setTimeout(function() {
    box.remove();
  }, 3000);
}

// -------------------- Category Functions --------------------

// Fill category dropdown
function fillCategories(select, type, selected = "") {
  if (!select) return;
  select.innerHTML = "";

  categories[type].forEach(function(category) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    if (category === selected) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

// Fill filter dropdown
function fillFilterCategories() {
  if (!categoryFilter) return;

  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  // Income
  const incomeGroup = document.createElement("optgroup");
  incomeGroup.label = "Income Categories";
  categories.income.forEach(function(category) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    incomeGroup.appendChild(option);
  });

  // Expense
  const expenseGroup = document.createElement("optgroup");
  expenseGroup.label = "Expense Categories";
  categories.expense.forEach(function(category) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    expenseGroup.appendChild(option);
  });

  categoryFilter.appendChild(incomeGroup);
  categoryFilter.appendChild(expenseGroup);
}

// -------------------- Search / Filter / Sort --------------------

function getFilteredTransactions() {
  // Always begin with ONLY the logged-in user's transactions
  let transactions = getUserTransactions();

  // Search
  if (searchText.trim() !== "") {
    const search = searchText.toLowerCase().trim();
    transactions = transactions.filter(function(transaction) {
      const title = (transaction.title || "").toLowerCase();
      const notes = (transaction.notes || "").toLowerCase();
      const category = (transaction.category || "").toLowerCase();

      return (
        title.includes(search) ||
        notes.includes(search) ||
        category.includes(search)
      );
    });
  }

  // Income / Expense
  if (selectedType !== "all") {
    transactions = transactions.filter(function(transaction) {
      return transaction.type === selectedType;
    });
  }

  // Category
  if (selectedCategory !== "all") {
    transactions = transactions.filter(function(transaction) {
      return transaction.category === selectedCategory;
    });
  }

  // Sort
  transactions.sort(function(a, b) {
    if (selectedSort === "date-asc") {
      return new Date(a.date) - new Date(b.date);
    }

    if (selectedSort === "amount-desc") {
      return Number(b.amount) - Number(a.amount);
    }

    if (selectedSort === "amount-asc") {
      return Number(a.amount) - Number(b.amount);
    }

    // Default: newest first
    return new Date(b.date) - new Date(a.date);
  });

  return transactions;
}

// -------------------- Display Transactions --------------------

function displayTransactions() {
  const userAllTransactions = getUserTransactions();
  const transactions = getFilteredTransactions();

  // Count
  if (countText) {
    countText.textContent = `Showing ${transactions.length} of ${userAllTransactions.length} transactions`;
  }

  // Total
  let total = 0;
  transactions.forEach(function(transaction) {
    const amount = Number(transaction.amount) || 0;
    if (transaction.type === "income") {
      total += amount;
    } else {
      total -= amount;
    }
  });

  if (totalText) {
    if (total >= 0) {
      totalText.textContent = "+" + money(total);
      totalText.className = "amount-positive";
    } else {
      totalText.textContent = "-" + money(Math.abs(total));
      totalText.className = "amount-negative";
    }
  }

  // No data
  if (transactions.length === 0) {
    if (tableBody) {
      tableBody.innerHTML = "";
    }
    if (emptyMessage) {
      emptyMessage.style.display = "block";
    }
    return;
  }

  if (emptyMessage) {
    emptyMessage.style.display = "none";
  }

  if (!tableBody) return;

  tableBody.innerHTML = "";

  // Display every transaction
  transactions.forEach(function(transaction) {
    const row = document.createElement("tr");

    const income = transaction.type === "income";
    const sign = income ? "+" : "-";
    const amountClass = income ? "amount-positive" : "amount-negative";
    const typeClass = income ? "badge-income" : "badge-expense";

    row.innerHTML = `
      <td class="col-title" data-label="Title">
        <strong>${transaction.title || ""}</strong>
        ${
          transaction.notes
            ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${transaction.notes}</div>`
            : ""
        }
      </td>

      <td data-label="Type">
        <span class="badge-type ${typeClass}">${transaction.type}</span>
      </td>

      <td data-label="Category">
        <span class="badge-category">${transaction.category || ""}</span>
      </td>

      <td data-label="Date">
        <span style="color:var(--text-muted); font-size:0.875rem;">${showDate(transaction.date)}</span>
      </td>

      <td data-label="Amount">
        <span class="${amountClass}" style="font-weight:700;">${sign} ${money(transaction.amount)}</span>
      </td>

      <td class="col-actions" data-label="Actions">
        <div class="table-actions">
          <button
            class="btn-icon btn-icon-edit"
            title="Edit Transaction"
            onclick="openEditModal('${transaction.id}')"
          >
            ✏️
          </button>

          <button
            class="btn-icon btn-icon-danger"
            title="Delete Transaction"
            onclick="deleteTransaction('${transaction.id}')"
          >
            🗑️
          </button>
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

// -------------------- ADD TRANSACTION --------------------

function openAddModal() {
  if (!addModal) return;

  addType = "expense";
  setAddType("expense");

  if (addDate) {
    addDate.value = today();
  }

  addModal.classList.add("active");
}

function closeAddModal() {
  if (addModal) {
    addModal.classList.remove("active");
  }
  if (addForm) {
    addForm.reset();
  }
}

function setAddType(type) {
  addType = type;

  addTypeButtons.forEach(function(button) {
    if (button.dataset.type === type) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });

  fillCategories(addCategory, type);
}

function addTransaction(event) {
  event.preventDefault();

  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    checkAuth();
    return;
  }

  const title = addTitle.value.trim();
  const amount = Number(addAmount.value);
  const category = addCategory.value;
  const date = addDate.value || today();
  const notes = addNotes ? addNotes.value.trim() : "";

  // Title validation
  if (title === "") {
    showMessage("Please enter a title.", "danger");
    addTitle.focus();
    return;
  }

  // Amount validation
  if (amount <= 0 || isNaN(amount)) {
    showMessage("Please enter a valid amount.", "danger");
    addAmount.focus();
    return;
  }

  // Create transaction stamped with logged-in user's userId
  const newTransaction = {
    id: makeId(),
    userId: Number(currentUserId) || currentUserId,
    title: title,
    amount: amount,
    type: addType,
    category: category,
    date: date,
    notes: notes
  };

  const allTransactions = getAllTransactions();
  allTransactions.unshift(newTransaction);
  saveAllTransactions(allTransactions);

  closeAddModal();
  displayTransactions();

  showMessage("Transaction added successfully!");
}

// -------------------- EDIT TRANSACTION --------------------

function openEditModal(id) {
  const currentUserId = getCurrentUserId();
  const userTransactions = getUserTransactions();

  const transaction = userTransactions.find(function(item) {
    return item.id === id && String(item.userId) === String(currentUserId);
  });

  if (!transaction) {
    showMessage("Transaction not found or unauthorized.", "danger");
    return;
  }

  editId = id;
  editIdInput.value = transaction.id;
  editTitle.value = transaction.title;
  editAmount.value = transaction.amount;
  editDate.value = transaction.date;

  if (editNotes) {
    editNotes.value = transaction.notes || "";
  }

  editType.forEach(function(radio) {
    radio.checked = radio.value === transaction.type;
  });

  fillCategories(editCategory, transaction.type, transaction.category);

  editModal.classList.add("active");
}

window.openEditModal = openEditModal;

function closeEditModal() {
  if (editModal) {
    editModal.classList.remove("active");
  }
  editId = null;
  if (editForm) {
    editForm.reset();
  }
}

function saveEdit(event) {
  event.preventDefault();

  if (!editId) return;

  const currentUserId = getCurrentUserId();
  const title = editTitle.value.trim();
  const amount = Number(editAmount.value);

  let type = "expense";
  editType.forEach(function(radio) {
    if (radio.checked) {
      type = radio.value;
    }
  });

  const category = editCategory.value;
  const date = editDate.value || today();
  const notes = editNotes ? editNotes.value.trim() : "";

  if (title === "") {
    showMessage("Please enter a title.", "danger");
    return;
  }

  if (amount <= 0 || isNaN(amount)) {
    showMessage("Please enter a valid amount.", "danger");
    return;
  }

  const allTransactions = getAllTransactions();
  const index = allTransactions.findIndex(function(transaction) {
    return transaction.id === editId && String(transaction.userId) === String(currentUserId);
  });

  if (index === -1) {
    showMessage("Transaction not found or unauthorized.", "danger");
    return;
  }

  allTransactions[index].title = title;
  allTransactions[index].amount = amount;
  allTransactions[index].type = type;
  allTransactions[index].category = category;
  allTransactions[index].date = date;
  allTransactions[index].notes = notes;

  saveAllTransactions(allTransactions);

  closeEditModal();
  displayTransactions();

  showMessage("Transaction updated successfully!");
}

// -------------------- DELETE --------------------

function deleteTransaction(id) {
  const currentUserId = getCurrentUserId();
  const userTransactions = getUserTransactions();

  const transaction = userTransactions.find(function(item) {
    return item.id === id && String(item.userId) === String(currentUserId);
  });

  if (!transaction) {
    showMessage("Transaction not found or unauthorized.", "danger");
    return;
  }

  const answer = confirm(`Are you sure you want to delete "${transaction.title}"?`);
  if (!answer) return;

  const allTransactions = getAllTransactions();
  const newTransactions = allTransactions.filter(function(item) {
    return !(item.id === id && String(item.userId) === String(currentUserId));
  });

  saveAllTransactions(newTransactions);

  displayTransactions();
  showMessage("Transaction deleted.", "danger");
}

window.deleteTransaction = deleteTransaction;

// -------------------- RESET FILTERS --------------------

function resetFilters() {
  searchText = "";
  selectedType = "all";
  selectedCategory = "all";
  selectedSort = "date-desc";

  if (searchInput) searchInput.value = "";
  if (clearSearchButton) clearSearchButton.style.display = "none";
  if (categoryFilter) categoryFilter.value = "all";
  if (sortFilter) sortFilter.value = "date-desc";

  typeButtons.forEach(function(button) {
    if (button.dataset.type === "all") {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });

  displayTransactions();
  showMessage("Filters reset.", "info");
}

// -------------------- PAGE START --------------------

document.addEventListener("DOMContentLoaded", function() {
  // Authentication Guard
  const user = checkAuth();
  if (!user) return;

  // Navbar user profile & logout
  updateNavbar(user);
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Category dropdown
  fillFilterCategories();

  // Search
  if (searchInput) {
    searchInput.addEventListener("input", function() {
      searchText = searchInput.value;
      if (clearSearchButton) {
        clearSearchButton.style.display = searchText ? "block" : "none";
      }
      displayTransactions();
    });
  }

  // Clear Search
  if (clearSearchButton) {
    clearSearchButton.addEventListener("click", function() {
      searchInput.value = "";
      searchText = "";
      clearSearchButton.style.display = "none";
      displayTransactions();
    });
  }

  // All / Income / Expense tabs
  typeButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      typeButtons.forEach(function(item) {
        item.classList.remove("active");
      });
      button.classList.add("active");
      selectedType = button.dataset.type;
      displayTransactions();
    });
  });

  // Category Filter
  if (categoryFilter) {
    categoryFilter.addEventListener("change", function() {
      selectedCategory = categoryFilter.value;
      displayTransactions();
    });
  }

  // Sort
  if (sortFilter) {
    sortFilter.addEventListener("change", function() {
      selectedSort = sortFilter.value;
      displayTransactions();
    });
  }

  // Reset
  if (resetButton) {
    resetButton.addEventListener("click", resetFilters);
  }

  // Open Add Modal
  if (addButton) {
    addButton.addEventListener("click", openAddModal);
  }

  // Close Add Modal
  if (closeAddButton) {
    closeAddButton.addEventListener("click", closeAddModal);
  }

  if (cancelAddButton) {
    cancelAddButton.addEventListener("click", closeAddModal);
  }

  // Click outside Add Modal
  if (addModal) {
    addModal.addEventListener("click", function(event) {
      if (event.target === addModal) {
        closeAddModal();
      }
    });
  }

  // Add Income / Expense
  addTypeButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      setAddType(button.dataset.type);
    });
  });

  // Add Form
  if (addForm) {
    addForm.addEventListener("submit", addTransaction);
  }

  // Close Edit Modal
  if (closeEditButton) {
    closeEditButton.addEventListener("click", closeEditModal);
  }

  if (cancelEditButton) {
    cancelEditButton.addEventListener("click", closeEditModal);
  }

  // Click outside Edit Modal
  if (editModal) {
    editModal.addEventListener("click", function(event) {
      if (event.target === editModal) {
        closeEditModal();
      }
    });
  }

  // Change Income / Expense in Edit
  editType.forEach(function(radio) {
    radio.addEventListener("change", function() {
      if (radio.checked) {
        fillCategories(editCategory, radio.value);
      }
    });
  });

  // Edit Form
  if (editForm) {
    editForm.addEventListener("submit", saveEdit);
  }

  // ESC key closes modals
  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
      if (editModal && editModal.classList.contains("active")) {
        closeEditModal();
      }
      if (addModal && addModal.classList.contains("active")) {
        closeAddModal();
      }
    }
  });

  // Show user's transactions
  displayTransactions();
});
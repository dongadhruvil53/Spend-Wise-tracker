const STORAGE_KEY = "spendwise_transactions";
const USERS_STORAGE_KEY = "spendwise_users";
const CURRENT_USER_KEY = "spendwise_current_user";

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

let searchText = "";
let selectedType = "all";
let selectedCategory = "all";
let selectedSort = "date-desc";

let editId = null;
let addType = "expense";

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

const navUserName = document.getElementById("nav-user-name");
const navUserAvatar = document.getElementById("user-avatar");
const logoutBtn = document.getElementById("logout-btn");

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
    for (let i = 0; i < users.length; i++) {
      if (String(users[i].id) === String(currentUserId)) {
        return users[i];
      }
    }
    return null;
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

// Get ALL transactions across all users from LocalStorage
function getAllTransactions() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return [];
  }
  try {
    const transactions = JSON.parse(data);
    if (Array.isArray(transactions)) {
      return transactions;
    }
    throw new Error("Saved transactions are not a list.");
  } catch (error) {
    console.error("Could not read saved transactions:", error);
    showMessage("Could not read saved transactions.", "danger");
    return [];
  }
}

// Save ALL transactions to LocalStorage
function saveAllTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error("Could not save transactions:", error);
    showMessage("Could not save transactions to this browser.", "danger");
    return false;
  }
}

// Get ONLY current user's transactions
function getUserTransactions() {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    return [];
  }

  const all = getAllTransactions();
  const userTransactions = [];
  for (let i = 0; i < all.length; i++) {
    if (String(all[i].userId) === String(currentUserId)) {
      userTransactions.push(all[i]);
    }
  }
  return userTransactions;
}

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeId() {
  return "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

function money(amount) {
  return "$" + Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

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

function fillCategories(select, type, selected = "") {
  if (!select) return;
  select.innerHTML = "";

  for (let i = 0; i < categories[type].length; i++) {
    const category = categories[type][i];
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    if (category === selected) {
      option.selected = true;
    }
    select.appendChild(option);
  }
}

function fillFilterCategories() {
  if (!categoryFilter) return;

  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  const incomeGroup = document.createElement("optgroup");
  incomeGroup.label = "Income Categories";
  for (let i = 0; i < categories.income.length; i++) {
    const category = categories.income[i];
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    incomeGroup.appendChild(option);
  }

  const expenseGroup = document.createElement("optgroup");
  expenseGroup.label = "Expense Categories";
  for (let i = 0; i < categories.expense.length; i++) {
    const category = categories.expense[i];
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    expenseGroup.appendChild(option);
  }

  categoryFilter.appendChild(incomeGroup);
  categoryFilter.appendChild(expenseGroup);
}

// Returns the current user's transactions that match the selected search and filters.
function getFilteredTransactions() {
  // Always begin with ONLY the logged-in user's transactions
  const userTransactions = getUserTransactions();
  const transactions = [];
  const search = searchText.trim().toLowerCase();

  for (let i = 0; i < userTransactions.length; i++) {
    const transaction = userTransactions[i];
    const title = (transaction.title || "").toLowerCase();
    const notes = (transaction.notes || "").toLowerCase();
    const category = (transaction.category || "").toLowerCase();

    if (search && !title.includes(search)
      && !notes.includes(search)
      && !category.includes(search)) {
      continue;
    }
    if (selectedType !== "all" && transaction.type !== selectedType) {
      continue;
    }
    if (selectedCategory !== "all"
      && transaction.category !== selectedCategory) {
      continue;
    }
    transactions.push(transaction);
  }

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

    return new Date(b.date) - new Date(a.date);
  });

  return transactions;
}

function displayTransactions() {
  const userAllTransactions = getUserTransactions();
  const transactions = getFilteredTransactions();

  if (countText) {
    countText.textContent = `Showing ${transactions.length} of ${userAllTransactions.length} transactions`;
  }

  let total = 0;
  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    const amount = Number(transaction.amount) || 0;
    if (transaction.type === "income") {
      total += amount;
    } else {
      total -= amount;
    }
  }

  if (totalText) {
    if (total >= 0) {
      totalText.textContent = "+" + money(total);
      totalText.className = "amount-positive";
    } else {
      totalText.textContent = "-" + money(Math.abs(total));
      totalText.className = "amount-negative";
    }
  }

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

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
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
  }
}

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

  for (let i = 0; i < addTypeButtons.length; i++) {
    const button = addTypeButtons[i];
    if (button.dataset.type === type) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  }

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

  if (title === "") {
    showMessage("Please enter a title.", "danger");
    addTitle.focus();
    return;
  }

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
  if (!saveAllTransactions(allTransactions)) return;

  closeAddModal();
  displayTransactions();

  showMessage("Transaction added successfully!");
}

function openEditModal(id) {
  const currentUserId = getCurrentUserId();
  const userTransactions = getUserTransactions();

  let transaction = null;
  for (let i = 0; i < userTransactions.length; i++) {
    if (userTransactions[i].id === id
      && String(userTransactions[i].userId) === String(currentUserId)) {
      transaction = userTransactions[i];
      break;
    }
  }

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

  for (let i = 0; i < editType.length; i++) {
    const radio = editType[i];
    radio.checked = radio.value === transaction.type;
  }

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
  for (let i = 0; i < editType.length; i++) {
    const radio = editType[i];
    if (radio.checked) {
      type = radio.value;
    }
  }

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
  let index = -1;
  for (let i = 0; i < allTransactions.length; i++) {
    if (allTransactions[i].id === editId
      && String(allTransactions[i].userId) === String(currentUserId)) {
      index = i;
      break;
    }
  }

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

  if (!saveAllTransactions(allTransactions)) return;

  closeEditModal();
  displayTransactions();

  showMessage("Transaction updated successfully!");
}

function deleteTransaction(id) {
  const currentUserId = getCurrentUserId();
  const userTransactions = getUserTransactions();

  let transaction = null;
  for (let i = 0; i < userTransactions.length; i++) {
    if (userTransactions[i].id === id
      && String(userTransactions[i].userId) === String(currentUserId)) {
      transaction = userTransactions[i];
      break;
    }
  }

  if (!transaction) {
    showMessage("Transaction not found or unauthorized.", "danger");
    return;
  }

  const answer = confirm(`Are you sure you want to delete "${transaction.title}"?`);
  if (!answer) return;

  const allTransactions = getAllTransactions();
  const newTransactions = [];
  for (let i = 0; i < allTransactions.length; i++) {
    const belongsToUser = String(allTransactions[i].userId) === String(currentUserId);
    if (allTransactions[i].id !== id || !belongsToUser) {
      newTransactions.push(allTransactions[i]);
    }
  }

  if (!saveAllTransactions(newTransactions)) return;

  displayTransactions();
  showMessage("Transaction deleted.", "danger");
}

window.deleteTransaction = deleteTransaction;

function resetFilters() {
  searchText = "";
  selectedType = "all";
  selectedCategory = "all";
  selectedSort = "date-desc";

  if (searchInput) searchInput.value = "";
  if (clearSearchButton) clearSearchButton.style.display = "none";
  if (categoryFilter) categoryFilter.value = "all";
  if (sortFilter) sortFilter.value = "date-desc";

  for (let i = 0; i < typeButtons.length; i++) {
    const button = typeButtons[i];
    if (button.dataset.type === "all") {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  }

  displayTransactions();
  showMessage("Filters reset.", "info");
}

document.addEventListener("DOMContentLoaded", function() {

  const user = checkAuth();
  if (!user) return;

  updateNavbar(user);
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  fillFilterCategories();

  if (searchInput) {
    searchInput.addEventListener("input", function() {
      searchText = searchInput.value;
      if (clearSearchButton) {
        clearSearchButton.style.display = searchText ? "block" : "none";
      }
      displayTransactions();
    });
  }

  if (clearSearchButton) {
    clearSearchButton.addEventListener("click", function() {
      searchInput.value = "";
      searchText = "";
      clearSearchButton.style.display = "none";
      displayTransactions();
    });
  }

  for (let i = 0; i < typeButtons.length; i++) {
    const button = typeButtons[i];
    button.addEventListener("click", function() {
      for (let j = 0; j < typeButtons.length; j++) {
        const item = typeButtons[j];
        item.classList.remove("active");
      }
      button.classList.add("active");
      selectedType = button.dataset.type;
      displayTransactions();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", function() {
      selectedCategory = categoryFilter.value;
      displayTransactions();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener("change", function() {
      selectedSort = sortFilter.value;
      displayTransactions();
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", resetFilters);
  }

  if (addButton) {
    addButton.addEventListener("click", openAddModal);
  }

  if (closeAddButton) {
    closeAddButton.addEventListener("click", closeAddModal);
  }

  if (cancelAddButton) {
    cancelAddButton.addEventListener("click", closeAddModal);
  }

  if (addModal) {
    addModal.addEventListener("click", function(event) {
      if (event.target === addModal) {
        closeAddModal();
      }
    });
  }

  for (let i = 0; i < addTypeButtons.length; i++) {
    const button = addTypeButtons[i];
    button.addEventListener("click", function() {
      setAddType(button.dataset.type);
    });
  }

  if (addForm) {
    addForm.addEventListener("submit", addTransaction);
  }

  if (closeEditButton) {
    closeEditButton.addEventListener("click", closeEditModal);
  }

  if (cancelEditButton) {
    cancelEditButton.addEventListener("click", closeEditModal);
  }

  if (editModal) {
    editModal.addEventListener("click", function(event) {
      if (event.target === editModal) {
        closeEditModal();
      }
    });
  }

  for (let i = 0; i < editType.length; i++) {
    const radio = editType[i];
    radio.addEventListener("change", function() {
      if (radio.checked) {
        fillCategories(editCategory, radio.value);
      }
    });
  }

  if (editForm) {
    editForm.addEventListener("submit", saveEdit);
  }

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

  displayTransactions();
});
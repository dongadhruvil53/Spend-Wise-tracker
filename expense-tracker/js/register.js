/**
 * ==============================================================================
 * SpendWise - Expense Tracker Application
 * File: js/register.js
 * Description: Handles user account registration, input validation, duplicate
 *              email verification, and LocalStorage persistence.
 * ==============================================================================
 */

// ==============================================================================
// 1. CONSTANTS & KEYS
// ==============================================================================
const USERS_STORAGE_KEY = "spendwise_users";
const CURRENT_USER_KEY = "spendwise_current_user";

// ==============================================================================
// 2. DOM ELEMENT REFERENCES
// ==============================================================================
const registerForm = document.getElementById("register-form");
const nameInput = document.getElementById("reg-name");
const emailInput = document.getElementById("reg-email");
const passwordInput = document.getElementById("reg-password");
const confirmPasswordInput = document.getElementById("reg-confirm-password");
const submitBtn = document.getElementById("register-submit-btn");

const errorAlert = document.getElementById("auth-error");
const errorText = document.getElementById("auth-error-text");
const matchIndicator = document.getElementById("match-indicator");

const togglePasswordBtn = document.getElementById("toggle-reg-password");
const toggleConfirmBtn = document.getElementById("toggle-reg-confirm");
const toastContainer = document.getElementById("toast-container");

// ==============================================================================
// 3. STORAGE HELPERS
// ==============================================================================

/**
 * Returns all registered users from LocalStorage.
 * @returns {Array} List of user objects
 */
function getUsersFromStorage() {
  const data = localStorage.getItem(USERS_STORAGE_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading users from LocalStorage:", error);
    return [];
  }
}

/**
 * Saves all users to LocalStorage
 * @param {Array} users
 */
function saveUsersToStorage(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Error saving users to LocalStorage:", error);
  }
}

/**
 * Generates a clean numeric ID for the new user (e.g. 101, 102, 103)
 * @param {Array} users
 * @returns {number}
 */
function generateNextUserId(users) {
  if (!users || users.length === 0) return 101;
  const ids = users.map((u) => Number(u.id) || 100);
  return Math.max(...ids) + 1;
}

// ==============================================================================
// 4. UI NOTIFICATIONS & HELPERS
// ==============================================================================

/**
 * Shows an inline error message
 * @param {string} message
 */
function showError(message) {
  if (!errorAlert || !errorText) return;
  errorText.textContent = message;
  errorAlert.style.display = "flex";
}

/**
 * Hides the inline error message
 */
function hideError() {
  if (errorAlert) errorAlert.style.display = "none";
}

/**
 * Floating toast notification
 * @param {string} message
 * @param {'success'|'danger'|'info'} type
 */
function showToast(message, type = "success") {
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Updates the visual password matching helper indicator
 */
function checkPasswordMatch() {
  if (!matchIndicator) return;

  const pwd = passwordInput.value;
  const cpwd = confirmPasswordInput.value;

  if (!cpwd) {
    matchIndicator.style.display = "none";
    return;
  }

  matchIndicator.style.display = "flex";
  if (pwd === cpwd) {
    matchIndicator.className = "match-indicator matched";
    matchIndicator.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>Passwords match</span>
    `;
  } else {
    matchIndicator.className = "match-indicator mismatched";
    matchIndicator.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      <span>Passwords do not match yet</span>
    `;
  }
}

// ==============================================================================
// 5. REGISTRATION SUBMISSION HANDLER
// ==============================================================================

/**
 * Handles the registration form submission
 * @param {Event} e
 */
function handleRegister(e) {
  e.preventDefault();
  hideError();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // 1. Validate Full Name
  if (!name) {
    showError("Please enter your full name.");
    nameInput.focus();
    return;
  }

  if (name.length < 2) {
    showError("Full name must be at least 2 characters long.");
    nameInput.focus();
    return;
  }

  // 2. Validate Email
  if (!email) {
    showError("Please enter your email address.");
    emailInput.focus();
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError("Please provide a valid email address (e.g. name@example.com).");
    emailInput.focus();
    return;
  }

  // 3. Validate Password Length
  if (!password) {
    showError("Please enter a password.");
    passwordInput.focus();
    return;
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters long.");
    passwordInput.focus();
    return;
  }

  // 4. Validate Confirm Password Match
  if (!confirmPassword) {
    showError("Please confirm your password.");
    confirmPasswordInput.focus();
    return;
  }

  if (password !== confirmPassword) {
    showError("Passwords do not match. Please re-enter identical passwords.");
    confirmPasswordInput.focus();
    return;
  }

  // 5. Check for duplicate email in LocalStorage
  const existingUsers = getUsersFromStorage();
  const emailExists = existingUsers.some(
    (u) => u.email && u.email.toLowerCase() === email.toLowerCase()
  );

  if (emailExists) {
    showError(`An account with the email "${email}" already exists. Please sign in instead.`);
    emailInput.focus();
    return;
  }

  // 6. Create new user object
  const newUserId = generateNextUserId(existingUsers);
  const newUser = {
    id: newUserId,
    name: name,
    email: email.toLowerCase(),
    password: password,
    createdAt: new Date().toISOString(),
  };

  // 7. Save to LocalStorage
  existingUsers.push(newUser);
  saveUsersToStorage(existingUsers);

  // Disable button while redirecting
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Creating account...</span>`;
  }

  showToast("Account created successfully! Redirecting to login...", "success");

  // 8. Redirect to Login page
  setTimeout(() => {
    window.location.href = "login.html?registered=true";
  }, 600);
}

// ==============================================================================
// 6. INITIALIZATION & EVENT LISTENERS
// ==============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Listen for registration form submit
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  // Real-time password match check
  if (passwordInput && confirmPasswordInput) {
    passwordInput.addEventListener("input", checkPasswordMatch);
    confirmPasswordInput.addEventListener("input", checkPasswordMatch);
  }

  // Toggle Password Visibility
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isPassword ? "text" : "password");

      togglePasswordBtn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  }

  // Toggle Confirm Password Visibility
  if (toggleConfirmBtn && confirmPasswordInput) {
    toggleConfirmBtn.addEventListener("click", () => {
      const isPassword = confirmPasswordInput.getAttribute("type") === "password";
      confirmPasswordInput.setAttribute("type", isPassword ? "text" : "password");

      toggleConfirmBtn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  }
});

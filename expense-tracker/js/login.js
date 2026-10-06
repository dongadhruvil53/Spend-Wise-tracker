/**
 * ==============================================================================
 * SpendWise - Expense Tracker Application
 * File: js/login.js
 * Description: Handles user authentication, credential verification,
 *              LocalStorage session persistence, and error handling.
 * ==============================================================================
 */

// ==============================================================================
// 1. CONSTANTS & KEYS
// ==============================================================================
const USERS_STORAGE_KEY = "spendwise_users";
const CURRENT_USER_KEY = "spendwise_current_user";

// Default demo user seeded on first run for quick testing
const DEFAULT_DEMO_USER = {
  id: 101,
  name: "Demo User",
  email: "demo@spendwise.com",
  password: "password123",
  createdAt: "2026-10-01T00:00:00.000Z",
};

// ==============================================================================
// 2. DOM ELEMENT REFERENCES
// ==============================================================================
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const submitBtn = document.getElementById("login-submit-btn");

const errorAlert = document.getElementById("auth-error");
const errorText = document.getElementById("auth-error-text");

const successAlert = document.getElementById("auth-success");
const successText = document.getElementById("auth-success-text");

const togglePasswordBtn = document.getElementById("toggle-login-password");
const fillDemoBtn = document.getElementById("btn-fill-demo");
const toastContainer = document.getElementById("toast-container");

// ==============================================================================
// 3. STORAGE HELPERS
// ==============================================================================

/**
 * Returns all registered users from LocalStorage.
 * If no users exist, seeds the default demo user.
 * @returns {Array} List of user objects
 */
function getUsersFromStorage() {
  const data = localStorage.getItem(USERS_STORAGE_KEY);
  if (!data) {
    const initialUsers = [DEFAULT_DEMO_USER];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
    return initialUsers;
  }

  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    // If empty array, seed default demo user
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([DEFAULT_DEMO_USER]));
    return [DEFAULT_DEMO_USER];
  } catch (error) {
    console.error("Error reading users from LocalStorage:", error);
    return [DEFAULT_DEMO_USER];
  }
}

/**
 * Saves current user ID to LocalStorage session
 * @param {string|number} userId
 */
function setLoggedInUser(userId) {
  localStorage.setItem(CURRENT_USER_KEY, String(userId));
}

// ==============================================================================
// 4. UI NOTIFICATIONS & HELPERS
// ==============================================================================

/**
 * Shows an inline error alert box inside the card
 * @param {string} message
 */
function showError(message) {
  if (!errorAlert || !errorText) return;
  errorText.textContent = message;
  errorAlert.style.display = "flex";
  if (successAlert) successAlert.style.display = "none";
}

/**
 * Hides the inline error alert box
 */
function hideError() {
  if (errorAlert) errorAlert.style.display = "none";
}

/**
 * Shows an inline success alert box inside the card
 * @param {string} message
 */
function showSuccess(message) {
  if (!successAlert || !successText) return;
  successText.textContent = message;
  successAlert.style.display = "flex";
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

// ==============================================================================
// 5. LOGIN SUBMISSION HANDLER
// ==============================================================================

/**
 * Handles the login form submission
 * @param {Event} e
 */
function handleLogin(e) {
  e.preventDefault();
  hideError();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Basic validation
  if (!email) {
    showError("Please enter your email address.");
    emailInput.focus();
    return;
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError("Please enter a valid email address (e.g. name@example.com).");
    emailInput.focus();
    return;
  }

  if (!password) {
    showError("Please enter your password.");
    passwordInput.focus();
    return;
  }

  // Load all users from LocalStorage
  const users = getUsersFromStorage();

  // Find user by email (case-insensitive) and matching password
  const matchedUser = users.find(
    (u) =>
      u.email &&
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password
  );

  if (!matchedUser) {
    showError("Incorrect email or password. Please verify your credentials and try again.");
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  // Save logged-in user ID into LocalStorage
  setLoggedInUser(matchedUser.id);

  // Disable button to prevent double submission
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Signing in...</span>`;
  }

  showToast(`Welcome back, ${matchedUser.name}!`, "success");

  // Redirect to SpendWise Dashboard
  setTimeout(() => {
    window.location.href = "index.html";
  }, 400);
}

// ==============================================================================
// 6. INITIALIZATION & EVENT LISTENERS
// ==============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Ensure default demo user exists in storage
  getUsersFromStorage();

  // Check URL query parameters for feedback messages
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("registered") === "true") {
    showSuccess("Your account was created successfully! Please sign in with your email and password.");
  } else if (urlParams.get("logout") === "true") {
    showSuccess("You have been signed out successfully.");
  }

  // Login Form submit listener
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // Password visibility toggle
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isPassword ? "text" : "password");

      // Switch icon
      togglePasswordBtn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  }

  // Quick Demo Auto-Fill button listener
  if (fillDemoBtn && emailInput && passwordInput) {
    fillDemoBtn.addEventListener("click", () => {
      emailInput.value = "demo@spendwise.com";
      passwordInput.value = "password123";
      hideError();
      showToast("Demo credentials filled! Click 'Sign In' to enter.", "info");
      emailInput.focus();
    });
  }
});

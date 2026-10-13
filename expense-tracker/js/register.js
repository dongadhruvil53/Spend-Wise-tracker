const USERS_STORAGE_KEY = "spendwise_users";

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

function saveUsersToStorage(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error("Error saving users to LocalStorage:", error);
    return false;
  }
}

function generateNextUserId(users) {
  if (!users || users.length === 0) return 101;
  let highestId = 100;
  for (let i = 0; i < users.length; i++) {
    const userId = Number(users[i].id) || 100;
    if (userId > highestId) {
      highestId = userId;
    }
  }
  return highestId + 1;
}

function showError(message) {
  if (!errorAlert || !errorText) return;
  errorText.textContent = message;
  errorAlert.style.display = "flex";
}

function hideError() {
  if (errorAlert) errorAlert.style.display = "none";
}

function showFieldError(message, input) {
  showError(message);
  input.focus();
}

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

function handleRegister(e) {
  e.preventDefault();
  hideError();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!name) {
    showFieldError("Please enter your full name.", nameInput);
    return;
  }

  if (name.length < 2) {
    showFieldError("Full name must be at least 2 characters long.", nameInput);
    return;
  }

  if (!email) {
    showFieldError("Please enter your email address.", emailInput);
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showFieldError("Please provide a valid email address (e.g. name@example.com).", emailInput);
    return;
  }

  if (!password) {
    showFieldError("Please enter a password.", passwordInput);
    return;
  }

  if (password.length < 6) {
    showFieldError("Password must be at least 6 characters long.", passwordInput);
    return;
  }

  if (!confirmPassword) {
    showFieldError("Please confirm your password.", confirmPasswordInput);
    return;
  }

  if (password !== confirmPassword) {
    showFieldError("Passwords do not match. Please re-enter identical passwords.", confirmPasswordInput);
    return;
  }

  const existingUsers = getUsersFromStorage();
  let emailExists = false;
  for (let i = 0; i < existingUsers.length; i++) {
    if (existingUsers[i].email
      && existingUsers[i].email.toLowerCase() === email.toLowerCase()) {
      emailExists = true;
      break;
    }
  }

  if (emailExists) {
    showFieldError(
      `An account with the email "${email}" already exists. Please sign in instead.`,
      emailInput
    );
    return;
  }

  const newUserId = generateNextUserId(existingUsers);
  const newUser = {
    id: newUserId,
    name: name,
    email: email.toLowerCase(),
    password: password,
    createdAt: new Date().toISOString(),
  };

  existingUsers.push(newUser);
  if (!saveUsersToStorage(existingUsers)) {
    showError("Could not save your account. Please check your browser storage and try again.");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Creating account...</span>`;
  }

  showToast("Account created successfully! Redirecting to login...", "success");

  setTimeout(() => {
    window.location.href = "login.html?registered=true";
  }, 600);
}

function togglePasswordVisibility(button, input) {
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";

  if (isPassword) {
    button.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
  } else {
    button.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }

  if (passwordInput && confirmPasswordInput) {
    passwordInput.addEventListener("input", checkPasswordMatch);
    confirmPasswordInput.addEventListener("input", checkPasswordMatch);
  }

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      togglePasswordVisibility(togglePasswordBtn, passwordInput);
    });
  }

  if (toggleConfirmBtn && confirmPasswordInput) {
    toggleConfirmBtn.addEventListener("click", () => {
      togglePasswordVisibility(toggleConfirmBtn, confirmPasswordInput);
    });
  }
});

/* ============================================================
   firebase.js – Auth + (optional) Firestore wiring
   - Uses Firebase Web SDK (compat version)
   - Handles:
     * Email/password login
     * Email/password signup
     * Google login
     * Logout
     * UI updates on all pages that have:
       - #auth-status, #logout-btn
       - #dash-auth-status, #dash-logout-btn
       - #login-status, #login-btn, #signup-btn, #google-login-btn
=============================================================== */

// ------------------------------------------------------------
// 1. Firebase Config – REPLACE with your own values
//    Get these from Firebase Console > Project Settings > Web app
// ------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAIKSvA8kt2xK9np5qTcbhuS5AihJ_Js8I",
  authDomain: "plus-webv101.firebaseapp.com",
  projectId: "plus-webv101",
  storageBucket: "plus-webv101.firebasestorage.app",
  messagingSenderId: "887973732688",
  appId: "1:887973732688:web:2f6171dad5b6ccd60f4c55"
};


// Global Firebase references
let fbApp = null;
let auth = null;
let db = null;

// ------------------------------------------------------------
// 2. Initialise Firebase (if SDK is available)
// ------------------------------------------------------------
function initFirebase() {
  if (!window.firebase) {
    console.warn("Firebase SDK not loaded. Make sure Firebase scripts are included before firebase.js.");
    return;
  }

  try {
    if (firebase.apps && firebase.apps.length) {
      fbApp = firebase.app();
    } else {
      fbApp = firebase.initializeApp(firebaseConfig);
    }

    auth = firebase.auth();
    try {
      db = firebase.firestore(); // optional
    } catch (e) {
      console.warn("Firestore not available (this is optional).", e);
      db = null;
    }
  } catch (e) {
    console.error("Error initialising Firebase:", e);
  }
}

// ------------------------------------------------------------
// 3. UI helper functions
// ------------------------------------------------------------
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setVisible(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? "" : "none";
}

// Update small auth widgets on index/quiz/dashboard
function updateAuthWidgets(user) {
  const name = user && (user.displayName || user.email || "Signed in user");

  // Generic auth bar (index.html, quiz.html)
  const authStatus = document.getElementById("auth-status");
  const logoutBtn = document.getElementById("logout-btn");

  if (authStatus) {
    if (user) {
      authStatus.textContent = `Signed in as ${name}`;
    } else {
      authStatus.innerHTML = `Not signed in. <a href="login.html">Log in</a>`;
    }
  }
  if (logoutBtn) {
    logoutBtn.style.display = user ? "" : "none";
    if (!logoutBtn.dataset.bound) {
      logoutBtn.addEventListener("click", handleLogout);
      logoutBtn.dataset.bound = "true";
    }
  }

  // Dashboard-specific bar
  const dashStatus = document.getElementById("dash-auth-status");
  const dashLogoutBtn = document.getElementById("dash-logout-btn");

  if (dashStatus) {
    if (user) {
      dashStatus.textContent = `Signed in as ${name}`;
    } else {
      dashStatus.innerHTML = `Not signed in. <a href="login.html">Log in</a>`;
    }
  }
  if (dashLogoutBtn) {
    dashLogoutBtn.style.display = user ? "" : "none";
    if (!dashLogoutBtn.dataset.bound) {
      dashLogoutBtn.addEventListener("click", handleLogout);
      dashLogoutBtn.dataset.bound = "true";
    }
  }
}

// ------------------------------------------------------------
// 4. Auth handlers (login.html)
// ------------------------------------------------------------
function bindLoginPageHandlers() {
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");
  const googleBtn = document.getElementById("google-login-btn");

  if (loginBtn && !loginBtn.dataset.bound) {
    loginBtn.addEventListener("click", handleLogin);
    loginBtn.dataset.bound = "true";
  }

  if (signupBtn && !signupBtn.dataset.bound) {
    signupBtn.addEventListener("click", handleSignup);
    signupBtn.dataset.bound = "true";
  }

  if (googleBtn && !googleBtn.dataset.bound) {
    googleBtn.addEventListener("click", handleGoogleLogin);
    googleBtn.dataset.bound = "true";
  }
}

function getLoginInputs() {
  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");
  const statusEl = document.getElementById("login-status");
  return { emailInput, passwordInput, statusEl };
}

async function handleLogin() {
  const { emailInput, passwordInput, statusEl } = getLoginInputs();
  if (!auth) {
    if (statusEl) statusEl.textContent = "Auth not initialised.";
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    if (statusEl) statusEl.textContent = "Please enter both email and password.";
    return;
  }

  try {
    statusEl && (statusEl.textContent = "Signing in...");
    await auth.signInWithEmailAndPassword(email, password);
    statusEl && (statusEl.textContent = "Signed in successfully. Redirecting...");
    setTimeout(() => (window.location.href = "index.html"), 800);
  } catch (e) {
    console.error("Login error:", e);
    statusEl && (statusEl.textContent = e.message || "Login failed.");
  }
}

async function handleSignup() {
  const { emailInput, passwordInput, statusEl } = getLoginInputs();
  if (!auth) {
    if (statusEl) statusEl.textContent = "Auth not initialised.";
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    if (statusEl) statusEl.textContent = "Please enter both email and password.";
    return;
  }

  try {
    statusEl && (statusEl.textContent = "Creating account...");
    await auth.createUserWithEmailAndPassword(email, password);
    statusEl && (statusEl.textContent = "Account created and signed in. Redirecting...");
    setTimeout(() => (window.location.href = "index.html"), 800);
  } catch (e) {
    console.error("Signup error:", e);
    statusEl && (statusEl.textContent = e.message || "Sign up failed.");
  }
}

async function handleGoogleLogin() {
  const statusEl = document.getElementById("login-status");
  if (!auth) {
    if (statusEl) statusEl.textContent = "Auth not initialised.";
    return;
  }

  try {
    statusEl && (statusEl.textContent = "Opening Google sign-in...");
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
    statusEl && (statusEl.textContent = "Signed in with Google. Redirecting...");
    setTimeout(() => (window.location.href = "index.html"), 800);
  } catch (e) {
    console.error("Google login error:", e);
    statusEl && (statusEl.textContent = e.message || "Google sign-in failed.");
  }
}

// ------------------------------------------------------------
// 5. Logout
// ------------------------------------------------------------
async function handleLogout() {
  if (!auth) return;
  try {
    await auth.signOut();
    // UI will update via onAuthStateChanged
  } catch (e) {
    console.error("Logout error:", e);
  }
}

// ------------------------------------------------------------
// 6. Optional: Save quiz results to Firestore
//    (Currently you already save to localStorage in app.js)
//    This is a helper you can call from app.js if desired.
// ------------------------------------------------------------
async function saveResultToFirestore(record) {
  if (!db || !auth) return;
  const user = auth.currentUser;
  if (!user) return;

  try {
    await db
      .collection("users")
      .doc(user.uid)
      .collection("quizHistory")
      .add(record);
  } catch (e) {
    console.error("Error saving to Firestore:", e);
  }
}

// ------------------------------------------------------------
// 7. Initialise everything on DOMContentLoaded
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initFirebase();

  if (auth) {
    auth.onAuthStateChanged(user => {
      updateAuthWidgets(user);
    });
  }

  // Only has effect on login.html (safe to call on other pages too)
  bindLoginPageHandlers();
});

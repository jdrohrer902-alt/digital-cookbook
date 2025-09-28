/* ---------- FIREBASE AUTH ---------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

/* ---------- FIREBASE CONFIG ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyAeWT-TYbQoLbIotXRJFadYpCYhg5dwQx8",
  authDomain: "digitalcookbook-4e267.firebaseapp.com",
  projectId: "digitalcookbook-4e267",
  storageBucket: "digitalcookbook-4e267.appspot.com",
  messagingSenderId: "473767352175",
  appId: "1:473767352175:web:17272117842f936f273a9a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/* ---------- DOM ELEMENTS ---------- */
const navSignup = document.getElementById("nav-signup");
const navLogin = document.getElementById("nav-login");
const profileDropdown = document.getElementById("profile-dropdown");
const profileBtn = document.getElementById("profile-btn");
const profileMenu = document.getElementById("profile-menu");
const profileLogout = document.getElementById("profile-logout");
const profileChangePass = document.getElementById("profile-change-password");
const profileDelete = document.getElementById("profile-delete-account");
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const forgotPasswordLogin = document.getElementById("forgot-password");

/* ---------- UI FUNCTIONS ---------- */
function showLoggedInUI(user) {
  if (navSignup) navSignup.style.display = "none";
  if (navLogin) navLogin.style.display = "none";
  if (profileDropdown) profileDropdown.style.display = "inline-flex";
  if (profileBtn) profileBtn.textContent = `👤 ${user.email} ▼`;

  // Dropdown toggle
  if (profileBtn && profileMenu && !profileBtn._listenerAdded) {
    profileBtn._listenerAdded = true;
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.style.display =
        profileMenu.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
      if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.style.display = "none";
      }
    });
  }
}

function showLoggedOutUI() {
  if (navSignup) navSignup.style.display = "inline-flex";
  if (navLogin) navLogin.style.display = "inline-flex";
  if (profileDropdown) profileDropdown.style.display = "none";
}

/* ---------- AUTH ACTIONS ---------- */

// SIGNUP
signupBtn?.addEventListener("click", async () => {
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  if (!email || !password) return alert("Enter email and password");

  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    alert(`Account created for ${user.email}`);
    showLoggedInUI(user);
    location.href = "index.html";
  } catch (err) {
    alert(err.message);
  }
});

// LOGIN
loginBtn?.addEventListener("click", async () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  if (!email || !password) return alert("Enter email and password");

  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    alert(`Logged in as ${user.email}`);
    showLoggedInUI(user);
    location.href = "index.html";
  } catch (err) {
    alert(err.message);
  }
});

// LOGOUT
profileLogout?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    alert("Logged out");
    showLoggedOutUI();
  } catch (err) {
    alert(err.message);
  }
});

// RESET PASSWORD (LOGIN PAGE)
forgotPasswordLogin?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  if (!email) return alert("Enter your email first");

  try {
    await sendPasswordResetEmail(auth, email);
    alert(`Password reset email sent to ${email}. Check your inbox.`);
  } catch (err) {
    alert("Error sending reset email: " + err.message);
  }
});

// RESET PASSWORD (PROFILE DROPDOWN)
profileChangePass?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("Not logged in");

  try {
    await sendPasswordResetEmail(auth, user.email);
    alert(`Password reset email sent to ${user.email}. Check your inbox.`);
  } catch (err) {
    alert("Error sending reset email: " + err.message);
  }
});

// DELETE ACCOUNT
profileDelete?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("Not logged in");

  if (!confirm("Are you sure? This cannot be undone.")) return;

  try {
    await deleteUser(user);
    alert("Account deleted");
    showLoggedOutUI();
    location.href = "index.html";
  } catch (err) {
    if (err.code === "auth/requires-recent-login") {
      const currentPass = prompt("Re-enter your current password:");
      if (!currentPass) return;
      try {
        const credential = EmailAuthProvider.credential(user.email, currentPass);
        await reauthenticateWithCredential(user, credential);
        await deleteUser(user);
        alert("Account deleted after re-authentication");
        showLoggedOutUI();
        location.href = "index.html";
      } catch (e) {
        alert("Failed: " + e.message);
      }
    } else {
      alert(err.message);
    }
  }
});

/* ---------- AUTH STATE LISTENER ---------- */
onAuthStateChanged(auth, (user) => {
  if (user) showLoggedInUI(user);
  else showLoggedOutUI();
});

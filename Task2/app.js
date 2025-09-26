// public/app.js
async function register() {
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value;
  const email = document.getElementById("signupEmail").value.trim();
  const phone = document.getElementById("signupPhone").value.trim();

  if (!username || !password) {
    alert("Username & password required");
    return;
  }

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email, phone }),
  });
  const data = await res.json();
  if (res.ok && data.success) {
    alert("Registered — please log in.");
    document.getElementById("signupUsername").value = "";
    document.getElementById("signupPassword").value = "";
    document.getElementById("signupEmail").value = "";
    document.getElementById("signupPhone").value = "";
  } else {
    alert("Register failed: " + (data.error || JSON.stringify(data)));
  }
}

async function login() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!username || !password) {
    alert("Provide username & password");
    return;
  }

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (res.ok && data.success) {
    localStorage.setItem("sokoban_user", JSON.stringify(data.user));
    alert("Login successful: " + data.user.username);
    afterLogin();
    loadLeaderboard();
  } else {
    alert("Login failed: " + (data.error || JSON.stringify(data)));
  }
}

function logout() {
  localStorage.removeItem("sokoban_user");
  const adminPanel = document.getElementById("admin-panel");
  if (adminPanel) adminPanel.style.display = "none";
  document.getElementById("loginUsername").value = "";
  document.getElementById("loginPassword").value = "";
  loadLeaderboard();
}

function afterLogin() {
  const user = JSON.parse(localStorage.getItem("sokoban_user") || "null");
  const adminPanel = document.getElementById("admin-panel");
  if (adminPanel) {
    // only show admin panel if user exists AND is admin
    if (user && user.role === "admin") {
      adminPanel.style.display = "block";
    } else {
      adminPanel.style.display = "none";
    }
  }
}

async function saveScore(moves, time) {
  const user = JSON.parse(localStorage.getItem("sokoban_user") || "null");
  if (!user) {
    alert("You must be logged in to save a score!");
    return;
  }

  try {
    const res = await fetch("/save-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user.username, moves, time }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error("Save score failed:", data.error);
    } else {
      console.log("✅ Score saved:", data);
      loadLeaderboard();
    }
  } catch (err) {
    console.error("Save score error", err);
  }
}
async function loadLeaderboard() {
  try {
    const res = await fetch("/leaderboard");
    if (!res.ok) {
      console.error("Leaderboard fetch failed:", res.status);
      return;
    }
    const rows = await res.json();
    const tbody = document.querySelector("#leaderboard tbody");
    tbody.innerHTML = "";
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.username}</td><td>${r.best_moves}</td><td>${r.best_time}</td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Load leaderboard error", err);
  }
}

function playGame() {
  const user = localStorage.getItem("sokoban_user");
  if (!user) {
    alert("Please login first!");
    return;
  }
  window.location.href = "sokoban.html";
}

// Admin UI
async function bootstrapAdmin() {
  const usernameInput = document.getElementById("bootstrapUsername");
  const username = usernameInput.value.trim();
  if (!username) return alert("Enter your username");
  const res = await fetch("/admin/bootstrap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const data = await res.json();
  if (res.ok && data.success) {
    const user = JSON.parse(localStorage.getItem("sokoban_user") || "null");
    if (user && user.username === username) {
      user.role = "admin";
      localStorage.setItem("sokoban_user", JSON.stringify(user));
      afterLogin();
    }
    alert("You are now admin.");
  } else {
    alert("Bootstrap failed: " + (data.error || JSON.stringify(data)));
  }
}

async function createPuzzle() {
  const layout = document.getElementById("puzzleLayout").value;
  const user = JSON.parse(localStorage.getItem("sokoban_user") || "null");
  if (!user || user.role !== "admin") return alert("Admin only");
  const res = await fetch("/admin/puzzles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user.username, layout }),
  });
  const data = await res.json();
  if (res.ok && data.success) {
    alert("Puzzle created.");
  } else {
    alert("Create puzzle failed: " + (data.error || JSON.stringify(data)));
  }
}

async function fetchLatestPuzzle() {
  const res = await fetch("/puzzles/latest");
  if (!res.ok) return null;
  return await res.json();
}
window.fetchLatestPuzzle = fetchLatestPuzzle;

// run on load
loadLeaderboard();
// only show admin panel if user is logged in and is admin
const user = JSON.parse(localStorage.getItem("sokoban_user") || "null");
if (user && user.role === "admin") {
  afterLogin();
} else {
  const adminPanel = document.getElementById("admin-panel");
  if (adminPanel) adminPanel.style.display = "none";
}

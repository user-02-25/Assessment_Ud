const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

const BUILD_INFO = {
  version: "v-admin-puzzles-1",
  leaderboardJoin:
    "JOIN users u ON u.id = COALESCE(scores.user_id, scores.userId)",
};

const db = new sqlite3.Database("./game.db");
db.serialize();
db.run("PRAGMA busy_timeout = 5000");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'player'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  moves INTEGER,
  time INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);

  db.run(`CREATE TABLE IF NOT EXISTS puzzles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    layout TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY(created_by) REFERENCES users(id)
  )`);

  // Ensure columns exist if the table was created previously without them
  db.all(`PRAGMA table_info(scores)`, [], (err, rows) => {
    if (err) {
      console.error("Failed to inspect scores schema:", err.message);
      return;
    }
    const columnNames = new Set(rows.map((r) => r.name));

    if (!columnNames.has("user_id")) {
      db.run(`ALTER TABLE scores ADD COLUMN user_id INTEGER`, (alterErr) => {
        if (alterErr)
          console.error("Failed adding user_id column:", alterErr.message);
      });
    }
    if (!columnNames.has("moves")) {
      db.run(`ALTER TABLE scores ADD COLUMN moves INTEGER`, (alterErr) => {
        if (alterErr)
          console.error("Failed adding moves column:", alterErr.message);
      });
    }
    if (!columnNames.has("time")) {
      db.run(`ALTER TABLE scores ADD COLUMN time INTEGER`, (alterErr) => {
        if (alterErr)
          console.error("Failed adding time column:", alterErr.message);
      });
    }
  });
});

// Middleware
app.use(bodyParser.json());

// Diagnostics
app.get("/__version", (req, res) => res.json(BUILD_INFO));
app.get("/__routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route && m.route.path) {
      const methods = Object.keys(m.route.methods)
        .filter((k) => m.route.methods[k])
        .map((k) => k.toUpperCase());
      routes.push({ path: m.route.path, methods });
    }
  });
  res.json(routes);
});

// link frontend files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.use(express.static(__dirname));

//Routes
// Register
app.post("/register", (req, res) => {
  const { username, password, email, phone } = req.body;
  db.run(
    `INSERT INTO users (username, password, email, phone, role) VALUES (?, ?, ?, ?, ?)`,
    [username, password, email, phone, "player"],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true, userId: this.lastID });
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    `SELECT * FROM users WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: "Invalid credentials" });
      res.json({ success: true, user: row });
    }
  );
});

// Save score
app.post("/save-score", (req, res) => {
  const { username, moves, time } = req.body;
  if (!username || moves == null || time == null) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  db.get(`SELECT id FROM users WHERE username = ?`, [username], (err, user) => {
    if (err || !user) {
      return res.status(400).json({ success: false, error: "User not found" });
    }

    db.run(
      `INSERT INTO scores (user_id, moves, time) VALUES (?, ?, ?)`,
      [user.id, moves, time],
      function (err) {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, scoreId: this.lastID });
      }
    );
  });
});

// Leaderboard
app.get("/leaderboard", (req, res) => {
  db.all(
    `
    SELECT 
        u.username, 
        MIN(scores.moves) as best_moves, 
        MIN(scores.time) as best_time
    FROM scores
    JOIN users u ON u.id = COALESCE(scores.user_id, scores.userId)
    GROUP BY u.username
    ORDER BY best_moves ASC, best_time ASC
    LIMIT 10
  `,
    [],
    (err, rows) => {
      if (err) {
        console.error("Leaderboard SQL Error:", err.message);
        return res
          .status(500)
          .json({ error: "Database Error: " + err.message });
      }
      res.json(rows);
    }
  );
});

//admin creates puzzle
app.post("/admin/puzzles", (req, res) => {
  const { username, layout } = req.body;

  if (!username || !layout) {
    return res
      .status(400)
      .json({ success: false, error: "Missing username or puzzle layout" });
  }

  //admin check
  db.get(
    `SELECT id, role FROM users WHERE username = ?`,
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Access denied. Admin privileges required.",
        });
      }

      //enter new puzzle layout
      db.run(
        `INSERT INTO puzzles (layout, created_by) VALUES (?, ?)`,
        [layout, user.id],
        function (insertErr) {
          if (insertErr) {
            return res
              .status(500)
              .json({ success: false, error: insertErr.message });
          }
          res.json({ success: true, puzzleId: this.lastID });
        }
      );
    }
  );
}); //admin bootstrap once
app.post("/admin/bootstrap", (req, res) => {
  const { username } = req.body || {};
  if (!username)
    return res.status(400).json({ success: false, error: "Missing username" });

  db.get(
    `SELECT COUNT(1) as cnt FROM users WHERE role = 'admin'`,
    [],
    (err, row) => {
      if (err)
        return res.status(500).json({ success: false, error: err.message });
      if (row && row.cnt > 0)
        return res
          .status(403)
          .json({ success: false, error: "Admin already exists" });

      db.run(
        `UPDATE users SET role = 'admin' WHERE username = ?`,
        [username],
        function (uErr) {
          if (uErr)
            return res
              .status(500)
              .json({ success: false, error: uErr.message });
          if (this.changes === 0)
            return res
              .status(404)
              .json({ success: false, error: "User not found" });
          res.json({ success: true });
        }
      );
    }
  );
});

//get admin's latest puzzle
app.get("/puzzles/latest", (req, res) => {
  db.get(
    `SELECT id, layout, created_at FROM puzzles ORDER BY datetime(created_at) DESC, id DESC LIMIT 1`,
    [],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.json(null);
      res.json(row);
    }
  );
});

//server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("Build:", BUILD_INFO);
});

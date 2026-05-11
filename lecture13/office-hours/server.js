const express = require("express");
const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, "office_hours.db");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let db;

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const d = new Date(value + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function timeToMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value || "");
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function validateOfficeHour({ day_of_week, start_time, end_time, slot_duration }) {
  const day = Number(day_of_week);
  const duration = Number(slot_duration ?? 15);
  const start = timeToMinutes(start_time);
  const end = timeToMinutes(end_time);

  if (!Number.isInteger(day) || day < 0 || day > 6) {
    return "day_of_week must be an integer between 0 and 6";
  }
  if (start == null || end == null) {
    return "start_time and end_time must use HH:MM 24-hour format";
  }
  if (end <= start) {
    return "end_time must be after start_time";
  }
  if (!Number.isInteger(duration) || duration <= 0) {
    return "slot_duration must be a positive integer";
  }
  if (duration > end - start) {
    return "slot_duration cannot be longer than the office-hours block";
  }

  return null;
}

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS office_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      slot_duration INTEGER NOT NULL DEFAULT 15,
      location TEXT DEFAULT ''
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      student_name TEXT NOT NULL,
      student_email TEXT DEFAULT '',
      topic TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(date, start_time)
    )
  `);

  saveDb();
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function runSql(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

// --- Office Hours CRUD ---

app.get("/api/office-hours", (req, res) => {
  const rows = queryAll("SELECT * FROM office_hours ORDER BY day_of_week, start_time");
  res.json(rows);
});

app.post("/api/office-hours", (req, res) => {
  const { day_of_week, start_time, end_time, slot_duration, location } = req.body;
  if (day_of_week == null || !start_time || !end_time) {
    return res.status(400).json({ error: "day_of_week, start_time, and end_time are required" });
  }

  const validationError = validateOfficeHour({ day_of_week, start_time, end_time, slot_duration });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const day = Number(day_of_week);
  const duration = Number(slot_duration ?? 15);

  db.run(
    "INSERT INTO office_hours (day_of_week, start_time, end_time, slot_duration, location) VALUES (?, ?, ?, ?, ?)",
    [day, start_time, end_time, duration, location || ""]
  );
  const row = queryAll("SELECT last_insert_rowid() as id")[0];
  saveDb();
  res.json({ id: row.id });
});

app.delete("/api/office-hours/:id", (req, res) => {
  runSql("DELETE FROM office_hours WHERE id = ?", [Number(req.params.id)]);
  res.json({ ok: true });
});

// --- Slots (computed from office_hours for a given week) ---

app.get("/api/slots", (req, res) => {
  const { week } = req.query;
  if (!week) return res.status(400).json({ error: "week query param required (YYYY-MM-DD of Monday)" });

  const monday = new Date(week + "T00:00:00");
  if (isNaN(monday.getTime())) return res.status(400).json({ error: "Invalid date" });

  const officeHours = queryAll("SELECT * FROM office_hours");
  const slots = [];

  for (const oh of officeHours) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + ((oh.day_of_week + 6) % 7));
    const dateStr = dayDate.toISOString().slice(0, 10);

    let [h, m] = oh.start_time.split(":").map(Number);
    const [endH, endM] = oh.end_time.split(":").map(Number);
    const endMinutes = endH * 60 + endM;

    while (h * 60 + m + oh.slot_duration <= endMinutes) {
      const slotStart = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      m += oh.slot_duration;
      if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
      const slotEnd = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      slots.push({
        date: dateStr,
        start_time: slotStart,
        end_time: slotEnd,
        location: oh.location,
        day_of_week: oh.day_of_week,
      });
    }
  }

  const mondayStr = monday.toISOString().slice(0, 10);
  const sundayStr = new Date(monday.getTime() + 6 * 86400000).toISOString().slice(0, 10);
  const bookings = queryAll(
    "SELECT * FROM bookings WHERE date BETWEEN ? AND ?",
    [mondayStr, sundayStr]
  );

  const bookingMap = {};
  for (const b of bookings) {
    bookingMap[`${b.date}_${b.start_time}`] = b;
  }

  const result = slots.map((s) => {
    const key = `${s.date}_${s.start_time}`;
    const booking = bookingMap[key];
    return { ...s, booking: booking || null };
  });

  res.json(result);
});

// --- Bookings CRUD ---

app.post("/api/bookings", (req, res) => {
  const { date, start_time, end_time, student_name, student_email, topic } = req.body;
  if (!date || !start_time || !end_time || !student_name) {
    return res.status(400).json({ error: "date, start_time, end_time, and student_name are required" });
  }

  const start = timeToMinutes(start_time);
  const end = timeToMinutes(end_time);
  if (!isValidDate(date) || start == null || end == null || end <= start) {
    return res.status(400).json({ error: "Invalid booking date or time" });
  }

  const bookingDate = new Date(date + "T00:00:00Z");
  const dayOfWeek = bookingDate.getUTCDay();
  const matchingSlot = queryAll(
    `SELECT 1
     FROM office_hours
     WHERE day_of_week = ?
       AND start_time <= ?
       AND end_time >= ?
       AND ((? - (CAST(substr(start_time, 1, 2) AS INTEGER) * 60 + CAST(substr(start_time, 4, 2) AS INTEGER))) % slot_duration) = 0
       AND (? - ?) = slot_duration
     LIMIT 1`,
    [dayOfWeek, start_time, end_time, start, end, start]
  )[0];

  if (!matchingSlot) {
    return res.status(400).json({ error: "Booking must match an available office-hours slot" });
  }

  try {
    db.run(
      "INSERT INTO bookings (date, start_time, end_time, student_name, student_email, topic) VALUES (?, ?, ?, ?, ?, ?)",
      [date, start_time, end_time, student_name, student_email || "", topic || ""]
    );
    const row = queryAll("SELECT last_insert_rowid() as id")[0];
    saveDb();
    res.json({ id: row.id });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ error: "This slot is already booked" });
    }
    throw err;
  }
});

app.delete("/api/bookings/:id", (req, res) => {
  runSql("DELETE FROM bookings WHERE id = ?", [Number(req.params.id)]);
  res.json({ ok: true });
});

// --- Start ---

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Office Hours app running at http://localhost:${PORT}`);
  });
});

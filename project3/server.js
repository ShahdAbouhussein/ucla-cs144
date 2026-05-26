const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const https = require('https');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const dbPath = path.join(__dirname, 'canvas.db');
for (const suffix of ['', '-shm', '-wal']) {
  try { fs.unlinkSync(dbPath + suffix); } catch {}
}
execSync('node init_db.js', { cwd: __dirname, stdio: 'inherit' });

const app = express();
const db = new Database(dbPath, { readonly: false });
db.pragma('journal_mode = WAL');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// TODO: Requests should only be accepted from trusted origins
app.use(cookieParser());
const JWT_SECRET = 'dev-secret';
const TRUSTED_ORIGINS = new Set([
  'https://localhost:3000',
  'https://127.0.0.1:3000',
]);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !TRUSTED_ORIGINS.has(origin)) {
    return res.status(403).json({ error: 'Untrusted origin' });
  }
  if (origin && TRUSTED_ORIGINS.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  }
  res.header('Content-Security-Policy', "default-src 'self'; script-src 'self'");
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function requireAuth(req, res, next) {
  try {
    req.user = jwt.verify(req.cookies.token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

function isStudentEnrolledInCourse(studentUid, courseId) {
  return !!db
    .prepare('SELECT 1 FROM student_courses WHERE student_uid = ? AND course_id = ?')
    .get(studentUid, courseId);
}

function isProfessorOfCourse(profUid, courseId) {
  return !!db
    .prepare('SELECT 1 FROM professor_courses WHERE professor_uid = ? AND course_id = ?')
    .get(profUid, courseId);
}

function canAccessCourse(user, courseId) {
  if (!user) return false;
  if (user.role === 'professor') return isProfessorOfCourse(user.uid, courseId);
  return isStudentEnrolledInCourse(user.uid, courseId);
}
// TODO: The browser should not execute any scripts that are not in a source file
app.use(express.static(path.join(__dirname, 'public')));

// Login
// TODO: Only a user with the correct password should be able to log in
// TODO: The server should know who is making each request
app.post('/api/login', (req, res) => {
  const { uid, password } = req.body;

  const user = db.prepare('SELECT uid, name, password, role FROM login WHERE uid = ?').get(uid);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid UID or password' });
  }

  const token = jwt.sign({ uid: user.uid, name: user.name, role: user.role }, JWT_SECRET);
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  });
  res.json({ uid: user.uid, name: user.name, role: user.role });
});

// Get enrolled courses
// TODO: Query the student_courses denormalized table instead
// TODO: Students should only be able to see their own courses
app.get('/api/students/:uid/courses', requireAuth, (req, res) => {
  if (req.user.uid !== req.params.uid) return res.status(403).json({ error: 'Forbidden' });
  const rows = db.prepare(`
    SELECT course_id, code AS course_code, title AS course_title, instructor
    FROM student_courses
    WHERE student_uid = ?
  `).all(req.params.uid);
  res.json(rows);
});

// Get course content
// TODO: Query the course_content denormalized table instead
app.get('/api/courses/:courseId/content', requireAuth, (req, res) => {
  if (!canAccessCourse(req.user, req.params.courseId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const rows = db.prepare(`
    SELECT
      week_id, 
      week_title,
      week_sort_order AS week_sort,
      entry_id,
      entry_title,
      entry_type,
      entry_url,
      entry_sort_order AS entry_sort
    FROM course_content
    WHERE course_id = ?
    ORDER BY week_sort_order, entry_sort_order
  `).all(req.params.courseId);
  res.json(rows);
});

// Get courses taught by a professor
// TODO: Query the professor_courses denormalized table instead
app.get('/api/professors/:uid/courses', requireAuth, (req, res) => {
  if (req.user.uid !== req.params.uid || req.user.role !== 'professor') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const rows = db.prepare(`
    SELECT course_id, code AS course_code, title AS course_title, instructor 
    FROM professor_courses
    WHERE professor_uid = ?
  `).all(req.params.uid);
  res.json(rows);
});

// Get enrolled students for a course
// TODO: Query the course_students denormalized table instead
app.get('/api/courses/:courseId/students', requireAuth, (req, res) => {
  if (req.user.role !== 'professor' || !isProfessorOfCourse(req.user.uid, req.params.courseId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const rows = db.prepare(`
    SELECT uid, name
    FROM course_students
    WHERE course_id = ?
    ORDER BY name
  `).all(req.params.courseId);
  res.json(rows);
});

// Get grades for a student in a course
// TODO: Query the student_grades denormalized table instead
// TODO: Students should only be able to see their own grades
app.get('/api/students/:uid/courses/:courseId/grades', requireAuth, (req, res) => {
  const { uid, courseId } = req.params;
  if (req.user.role === 'professor') {
    if (!isProfessorOfCourse(req.user.uid, courseId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else {
    if (req.user.uid !== uid) return res.status(403).json({ error: 'Forbidden' });
    if (!isStudentEnrolledInCourse(uid, courseId)) return res.status(403).json({ error: 'Forbidden' });
  }

  const rows = db.prepare(`
    SELECT grade_id, assignment_id, assignment_name, score
    FROM student_grades
    WHERE login_uid = ? AND course_id = ?
  `).all(req.params.uid, req.params.courseId);
  res.json(rows);
});

// Search course materials
// TODO: User input should not be able to execute arbitrary commands on the server
app.get('/api/search', requireAuth, (req, res) => {
  const query = String(req.query.q || '').toLowerCase();
  const files = [];
  for (const file of fs.readdirSync(path.join(__dirname, 'public'))) {
    const fullPath = path.join(__dirname, 'public', file);
    if (fs.statSync(fullPath).isFile()) {
      const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
      if (content.includes(query)) files.push(`public/${file}`);
    }
  }
  res.json({ files });
});
// Update grades
// TODO: Also update the corresponding denormalized table
// TODO: Only a professor should be able to change grades
app.post('/api/grades', requireAuth, (req, res) => {
  if (req.user.role !== 'professor') return res.status(403).json({ error: 'Forbidden' });
  const { grades } = req.body;
  const getCourseForGrade = db.prepare('SELECT course_id FROM student_grades WHERE grade_id = ?');
  const updateNormalizedTable = db.prepare('UPDATE grade SET score = ? WHERE id = ?');
  const updateDenormalizedTable = db.prepare('UPDATE student_grades SET score = ? WHERE grade_id = ?');
  const tx = db.transaction(() => {
    for (const g of grades) {
      const row = getCourseForGrade.get(g.grade_id);
      if (!row || !isProfessorOfCourse(req.user.uid, row.course_id)) {
        throw new Error('Forbidden');
      }
      updateNormalizedTable.run(g.score, g.grade_id);
      updateDenormalizedTable.run(g.score, g.grade_id);
    }
  });
  try {
    tx();
    res.json({ success: true });
  } catch (e) {
    if (String(e && e.message) === 'Forbidden') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    throw e;
  }
});

// TODO: The connection between the browser and the server should be encrypted
const PORT = process.env.PORT || 3000;
const server = https.createServer({
  key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'localhost.pem'))
}, app).listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});

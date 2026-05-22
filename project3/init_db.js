const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'canvas.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE login (
    uid TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student'
  );

  CREATE TABLE course (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    instructor TEXT NOT NULL,
    professor_uid TEXT,
    FOREIGN KEY (professor_uid) REFERENCES login(uid)
  );

  CREATE TABLE enrollment (
    login_uid TEXT NOT NULL,
    course_id INTEGER NOT NULL,
    PRIMARY KEY (login_uid, course_id),
    FOREIGN KEY (login_uid) REFERENCES login(uid),
    FOREIGN KEY (course_id) REFERENCES course(id)
  );

  CREATE TABLE week (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    FOREIGN KEY (course_id) REFERENCES course(id)
  );

  CREATE TABLE entry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('slides', 'recording')),
    url TEXT NOT NULL DEFAULT '#',
    sort_order INTEGER NOT NULL,
    FOREIGN KEY (week_id) REFERENCES week(id)
  );

  CREATE TABLE assignment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    FOREIGN KEY (course_id) REFERENCES course(id)
  );

  CREATE TABLE grade (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login_uid TEXT NOT NULL,
    assignment_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    UNIQUE(login_uid, assignment_id),
    FOREIGN KEY (login_uid) REFERENCES login(uid),
    FOREIGN KEY (assignment_id) REFERENCES assignment(id)
  );
`);

const seed = db.transaction(() => {
  // TODO: If an attacker gained access to the database, they should not be able to read passwords
  const insertLogin = db.prepare('INSERT INTO login (uid, name, password, role) VALUES (?, ?, ?, ?)');
  insertLogin.run('123456789', 'Alice Johnson', 'alice123', 'student');
  insertLogin.run('987654321', 'Bob Smith', 'bob456', 'student');
  insertLogin.run('555123456', 'Charlie Davis', 'charlie789', 'student');
  insertLogin.run('profrosario', 'Rosario', 'bruin', 'professor');

  const insertCourse = db.prepare('INSERT INTO course (code, title, instructor, professor_uid) VALUES (?, ?, ?, ?)');
  insertCourse.run('COM SCI 35L', 'Software Construction', 'Deuerschmidt', null);
  insertCourse.run('COM SCI 144', 'Web Applications', 'Rosario', 'profrosario');
  insertCourse.run('COM SCI 130', 'Software Engineering', 'Deuerschmidt', null);
  insertCourse.run('CS 33', 'Introduction to Computer Organization', 'Batista', null);
  insertCourse.run('CS 131', 'Programming Languages', 'Eggert', null);

  const courses = db.prepare('SELECT id, code FROM course ORDER BY id').all();

  const insertEnrollment = db.prepare('INSERT INTO enrollment (login_uid, course_id) VALUES (?, ?)');
  const enrollments = [
    ['123456789', [0, 1, 3]],
    ['987654321', [1, 2, 4]],
    ['555123456', [0, 3, 4]],
  ];
  for (const [uid, cis] of enrollments) {
    for (const ci of cis) insertEnrollment.run(uid, courses[ci].id);
  }

  const insertWeek = db.prepare('INSERT INTO week (course_id, title, sort_order) VALUES (?, ?, ?)');
  const insertEntry = db.prepare('INSERT INTO entry (week_id, title, type, url, sort_order) VALUES (?, ?, ?, ?, ?)');

  for (const course of courses) {
    const genWeek = insertWeek.run(course.id, 'General Information', 0);
    const genWeekId = genWeek.lastInsertRowid;
    insertEntry.run(genWeekId, 'Course Introduction Slides', 'slides', '#', 1);
    insertEntry.run(genWeekId, 'Course Introduction Recording', 'recording', '#', 2);
    insertEntry.run(genWeekId, 'Syllabus Overview Slides', 'slides', '#', 3);
    insertEntry.run(genWeekId, 'Syllabus Overview Recording', 'recording', '#', 4);

    let lectureNum = 1;
    for (let w = 1; w <= 10; w++) {
      const week = insertWeek.run(course.id, `Week ${w}`, w);
      const weekId = week.lastInsertRowid;
      for (let lec = 0; lec < 2; lec++) {
        insertEntry.run(weekId, `Lecture ${lectureNum} Slides`, 'slides', '#', lectureNum * 10 + 1);
        insertEntry.run(weekId, `Lecture ${lectureNum} Recording`, 'recording', '#', lectureNum * 10 + 2);
        lectureNum++;
      }
    }
  }

  const insertAssignment = db.prepare('INSERT INTO assignment (course_id, name, sort_order) VALUES (?, ?, ?)');
  for (const c of courses) {
    insertAssignment.run(c.id, 'Midterm', 1);
    insertAssignment.run(c.id, 'Final Exam', 2);
  }

  const insertGrade = db.prepare('INSERT INTO grade (login_uid, assignment_id, score) VALUES (?, ?, ?)');
  const allEnrollments = db.prepare('SELECT login_uid, course_id FROM enrollment').all();
  const allAssignments = db.prepare('SELECT id, course_id FROM assignment').all();

  for (const enr of allEnrollments) {
    const courseAssignments = allAssignments.filter(a => a.course_id === enr.course_id);
    for (const a of courseAssignments) {
      const score = Math.floor(Math.random() * 41) + 60;
      insertGrade.run(enr.login_uid, a.id, score);
    }
  }
});

seed();

// --- Part 1: Denormalized Tables ---
// TODO: Create the student_courses denormalized table
// Given a student's UID, returns the courses they are enrolled in (course ID, code, title, and instructor). 
// Your denormalized table should map each student directly to their enrolled course information.
db.exec(` 
  CREATE TABLE student_courses AS
  SELECT 
    login.uid AS student_uid,
    login.name AS student_name,
    course.id AS course_id,
    course.code,
    course.title,
    course.instructor
  FROM login
  JOIN enrollment
    ON login.uid = enrollment.login_uid
  JOIN course 
    ON enrollment.course_id = course.id
  WHERE login.role = 'student';
`)
  

// TODO: Create the professor_courses denormalized table
// Given a professor's UID, returns the courses they teach (course ID, code, title, and instructor).
db.exec(`
  CREATE TABLE professor_courses AS
  SELECT 
    login.uid AS professor_uid,
    login.name AS professor_name,
    course.id AS course.id,
    course.code,
    course.title,
    course.instructor
  FROM login 
  JOIN course 
    ON login.uid = course.professor_uid
  WHERE login.role = 'professor';
`)

// TODO: Create the course_content denormalized table
// Given a course ID, returns all weekly modules and their entries. Each row contains the week ID, 
// week title, week sort order, entry ID, entry title, entry type, entry URL, and entry sort order.
db.exec(`
  CREATE TABLE course_content AS
  SELECT
    week.course_id,
    week.id AS week_id,
    week.title AS week_title,
    week.sort_order AS week_sort_order,
    entry.id AS entry_id,
    entry.title AS entry_title,
    entry.type AS entry_type,
    entry.url AS entry_url,
    entry.sort_order AS entry_sort_order
  FROM week
  JOIN entry
    ON week.id = entry.week_id;
`);

// TODO: Create the course_students denormalized table
// Given a course ID, returns the students enrolled in that course (UID and name).
db.exec(`
  CREATE TABLE course_students AS
  SELECT
    enrollment.course_id,
    login.uid,
    login.name
  FROM enrollment
  JOIN login
    ON enrollment.login_uid = login.uid;
`);

// TODO: Create the student_grades denormalized table
// Given a student's UID and a course ID, returns their assignment grades. Each row 
// contains the grade ID, assignment ID, assignment name, and score.
db.exec(`
  CREATE TABLE student_grades AS
  SELECT
    grade.id AS grade_id,
    grade.login_uid,
    assignment.course_id,
    assignment.id AS assignment_id,
    assignment.name AS assignment_name,
    grade.score
  FROM grade
  JOIN assignment
    ON grade.assignment_id = assignment.id;
`)  


// TODO: Make searching the data in each denormalized table more efficient
db.exec(`
  CREATE INDEX student_courses_index
  ON student_courses(login_uid);

  CREATE INDEX professor_courses_index
  ON professor_courses(professor_uid);

  CREATE INDEX course_content_index
  ON course_content(course_id);

  CREATE INDEX course_students_index
  ON course_students(course_id);

  CREATE INDEX student_grades_index
  ON student_grades(login_uid, course_id);
`);

console.log('Database initialized successfully.');
db.close();

# Questions

Answer each question below. Replace the blank lines with your response.

## Part 1: Database Optimization

**1. In general, writes such as changing grades should only occur on the smaller normalized tables. Explain why. Since SQLite does not support materialized views, we write to both the normalized and denormalized tables instead. What problem(s) could this introduce?**

Because there is only one normalized table, any change requires just one update, which eliminates chances of error because you cannot accidentally miss updating another table that contains the same variable. This makes normalized tables ideal for writes.
Since SQLite does not support materialized views, writing to both tables manually could introduce stale data in either the denormalized or normalized table, because one table may successfully update a value while the other does not. Now the two tables disagree, and you would get different values depending on which table you query.

**2. For each denormalized table you created, explain why you chose that specific set of columns. Why not include additional columns that might be useful later?**

In the project, the point of each denormalized table we created was that they would only contain the columns needed by the corresponding API. This keeps the tables smaller and therefore more efficient for read queries, since there is no unnecessary scanning or storing of extra data. When we add more columns for potential future use, it adds overhead that counters the benefits of denormalization and increases data duplication, ultimately making writes more costly because we are updating the same data in multiple places.

**3. Why not skip denormalization and just add indexes to the normalized tables?**

Adding indexes to a normalized table doesn't remove the fact that at query time you would still have to perform the original join operations to find the needed data, and as the amount of data increases, these joins become more costly. This is avoided with denormalized tables because the data of interest for each API/view is already precomputed, which reduces query complexity and improves performance times and costs.

**4. Which users should be able to read which data? Which users should be able to write which data? For each API endpoint, describe who should have access and what kind of access they should have.**

POST /api/login - anyone should be able to attempt a login, but only users with the correct UID and password should have access

GET /api/students/:uid/courses - only the student whose UID matches :uid should have read access to that student dashboard and enrolled courses

GET /api/professors/:uid/courses - only the professor whose UID matches :uid should have read access to that professor dashboard and the courses they teach

GET /api/courses/:courseId/content - only students enrolled in that course and the professor teaching that course should have read access to the course content

GET /api/courses/:courseId/students - only the professor teaching that course should have read access to the roster of students enrolled in that course

GET /api/students/:uid/courses/:courseId/grades - only the student whose UID matches :uid and the professor teaching that course should have read access to those grades

POST /api/grades - only the professor teaching the course should have write access to modify grades for students in that course

## Part 2: Security

For each vulnerability, describe in your own words: (1) what the security hole is and what it allows an attacker to do, and (2) how you fixed it and why your fix works.

**HTTPS:**
- security hole: server used unencrypted HTTP
- attacker advantage: attackers on the network could intercept/modify traffic, which includes logins and tokens
- fix: configured the server to use HTTPS using mkcert certificates (mkcert -install and mkcert localhost), and the HTTPS will encrypt communication between the browser and server

**SQL Injection:**
- security hole: login route inserted user input directly into SQL queries, 
- attacker advantage: manipilate queries or bypass the login entirely 
- fix: replaced string interpolation with paramterized queries using ? placeholders so input is treated as data instead of code 

**Command Injection:**
- security hole: search endpoint passed user input directly into shell commands
- attacker advantage: execute arbitrary commands 
- fix: rewrote the search endpoint to use filesystem functions (readdir/readFile) to scan files directly, so user input is never executed by a shell

**Cross-Site Scripting (XSS):**
- security hole: server data was inserted into innerHTML without escapes
- attacker advantage: inject malicious JS into web pages
- fix: escaping HTML characters before rendering server data and adding a CSP header to block unauthorized scripts  

**Broken Authentication:**
- security hole: passwords were stored in plaintext so the server had no way of identifying logged-in users
- attacker advantage: if got access to database could read all user passwords and impersonate users since requests arent tied to a session
- fix: hashed passwords using bcrypt and added JWT authentication in HttpOnly, secure, samesite cookies 

**Broken Access Control:**
- security hole: API endpoints did not verify the requester’s UID or role before returning/modifying data
- attacker advantage: could change URL parameters to view another user’s data or perform actions perftained to a certain role like a professor editing grades
- fix: added checks to verify the authenticated user’s uid and role before returning/modifying data

**Cross-Site Request Forgery (CSRF):**
- security hole: app accepted requests from untrusted origins and used cookies for authentication
- attacker advantage: trick a logged-in user’s browser into sending unwanted authenticated requests
- fix: restricted trusted origins, validated request origins, and used SameSite cookies to block unauthorized cross-site request

**Dependency Vulnerabilities:**
- security hole: some dependencies had known security vulnerabilities
- attacker advantage: potentially exploit those known package vulnerabilities
- fix: ran `npm audit fix --force`, which updated vulnerable packages, including a major update to `jsonwebtoken`

## Part 3: React

**5. Where does the expanded/collapsed state for each module live in your component hierarchy? Why did you put it there?**
The state is in each moduleSection component as a local state since these collapsables are connected to their respective module, and so keeping to a local scope so that the parent component doesnt need to manage all toggle states

**6. What did React make easier compared to the vanilla JavaScript implementation? What did it make harder?**

Easier:
- reusable components,  since pieces could be reused for every week and entry instead of rewriting the same HTML and event logic multiple times 
- keeping the UI in sync with collapsed state without manually updating DOM elements

Harder:
- harder setup because JSX needed to be compiled with esbuild, so had to mount the React bundle back into the existing vanilla JavaScript application

## Part 4: Responsive Design

**7. For each media query breakpoint, explain why you chose that specific cutoff value and what layout or usability problem it solves. Describe the changes you made at each breakpoint in terms of the user experience (e.g. "the sidebar collapses into a hamburger menu because there isn't enough horizontal space to show it alongside the content"), not just the CSS properties you changed.**

**Breakpoint 1 — 768px (iPad standard portrait)**
- 768px matches the iPad 9th gen portrait viewport exactly, making it the natural tablet/desktop boundary
- sidebar narrows from 240px to 200px since it still fits but wastes proportional space, giving the main content more room
- dashboard card grid shrinks its minimum width so cards don't stretch awkwardly
- login card's top margin shrinks since tablets have less vertical depth than desktops
- professor grades table drops its max-width cap so it fills available width instead of sitting in a narrow column with empty space on either side

**Breakpoint 2 — 480px (Google Pixel 10, ~412px CSS width)**
- 480px safely catches the Pixel 10 (~412px) and similar phones without triggering too early on larger phablets
- on the course screen, a 240px sidebar would leave only ~172px for content making text unreadable and links impossible to tap, so it collapses into a horizontal nav bar pinned at the top with back, course code, and modules/grades tabs in one row
- per-module jump links are hidden since desktop-style scrolling isn't useful on mobile
- dashboard drops to single-column so each course card is full-width and tappable
- login form extends to fill the screen with side margins instead of floating in a box
- top bar hides the greeting since phones can't fit a username and logout button at readable size
- buttons, inputs, and table cells get min 44px touch targets
- "PWNED!" title shrinks from 64px to 32px so it doesn't overflow the narrowed box


**8. If you used AI for this part, what did you prompt it with, and what did you have to fix or adjust by hand?**
Prompt:
Please make the app responsive with minimal changes.

Requirements:
- Replace fixed pixel dimensions that prevent responsiveness with relative units like %, rem, vw, min(), max(), or clamp().
- Keep pixel values only where they are harmless, like borders, shadows, or tiny icons.
- Dashboard course images must scale with relative widths and not be fixed-size.
- Add exactly two meaningful media query breakpoints:
  1. Tablet breakpoint for iPad standard size around 768px wide.
  2. Phone breakpoint for Google Pixel 10 size.
- At each breakpoint, make real usability changes, not just tiny style tweaks. For example: adjust grids, collapse/reflow sidebar/content layout, resize typography, improve tap targets, prevent overflow.
- All views must remain usable: login, student dashboard, professor dashboard, course modules, grades, and roster.
- Text should stay readable, buttons tappable, and no content should overflow or get clipped.

Please inspect the existing HTML/CSS/JS structure first, then update only the CSS and minimal JS if truly needed. Do not rewrite unrelated functionality. After changes, summarize:
1. Which fixed sizes you replaced.
2. What each breakpoint does.

Upon rechecking the AI work, it had done everything right so I did not go in to fix anything.
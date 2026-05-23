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


**SQL Injection:**


**Command Injection:**


**Cross-Site Scripting (XSS):**


**Broken Authentication:**


**Broken Access Control:**


**Cross-Site Request Forgery (CSRF):**


**Dependency Vulnerabilities:**





## Part 3: React

**5. Where does the expanded/collapsed state for each module live in your component hierarchy? Why did you put it there?**



**6. What did React make easier compared to the vanilla JavaScript implementation? What did it make harder?**



## Part 4: Responsive Design

**7. For each media query breakpoint, explain why you chose that specific cutoff value and what layout or usability problem it solves. Describe the changes you made at each breakpoint in terms of the user experience (e.g. "the sidebar collapses into a hamburger menu because there isn't enough horizontal space to show it alongside the content"), not just the CSS properties you changed.**



**8. If you used AI for this part, what did you prompt it with, and what did you have to fix or adjust by hand?**


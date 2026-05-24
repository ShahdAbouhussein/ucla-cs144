function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadStudentGrades(course) {
  const res = await fetch(`/api/students/${currentStudent.uid}/courses/${course.course_id}/grades`);
  const grades = await res.json();

  const container = document.getElementById('modules-container');

  // TODO: Data from the server should be safe to render in the page
  let rowsHtml = '';
  let totalScore = 0;
  
  for (const g of grades) {
    rowsHtml += `
      <tr>
            <td>${escapeHTML(g.assignment_name)}</td>
            <td>${escapeHTML(g.score)}</td>
        <td>100</td>
            <input type="hidden" name="grade_${escapeHTML(g.grade_id)}" value="${escapeHTML(g.score)}">
      </tr>`;
    totalScore += g.score;
  }

  const finalGrade = grades.length > 0 ? (totalScore / grades.length).toFixed(1) : '0.0';
  const letter = letterGrade(parseFloat(finalGrade));

  container.innerHTML = `
    <div class="grades-container">
      <table class="grades-table">
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Score</th>
            <th>Out Of</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}
        </tbody>
        <tfoot>
          <tr class="final-row">
            <td><strong>Final Grade</strong></td>
            <td><strong>${finalGrade}</strong></td>
            <td><strong>100</strong></td>
          </tr>
          <tr class="letter-row">
            <td><strong>Letter Grade</strong></td>
            <td colspan="2"><strong class="letter-${letter}">${letter}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}

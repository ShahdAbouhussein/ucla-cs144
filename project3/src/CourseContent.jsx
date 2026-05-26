import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const SLIDES_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const RECORDING_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

function MaterialLink({ entry }) {
  const icon = entry.type === 'slides' ? SLIDES_ICON : RECORDING_ICON;
  const iconClass = entry.type === 'slides' ? 'icon-slides' : 'icon-recording';

  return (
    <a href={entry.url} className="material-link">
      <span className={`material-icon ${iconClass}`}>{icon}</span>
      <span>{entry.title}</span>
    </a>
  );
}

function ModuleSection({ week }) {
  const [collapsed, setCollapsed] = useState(false);
  const sortedEntries = [...week.entries].sort((a, b) => a.sort - b.sort);

  return (
    <div className="module-section" id={`week-${week.id}`}>
      <div
        className={`module-header ${collapsed ? 'collapsed' : ''}`}
        onClick={() => setCollapsed(!collapsed)}
      >
        <h3>{week.title}</h3>
        <span className="module-toggle">▼</span>
      </div>

      <div className={`module-body ${collapsed ? 'collapsed' : ''}`}>
        <div className="lecture-group">
          {sortedEntries.map(entry => (
            <MaterialLink key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CourseContent({ weeks }) {
  const sortedWeeks = [...weeks].sort((a, b) => a.sort - b.sort);
  return (
    <>
      {sortedWeeks.map(week => (
        <ModuleSection key={week.id} week={week} />
      ))}
    </>
  );
}

window.renderCourseContent = function renderCourseContent(weeks) {
  const container = document.getElementById('modules-container');
  const root = createRoot(container);
  root.render(<CourseContent weeks={weeks} />);
};

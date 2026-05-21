export default function Header({ onToggleSettings, onGoToToday }) {
  return (
    <header>
      <h1>Office Hours</h1>
      <div className="header-actions">
        <button className="btn btn-secondary" onClick={onToggleSettings}>
          Settings
        </button>
        <button className="btn btn-secondary" onClick={onGoToToday}>
          Today
        </button>
      </div>
    </header>
  );
}

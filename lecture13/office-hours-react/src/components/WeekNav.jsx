export default function WeekNav({ currentMonday, onChangeWeek }) {
  const end = new Date(currentMonday);
  end.setDate(end.getDate() + 6);
  const opts = { month: "long", day: "numeric", year: "numeric" };
  const label = `${currentMonday.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;

  return (
    <div className="week-nav">
      <button className="btn btn-secondary" onClick={() => onChangeWeek(-1)}>
        &larr; Prev
      </button>
      <h2>{label}</h2>
      <button className="btn btn-secondary" onClick={() => onChangeWeek(1)}>
        Next &rarr;
      </button>
    </div>
  );
}

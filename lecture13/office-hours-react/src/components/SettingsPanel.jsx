import { useState } from "react";
import { DAY_NAMES, fmtTime12 } from "../utils.js";

export default function SettingsPanel({ officeHours, onAdd, onDelete }) {
  const [day, setDay] = useState(1);
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("12:00");
  const [duration, setDuration] = useState(15);

  function handleAdd() {
    onAdd({
      day_of_week: day,
      start_time: start,
      end_time: end,
      slot_duration: duration,
    });
  }

  return (
    <div className="settings-panel active">
      <h3>Office Hours Schedule</h3>
      <div className="oh-list">
        {officeHours.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
            No office hours configured. Add some below.
          </p>
        ) : (
          officeHours.map((h) => (
            <div className="oh-item" key={h.id}>
              <strong>{DAY_NAMES[h.day_of_week]}</strong>
              <span>
                {fmtTime12(h.start_time)} &ndash; {fmtTime12(h.end_time)}
              </span>
              <span style={{ color: "#64748b" }}>({h.slot_duration} min slots)</span>
              {h.location && <span style={{ color: "#64748b" }}>{h.location}</span>}
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onDelete(h.id)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
      <div className="oh-form">
        <div>
          <label>Day</label>
          <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
            <option value={0}>Sunday</option>
            <option value={1}>Monday</option>
            <option value={2}>Tuesday</option>
            <option value={3}>Wednesday</option>
            <option value={4}>Thursday</option>
            <option value={5}>Friday</option>
            <option value={6}>Saturday</option>
          </select>
        </div>
        <div>
          <label>Start</label>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label>End</label>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div>
          <label>Slot (min)</label>
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={60}>60</option>
          </select>
        </div>
        <div>
          <label>&nbsp;</label>
          <button className="btn btn-primary" onClick={handleAdd}>Add</button>
        </div>
      </div>
    </div>
  );
}

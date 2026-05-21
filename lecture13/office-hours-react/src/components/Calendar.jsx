import { DAY_SHORT, fmtDate, fmtDateShort, fmtTime12 } from "../utils.js";
import SlotCell from "./SlotCell.jsx";

export default function Calendar({ currentMonday, slots, onSlotClick }) {
  if (slots.length === 0) {
    return (
      <div className="no-slots-msg">
        No office hours this week. Open <strong>Settings</strong> to add your schedule.
      </div>
    );
  }

  const timeSet = new Set();
  for (const s of slots) {
    timeSet.add(s.start_time);
  }
  const times = [...timeSet].sort();

  const today = fmtDate(new Date());

  const slotMap = {};
  for (const s of slots) {
    slotMap[`${s.date}_${s.start_time}`] = s;
  }

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  return (
    <div className="calendar">
      {/* Header row */}
      <div className="cal-header corner" />
      {days.map((d) => {
        const isToday = fmtDate(d) === today;
        return (
          <div
            className={`cal-header${isToday ? " today-marker" : ""}`}
            key={fmtDate(d)}
          >
            {DAY_SHORT[d.getDay()]}
            <span className="day-date">{fmtDateShort(d)}</span>
          </div>
        );
      })}

      {/* Time rows */}
      {times.map((time) => (
        <TimeRow
          key={time}
          time={time}
          days={days}
          today={today}
          slotMap={slotMap}
          onSlotClick={onSlotClick}
        />
      ))}
    </div>
  );
}

function TimeRow({ time, days, today, slotMap, onSlotClick }) {
  return (
    <>
      <div className="time-label">{fmtTime12(time)}</div>
      {days.map((d) => {
        const dateStr = fmtDate(d);
        const key = `${dateStr}_${time}`;
        const slot = slotMap[key];
        const isToday = dateStr === today;
        return (
          <div className={`cal-cell${isToday ? " today-marker" : ""}`} key={key}>
            {slot && <SlotCell slot={slot} onClick={() => onSlotClick(slot)} />}
          </div>
        );
      })}
    </>
  );
}

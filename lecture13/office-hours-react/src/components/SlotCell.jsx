import { fmtTime12 } from "../utils.js";

export default function SlotCell({ slot, onClick }) {
  if (slot.booking) {
    return (
      <button type="button" className="slot booked" onClick={onClick}>
        <span className="slot-name">{slot.booking.student_name}</span>
        <span className="slot-time">{fmtTime12(slot.start_time)}</span>
      </button>
    );
  }

  return (
    <button type="button" className="slot available" onClick={onClick}>
      <span className="slot-time">{fmtTime12(slot.start_time)}</span>
      <span style={{ fontSize: "0.65rem" }}>Available</span>
    </button>
  );
}

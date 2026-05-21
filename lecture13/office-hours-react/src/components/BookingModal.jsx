import { useState } from "react";
import { DAY_NAMES, fmtTime12 } from "../utils.js";

export default function BookingModal({ slot, onClose, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");

  const dayName = DAY_NAMES[new Date(slot.date + "T00:00:00").getDay()];
  const timeLabel = fmtTime12(slot.start_time);
  const isBooked = !!slot.booking;

  function handleSubmit() {
    if (!name.trim()) {
      alert("Student name is required.");
      return;
    }
    onSubmit({
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      student_name: name.trim(),
      student_email: email.trim(),
      topic: topic.trim(),
    });
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay active" onClick={handleOverlayClick}>
      <div className="modal">
        <h3>
          {isBooked ? "" : "Book: "}
          {dayName} {slot.date} at {timeLabel}
        </h3>

        {isBooked ? (
          <BookingDetail booking={slot.booking} />
        ) : (
          <BookingForm
            name={name}
            email={email}
            topic={topic}
            onNameChange={setName}
            onEmailChange={setEmail}
            onTopicChange={setTopic}
          />
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {isBooked ? (
            <button
              className="btn btn-danger"
              onClick={() => onCancel(slot.booking.id)}
            >
              Cancel Booking
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit}>
              Book
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingDetail({ booking }) {
  return (
    <div className="booking-detail">
      <p>
        <span className="label">Student:</span> {booking.student_name}
      </p>
      {booking.student_email && (
        <p>
          <span className="label">Email:</span> {booking.student_email}
        </p>
      )}
      {booking.topic && (
        <p>
          <span className="label">Topic:</span> {booking.topic}
        </p>
      )}
      <p>
        <span className="label">Booked:</span>{" "}
        {new Date(booking.created_at).toLocaleString()}
      </p>
    </div>
  );
}

function BookingForm({ name, email, topic, onNameChange, onEmailChange, onTopicChange }) {
  return (
    <div>
      <label>Student Name *</label>
      <input
        type="text"
        placeholder="e.g. Jane Smith"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        autoFocus
      />
      <label>Email</label>
      <input
        type="email"
        placeholder="e.g. jane@university.edu"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
      />
      <label>Topic</label>
      <textarea
        placeholder="What do they need help with?"
        value={topic}
        onChange={(e) => onTopicChange(e.target.value)}
      />
    </div>
  );
}

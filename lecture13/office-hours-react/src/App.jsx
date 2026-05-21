import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiDelete } from "./api.js";
import { getMonday, fmtDate } from "./utils.js";
import Header from "./components/Header.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import WeekNav from "./components/WeekNav.jsx";
import Calendar from "./components/Calendar.jsx";
import BookingModal from "./components/BookingModal.jsx";

export default function App() {
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
  const [slots, setSlots] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [officeHours, setOfficeHours] = useState([]);
  const [modalSlot, setModalSlot] = useState(null);

  const loadWeek = useCallback(async (monday) => {
    const data = await apiGet(`/api/slots?week=${fmtDate(monday)}`);
    setSlots(data);
  }, []);

  const loadOfficeHours = useCallback(async () => {
    const data = await apiGet("/api/office-hours");
    setOfficeHours(data);
  }, []);

  useEffect(() => {
    loadWeek(currentMonday);
  }, [currentMonday, loadWeek]);

  useEffect(() => {
    if (settingsOpen) loadOfficeHours();
  }, [settingsOpen, loadOfficeHours]);

  function changeWeek(dir) {
    setCurrentMonday((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + dir * 7);
      return next;
    });
  }

  function goToToday() {
    setCurrentMonday(getMonday(new Date()));
  }

  async function addOfficeHour(body) {
    await apiPost("/api/office-hours", body);
    loadOfficeHours();
    loadWeek(currentMonday);
  }

  async function deleteOfficeHour(id) {
    await apiDelete(`/api/office-hours/${id}`);
    loadOfficeHours();
    loadWeek(currentMonday);
  }

  async function submitBooking(bookingData) {
    const result = await apiPost("/api/bookings", bookingData);
    if (result.error) {
      alert(result.error);
      return;
    }
    setModalSlot(null);
    loadWeek(currentMonday);
  }

  async function cancelBooking(id) {
    if (!confirm("Cancel this booking?")) return;
    await apiDelete(`/api/bookings/${id}`);
    setModalSlot(null);
    loadWeek(currentMonday);
  }

  return (
    <>
      <Header
        onToggleSettings={() => setSettingsOpen((prev) => !prev)}
        onGoToToday={goToToday}
      />
      <div className="container">
        {settingsOpen && (
          <SettingsPanel
            officeHours={officeHours}
            onAdd={addOfficeHour}
            onDelete={deleteOfficeHour}
          />
        )}
        <WeekNav
          currentMonday={currentMonday}
          onChangeWeek={changeWeek}
        />
        <Calendar
          currentMonday={currentMonday}
          slots={slots}
          onSlotClick={setModalSlot}
        />
      </div>
      {modalSlot && (
        <BookingModal
          slot={modalSlot}
          onClose={() => setModalSlot(null)}
          onSubmit={submitBooking}
          onCancel={cancelBooking}
        />
      )}
    </>
  );
}

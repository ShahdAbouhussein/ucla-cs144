<script>
  import { getMonday, fmtDate } from "./lib/utils.js";
  import { apiGet, apiPost, apiDelete } from "./lib/api.js";
  import Header from "./components/Header.svelte";
  import SettingsPanel from "./components/SettingsPanel.svelte";
  import WeekNav from "./components/WeekNav.svelte";
  import Calendar from "./components/Calendar.svelte";
  import BookingModal from "./components/BookingModal.svelte";

  let currentMonday = $state(getMonday(new Date()));
  let slots = $state([]);
  let settingsOpen = $state(false);
  let officeHours = $state([]);
  let modalSlot = $state(null);

  async function loadWeek(monday = currentMonday) {
    slots = await apiGet(`/api/slots?week=${fmtDate(monday)}`);
  }

  async function loadOfficeHours() {
    officeHours = await apiGet("/api/office-hours");
  }

  $effect(() => {
    loadWeek(currentMonday);
  });

  $effect(() => {
    if (settingsOpen) loadOfficeHours();
  });

  function changeWeek(dir) {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + dir * 7);
    currentMonday = next;
  }

  function goToToday() {
    currentMonday = getMonday(new Date());
  }

  async function addOfficeHour(body) {
    await apiPost("/api/office-hours", body);
    loadOfficeHours();
    loadWeek();
  }

  async function deleteOfficeHour(id) {
    await apiDelete(`/api/office-hours/${id}`);
    loadOfficeHours();
    loadWeek();
  }

  async function submitBooking(bookingData) {
    const result = await apiPost("/api/bookings", bookingData);
    if (result.error) {
      alert(result.error);
      return;
    }
    modalSlot = null;
    loadWeek();
  }

  async function cancelBooking(id) {
    if (!confirm("Cancel this booking?")) return;
    await apiDelete(`/api/bookings/${id}`);
    modalSlot = null;
    loadWeek();
  }
</script>

<Header
  onToggleSettings={() => (settingsOpen = !settingsOpen)}
  onGoToToday={goToToday}
/>

<div class="container">
  {#if settingsOpen}
    <SettingsPanel
      {officeHours}
      onAdd={addOfficeHour}
      onDelete={deleteOfficeHour}
    />
  {/if}

  <WeekNav {currentMonday} onChangeWeek={changeWeek} />

  <Calendar {currentMonday} {slots} onSlotClick={(slot) => (modalSlot = slot)} />
</div>

{#if modalSlot}
  <BookingModal
    slot={modalSlot}
    onClose={() => (modalSlot = null)}
    onSubmit={submitBooking}
    onCancel={cancelBooking}
  />
{/if}

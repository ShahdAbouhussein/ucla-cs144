<script setup>
import { ref, watch } from "vue";
import { getMonday, fmtDate } from "./utils.js";
import { apiGet, apiPost, apiDelete } from "./api.js";
import AppHeader from "./components/AppHeader.vue";
import SettingsPanel from "./components/SettingsPanel.vue";
import WeekNav from "./components/WeekNav.vue";
import CalendarGrid from "./components/CalendarGrid.vue";
import BookingModal from "./components/BookingModal.vue";

const currentMonday = ref(getMonday(new Date()));
const slots = ref([]);
const settingsOpen = ref(false);
const officeHours = ref([]);
const modalSlot = ref(null);

async function loadWeek() {
  slots.value = await apiGet(`/api/slots?week=${fmtDate(currentMonday.value)}`);
}

async function loadOfficeHours() {
  officeHours.value = await apiGet("/api/office-hours");
}

watch(currentMonday, () => loadWeek(), { immediate: true });

watch(settingsOpen, (open) => {
  if (open) loadOfficeHours();
});

function changeWeek(dir) {
  const next = new Date(currentMonday.value);
  next.setDate(next.getDate() + dir * 7);
  currentMonday.value = next;
}

function goToToday() {
  currentMonday.value = getMonday(new Date());
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
  modalSlot.value = null;
  loadWeek();
}

async function cancelBooking(id) {
  if (!confirm("Cancel this booking?")) return;
  await apiDelete(`/api/bookings/${id}`);
  modalSlot.value = null;
  loadWeek();
}
</script>

<template>
  <AppHeader
    @toggle-settings="settingsOpen = !settingsOpen"
    @go-to-today="goToToday"
  />
  <div class="container">
    <SettingsPanel
      v-if="settingsOpen"
      :office-hours="officeHours"
      @add="addOfficeHour"
      @delete="deleteOfficeHour"
    />
    <WeekNav
      :current-monday="currentMonday"
      @change-week="changeWeek"
    />
    <CalendarGrid
      :current-monday="currentMonday"
      :slots="slots"
      @slot-click="(slot) => (modalSlot = slot)"
    />
  </div>
  <BookingModal
    v-if="modalSlot"
    :slot="modalSlot"
    @close="modalSlot = null"
    @submit="submitBooking"
    @cancel="cancelBooking"
  />
</template>

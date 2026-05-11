<script setup>
import { ref } from "vue";
import { DAY_NAMES, fmtTime12 } from "../utils.js";

defineProps({
  officeHours: { type: Array, required: true },
});

const emit = defineEmits(["add", "delete"]);

const day = ref(1);
const start = ref("10:00");
const end = ref("12:00");
const duration = ref(15);

function handleAdd() {
  emit("add", {
    day_of_week: day.value,
    start_time: start.value,
    end_time: end.value,
    slot_duration: duration.value,
  });
}
</script>

<template>
  <div class="settings-panel active">
    <h3>Office Hours Schedule</h3>
    <div class="oh-list">
      <p v-if="officeHours.length === 0" style="color:#94a3b8;font-size:0.875rem;">
        No office hours configured. Add some below.
      </p>
      <div v-for="h in officeHours" :key="h.id" class="oh-item">
        <strong>{{ DAY_NAMES[h.day_of_week] }}</strong>
        <span>{{ fmtTime12(h.start_time) }} &ndash; {{ fmtTime12(h.end_time) }}</span>
        <span style="color:#64748b">({{ h.slot_duration }} min slots)</span>
        <span v-if="h.location" style="color:#64748b">{{ h.location }}</span>
        <button class="btn btn-danger btn-sm" @click="emit('delete', h.id)">
          Remove
        </button>
      </div>
    </div>
    <div class="oh-form">
      <div>
        <label for="oh-day">Day</label>
        <select id="oh-day" v-model.number="day">
          <option :value="0">Sunday</option>
          <option :value="1">Monday</option>
          <option :value="2">Tuesday</option>
          <option :value="3">Wednesday</option>
          <option :value="4">Thursday</option>
          <option :value="5">Friday</option>
          <option :value="6">Saturday</option>
        </select>
      </div>
      <div>
        <label for="oh-start">Start</label>
        <input id="oh-start" type="time" v-model="start" />
      </div>
      <div>
        <label for="oh-end">End</label>
        <input id="oh-end" type="time" v-model="end" />
      </div>
      <div>
        <label for="oh-duration">Slot (min)</label>
        <select id="oh-duration" v-model.number="duration">
          <option :value="10">10</option>
          <option :value="15">15</option>
          <option :value="20">20</option>
          <option :value="30">30</option>
          <option :value="60">60</option>
        </select>
      </div>
      <div>
        <label>&nbsp;</label>
        <button class="btn btn-primary" @click="handleAdd">Add</button>
      </div>
    </div>
  </div>
</template>

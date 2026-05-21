<script setup>
import { computed } from "vue";
import { DAY_SHORT, fmtDate, fmtDateShort, fmtTime12 } from "../utils.js";
import SlotCell from "./SlotCell.vue";

const props = defineProps({
  currentMonday: { type: Date, required: true },
  slots: { type: Array, required: true },
});

const emit = defineEmits(["slot-click"]);

const today = fmtDate(new Date());

const times = computed(() => {
  const timeSet = new Set();
  for (const s of props.slots) timeSet.add(s.start_time);
  return [...timeSet].sort();
});

const slotMap = computed(() => {
  const map = {};
  for (const s of props.slots) map[`${s.date}_${s.start_time}`] = s;
  return map;
});

const days = computed(() => {
  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(props.currentMonday);
    d.setDate(d.getDate() + i);
    result.push(d);
  }
  return result;
});
</script>

<template>
  <div v-if="slots.length === 0" class="no-slots-msg">
    No office hours this week. Open <strong>Settings</strong> to add your schedule.
  </div>
  <div v-else class="calendar">
    <!-- Header row -->
    <div class="cal-header corner"></div>
    <div
      v-for="d in days"
      :key="fmtDate(d)"
      class="cal-header"
      :class="{ 'today-marker': fmtDate(d) === today }"
    >
      {{ DAY_SHORT[d.getDay()] }}
      <span class="day-date">{{ fmtDateShort(d) }}</span>
    </div>

    <!-- Time rows -->
    <template v-for="time in times" :key="time">
      <div class="time-label">{{ fmtTime12(time) }}</div>
      <div
        v-for="d in days"
        :key="`${fmtDate(d)}_${time}`"
        class="cal-cell"
        :class="{ 'today-marker': fmtDate(d) === today }"
      >
        <SlotCell
          v-if="slotMap[`${fmtDate(d)}_${time}`]"
          :slot="slotMap[`${fmtDate(d)}_${time}`]"
          @click="emit('slot-click', slotMap[`${fmtDate(d)}_${time}`])"
        />
      </div>
    </template>
  </div>
</template>

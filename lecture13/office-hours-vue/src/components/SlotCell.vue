<script setup>
import { fmtTime12 } from "../utils.js";

defineProps({
  slot: { type: Object, required: true },
});

const emit = defineEmits(["click"]);
</script>

<template>
  <button
    v-if="slot.booking"
    type="button"
    class="slot booked"
    @click="emit('click')"
  >
    <span class="slot-name">{{ slot.booking.student_name }}</span>
    <span class="slot-time">{{ fmtTime12(slot.start_time) }}</span>
  </button>
  <button
    v-else
    type="button"
    class="slot available"
    @click="emit('click')"
  >
    <span class="slot-time">{{ fmtTime12(slot.start_time) }}</span>
    <span style="font-size:0.65rem">Available</span>
  </button>
</template>

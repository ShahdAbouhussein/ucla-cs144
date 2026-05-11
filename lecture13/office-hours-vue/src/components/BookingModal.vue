<script setup>
import { ref, computed } from "vue";
import { DAY_NAMES, fmtTime12 } from "../utils.js";

const props = defineProps({
  slot: { type: Object, required: true },
});

const emit = defineEmits(["close", "submit", "cancel"]);

const name = ref("");
const email = ref("");
const topic = ref("");

const dayName = computed(
  () => DAY_NAMES[new Date(props.slot.date + "T00:00:00").getDay()]
);
const timeLabel = computed(() => fmtTime12(props.slot.start_time));
const isBooked = computed(() => !!props.slot.booking);

function handleSubmit() {
  if (!name.value.trim()) {
    alert("Student name is required.");
    return;
  }
  emit("submit", {
    date: props.slot.date,
    start_time: props.slot.start_time,
    end_time: props.slot.end_time,
    student_name: name.value.trim(),
    student_email: email.value.trim(),
    topic: topic.value.trim(),
  });
}

function handleOverlayClick(e) {
  if (e.target === e.currentTarget) emit("close");
}
</script>

<template>
  <div class="modal-overlay active" @click="handleOverlayClick">
    <div class="modal">
      <h3>
        {{ isBooked ? "" : "Book: " }}
        {{ dayName }} {{ slot.date }} at {{ timeLabel }}
      </h3>

      <!-- Booked: show details -->
      <div v-if="isBooked" class="booking-detail">
        <p><span class="label">Student:</span> {{ slot.booking.student_name }}</p>
        <p v-if="slot.booking.student_email">
          <span class="label">Email:</span> {{ slot.booking.student_email }}
        </p>
        <p v-if="slot.booking.topic">
          <span class="label">Topic:</span> {{ slot.booking.topic }}
        </p>
        <p>
          <span class="label">Booked:</span>
          {{ new Date(slot.booking.created_at).toLocaleString() }}
        </p>
      </div>

      <!-- Available: show booking form -->
      <div v-else>
        <label for="book-name">Student Name *</label>
        <input id="book-name" type="text" placeholder="e.g. Jane Smith" v-model="name" />
        <label for="book-email">Email</label>
        <input id="book-email" type="email" placeholder="e.g. jane@university.edu" v-model="email" />
        <label for="book-topic">Topic</label>
        <textarea id="book-topic" placeholder="What do they need help with?" v-model="topic"></textarea>
      </div>

      <div class="modal-actions">
        <button class="btn btn-secondary" @click="emit('close')">Cancel</button>
        <button
          v-if="isBooked"
          class="btn btn-danger"
          @click="emit('cancel', slot.booking.id)"
        >
          Cancel Booking
        </button>
        <button v-else class="btn btn-primary" @click="handleSubmit">
          Book
        </button>
      </div>
    </div>
  </div>
</template>

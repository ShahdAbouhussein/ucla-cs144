<script setup>
import { computed } from "vue";

const props = defineProps({
  currentMonday: { type: Date, required: true },
});

const emit = defineEmits(["change-week"]);

const label = computed(() => {
  const end = new Date(props.currentMonday);
  end.setDate(end.getDate() + 6);
  const opts = { month: "long", day: "numeric", year: "numeric" };
  return `${props.currentMonday.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
});
</script>

<template>
  <div class="week-nav">
    <button class="btn btn-secondary" @click="emit('change-week', -1)">
      &larr; Prev
    </button>
    <h2>{{ label }}</h2>
    <button class="btn btn-secondary" @click="emit('change-week', 1)">
      Next &rarr;
    </button>
  </div>
</template>

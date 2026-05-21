<script setup>
const emit = defineEmits(["toggle-settings", "go-to-today"]);
</script>

<template>
  <header>
    <h1>Office Hours</h1>
    <div class="header-actions">
      <button class="btn btn-secondary" @click="emit('toggle-settings')">
        Settings
      </button>
      <button class="btn btn-secondary" @click="emit('go-to-today')">
        Today
      </button>
    </div>
  </header>
</template>

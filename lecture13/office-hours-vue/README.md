# Office Hours (Vue Version)

This is a Vue 3 conversion of the vanilla JavaScript office-hours app from `lecture7/office-hours`. The backend (Express + SQLite) is identical; only the frontend was rewritten using Vue's Composition API.

## How to Build and Run

```bash
npm install
```

### Development

Run the Express backend and Vite dev server in two terminals:

```bash
# Terminal 1: start the API backend
node server.cjs

# Terminal 2: start the Vite dev server (compiles .vue files, hot-reloads)
npm run dev
```

Vite starts at `http://localhost:5173` and proxies all `/api` requests to the Express backend on port 3001.

### Production

```bash
npm run build       # compiles Vue SFCs and bundles into dist/
npm start           # runs Express, which serves dist/ and the API on :3001
```

Open `http://localhost:3001` in your browser.

## Major Differences from the Vanilla Version

### 1. Single-File Components (`.vue` files)

**Vanilla:** Everything lives in one `index.html` — HTML, CSS, and JavaScript together in a single file.

**Vue:** Each component is a `.vue` file with up to three sections:

```vue
<!-- AppHeader.vue -->
<script setup>
const emit = defineEmits(["toggle-settings", "go-to-today"]);
</script>

<template>
  <header>
    <h1>Office Hours</h1>
    <div class="header-actions">
      <button class="btn btn-secondary" @click="emit('toggle-settings')">Settings</button>
      <button class="btn btn-secondary" @click="emit('go-to-today')">Today</button>
    </div>
  </header>
</template>
```

**Vue concept: Single-File Components (SFCs).** A `.vue` file contains `<script>`, `<template>`, and optionally `<style>` blocks. The template uses real HTML (not JSX), the script handles logic, and styles can be scoped to the component. Vue's compiler processes the `.vue` file and produces optimized JavaScript.

| Component | What it does |
|---|---|
| `App.vue` | Root component; owns all shared state and API calls |
| `AppHeader.vue` | Top navigation bar |
| `WeekNav.vue` | Previous/Next week buttons and label |
| `SettingsPanel.vue` | Add/remove office hours schedule |
| `CalendarGrid.vue` | The weekly calendar grid |
| `SlotCell.vue` | A single slot (available or booked) |
| `BookingModal.vue` | Modal for creating or viewing a booking |

### 2. `<script setup>` and the Composition API

**Vanilla:** All logic is written as loose functions and global variables in a `<script>` tag.

**Vue:**
```vue
<script setup>
import { ref, computed, watch } from "vue";

const currentMonday = ref(getMonday(new Date()));
const slots = ref([]);

async function loadWeek() {
  slots.value = await apiGet(`/api/slots?week=${fmtDate(currentMonday.value)}`);
}

watch(currentMonday, () => loadWeek(), { immediate: true });
</script>
```

**Vue concept: `<script setup>`.** This is Vue 3's Composition API in its most concise form. Everything declared at the top level of `<script setup>` — variables, functions, imports — is automatically available in the template. There is no `export default`, no `data()`, no `methods:` object. It reads like plain JavaScript with reactive primitives mixed in.

### 3. `ref()` for Reactive State

**Vanilla:** State lives in global variables:
```js
let currentMonday = getMonday(new Date());
let currentSlotData = null;
```

**Vue:**
```js
const currentMonday = ref(getMonday(new Date()));
const modalSlot = ref(null);
```

**Vue concept: `ref()`.** `ref()` wraps a value in a reactive container. In JavaScript code you read and write it via `.value` (`currentMonday.value = next`). In the template, Vue automatically unwraps it so you write `{{ currentMonday }}` without `.value`. When you assign to `.value`, Vue's reactivity system detects the change and updates every part of the DOM that depends on it.

### 4. `computed()` for Derived Values

**Vanilla:** Computed values are recalculated manually inside functions:
```js
const timeSet = new Set();
for (const s of slots) timeSet.add(s.start_time);
const times = [...timeSet].sort();
```

**Vue:**
```js
const times = computed(() => {
  const timeSet = new Set();
  for (const s of props.slots) timeSet.add(s.start_time);
  return [...timeSet].sort();
});
```

**Vue concept: `computed()`.** A `computed` ref automatically tracks which reactive values it reads (here, `props.slots`) and caches its result. It only recalculates when a dependency changes. In the template you use it like a regular ref: `{{ times }}`. This replaces the vanilla pattern of manually rebuilding derived data after every state change.

### 5. `watch()` for Side Effects

**Vanilla:** Data loading happens via imperative function calls — `loadWeek()` is called at the bottom of the script and again after every navigation:
```js
function changeWeek(dir) {
  currentMonday.setDate(currentMonday.getDate() + dir * 7);
  loadWeek();   // must remember to call this
}
loadWeek();     // initial load
```

**Vue:**
```js
watch(currentMonday, () => loadWeek(), { immediate: true });
```

**Vue concept: `watch()`.** `watch` runs a callback whenever a reactive source changes. `{ immediate: true }` makes it also run once on setup, replacing the initial `loadWeek()` call. Unlike React's `useEffect`, Vue's `watch` explicitly names what it watches (the first argument) rather than relying on a dependency array. This makes it clear which state change triggers which effect.

### 6. `defineProps()` and `defineEmits()` for Component Communication

**Vanilla:** There are no components — functions read globals directly and mutate the DOM.

**Vue:**
```vue
<script setup>
const props = defineProps({
  currentMonday: { type: Date, required: true },
  slots: { type: Array, required: true },
});

const emit = defineEmits(["slot-click"]);
</script>
```

The parent passes data down and listens for events:
```vue
<CalendarGrid
  :current-monday="currentMonday"
  :slots="slots"
  @slot-click="(slot) => (modalSlot = slot)"
/>
```

**Vue concept: Props down, events up.** `defineProps` declares the data a component receives from its parent. Props are read-only — the child cannot modify them. `defineEmits` declares the events a component can fire back to its parent. The parent listens with `@event-name="handler"`. This is Vue's one-way data flow: parents own the state, children request changes by emitting events.

Note the naming convention: Vue automatically converts between camelCase in JavaScript (`currentMonday`) and kebab-case in templates (`:current-monday`).

### 7. `v-if` / `v-else` for Conditional Rendering

**Vanilla:** The settings panel and modal are always in the DOM, toggled with CSS classes:
```js
panel.classList.toggle("active");
document.getElementById("bookModal").classList.add("active");
```

**Vue:**
```vue
<SettingsPanel v-if="settingsOpen" ... />

<BookingModal v-if="modalSlot" ... />
```

**Vue concept: `v-if` directive.** `v-if` conditionally mounts or unmounts an element (or component) from the DOM. When the expression is falsy, the element doesn't exist at all — it's not hidden, it's removed. When it becomes truthy, the component is created fresh. `v-else` can follow a `v-if` to provide an alternative:

```vue
<div v-if="isBooked" class="booking-detail">...</div>
<div v-else>
  <!-- booking form -->
</div>
```

### 8. `v-for` for List Rendering

**Vanilla:** Lists are built by concatenating HTML strings:
```js
list.innerHTML = hours.map(h => `<div class="oh-item">...</div>`).join("");
```

**Vue:**
```vue
<div v-for="h in officeHours" :key="h.id" class="oh-item">
  <strong>{{ DAY_NAMES[h.day_of_week] }}</strong>
  <span>{{ fmtTime12(h.start_time) }} &ndash; {{ fmtTime12(h.end_time) }}</span>
  <button class="btn btn-danger btn-sm" @click="emit('delete', h.id)">Remove</button>
</div>
```

**Vue concept: `v-for` directive.** `v-for="item in array"` repeats the element once per item. The `:key` binding (shorthand for `v-bind:key`) tells Vue's virtual DOM how to efficiently track and reorder elements. Like React, keys should be stable, unique IDs — not array indices.

### 9. `v-model` for Two-Way Binding

**Vanilla:** Form values are read imperatively from the DOM:
```js
const name = document.getElementById("bookName").value.trim();
```

**Vue:**
```vue
<script setup>
const name = ref("");
</script>

<template>
  <input type="text" v-model="name" />
</template>
```

**Vue concept: `v-model` directive.** `v-model` creates a two-way binding between a form element and a `ref`. It's syntactic sugar for `:value="name" @input="name = $event.target.value"` — Vue writes both directions for you. Modifiers like `v-model.number` automatically coerce the input to a number:

```vue
<select v-model.number="day">
  <option :value="0">Sunday</option>
  ...
</select>
```

Compare with React, which requires separate `value` and `onChange` props:
```jsx
<input value={name} onChange={(e) => setName(e.target.value)} />
```

### 10. `@click` Event Shorthand and `{{ }}` Template Syntax

**Vanilla:**
```html
<button onclick="toggleSettings()">Settings</button>
<span>${escapeHtml(name)}</span>
```

**Vue:**
```vue
<button @click="emit('toggle-settings')">Settings</button>
<span>{{ name }}</span>
```

**Vue concept: `@` event shorthand.** `@click` is shorthand for `v-on:click`. It binds a DOM event to a JavaScript expression or function. Unlike vanilla HTML `onclick` strings, Vue event handlers are real JavaScript with access to component scope.

**Vue concept: `{{ }}` mustache interpolation.** Double curly braces render a JavaScript expression as text content. Like React's JSX `{}` and Svelte's `{}`, Vue automatically escapes the output to prevent XSS — no manual `escapeHtml()` needed.

### 11. `:class` for Dynamic CSS Classes

**Vanilla:**
```js
html += `<div class="cal-header${isToday ? " today-marker" : ""}">`;
```

**Vue:**
```vue
<div class="cal-header" :class="{ 'today-marker': fmtDate(d) === today }">
```

**Vue concept: `:class` binding.** `:class` (shorthand for `v-bind:class`) accepts an object where keys are class names and values are booleans. When the value is truthy, the class is added. This merges with any static `class` attribute on the same element.

### 12. `<template>` for Grouping Without Extra DOM Nodes

**Vanilla (and React):** When you need to render multiple adjacent elements in a loop, you either wrap them in a container `<div>` or use a React Fragment.

**Vue:**
```vue
<template v-for="time in times" :key="time">
  <div class="time-label">{{ fmtTime12(time) }}</div>
  <div v-for="d in days" :key="`${fmtDate(d)}_${time}`" class="cal-cell">
    ...
  </div>
</template>
```

**Vue concept: `<template>` as invisible wrapper.** `<template>` with a directive (`v-for`, `v-if`) acts as a grouping mechanism that doesn't render any DOM element. This is essential for the calendar grid, where the CSS grid layout requires the time label and 7 day cells to be direct children of the grid container — an extra wrapper `<div>` would break the layout.

### Summary Table

| Concept | Vanilla JS | Vue 3 |
|---|---|---|
| UI structure | Single HTML file | `.vue` Single-File Components |
| Script style | Loose functions + globals | `<script setup>` Composition API |
| State | Global variables | `ref()` reactive references |
| Computed values | Manual recalculation | `computed()` with auto-caching |
| Side effects | Imperative function calls | `watch()` with named sources |
| Component inputs | N/A (globals) | `defineProps()` with type declarations |
| Component outputs | N/A (globals) | `defineEmits()` — events up to parent |
| Conditionals | `if` in string templates | `v-if` / `v-else` directives |
| Loops | `.map().join("")` | `v-for` with `:key` |
| Forms | Read DOM on submit | `v-model` two-way binding |
| Events | Inline `onclick` strings | `@click` directive |
| CSS classes | String concatenation | `:class="{ name: condition }"` |
| XSS prevention | Manual `escapeHtml()` | Automatic escaping in `{{ }}` |
| Build | None (static file) | Vite + Vue compiler (SFC compile, bundle, HMR) |

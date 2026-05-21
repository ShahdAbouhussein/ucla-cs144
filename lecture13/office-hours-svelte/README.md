# Office Hours (Svelte Version)

This is a Svelte 5 conversion of the vanilla JavaScript office-hours app from `lecture7/office-hours`. The backend (Express + SQLite) is identical; only the frontend was rewritten using Svelte.

## How to Build and Run

```bash
npm install
```

### Development

Run the Express backend and Vite dev server in two terminals:

```bash
# Terminal 1: start the API backend
node server.cjs

# Terminal 2: start the Vite dev server (compiles Svelte, hot-reloads)
npm run dev
```

Vite starts at `http://localhost:5173` and proxies all `/api` requests to the Express backend on port 3001.

### Production

```bash
npm run build       # compiles Svelte and bundles into dist/
npm start           # runs Express, which serves dist/ and the API on :3001
```

Open `http://localhost:3001` in your browser.

## Major Differences from the Vanilla Version

### 1. Single-File Components (`.svelte` files)

**Vanilla:** Everything lives in one `index.html` — HTML, CSS, and JavaScript together in a single file.

**Svelte:** Each component is a `.svelte` file that contains all three concerns — but scoped to that component:

```svelte
<!-- Header.svelte -->
<script>
  let { onToggleSettings, onGoToToday } = $props();
</script>

<header>
  <h1>Office Hours</h1>
  <div class="header-actions">
    <button class="btn btn-secondary" onclick={onToggleSettings}>Settings</button>
    <button class="btn btn-secondary" onclick={onGoToToday}>Today</button>
  </div>
</header>
```

**Svelte concept: Single-file components.** A `.svelte` file has up to three sections: `<script>` for logic, the template markup (just HTML), and optionally `<style>` for CSS. Unlike React's JSX, the template is actual HTML — not JavaScript that looks like HTML. The component is the file itself; there is no `export default function` wrapper.

| Component | What it does |
|---|---|
| `App.svelte` | Root component; owns all shared state and API calls |
| `Header.svelte` | Top navigation bar |
| `WeekNav.svelte` | Previous/Next week buttons and label |
| `SettingsPanel.svelte` | Add/remove office hours schedule |
| `Calendar.svelte` | The weekly calendar grid |
| `SlotCell.svelte` | A single slot (available or booked) |
| `BookingModal.svelte` | Modal for creating or viewing a booking |

### 2. `$state` Rune Instead of Global Variables

**Vanilla:** State is stored in global variables that any function can mutate:
```js
let currentMonday = getMonday(new Date());
let currentSlotData = null;
```

**Svelte:**
```svelte
<script>
  let currentMonday = $state(getMonday(new Date()));
  let slots = $state([]);
  let modalSlot = $state(null);
</script>
```

**Svelte concept: `$state` rune.** `$state()` declares a piece of reactive state. When you assign a new value to a `$state` variable (`currentMonday = next`), Svelte automatically updates every part of the DOM that depends on it. Unlike React's `useState`, there is no setter function — you just use normal JavaScript assignment (`=`). The Svelte compiler rewrites these assignments into reactive updates at compile time.

### 3. `$derived` Rune for Computed Values

**Vanilla:** Computed values are recalculated manually inside functions and stored in local variables:
```js
const timeSet = new Set();
for (const s of slots) timeSet.add(s.start_time);
const times = [...timeSet].sort();
```

**Svelte:**
```svelte
<script>
  let times = $derived.by(() => {
    const timeSet = new Set();
    for (const s of slots) timeSet.add(s.start_time);
    return [...timeSet].sort();
  });
</script>
```

**Svelte concept: `$derived` rune.** `$derived(expression)` creates a reactive value for simple expressions. `$derived.by(() => { ... })` is the block-body version for multi-step computations. Both automatically recompute whenever their reactive dependencies change. When `slots` changes, `times` recalculates. This replaces the pattern of manually calling a rebuild function after every state change.

### 4. `$effect` Rune for Side Effects

**Vanilla:** Data loading is triggered by imperative function calls — `loadWeek()` is called at the bottom of the script and again after every navigation:
```js
function changeWeek(dir) {
  currentMonday.setDate(currentMonday.getDate() + dir * 7);
  loadWeek();   // must remember to call this
}
loadWeek();     // initial load
```

**Svelte:**
```svelte
<script>
  $effect(() => {
    loadWeek(currentMonday);
  });
</script>
```

**Svelte concept: `$effect` rune.** `$effect` runs a function after the component mounts, and re-runs it whenever any `$state` or `$derived` value read inside it changes. The dependency tracking is automatic — there is no dependency array like React's `useEffect`. When `currentMonday` changes (via week navigation), the effect re-runs and fetches new data.

### 5. `$props` Rune for Component Props

**Vanilla:** There are no components, so there are no props. Functions access global state directly.

**Svelte:**
```svelte
<!-- WeekNav.svelte -->
<script>
  let { currentMonday, onChangeWeek } = $props();
</script>
```

**Svelte concept: `$props` rune.** `$props()` declares the inputs a component accepts from its parent. It uses JavaScript destructuring syntax to name the props. The parent passes them as attributes:

```svelte
<WeekNav {currentMonday} onChangeWeek={changeWeek} />
```

Note the shorthand `{currentMonday}` — when the prop name matches the variable name, Svelte lets you write it once instead of `currentMonday={currentMonday}`.

### 6. `{#if}` and `{#each}` Template Blocks

**Vanilla:** Conditional and repeated content is built by concatenating HTML strings:
```js
if (slots.length === 0) {
  container.innerHTML = '<div class="no-slots-msg">No office hours...</div>';
} else {
  html += slots.map(s => `<div>...</div>`).join("");
  container.innerHTML = html;
}
```

**Svelte:**
```svelte
{#if slots.length === 0}
  <div class="no-slots-msg">
    No office hours this week. Open <strong>Settings</strong> to add your schedule.
  </div>
{:else}
  {#each times as time (time)}
    <div class="time-label">{fmtTime12(time)}</div>
    {#each days as d (`${fmtDate(d)}_${time}`)}
      ...
    {/each}
  {/each}
{/if}
```

**Svelte concept: Template directives.** `{#if}` / `{:else}` / `{/if}` is Svelte's conditional rendering. `{#each array as item (key)}` iterates over a list. The `(key)` expression works like React's `key` prop — it tells Svelte how to efficiently update the DOM when items change. These are compiled away — the browser never sees them.

**Svelte concept: `{@const}` local declarations.** Inside template blocks, you can declare local variables:
```svelte
{#each days as d}
  {@const dateStr = fmtDate(d)}
  {@const slot = slotMap[`${dateStr}_${time}`]}
  ...
{/each}
```
This keeps computed values close to where they're used without polluting the `<script>` block.

### 7. `bind:value` Two-Way Binding

**Vanilla:** Form values are read imperatively from the DOM on submit:
```js
const name = document.getElementById("bookName").value.trim();
```

**Svelte:**
```svelte
<script>
  let name = $state("");
</script>

<input type="text" bind:value={name} />
```

**Svelte concept: Two-way binding.** `bind:value` creates a two-way connection between the input element and the `$state` variable. When the user types, `name` updates. If code changes `name`, the input updates. This replaces both the `value=` and `onChange=` that React requires for controlled inputs — Svelte handles both directions in one directive.

Compare with React's equivalent:
```jsx
const [name, setName] = useState("");
<input value={name} onChange={(e) => setName(e.target.value)} />
```

Svelte's `bind:value={name}` does the same thing in fewer moving parts.

### 8. `class:` Directive for Conditional CSS Classes

**Vanilla:** CSS classes are toggled with string concatenation:
```js
html += `<div class="cal-header${isToday ? " today-marker" : ""}">`;
```

**Svelte:**
```svelte
<div class="cal-header" class:today-marker={fmtDate(d) === today}>
```

**Svelte concept: `class:` directive.** `class:name={condition}` adds the CSS class `name` when the condition is truthy and removes it when falsy. This is cleaner than string interpolation and compiles to direct `classList.toggle()` calls.

### 9. No Virtual DOM — Compiles to Direct DOM Updates

**React** uses a virtual DOM: it builds an in-memory representation of the UI, diffs it against the previous version, and applies the minimal set of changes to the real DOM.

**Svelte** has no virtual DOM. The Svelte compiler analyzes your component at build time and generates JavaScript that updates exactly the DOM nodes that depend on each piece of state. When `currentMonday` changes, Svelte doesn't re-render the whole component — it only touches the specific text nodes and attributes that use `currentMonday`.

This is why the production bundle is **42 KB** (Svelte) vs **203 KB** (React) — Svelte doesn't ship a runtime diffing engine to the browser.

### 10. Automatic Text Escaping

**Vanilla:** We needed a manual `escapeHtml()` function to prevent XSS:
```js
html += `<span>${escapeHtml(slot.booking.student_name)}</span>`;
```

**Svelte:** Text inside `{}` is automatically escaped:
```svelte
<span>{slot.booking.student_name}</span>
```

Like React's JSX, Svelte escapes all text expressions by default. You would need `{@html ...}` to render raw HTML, which is deliberately opt-in.

### Summary Table

| Concept | Vanilla JS | Svelte 5 |
|---|---|---|
| UI structure | Single HTML file | `.svelte` single-file components |
| Rendering | `innerHTML` string concatenation | Template syntax, compiled to direct DOM ops |
| State | Global variables | `$state()` rune with plain `=` assignment |
| Computed values | Manual recalculation | `$derived()` rune with auto-tracking |
| Side effects | Imperative function calls | `$effect()` rune with auto-dependency tracking |
| Component inputs | N/A (globals) | `$props()` rune with destructuring |
| Conditionals | `if` in string templates | `{#if}` / `{:else}` / `{/if}` blocks |
| Loops | `.map().join("")` | `{#each array as item (key)}` blocks |
| Forms | Read DOM on submit | `bind:value` two-way binding |
| CSS classes | String concatenation | `class:name={condition}` directive |
| XSS prevention | Manual `escapeHtml()` | Automatic escaping in `{}` expressions |
| Runtime overhead | None (raw DOM) | None (compiled away at build time) |
| Build | None (static file) | Vite + Svelte compiler (compile, bundle, HMR) |

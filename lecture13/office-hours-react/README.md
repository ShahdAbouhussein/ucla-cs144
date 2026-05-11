# Office Hours (React Version)

This is a React conversion of the vanilla JavaScript office-hours app from `lecture7/office-hours`. The backend (Express + SQLite) is identical; only the frontend was rewritten using the React ecosystem.

## How to Build and Run

```bash
npm install
```

### Development

Run the Express backend and Vite dev server in two terminals:

```bash
# Terminal 1: start the API backend
node server.js

# Terminal 2: start the Vite dev server (compiles JSX, hot-reloads)
npm run dev
```

Vite starts at `http://localhost:5173` and proxies all `/api` requests to the Express backend on port 3001.

### Production

```bash
npm run build       # compiles React/JSX and bundles into dist/
npm start           # runs Express, which serves dist/ and the API on :3001
```

Open `http://localhost:3001` in your browser.

## Major Differences from the Vanilla Version

### 1. Components Instead of One Big HTML File

**Vanilla:** Everything lives in a single `public/index.html` — HTML structure, CSS, and all JavaScript in one `<script>` tag.

**React:** The UI is split into focused components, each in its own file:

| Component | What it does |
|---|---|
| `App.jsx` | Root component; owns all shared state and API calls |
| `Header.jsx` | Top navigation bar |
| `WeekNav.jsx` | Previous/Next week buttons and label |
| `SettingsPanel.jsx` | Add/remove office hours schedule |
| `Calendar.jsx` | The weekly calendar grid |
| `SlotCell.jsx` | A single slot (available or booked) |
| `BookingModal.jsx` | Modal for creating or viewing a booking |

**React concept: Components and Props.** Each component is a function that receives data via `props` — the arguments passed from the parent. For example, `<SlotCell slot={slot} onClick={handleClick} />` passes a slot object and a click handler down. This is React's primary mechanism for parent-to-child communication.

### 2. JSX Instead of innerHTML Strings

**Vanilla:** The calendar is built by concatenating HTML strings and assigning to `container.innerHTML`:
```js
html += `<div class="slot booked" onclick='showBooking(${JSON.stringify(slot)})'>
  <span class="slot-name">${escapeHtml(slot.booking.student_name)}</span>
</div>`;
container.innerHTML = html;
```

**React (JSX):** The markup is written declaratively as JSX — an XML-like syntax embedded in JavaScript:
```jsx
<div className="slot booked" onClick={onClick}>
  <span className="slot-name">{slot.booking.student_name}</span>
</div>
```

**React concept: JSX.** JSX is syntactic sugar for `React.createElement()` calls. It looks like HTML but it's JavaScript, which means you can embed expressions with `{}`, use JavaScript variables directly, and get compile-time checks. Note `className` instead of `class` (since `class` is a reserved word in JS) and `onClick` instead of `onclick` (camelCase event naming).

**React concept: Automatic escaping.** In vanilla JS, we needed a manual `escapeHtml()` function to prevent XSS when inserting user-provided strings into `innerHTML`. React's JSX automatically escapes text content rendered via `{}`, so `{slot.booking.student_name}` is safe without any manual escaping.

### 3. State with `useState` Instead of Global Variables

**Vanilla:** State lives in global variables that any function can read or mutate:
```js
let currentMonday = getMonday(new Date());
let currentSlotData = null;
```

**React:** State is declared inside components using the `useState` hook:
```jsx
const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
const [modalSlot, setModalSlot] = useState(null);
```

**React concept: `useState` hook.** `useState` returns a pair: the current value and a setter function. Calling the setter triggers a re-render of the component with the new value. This is how React knows when to update the DOM — you never manipulate the DOM directly.

**React concept: Lifting state up.** In the vanilla version, any function anywhere can read/write `currentMonday`. In React, state lives in the lowest common ancestor that needs it. `App.jsx` owns `currentMonday`, `slots`, `officeHours`, `settingsOpen`, and `modalSlot` and passes them down as props. Child components communicate back up via callback props (e.g., `onChangeWeek`, `onSlotClick`).

### 4. Side Effects with `useEffect` Instead of Manual Init

**Vanilla:** Data loading happens in explicit function calls, and `loadWeek()` is called at the bottom of the script to initialize:
```js
loadWeek();  // called once on page load
```
Navigating weeks calls `loadWeek()` imperatively after mutating the global `currentMonday`.

**React:** Data fetching is triggered by `useEffect`, which runs automatically when its dependencies change:
```jsx
useEffect(() => {
  loadWeek(currentMonday);
}, [currentMonday, loadWeek]);
```

**React concept: `useEffect` hook.** `useEffect` runs a side effect (API call, subscription, DOM mutation) after the component renders. The dependency array `[currentMonday]` tells React to re-run the effect only when `currentMonday` changes. This replaces the pattern of "call a fetch function after every state change."

### 5. `useCallback` for Stable Function References

```jsx
const loadWeek = useCallback(async (monday) => {
  const data = await apiGet(`/api/slots?week=${fmtDate(monday)}`);
  setSlots(data);
}, []);
```

**React concept: `useCallback` hook.** `useCallback` memoizes a function so it keeps the same reference across re-renders (unless its dependencies change). Without it, `loadWeek` would be a new function object on every render, causing the `useEffect` that depends on it to re-fire unnecessarily.

### 6. Conditional Rendering Instead of DOM Show/Hide

**Vanilla:** The settings panel and modal are always in the DOM, toggled via CSS class:
```js
panel.classList.toggle("active");
document.getElementById("bookModal").classList.add("active");
```

**React:** Components are conditionally rendered — they don't exist in the DOM at all when not needed:
```jsx
{settingsOpen && <SettingsPanel ... />}

{modalSlot && <BookingModal slot={modalSlot} ... />}
```

**React concept: Conditional rendering.** Using `&&` or ternary `? :` in JSX controls whether a component is mounted or unmounted. When `modalSlot` is `null`, `BookingModal` is completely removed from the DOM (not just hidden). When the user clicks a slot, `setModalSlot(slot)` triggers a re-render that mounts the modal fresh with clean form state.

### 7. Controlled Form Inputs Instead of Reading DOM Values

**Vanilla:** Form values are read from the DOM on submit:
```js
const name = document.getElementById("bookName").value.trim();
```

**React:** Form inputs are "controlled" — their values are stored in state and updated via `onChange`:
```jsx
const [name, setName] = useState("");
<input value={name} onChange={(e) => setName(e.target.value)} />
```

**React concept: Controlled components.** The input's displayed value is always driven by React state, and every keystroke updates that state via `onChange`. This gives React full control over form data, making validation, conditional logic, and resetting straightforward.

### 8. Lists Rendered with `.map()` and `key`

**Vanilla:** Lists are built as concatenated HTML strings:
```js
list.innerHTML = hours.map(h => `<div class="oh-item">...</div>`).join("");
```

**React:** Lists are rendered by mapping data to JSX elements, each with a unique `key`:
```jsx
officeHours.map((h) => (
  <div className="oh-item" key={h.id}>
    ...
  </div>
))
```

**React concept: List rendering and keys.** The `key` prop tells React which items changed, were added, or were removed. React uses keys to efficiently update only the DOM nodes that actually changed, rather than re-rendering the entire list. Keys should be stable, unique identifiers (like database IDs), not array indices.

### 9. Vite Build Tooling Instead of Static Files

**Vanilla:** The browser loads `index.html` directly. No build step.

**React:** Vite handles:
- **JSX transformation** — browsers can't read JSX natively, so Vite compiles it to standard JavaScript
- **Module bundling** — the many component files are bundled into a single optimized JS file for production
- **Dev server with hot reload** — changes appear instantly in the browser during development
- **API proxy** — in development, `/api` requests are proxied to the Express backend so the frontend and backend can run on different ports without CORS issues

### Summary Table

| Concept | Vanilla JS | React |
|---|---|---|
| UI structure | Single HTML file | Component tree (JSX) |
| Rendering | `innerHTML` string concatenation | Declarative JSX, virtual DOM diffing |
| State | Global variables | `useState` hooks, lifted to common ancestor |
| Data fetching | Imperative function calls | `useEffect` with dependency tracking |
| Events | Inline `onclick` strings | `onClick` props with function references |
| Forms | Read DOM on submit | Controlled components with `onChange` |
| Show/hide UI | Toggle CSS classes | Conditional rendering (mount/unmount) |
| XSS prevention | Manual `escapeHtml()` | Automatic escaping by JSX |
| Build | None (static files) | Vite (JSX compile, bundle, HMR, proxy) |

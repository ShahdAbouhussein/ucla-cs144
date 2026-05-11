# Lecture 12 Office Hours Apps

This lecture contains the same office-hours scheduler implemented three ways:

These apps are teaching examples. They may not work perfectly in every edge case, and that is not the goal. The goal is to show how the same app structure and behavior look in React, Svelte, and Vue so the syntax and framework patterns are easy to compare.

| Directory | Frontend | Backend |
|---|---|---|
| `office-hours-react` | React 19 with JSX, hooks, props, and controlled inputs | Express + sql.js |
| `office-hours-svelte` | Svelte 5 with runes, single-file components, directives, and bindings | Express + sql.js |
| `office-hours-vue` | Vue 3 with Composition API, refs, computed values, directives, and emits | Express + sql.js |

Each version implements the same product flow:

- add recurring office-hour blocks in Settings
- generate bookable weekly slots from those blocks
- book an available slot with student details
- inspect or cancel an existing booking

The server stores data in `office_hours.db` inside the app directory. Removing that file resets the local data.

## Development

Install dependencies once in the app you want to run:

```bash
cd office-hours-react
npm install
```

Run two terminals from that same app directory:

```bash
# Terminal 1: API and static-file server
npm start

# Terminal 2: Vite development server
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`. Vite proxies `/api` requests to the Express server on `http://localhost:3001`.

For Svelte and Vue, use the same commands from `office-hours-svelte` or `office-hours-vue`.

If port 3001 is already in use, start the backend on another port:

```bash
PORT=3101 npm start
```

Then update the `target` in that app's `vite.config.js` proxy to the same port for development. Production can be opened directly on the alternate backend port.

## Production Build

From any app directory:

```bash
npm run build
npm start
```

Then open `http://localhost:3001`. In production mode, Express serves the compiled `dist/` assets and the JSON API from the same origin.

## Concepts Covered

The three READMEs in the app directories explain the framework-specific concepts in more detail. At a high level:

- React demonstrates component functions, JSX, `useState`, `useEffect`, `useCallback`, props, callback props, conditional rendering, keyed lists, and controlled form inputs.
- Svelte demonstrates `.svelte` single-file components, `$state`, `$derived` and `$derived.by`, `$effect`, `$props`, `{#if}` and `{#each}` blocks, `{@const}`, `bind:value`, and `class:` directives.
- Vue demonstrates `.vue` single-file components, `<script setup>`, `ref`, `computed`, `watch`, `defineProps`, `defineEmits`, `v-if`, `v-for`, `v-model`, `@event`, `:class`, and invisible `<template>` loop wrappers.

All three versions also show the same full-stack boundary: the frontend owns UI state and calls `fetch`, while Express validates requests, persists data with sql.js, and computes slots from recurring office-hour rules.

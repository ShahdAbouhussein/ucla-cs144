<script>
  import { DAY_NAMES, fmtTime12 } from "../lib/utils.js";

  let { officeHours, onAdd, onDelete } = $props();

  let day = $state(1);
  let start = $state("10:00");
  let end = $state("12:00");
  let duration = $state(15);

  function handleAdd() {
    onAdd({
      day_of_week: day,
      start_time: start,
      end_time: end,
      slot_duration: duration,
    });
  }
</script>

<div class="settings-panel active">
  <h3>Office Hours Schedule</h3>
  <div class="oh-list">
    {#if officeHours.length === 0}
      <p style="color:#94a3b8;font-size:0.875rem;">
        No office hours configured. Add some below.
      </p>
    {:else}
      {#each officeHours as h (h.id)}
        <div class="oh-item">
          <strong>{DAY_NAMES[h.day_of_week]}</strong>
          <span>{fmtTime12(h.start_time)} &ndash; {fmtTime12(h.end_time)}</span>
          <span style="color:#64748b">({h.slot_duration} min slots)</span>
          {#if h.location}
            <span style="color:#64748b">{h.location}</span>
          {/if}
          <button class="btn btn-danger btn-sm" onclick={() => onDelete(h.id)}>
            Remove
          </button>
        </div>
      {/each}
    {/if}
  </div>
  <div class="oh-form">
    <div>
      <label for="oh-day">Day</label>
      <select id="oh-day" bind:value={day}>
        <option value={0}>Sunday</option>
        <option value={1}>Monday</option>
        <option value={2}>Tuesday</option>
        <option value={3}>Wednesday</option>
        <option value={4}>Thursday</option>
        <option value={5}>Friday</option>
        <option value={6}>Saturday</option>
      </select>
    </div>
    <div>
      <label for="oh-start">Start</label>
      <input id="oh-start" type="time" bind:value={start} />
    </div>
    <div>
      <label for="oh-end">End</label>
      <input id="oh-end" type="time" bind:value={end} />
    </div>
    <div>
      <label for="oh-duration">Slot (min)</label>
      <select id="oh-duration" bind:value={duration}>
        <option value={10}>10</option>
        <option value={15}>15</option>
        <option value={20}>20</option>
        <option value={30}>30</option>
        <option value={60}>60</option>
      </select>
    </div>
    <div>
      <label for="oh-add-btn">&nbsp;</label>
      <button id="oh-add-btn" class="btn btn-primary" onclick={handleAdd}>Add</button>
    </div>
  </div>
</div>

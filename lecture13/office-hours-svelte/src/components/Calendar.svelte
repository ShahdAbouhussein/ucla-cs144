<script>
  import { DAY_SHORT, fmtDate, fmtDateShort, fmtTime12 } from "../lib/utils.js";
  import SlotCell from "./SlotCell.svelte";

  let { currentMonday, slots, onSlotClick } = $props();

  let times = $derived.by(() => {
    const timeSet = new Set();
    for (const s of slots) timeSet.add(s.start_time);
    return [...timeSet].sort();
  });

  let slotMap = $derived.by(() => {
    const map = {};
    for (const s of slots) map[`${s.date}_${s.start_time}`] = s;
    return map;
  });

  let days = $derived.by(() => {
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday);
      d.setDate(d.getDate() + i);
      result.push(d);
    }
    return result;
  });

  const today = fmtDate(new Date());
</script>

{#if slots.length === 0}
  <div class="no-slots-msg">
    No office hours this week. Open <strong>Settings</strong> to add your schedule.
  </div>
{:else}
  <div class="calendar">
    <!-- Header row -->
    <div class="cal-header corner"></div>
    {#each days as d (fmtDate(d))}
      <div class="cal-header" class:today-marker={fmtDate(d) === today}>
        {DAY_SHORT[d.getDay()]}
        <span class="day-date">{fmtDateShort(d)}</span>
      </div>
    {/each}

    <!-- Time rows -->
    {#each times as time (time)}
      <div class="time-label">{fmtTime12(time)}</div>
      {#each days as d (`${fmtDate(d)}_${time}`)}
        {@const dateStr = fmtDate(d)}
        {@const key = `${dateStr}_${time}`}
        {@const slot = slotMap[key]}
        <div class="cal-cell" class:today-marker={dateStr === today}>
          {#if slot}
            <SlotCell {slot} onclick={() => onSlotClick(slot)} />
          {/if}
        </div>
      {/each}
    {/each}
  </div>
{/if}

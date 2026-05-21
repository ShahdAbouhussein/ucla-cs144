<script>
  import { fmtTime12 } from "../lib/utils.js";

  let { slot, onclick } = $props();
</script>

{#if slot.booking}
  <button type="button" class="slot booked" {onclick}>
    <span class="slot-name">{slot.booking.student_name}</span>
    <span class="slot-time">{fmtTime12(slot.start_time)}</span>
  </button>
{:else}
  <button type="button" class="slot available" {onclick}>
    <span class="slot-time">{fmtTime12(slot.start_time)}</span>
    <span style="font-size:0.65rem">Available</span>
  </button>
{/if}

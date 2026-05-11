<script>
  import { DAY_NAMES, fmtTime12 } from "../lib/utils.js";

  let { slot, onClose, onSubmit, onCancel } = $props();

  let name = $state("");
  let email = $state("");
  let topic = $state("");

  let dayName = $derived(DAY_NAMES[new Date(slot.date + "T00:00:00").getDay()]);
  let timeLabel = $derived(fmtTime12(slot.start_time));
  let isBooked = $derived(!!slot.booking);

  function handleSubmit() {
    if (!name.trim()) {
      alert("Student name is required.");
      return;
    }
    onSubmit({
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      student_name: name.trim(),
      student_email: email.trim(),
      topic: topic.trim(),
    });
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay active" onclick={handleOverlayClick}>
  <div class="modal">
    <h3>
      {isBooked ? "" : "Book: "}
      {dayName} {slot.date} at {timeLabel}
    </h3>

    {#if isBooked}
      <div class="booking-detail">
        <p><span class="label">Student:</span> {slot.booking.student_name}</p>
        {#if slot.booking.student_email}
          <p><span class="label">Email:</span> {slot.booking.student_email}</p>
        {/if}
        {#if slot.booking.topic}
          <p><span class="label">Topic:</span> {slot.booking.topic}</p>
        {/if}
        <p>
          <span class="label">Booked:</span>
          {new Date(slot.booking.created_at).toLocaleString()}
        </p>
      </div>
    {:else}
      <div>
        <label for="book-name">Student Name *</label>
        <input id="book-name" type="text" placeholder="e.g. Jane Smith" bind:value={name} />
        <label for="book-email">Email</label>
        <input id="book-email" type="email" placeholder="e.g. jane@university.edu" bind:value={email} />
        <label for="book-topic">Topic</label>
        <textarea id="book-topic" placeholder="What do they need help with?" bind:value={topic}></textarea>
      </div>
    {/if}

    <div class="modal-actions">
      <button class="btn btn-secondary" onclick={onClose}>Cancel</button>
      {#if isBooked}
        <button class="btn btn-danger" onclick={() => onCancel(slot.booking.id)}>
          Cancel Booking
        </button>
      {:else}
        <button class="btn btn-primary" onclick={handleSubmit}>Book</button>
      {/if}
    </div>
  </div>
</div>

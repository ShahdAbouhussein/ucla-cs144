<script>
  let { currentMonday, onChangeWeek } = $props();

  let label = $derived.by(() => {
    const end = new Date(currentMonday);
    end.setDate(end.getDate() + 6);
    const opts = { month: "long", day: "numeric", year: "numeric" };
    return `${currentMonday.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
  });
</script>

<div class="week-nav">
  <button class="btn btn-secondary" onclick={() => onChangeWeek(-1)}>
    &larr; Prev
  </button>
  <h2>{label}</h2>
  <button class="btn btn-secondary" onclick={() => onChangeWeek(1)}>
    Next &rarr;
  </button>
</div>

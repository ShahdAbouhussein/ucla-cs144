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

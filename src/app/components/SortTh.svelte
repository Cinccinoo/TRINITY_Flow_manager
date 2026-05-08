<script>
  export let label;
  export let sortKey;
  export let currentSort;
  export let onSort;

  $: isActive = currentSort.key === sortKey;
  $: dir = isActive ? currentSort.dir : null;
</script>

<th style="cursor: pointer; user-select: none;" on:click={() => onSort(sortKey)}>
  <span class="sort-th-inner">
    {label}
    <span class="sort-indicator" class:active={isActive}>
      {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '⇅'}
    </span>
  </span>
</th>

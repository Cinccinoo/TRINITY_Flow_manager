<script lang="ts">
  import type { FolderNode } from '../FlowManager';

  export let node: FolderNode;
  export let depth: number = 0;
  export let activeCode: string = '';
  export let onSelect: (code: string, name: string) => void;

  let expanded = true;

  $: hasChildren = node.children && node.children.length > 0;

  function toggle(e: Event) {
    e.stopPropagation();
    expanded = !expanded;+
  }

  function select() {
    onSelect(node.code, node.name);
  }
</script>

<div class="tree-node">
  <div
    class="tree-row"
    class:active={activeCode === node.code}
    class:root={node.nodeType === 'ROOT'}
    style="padding-left: {12 + depth * 18}px"
    on:click={select}
    on:keydown={(e) => e.key === 'Enter' && select()}
    role="button"
    tabindex="0"
  >
    {#if hasChildren}
      <span class="toggle" on:click={toggle} on:keydown={(e) => e.key === 'Enter' && toggle(e)} role="button" tabindex="-1">
        {expanded ? '▾' : '▸'}
      </span>
    {:else}
      <span class="toggle-placeholder"></span>
    {/if}
    <span class="folder-icon">{node.nodeType === 'ROOT' ? '📂' : '📁'}</span>
    <span class="node-name">{node.name}</span>
  </div>

  {#if hasChildren && expanded}
    <div class="tree-children">
      {#each node.children as child (child.code)}
        <svelte:self
          node={child}
          depth={depth + 1}
          {activeCode}
          {onSelect}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .tree-node { user-select: none; }

  .tree-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    font-size: 13px;
    color: var(--text2, #5f6777);
    cursor: pointer;
    border-radius: 0;
    transition: background .1s;
    white-space: nowrap;
  }

  .tree-row:hover {
    background: var(--surface2, #f7f8fa);
  }

  .tree-row.active {
    background: var(--dev-light, #eff4ff);
    color: var(--dev, #2563eb);
    font-weight: 600;
    border-right: 3px solid var(--dev, #2563eb);
  }

  .tree-row.root {
    font-weight: 600;
    color: var(--text, #1a1d23);
  }

  .toggle {
    width: 14px;
    font-size: 10px;
    color: var(--text3, #9aa1b0);
    cursor: pointer;
    flex-shrink: 0;
    text-align: center;
    line-height: 1;
  }

  .toggle-placeholder {
    width: 14px;
    flex-shrink: 0;
  }

  .folder-icon {
    font-size: 13px;
    flex-shrink: 0;
  }

  .node-name {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tree-children {
    /* 하위 노드 */
  }
</style>

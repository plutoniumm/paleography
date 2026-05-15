<script lang="ts">
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import { base } from '$app/paths';
  import {
    getTree,
    ancestorChain,
    computeColorMap,
    hasImg,
    type Sym
  } from '$lib/treeData.js';

  export let data: { tree: string };

  let selectedIds = new Set<string>();

  // Reset selection when switching trees
  $: data.tree, (selectedIds = new Set());

  $: tree = getTree(data.tree);
  $: colorMap = computeColorMap(selectedIds, tree.byId);
  $: coloredIds = selectedIds.size > 0
    ? new Set([...selectedIds].flatMap(id => ancestorChain(id, tree.byId)))
    : null;
  $: coloredScripts = coloredIds ? tree.sortedScripts.filter(s => coloredIds!.has(s.id)) : tree.sortedScripts;
  $: uncoloredScripts = coloredIds ? tree.sortedScripts.filter(s => !coloredIds!.has(s.id)) : [];

  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedIds = next;
  }
</script>

<div class="container">
  <nav class="tabs">
    <a class="tab" class:active={data.tree === 'aramaic'} href="{base}/aramaic">Aramaic tree</a>
    <a class="tab" class:active={data.tree === 'latin'} href="{base}/latin">Latin tree</a>
  </nav>

  <h1>
    {data.tree === 'latin' ? 'Latin Script Family' : 'Brahmic Script Evolution'}
    <a class="about-link" href="{base}/{data.tree}/about">sources</a>
  </h1>
  <p class="hint">Click a row to trace its ancestor scripts. Multiple selections compare paths.</p>
  {#if selectedIds.size > 0}
    <button class="clear" transition:slide={{ duration: 200, axis: 'y' }} on:click={() => { selectedIds = new Set(); }}>
      ← deselect all
    </button>
  {/if}

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th class="source-col">Source</th>
          <th class="script-col">Script</th>
          {#each tree.letters as letter}
            <th class:dim={!letter}>{letter as string}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each coloredScripts as row (row.id)}
          {@const rowColor = colorMap.get(row.id)}
          <tr
            animate:flip={{ duration: 300 }}
            class:selected={selectedIds.has(row.id)}
            class:colored={!!rowColor}
            data-script={row.id}
            style={rowColor ? `--row-color: ${rowColor}` : ''}
            on:click={() => toggle(row.id)}
          >
            <td class="source-col">
              {#if row.root && tree.byId[row.root]}
                <span class="source-arrow">›</span>{tree.byId[row.root].name}
              {/if}
            </td>
            <td class="script-col">
              <div class="script-cell">
                <input
                  type="checkbox"
                  class="row-check"
                  checked={selectedIds.has(row.id)}
                  on:click|stopPropagation={() => toggle(row.id)}
                />
                <span class="name">{row.name}</span>
              </div>
            </td>
            {#each row.symbols as sym}
              {@const s = sym as Sym}
              <td class:dim={!sym || sym === ''}>
                {#if hasImg(s)}
                  <img src="{base}{s.img}" alt="" class="glyph" />
                {:else}
                  {s}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
        {#if uncoloredScripts.length > 0}
          <tr class="path-sep" aria-hidden="true">
            <td colspan={2 + tree.letters.length}></td>
          </tr>
          {#each uncoloredScripts as row (row.id)}
            {@const rowColor = colorMap.get(row.id)}
            <tr
              animate:flip={{ duration: 300 }}
              class:selected={selectedIds.has(row.id)}
              class:colored={!!rowColor}
              data-script={row.id}
              style={rowColor ? `--row-color: ${rowColor}` : ''}
              on:click={() => toggle(row.id)}
            >
              <td class="source-col">
                {#if row.root && tree.byId[row.root]}
                  <span class="source-arrow">›</span>{tree.byId[row.root].name}
                {/if}
              </td>
              <td class="script-col">
                <div class="script-cell">
                  <input
                    type="checkbox"
                    class="row-check"
                    checked={selectedIds.has(row.id)}
                    on:click|stopPropagation={() => toggle(row.id)}
                  />
                  <span class="name">{row.name}</span>
                </div>
              </td>
              {#each row.symbols as sym}
                {@const s = sym as Sym}
                <td class:dim={!sym || sym === ''}>
                  {#if hasImg(s)}
                    <img src="{base}{s.img}" alt="" class="glyph" />
                  {:else}
                    {s}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

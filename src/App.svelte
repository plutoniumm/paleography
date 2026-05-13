<script lang="ts">
  import data from './lib/data.json';

  type Sym = string | { img: string };

  interface Script {
    id: string;
    name: string;
    root: string;
    symbols: Sym[];
  }

  const scripts = data.scripts as Script[];

  // Build id → script lookup
  const byId = Object.fromEntries(scripts.map(s => [s.id, s]));

  // Ancestry chain: walk root pointers up to the root
  function ancestors(id: string): Set<string> {
    const chain = new Set<string>();
    let cur: string | undefined = id;
    while (cur && byId[cur]) {
      chain.add(cur);
      const parent = byId[cur].root;
      if (!parent || chain.has(parent)) break;
      cur = parent;
    }
    return chain;
  }

  let selected: string | null = null;
  let activeTab = 'aramaic';

  function toggle(id: string) {
    if (document.startViewTransition) {
      document.startViewTransition(() => { selected = selected === id ? null : id; });
    } else {
      selected = selected === id ? null : id;
    }
  }

  $: visibleIds = selected ? ancestors(selected) : null;
  $: visibleScripts = visibleIds
    ? scripts.filter(s => visibleIds!.has(s.id))
    : scripts;

  function hasImg(s: Sym): s is { img: string } {
    return typeof s === 'object' && s !== null && 'img' in s;
  }
</script>

<div class="container">
  <nav class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'aramaic'}
      on:click={() => activeTab = 'aramaic'}
    >
      Aramaic tree
    </button>
    <button
      class="tab tab-disabled"
      disabled
      title="coming soon"
    >
      Latin tree
    </button>
  </nav>

  {#if activeTab === 'aramaic'}
    <h1>Brahmic Script Evolution</h1>
    {#if selected}
      <button class="clear" on:click={() => { if (document.startViewTransition) { document.startViewTransition(() => { selected = null; }); } else { selected = null; } }}>
        ← show all
      </button>
    {/if}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="source-col">Source</th>
            <th class="script-col">Script</th>
            {#each data.letters as letter}
              <th class:dim={!letter}>{letter as string}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each visibleScripts as row (row.id)}
            <tr
              class:selected={selected === row.id}
              on:click={() => toggle(row.id)}
            >
              <td class="source-col">
                {#if row.root && byId[row.root]}
                  <span class="source-arrow">›</span>{byId[row.root].name}
                {/if}
              </td>
              <td class="script-col">
                <span class="name">{row.name}</span>
              </td>
              {#each row.symbols as sym}
                {@const s = sym as Sym}
                <td class:dim={!sym || sym === ''}>
                  {#if hasImg(s)}
                    <img src={s.img} alt="" class="glyph" />
                  {:else}
                    {s}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

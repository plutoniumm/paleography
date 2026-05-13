<script lang="ts">
  import meta from './lib/scripts.json';
  import symbolsRaw from './lib/symbols.tsv?raw';

  type Sym = string | { img: string };

  interface Script {
    id: string;
    name: string;
    root: string;
    symbols: Sym[];
  }

  // Parse symbols.tsv: rows = scripts, cols = consonant slots
  const tsvRows = symbolsRaw.trim().split('\n').map(r => r.split('\t'));
  const symMap = new Map<string, Sym[]>(
    tsvRows.slice(1).map(row => [
      row[0],
      row.slice(1).map(v => v.startsWith('/img/') ? { img: v } : v) as Sym[]
    ])
  );

  const scripts: Script[] = (meta.scripts as Omit<Script,'symbols'>[]).map(s => ({
    ...s,
    symbols: symMap.get(s.id) ?? Array(38).fill('') as Sym[]
  }));

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
  let selectedLetter: number | null = null;
  let activeTab = 'aramaic';

  function toggle(id: string) {
    const next = selected === id ? null : id;
    selectedLetter = null;
    if (document.startViewTransition) {
      document.startViewTransition(() => { selected = next; });
    } else {
      selected = next;
    }
  }

  function pickLetter(i: number) {
    selectedLetter = selectedLetter === i ? null : i;
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
    <p class="hint">
      Click a row to trace its ancestor scripts.
      {#if selected}While filtered, click any character cell to isolate its evolution across that lineage.{/if}
    </p>
    {#if selected}
      <button class="clear" on:click={() => toggle(selected!)}>
        ← show all scripts
      </button>
      {#if selectedLetter !== null}
        <button class="clear" on:click={() => selectedLetter = null}>
          ← show all characters
        </button>
      {/if}
    {/if}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="source-col">Source</th>
            <th class="script-col">Script</th>
            {#each meta.letters as letter, i}
              {#if selectedLetter === null || selectedLetter === i}
                <th class:dim={!letter}>{letter as string}</th>
              {/if}
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each visibleScripts as row (row.id)}
            <tr
              class:selected={selected === row.id}
              data-script={row.id}
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
              {#each row.symbols as sym, i}
                {#if selectedLetter === null || selectedLetter === i}
                  {@const s = sym as Sym}
                  <td
                    class:dim={!sym || sym === ''}
                    class:letter-cell={selected !== null}
                    on:click|stopPropagation={selected !== null ? () => pickLetter(i) : undefined}
                  >
                    {#if hasImg(s)}
                      <img src={import.meta.env.BASE_URL + s.img.replace(/^\//, '')} alt="" class="glyph" />
                    {:else}
                      {s}
                    {/if}
                  </td>
                {/if}
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

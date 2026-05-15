<script lang="ts">
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { fade, slide } from 'svelte/transition';
  import meta from './lib/scripts.json';
  import latinMeta from './lib/scripts-latin.json';
  import symbolsRaw from './lib/symbols.tsv?raw';
  import latinSymbolsRaw from './lib/symbols-latin.tsv?raw';
  import About from './About.svelte';

  type Sym = string | { img: string };

  interface Script {
    id: string;
    name: string;
    root: string;
    symbols: Sym[];
  }

  interface TreeData {
    letters: string[];
    sortedScripts: Script[];
    byId: Record<string, Script>;
  }

  function parseSymbols(raw: string): Map<string, Sym[]> {
    const rows = raw.trim().split('\n').map(r => r.split('\t'));
    return new Map(
      rows.slice(1).map(row => [
        row[0],
        row.slice(1).map(v => v.startsWith('/img/') ? { img: v } : v) as Sym[]
      ])
    );
  }

  function toposort(arr: Script[]): Script[] {
    const result: Script[] = [];
    const visited = new Set<string>();
    const lookup = Object.fromEntries(arr.map(s => [s.id, s]));
    function visit(s: Script) {
      if (visited.has(s.id)) return;
      visited.add(s.id);
      if (s.root && lookup[s.root]) visit(lookup[s.root]);
      result.push(s);
    }
    for (const s of arr) visit(s);
    return result;
  }

  function buildTree(
    metaFile: { letters: string[]; scripts: Omit<Script, 'symbols'>[] },
    raw: string
  ): TreeData {
    const symMap = parseSymbols(raw);
    const nCols = metaFile.letters.length;
    const scripts: Script[] = metaFile.scripts.map(s => ({
      ...s,
      symbols: symMap.get(s.id) ?? (Array(nCols).fill('') as Sym[])
    }));
    return {
      letters: metaFile.letters,
      sortedScripts: toposort(scripts),
      byId: Object.fromEntries(scripts.map(s => [s.id, s]))
    };
  }

  function ancestorChain(id: string, byId: Record<string, Script>): string[] {
    const chain: string[] = [];
    let cur: string | undefined = id;
    const seen = new Set<string>();
    while (cur && byId[cur]) {
      if (seen.has(cur)) break;
      seen.add(cur);
      chain.push(cur);
      cur = byId[cur].root || undefined;
    }
    return chain.reverse();
  }

  const PURPLE: [number, number, number] = [0x7c, 0x6f, 0xe0];
  const WHITE: [number, number, number] = [255, 255, 255];

  function computeColorMap(ids: Set<string>, byId: Record<string, Script>): Map<string, string> {
    const acc = new Map<string, [number, number, number][]>();
    for (const selId of ids) {
      const chain = ancestorChain(selId, byId);
      chain.forEach((cid, i) => {
        const t = chain.length <= 1 ? 1 : i / (chain.length - 1);
        const color: [number, number, number] = [
          Math.round(PURPLE[0] + (WHITE[0] - PURPLE[0]) * t),
          Math.round(PURPLE[1] + (WHITE[1] - PURPLE[1]) * t),
          Math.round(PURPLE[2] + (WHITE[2] - PURPLE[2]) * t)
        ];
        if (!acc.has(cid)) acc.set(cid, []);
        acc.get(cid)!.push(color);
      });
    }
    const result = new Map<string, string>();
    for (const [cid, colors] of acc) {
      const n = colors.length;
      const sum = colors.reduce<[number, number, number]>(
        (a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]],
        [0, 0, 0]
      );
      result.set(cid, `rgb(${Math.round(sum[0] / n)},${Math.round(sum[1] / n)},${Math.round(sum[2] / n)})`);
    }
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aramTree = buildTree(meta as any, symbolsRaw);
  const latinTree = buildTree(latinMeta, latinSymbolsRaw);

  let activeTab = 'aramaic';
  let selectedIds = new Set<string>();

  let hash = typeof window !== 'undefined' ? window.location.hash : '';
  onMount(() => {
    const onHash = () => { hash = window.location.hash; };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  $: aboutTree = hash.startsWith('#/about/') ? (hash.slice(8) as 'aramaic' | 'latin') : null;

  function switchTab(tab: string) {
    if (activeTab === tab) return;
    activeTab = tab;
    selectedIds = new Set();
  }

  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedIds = next;
  }

  $: tree = activeTab === 'latin' ? latinTree : aramTree;
  $: colorMap = computeColorMap(selectedIds, tree.byId);
  $: coloredIds = selectedIds.size > 0
    ? new Set([...selectedIds].flatMap(id => ancestorChain(id, tree.byId)))
    : null;
  $: coloredCount = coloredIds ? tree.sortedScripts.filter(s => coloredIds!.has(s.id)).length : 0;
  $: visibleScripts = coloredIds
    ? [
        ...tree.sortedScripts.filter(s => coloredIds!.has(s.id)),
        ...tree.sortedScripts.filter(s => !coloredIds!.has(s.id))
      ]
    : tree.sortedScripts;

  function hasImg(s: Sym): s is { img: string } {
    return typeof s === 'object' && s !== null && 'img' in s;
  }
</script>

<div class="container">
  {#if aboutTree}
    <div transition:fade={{ duration: 200 }}>
      <nav class="tabs">
        <a class="tab active" href="#">← Back to tree</a>
      </nav>
      <About tree={aboutTree} />
    </div>
  {:else}
    <nav class="tabs">
      <button
        class="tab"
        class:active={activeTab === 'aramaic'}
        on:click={() => switchTab('aramaic')}
      >
        Aramaic tree
      </button>
      <button
        class="tab"
        class:active={activeTab === 'latin'}
        on:click={() => switchTab('latin')}
      >
        Latin tree
      </button>
    </nav>

    <h1>
      {activeTab === 'latin' ? 'Latin Script Family' : 'Brahmic Script Evolution'}
      <a class="about-link" href={`#/about/${activeTab}`}>sources</a>
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
          {#each visibleScripts as row, idx (row.id)}
            {#if idx === coloredCount && coloredCount > 0}
              <tr class="path-sep" aria-hidden="true">
                <td colspan={2 + tree.letters.length}></td>
              </tr>
            {/if}
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
                    <img src={import.meta.env.BASE_URL + s.img.replace(/^\//, '')} alt="" class="glyph" />
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

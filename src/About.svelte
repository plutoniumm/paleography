<script lang="ts">
  import allSources from './lib/sources.json';

  export let tree: 'aramaic' | 'latin';

  type RefImage = { path: string; caption: string };
  type SourceEntry = {
    unicode_block: string | null;
    source_type: string;
    wikipedia_url: string;
    notes: string;
    reference_images?: RefImage[];
    trace_samples?: string[];
  };

  const treeLabel: Record<string, string> = {
    aramaic: 'Aramaic / Brahmic tree',
    latin: 'Latin / Phoenician tree',
  };

  $: allEntries = Object.entries(
    (allSources as Record<string, Record<string, SourceEntry>>)[tree] ?? {}
  );

  $: unicodeScripts  = allEntries.filter(([, s]) => s.source_type === 'unicode');
  $: wikiImgScripts  = allEntries.filter(([, s]) => s.source_type === 'wikipedia_image');
  $: fontScripts     = allEntries.filter(([, s]) => s.source_type === 'font');
  $: inscriptions    = allEntries.filter(([, s]) => s.source_type === 'inscription');

  function label(id: string) {
    return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // resolve paths relative to vite base
  function src(path: string) {
    return import.meta.env.BASE_URL + path.replace(/^\//, '');
  }
</script>

<div class="about">
  <h1>{treeLabel[tree] ?? tree} — Data Sources</h1>

  <!-- ── Inscription scripts: rich cards ── -->
  {#if inscriptions.length > 0}
    <section>
      <h2>Traced from inscriptions</h2>
      <p class="section-lead">
        These scripts have no Unicode block. Each glyph was hand-traced as an SVG from
        historical stone inscriptions or museum reference charts.
      </p>

      {#each inscriptions as [id, info]}
        <div class="inscription-card">
          <div class="card-header">
            <h3>{label(id)}</h3>
            {#if info.wikipedia_url}
              <a class="wiki-link" href={info.wikipedia_url} target="_blank" rel="noopener">Wikipedia ↗</a>
            {/if}
          </div>
          <p class="card-notes">{info.notes}</p>

          {#if info.reference_images?.length}
            <div class="ref-images">
              {#each info.reference_images as img}
                <figure>
                  <img src={src(img.path)} alt={img.caption} loading="lazy" />
                  <figcaption>{img.caption}</figcaption>
                </figure>
              {/each}
            </div>
          {/if}

          {#if info.trace_samples?.length}
            <div class="traces">
              <span class="traces-label">Traced glyphs</span>
              <div class="trace-grid">
                {#each info.trace_samples as path}
                  <img src={src(path)} alt="" class="trace-glyph" />
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </section>
  {/if}

  <!-- ── Wikipedia image scripts ── -->
  {#if wikiImgScripts.length > 0}
    <section>
      <h2>Wikipedia glyph images</h2>
      <p class="section-lead">
        No dedicated Unicode block exists. Glyph images were sourced from Wikipedia
        reference charts and are stored locally.
      </p>

      {#each wikiImgScripts as [id, info]}
        <div class="wiki-card">
          <div class="card-header">
            <h3>{label(id)}</h3>
            {#if info.wikipedia_url}
              <a class="wiki-link" href={info.wikipedia_url} target="_blank" rel="noopener">Wikipedia ↗</a>
            {/if}
          </div>
          <p class="card-notes">{info.notes}</p>

          {#if info.reference_images?.length}
            <div class="ref-images">
              {#each info.reference_images as img}
                <figure>
                  <img src={src(img.path)} alt={img.caption} loading="lazy" />
                  <figcaption>{img.caption}</figcaption>
                </figure>
              {/each}
            </div>
          {/if}

          {#if info.trace_samples?.length}
            <div class="traces">
              <span class="traces-label">Individual glyphs used</span>
              <div class="trace-grid">
                {#each info.trace_samples as path}
                  <img src={src(path)} alt="" class="trace-glyph" />
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </section>
  {/if}

  <!-- ── Font scripts ── -->
  {#if fontScripts.length > 0}
    <section>
      <h2>Fonts</h2>
      <ul class="plain-list">
        {#each fontScripts as [id, info]}
          <li>
            <strong>{label(id)}</strong> — {info.notes}
            {#if info.wikipedia_url}
              · <a href={info.wikipedia_url} target="_blank" rel="noopener">Wikipedia ↗</a>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <!-- ── Unicode scripts: compact list ── -->
  {#if unicodeScripts.length > 0}
    <section>
      <h2>Unicode</h2>
      <p class="section-lead">All other scripts use their standard Unicode block directly.</p>
      <ul class="plain-list">
        {#each unicodeScripts as [id, info]}
          <li>
            <strong>{label(id)}</strong>
            {#if info.unicode_block}— <code>{info.unicode_block}</code>{/if}
            {#if info.wikipedia_url}
              · <a href={info.wikipedia_url} target="_blank" rel="noopener">Wikipedia ↗</a>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

<style>
  .about { max-width: 760px; }

  h1 {
    font-size: 20px;
    font-weight: 500;
    margin: 0 0 32px;
    display: block;
  }

  h2 {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin: 0 0 12px;
  }

  h3 {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
    color: var(--text);
  }

  section { margin-bottom: 44px; }

  .section-lead {
    font-size: 13px;
    color: var(--muted);
    margin: 0 0 20px;
    line-height: 1.6;
  }

  /* ── Inscription / wiki-image cards ── */
  .inscription-card, .wiki-card {
    border-left: 2px solid var(--accent);
    padding: 0 0 0 16px;
    margin-bottom: 32px;
  }

  .card-header {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;
  }

  .wiki-link {
    font-size: 12px;
    color: var(--muted);
    text-decoration: none;
    &:hover { color: var(--accent); }
  }

  .card-notes {
    font-size: 13px;
    color: var(--muted);
    margin: 0 0 16px;
    line-height: 1.7;
  }

  /* ── Inscription photos ── */
  .ref-images {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  figure {
    margin: 0;
    flex: 1 1 260px;
    max-width: 380px;
  }

  figure img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 4px;
    display: block;
    background: var(--surface);
  }

  figcaption {
    font-size: 11px;
    color: var(--muted);
    margin-top: 6px;
    line-height: 1.5;
  }

  /* ── Trace glyphs ── */
  .traces {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .traces-label {
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  .trace-grid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .trace-glyph {
    width: 32px;
    height: 32px;
    object-fit: contain;
    filter: invert(1);
    background: var(--surface);
    border-radius: 3px;
    padding: 4px;
  }

  /* ── Plain Unicode list ── */
  .plain-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .plain-list li {
    font-size: 13px;
    padding: 5px 0;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
    line-height: 1.5;
    &:last-child { border-bottom: none; }
  }

  strong { color: var(--text); }

  code {
    font-size: 11px;
    color: var(--muted);
    background: var(--surface);
    padding: 1px 5px;
    border-radius: 3px;
  }

  a {
    color: var(--accent);
    text-decoration: none;
    font-size: 12px;
    &:hover { text-decoration: underline; }
  }
</style>

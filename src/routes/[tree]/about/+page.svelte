<script lang="ts">
  import { base } from '$app/paths';
  import About from '$lib/About.svelte';

  export let data: { tree: 'aramaic' | 'latin' };
</script>

<div class="container">
  <nav class="tabs">
    <a class="tab active" href="{base}/{data.tree}">← Back to tree</a>
  </nav>
  <About tree={data.tree} />
</div>

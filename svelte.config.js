import adapter from '@sveltejs/adapter-static';

const base = process.env.BASE ?? '';

/** @type {import('@sveltejs/kit').Config} */
export default {
  kit: {
    adapter: adapter(),
    paths: { base },
    files: {
      assets: 'public'
    }
  }
};

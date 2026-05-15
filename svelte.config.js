import adapter from '@sveltejs/adapter-static';

const base = process.env.BASE?.replace(/\/$/, '') ?? '';

/** @type {import('@sveltejs/kit').Config} */
export default {
  kit: {
    adapter: adapter({ pages: 'dist', assets: 'dist', fallback: null }),
    paths: { base },
    prerender: {
      handleHttpError: 'warn'
    }
  }
};

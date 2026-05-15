import { error } from '@sveltejs/kit';

export const entries = () => [{ tree: 'aramaic' }, { tree: 'latin' }];

export function load({ params }) {
  const { tree } = params;
  if (tree !== 'aramaic' && tree !== 'latin') error(404, 'Not found');
  return { tree };
}

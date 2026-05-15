import meta from './scripts.json';
import latinMeta from './scripts-latin.json';
import symbolsRaw from './symbols.tsv?raw';
import latinSymbolsRaw from './symbols-latin.tsv?raw';

export type Sym = string | { img: string };

export interface Script {
  id: string;
  name: string;
  root: string;
  symbols: Sym[];
}

export interface TreeData {
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

export function ancestorChain(id: string, byId: Record<string, Script>): string[] {
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

export function computeColorMap(ids: Set<string>, byId: Record<string, Script>): Map<string, string> {
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

export function hasImg(s: Sym): s is { img: string } {
  return typeof s === 'object' && s !== null && 'img' in s;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const aramTree = buildTree(meta as any, symbolsRaw);
export const latinTree = buildTree(latinMeta, latinSymbolsRaw);

export function getTree(id: string): TreeData {
  return id === 'latin' ? latinTree : aramTree;
}

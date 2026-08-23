// The order a gallery is browsed in. It belongs to the folder, not to the
// pictures: one list, `src/assets/<folder>/order.md`, naming the files one to a
// line. A file's line is its place, so nothing is numbered and no picture is
// ever rewritten to reorder it.
//
// Everything here is arithmetic on names, so it can be proved without a
// browser. Reading the list at build time is the loader's job; writing it back
// belongs to the dev server and to `netlify/functions/reorder.mts`.

export const ORDER_FILE = 'order.md';

// The names a list holds, in the order it holds them. A blank line says
// nothing, and a line opening with # is a note to a reader.
export function namesInOrder(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
}

// The list as it is written to disk: one name a line, and a first line saying
// what the file is for, since somebody will open it wondering.
export function orderText(names: string[]): string {
  return ['# the order this folder is shown in — one file to a line', '', ...names].join('\n') + '\n';
}

// The photos of one folder, in the order the list names. A file the list does
// not name goes at the end, by file name; a name the folder no longer holds is
// left out. A folder with no list at all keeps the file-name order it has now.
export function inOrder<T extends { name: string }>(photos: T[], names: string[]): T[] {
  const byName = new Map(photos.map((one) => [one.name, one]));
  const listed: T[] = [];
  for (const name of names) {
    const one = byName.get(name);
    if (one) { listed.push(one); byName.delete(name); }
  }
  const rest = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return [...listed, ...rest];
}

// One file moved by a step, and where it now sits. A move off either end is no
// move at all: the list and the place both come back as they were.
export function moved(names: string[], at: number, by: number): { names: string[]; at: number } {
  const to = at + by;
  if (at < 0 || at >= names.length || to < 0 || to >= names.length) { return { names, at }; }
  const now = [...names];
  [now[at], now[to]] = [now[to], now[at]];
  return { names: now, at: to };
}

// Where the highlight lands. It halts at both ends, where stepping a picture
// wraps around.
export function halted(at: number, count: number, by: number): number {
  if (count <= 0) { return 0; }
  return Math.min(count - 1, Math.max(0, at + by));
}

// Two icon shapes borrowed from the di project: the rounded three-bar menu
// mark and the fat-cornered triangle. Each returns the path data for an inline
// drawing, sized to fit a square that is `size` units on each side. Ported from
// di's SVG_Paths so this project needs none of di's geometry types.

function rotate(x: number, y: number, angle: number): [number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [x * cos + y * sin, y * cos - x * sin];
}

function pair(x: number, y: number): string {
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}

// Three stacked, fully-rounded horizontal bars.
export function hamburger(size: number): string {
  const w = size * 0.8;
  const h = size * 0.125;
  const r = h / 2;
  const x = (size - w) / 2;
  const gap = (size - 3 * h) / 4;
  let d = '';
  for (let i = 0; i < 3; i++) {
    const y = gap + i * (h + gap);
    d +=
      `M${x + r},${y}H${x + w - r}` +
      `A${r},${r},0,0,1,${x + w},${y + r}` +
      `A${r},${r},0,0,1,${x + w - r},${y + h}` +
      `H${x + r}` +
      `A${r},${r},0,0,1,${x},${y + h - r}` +
      `A${r},${r},0,0,1,${x + r},${y}Z`;
  }
  return d;
}

// A triangle with softly rounded corners. The default points so a quarter-turn
// lines it up with a folded/unfolded marker.
export function fatTriangle(size: number, angle = Math.PI, vertices = 3): string {
  const segmentAngle = Math.PI / vertices;
  const off = size / 2;
  const inner = size / 3;
  const outer = size / 2;
  const tweak = segmentAngle / 5;
  const corners: { c1: [number, number]; c2: [number, number]; end: [number, number] }[] = [];
  for (let i = 1; i <= vertices; i++) {
    const final = angle + i * segmentAngle * 2;
    const halfWay = final - segmentAngle;
    const [c1x, c1y] = rotate(outer, 0, halfWay - tweak);
    const [c2x, c2y] = rotate(outer, 0, halfWay + tweak);
    const [ex, ey] = rotate(inner, 0, final);
    corners.push({ c1: [c1x + off, c1y + off], c2: [c2x + off, c2y + off], end: [ex + off, ey + off] });
  }
  const start = corners[vertices - 1].end;
  const arcs = corners.map((c) => `C${pair(...c.c1)} ${pair(...c.c2)} ${pair(...c.end)}`);
  return `M${pair(start[0], start[1])} ${arcs.join(' ')}Z`;
}

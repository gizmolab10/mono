/** A number written in thousands once it is past one: 38392 → "38.4k", 213970 → "214k",
 *  984 → "984". One decimal, with a bare ".0" dropped, and the k saying which kind it is —
 *  so a plain count and a thousands count can share a column without reading alike. */
export function in_thousands(n: number): string {
	if (n <= 1000) { return String(n); }
	return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
}

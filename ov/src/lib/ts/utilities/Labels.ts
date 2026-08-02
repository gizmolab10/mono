import type { Labels } from '../types/Guide';

// The five labels at the top of every guide, written back into the file.
//
// Reading them happens where the guides are gathered; this is the other direction. They
// are the one part of a guide the app itself reads, so they are never typed as free text —
// what is written here is built from what a small form was given.

// A title or a description sits inside quote marks, so a quote mark of its own is marked
// as standing for itself, and a stray line break is taken out.
function quoted(words: string): string {
	return `"${words.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ')}"`;
}

// The block itself: three dashes, the five labels in their settled order, three dashes.
export function label_block(labels: Labels, tags: string[]): string {
	return [
		'---',
		`kind: ${labels.kind}`,
		`title: ${quoted(labels.title)}`,
		`description: ${quoted(labels.description)}`,
		`tags: [${tags.join(', ')}]`,
		`date: ${labels.date}`,
		'---',
	].join('\n');
}

// The whole file again, with its label block swapped for this one. A file that carries no
// labels gets one put at the very top, with its words left exactly as they are.
export function with_labels_replaced(text: string, labels: Labels, tags: string[]): string {
	const block = label_block(labels, tags);
	const lines = text.split('\n');
	const ends_at = lines[0]?.trim() === '---'
		? lines.findIndex((line, i) => i > 0 && line.trim() === '---')
		: -1;
	if (ends_at < 1) { return `${block}\n${text}`; }
	return [block, ...lines.slice(ends_at + 1)].join('\n');
}

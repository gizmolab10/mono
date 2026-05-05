#!/usr/bin/env node
// sync-next.mjs
//
// Keeps the "Next" section of the code-debt handoff in lock-step with the
// first unchecked item in code.debt.md. Reads the debt list, finds the first
// "- [ ]" line at any depth (skipping code-fenced blocks), and rewrites the
// handoff's Next section. The block is bounded by HTML markers so re-running
// the script is idempotent.
//
// Run with: node notes/tools/sync-next.mjs
//
// Wired into yarn adherence so every build refreshes the section.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '../..');
const CODE_DEBT = join(ROOT, 'notes/work/now/code.debt.md');
const HANDOFF   = join(ROOT, 'notes/work/now/handoff.md');

function find_first_unchecked(text) {
	const lines = text.split('\n');
	let in_code_block = false;
	for (const line of lines) {
		if (line.match(/^```/)) {
			in_code_block = !in_code_block;
			continue;
		}
		if (in_code_block) continue;
		const m = line.match(/^\s*-\s*\[\s\]\s*(.+)$/);
		if (m) return m[1].trim();
	}
	return null;
}

function build_next_section(item) {
	return [
		'## Next',
		'',
		`The first unchecked code-debt item is "${item}". Pick that up next.`,
		'',
	].join('\n');
}

function rewrite_next(handoff, replacement) {
	// First-run path: find the "## Next" heading and replace everything down
	// to the next "## " heading or the next "---" separator.
	const next_idx = handoff.indexOf('## Next');
	if (next_idx === -1) {
		throw new Error('handoff has no "## Next" heading');
	}
	const after = handoff.slice(next_idx);
	const tail_match = after.slice('## Next'.length).match(/\n##\s|\n---\s*\n/);
	if (!tail_match) {
		throw new Error('cannot find end of Next section (expected next "## " or "---" separator)');
	}
	const tail_offset = next_idx + '## Next'.length + tail_match.index;
	return handoff.slice(0, next_idx) + replacement + handoff.slice(tail_offset);
}

const debt    = readFileSync(CODE_DEBT, 'utf-8');
const item    = find_first_unchecked(debt);
if (!item) {
	process.stderr.write('sync-next: no unchecked items found in code.debt.md\n');
	process.exit(0);
}

const handoff = readFileSync(HANDOFF, 'utf-8');
const updated = rewrite_next(handoff, build_next_section(item));
if (updated === handoff) {
	process.stdout.write(`sync-next: handoff already in sync ("${item}")\n`);
} else {
	writeFileSync(HANDOFF, updated, 'utf-8');
	process.stdout.write(`sync-next: handoff Next section refreshed → "${item}"\n`);
}

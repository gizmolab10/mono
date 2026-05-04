#!/usr/bin/env node
// validate-adherence.mjs
//
// Fixture-driven check for the adherence extractor. Builds two small in-memory
// catalogues (a stipulations file and a test-index file), runs them through
// parse_stipulations / parse_test_index / cross_join, and asserts the expected
// counts of matched, uncovered, and orphan entries.
//
// First pass: three stipulations and three tests, two matched, one uncovered,
// one orphan. Then the orphan test's pointer is flipped to the uncovered
// stipulation's slug; the second pass should report zero uncovered and zero
// orphan.
//
// Exits 0 on success, 1 on failure. Writes a single summary line per pass.
//
// Usage: node notes/tools/validate-adherence.mjs

import { parse_stipulations, parse_test_index, cross_join } from './extract-adherence.mjs';

// Pointer paths must resolve to real files so the file-existence checks pass.
// The validator file itself is a safe target — it is guaranteed to exist
// whenever this script runs.
const POINTER = '(notes/tools/validate-adherence.mjs)';

function build_stipulations_text() {
	return `## Test area

1. First stipulation prose
	- id: stip-one
	- test: [t1]${POINTER}
	- code: [c1]${POINTER}
2. Second stipulation prose
	- id: stip-two
	- test: [t2]${POINTER}
	- code: [c2]${POINTER}
3. Third stipulation prose (uncovered in pass one)
	- id: stip-three
	- test: [t3]${POINTER}
	- code: [c3]${POINTER}
`;
}

function build_test_index_text(third_pointer_slug) {
	return `- **test_one** — pins stip-one
	- stipulation: stip-one
- **test_two** — pins stip-two
	- stipulation: stip-two
- **test_third** — points at ${third_pointer_slug}
	- stipulation: ${third_pointer_slug}
`;
}

function assert_eq(actual, expected, label) {
	if (actual !== expected) {
		process.stdout.write(`FAIL: ${label} — expected ${expected}, got ${actual}\n`);
		process.exit(1);
	}
}

function run_pass(label, stip_text, test_text, expected) {
	const stipulations = parse_stipulations(stip_text);
	const tests = parse_test_index(test_text);
	const result = cross_join(stipulations, tests);
	const summary = `pass ${label}: matched=${result.matched.length}, uncovered=${result.uncovered.length}, orphan=${result.orphan.length}, malformed=${result.malformed.length}`;
	process.stdout.write(summary + '\n');
	assert_eq(result.matched.length, expected.matched, `${label} matched`);
	assert_eq(result.uncovered.length, expected.uncovered, `${label} uncovered`);
	assert_eq(result.orphan.length, expected.orphan, `${label} orphan`);
	assert_eq(result.malformed.length, expected.malformed, `${label} malformed`);
}

const stip_text = build_stipulations_text();

// Pass one — third test points at a slug that does not exist (orphan).
run_pass(
	'one (one uncovered, one orphan)',
	stip_text,
	build_test_index_text('nonexistent-slug'),
	{ matched: 2, uncovered: 1, orphan: 1, malformed: 0 },
);

// Pass two — flip the third test's pointer to the previously uncovered slug.
run_pass(
	'two (all three matched)',
	stip_text,
	build_test_index_text('stip-three'),
	{ matched: 3, uncovered: 0, orphan: 0, malformed: 0 },
);

process.stdout.write('validate-adherence: all assertions pass\n');

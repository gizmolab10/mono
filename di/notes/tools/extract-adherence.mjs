#!/usr/bin/env node
// extract-adherence.mjs
//
// Reads the stipulations catalogue and the test index, cross-joins the two,
// and reports four arrays:
//   - matched pairs (stipulation slug found in some test entry)
//   - uncovered stipulations (stipulation slug not found in any test entry)
//   - orphan tests (test entry references a slug that does not exist)
//   - malformed entries (legacy entries that have started migrating but are incomplete,
//                        or test pointers that do not resolve to a real file,
//                        or duplicate slugs)
//
// A "legacy" stipulation has the old "Covered:" line and no id line. Legacy
// entries are NOT malformed; they are simply not migrated yet. The script
// reports the migrated count and the legacy count separately.
//
// Usage: node notes/tools/extract-adherence.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const STIPULATIONS = join(ROOT, 'notes/guides/project/development/stipulations.md');
const TESTING      = join(ROOT, 'notes/guides/project/development/testing.md');
const AREAS_JSON   = join(ROOT, 'notes/guides/project/development/areas.json');
const DASHBOARD    = join(ROOT, 'notes/guides/project/development/adherence dashboard.md');
const BUILD_STATUS = join(ROOT, 'notes/guides/project/development/build-status.json');
const BUILDS_MD    = join(ROOT, 'src/lib/md/builds.md');

// ─── parse stipulations ────────────────────────────────────────────────

/**
 * @typedef {object} Stipulation
 * @property {string} slug
 * @property {string} area
 * @property {number} line
 * @property {string} prose
 * @property {string|null} test_pointer        raw text after "- test:"
 * @property {string|null} code_pointer        raw text after "- code:"
 * @property {string|null} legacy_covered      raw text after "- Covered:" (legacy)
 */

export function parse_stipulations(text) {
	/** @type {Stipulation[]} */
	const out = [];
	let area = '';
	let current = null;
	let in_code_block = false;
	const lines = text.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.match(/^```/)) {
			in_code_block = !in_code_block;
			continue;
		}
		if (in_code_block) continue;
		const heading = line.match(/^##\s+(.+)$/);
		if (heading) {
			if (current) out.push(current);
			current = null;
			area = heading[1].trim();
			continue;
		}
		const numbered = line.match(/^(\d+)\.\s+(.+)$/);
		if (numbered) {
			if (current) out.push(current);
			current = {
				slug: '',
				area,
				line: i + 1,
				prose: numbered[2].trim(),
				test_pointer: null,
				code_pointer: null,
				legacy_covered: null,
			};
			continue;
		}
		if (!current) continue;
		const id = line.match(/^\s*-\s+id:\s+(\S+)/i);
		if (id) { current.slug = id[1].trim(); continue; }
		const test = line.match(/^\s*-\s+test:\s+(.+)$/i);
		if (test) { current.test_pointer = test[1].trim(); continue; }
		const code = line.match(/^\s*-\s+code:\s+(.+)$/i);
		if (code) { current.code_pointer = code[1].trim(); continue; }
		const legacy = line.match(/^\s*-\s+Covered:\s+(.+)$/i);
		if (legacy) { current.legacy_covered = legacy[1].trim(); continue; }
	}
	if (current) out.push(current);
	return out;
}

// ─── parse test index ─────────────────────────────────────────────────

/**
 * @typedef {object} TestEntry
 * @property {string} name
 * @property {number} line
 * @property {string} description
 * @property {string[]} stipulation_slugs
 */

export function parse_test_index(text) {
	/** @type {TestEntry[]} */
	const out = [];
	let current = null;
	let in_code_block = false;
	const lines = text.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.match(/^```/)) {
			in_code_block = !in_code_block;
			continue;
		}
		if (in_code_block) continue;
		const bullet = line.match(/^-\s+\*\*([\w_]+)\*\*\s*—\s*(.+)$/);
		if (bullet) {
			if (current) out.push(current);
			current = {
				name: bullet[1],
				line: i + 1,
				description: bullet[2].trim(),
				stipulation_slugs: [],
			};
			continue;
		}
		if (!current) continue;
		const stip = line.match(/^\s*-\s+stipulation:\s+(.+)$/i);
		if (stip) {
			current.stipulation_slugs = stip[1].split(',').map(s => s.trim()).filter(Boolean);
			continue;
		}
	}
	if (current) out.push(current);
	return out;
}

// ─── cross-join ────────────────────────────────────────────────────────

export function cross_join(stipulations, tests) {
	const matched = [];
	const uncovered = [];
	const orphan = [];
	const malformed = [];
	const legacy = [];

	const slug_to_stipulation = new Map();
	for (const s of stipulations) {
		if (!s.slug && !s.legacy_covered) {
			malformed.push({ file: 'stipulations.md', line: s.line, reason: 'no id and no legacy Covered line' });
			continue;
		}
		if (!s.slug && s.legacy_covered) {
			legacy.push(s);
			continue;
		}
		if (s.slug && (!s.test_pointer || !s.code_pointer)) {
			malformed.push({
				file: 'stipulations.md',
				line: s.line,
				reason: `migration started but incomplete (slug: "${s.slug}", missing ${[!s.test_pointer && 'test', !s.code_pointer && 'code'].filter(Boolean).join(' and ')})`,
			});
			continue;
		}
		if (slug_to_stipulation.has(s.slug)) {
			malformed.push({ file: 'stipulations.md', line: s.line, reason: `duplicate slug "${s.slug}"` });
			continue;
		}
		slug_to_stipulation.set(s.slug, s);
	}

	const slugs_referenced_by_tests = new Set();
	for (const t of tests) {
		for (const slug of t.stipulation_slugs) {
			slugs_referenced_by_tests.add(slug);
			if (!slug_to_stipulation.has(slug)) {
				orphan.push({ test: t.name, line: t.line, slug });
			}
		}
	}

	for (const [slug, s] of slug_to_stipulation) {
		if (slugs_referenced_by_tests.has(slug)) {
			matched.push({ slug, area: s.area, prose: s.prose });
		} else {
			uncovered.push({ slug, area: s.area, line: s.line, prose: s.prose });
		}
	}

	// resolve test pointers — does the named test file exist?
	for (const s of slug_to_stipulation.values()) {
		const m = s.test_pointer.match(/\(([^)]+)\)/);
		if (!m) {
			malformed.push({ file: 'stipulations.md', line: s.line, reason: `test pointer for "${s.slug}" does not contain a path in parentheses` });
			continue;
		}
		const rel = m[1].replace(/^\.\.\/\.\.\/\.\.\//, '');
		const abs = join(ROOT, rel);
		if (!existsSync(abs)) {
			malformed.push({ file: 'stipulations.md', line: s.line, reason: `test pointer for "${s.slug}" resolves to missing file: ${rel}` });
		}
	}
	for (const s of slug_to_stipulation.values()) {
		const m = s.code_pointer.match(/\(([^)]+)\)/) || s.code_pointer.match(/^(\S+)/);
		if (!m) {
			malformed.push({ file: 'stipulations.md', line: s.line, reason: `code pointer for "${s.slug}" has no path` });
			continue;
		}
		const path_with_lines = m[1].replace(/^\.\.\/\.\.\/\.\.\//, '');
		const path_only = path_with_lines.split(':')[0];
		const abs = join(ROOT, path_only);
		if (!existsSync(abs)) {
			malformed.push({ file: 'stipulations.md', line: s.line, reason: `code pointer for "${s.slug}" resolves to missing file: ${path_only}` });
		}
	}

	return { matched, uncovered, orphan, malformed, legacy };
}

// ─── metrics ──────────────────────────────────────────────────────────

/**
 * @typedef {object} Metrics
 * @property {Array<{area:string, modules:number, stipulations:number, coverage:number|null, status:string}>} coverage_by_area
 * @property {{matched:number, uncovered:number}} test_binding
 * @property {{count:number}} orphan_tests
 * @property {{status:string, note:string}} build_gate
 */

function compute_metrics(result, stipulations, tests, areas_data) {
	// coverage by area
	const stipulations_per_area = new Map();
	for (const s of stipulations) {
		if (s.area) {
			stipulations_per_area.set(s.area, (stipulations_per_area.get(s.area) ?? 0) + 1);
		}
	}
	const coverage_by_area = [];
	for (const [area, modules] of Object.entries(areas_data.areas)) {
		const stipulation_count = stipulations_per_area.get(area) ?? 0;
		let coverage = null;
		let status = 'not yet audited';
		if (modules > 0) {
			coverage = stipulation_count / modules;
			status = coverage >= 1 ? 'green' : 'red';
		}
		coverage_by_area.push({ area, modules, stipulations: stipulation_count, coverage, status });
	}

	// test binding
	const test_binding = {
		matched:   result.matched.length,
		uncovered: result.uncovered.length,
	};

	// orphan tests
	const orphan_tests = { count: result.orphan.length };

	// build-gate health — read from the status file the wrapper writes
	let build_gate;
	try {
		const raw = readFileSync(BUILD_STATUS, 'utf-8');
		const parsed = JSON.parse(raw);
		build_gate = {
			status: parsed.status,
			note:   `from the build at ${parsed.at} (exit code ${parsed.exit_code})`,
		};
	} catch {
		build_gate = {
			status: 'unknown',
			note:   `no build-status file yet; run "yarn adherence" once to record one`,
		};
	}

	return { coverage_by_area, test_binding, orphan_tests, build_gate };
}

// ─── report ────────────────────────────────────────────────────────────

function format_report(result, metrics, total_stipulations, total_tests) {
	const lines = [];
	lines.push('Adherence extraction');
	lines.push('====================');
	lines.push('');
	lines.push(`Stipulations: ${total_stipulations} total`);
	lines.push(`  migrated:  ${result.matched.length + result.uncovered.length}`);
	lines.push(`  legacy:    ${result.legacy.length} (still on the old "Covered:" shape)`);
	lines.push(`  matched:   ${result.matched.length}`);
	lines.push(`  uncovered: ${result.uncovered.length}`);
	lines.push('');
	lines.push(`Test entries: ${total_tests} total`);
	lines.push(`  orphan:    ${result.orphan.length} (slug pointed at no stipulation)`);
	lines.push('');
	lines.push(`Malformed entries: ${result.malformed.length}`);
	lines.push('');
	lines.push('Metrics');
	lines.push('-------');
	lines.push('');
	lines.push(`Test binding — matched: ${metrics.test_binding.matched}, uncovered: ${metrics.test_binding.uncovered}`);
	lines.push(`Orphan tests — ${metrics.orphan_tests.count}`);
	lines.push(`Build-gate — ${metrics.build_gate.status} (${metrics.build_gate.note})`);
	lines.push('');
	lines.push('Coverage by area:');
	for (const row of metrics.coverage_by_area) {
		const cov = row.coverage === null ? '—' : (row.coverage * 100).toFixed(0) + '%';
		lines.push(`  ${row.area.padEnd(46)} stipulations ${String(row.stipulations).padStart(2)}  modules ${String(row.modules).padStart(2)}  coverage ${cov.padStart(4)}  ${row.status}`);
	}
	lines.push('');
	if (result.uncovered.length > 0) {
		lines.push('Uncovered stipulations:');
		for (const u of result.uncovered) {
			lines.push(`  ${u.slug}  (line ${u.line}, area ${u.area})`);
		}
		lines.push('');
	}
	if (result.orphan.length > 0) {
		lines.push('Orphan test slugs:');
		for (const o of result.orphan) {
			lines.push(`  ${o.slug}  (test ${o.test}, line ${o.line})`);
		}
		lines.push('');
	}
	if (result.malformed.length > 0) {
		lines.push('Malformed:');
		for (const m of result.malformed) {
			lines.push(`  ${m.file}:${m.line}  ${m.reason}`);
		}
		lines.push('');
	}
	return lines.join('\n');
}

// ─── main ─────────────────────────────────────────────────────────────

// ─── dashboard markdown ───────────────────────────────────────────────

function read_build_number() {
	try {
		const md = readFileSync(BUILDS_MD, 'utf-8');
		const numbers = md
			.split('\n')
			.map(l => l.match(/^\|\s*(\d+)\s*\|/))
			.filter(Boolean)
			.map(m => parseInt(m[1], 10));
		if (numbers.length === 0) return null;
		return Math.max(...numbers);
	} catch {
		return null;
	}
}

function build_actions(result, metrics) {
	const actions = [];

	if (metrics.build_gate.status !== 'green') {
		actions.push({
			what: `The most recent build did not pass — ${metrics.build_gate.note}.`,
			todo: 'Fix the build before merging new work.',
			owner: 'Jonathan',
		});
	}

	for (const u of result.uncovered) {
		actions.push({
			what: `Rule \`${u.slug}\` (${u.area}) has no test pinned to it.`,
			todo: 'Write a test and add a pointer to it in the test index.',
			owner: 'Jonathan',
		});
	}

	for (const o of result.orphan) {
		actions.push({
			what: `Test ${o.test} (line ${o.line}) names a rule \`${o.slug}\` that does not exist.`,
			todo: 'Either correct the pointer or add the missing rule to the catalogue.',
			owner: 'Jonathan',
		});
	}

	for (const m of result.malformed) {
		actions.push({
			what: `Catalogue entry at ${m.file}:${m.line} is malformed — ${m.reason}.`,
			todo: 'Complete or correct the entry before the next build can pass.',
			owner: 'Jonathan',
		});
	}

	for (const row of metrics.coverage_by_area) {
		if (row.status !== 'red') continue;
		const rule_word = row.stipulations === 1 ? 'rule' : 'rules';
		const module_word = row.modules === 1 ? 'module' : 'modules';
		actions.push({
			what: `Area "${row.area}" has ${row.stipulations} ${rule_word} for ${row.modules} load-bearing ${module_word} — below the one-rule-per-module target.`,
			todo: 'Schedule an extraction sprint for this area: read the modules, write the missing invariants, add them to the catalogue.',
			owner: 'Jonathan',
		});
	}

	if (result.legacy.length > 0) {
		const word = result.legacy.length === 1 ? 'rule remains' : 'rules remain';
		actions.push({
			what: `${result.legacy.length} ${word} on the legacy "Covered:" format.`,
			todo: 'Migrate the next legacy entry to the new id / test pointer / code pointer shape.',
			owner: 'Jonathan',
		});
	}

	return actions;
}

function format_dashboard(result, metrics, build_number, timestamp) {
	const actions = build_actions(result, metrics);
	const lines = [];
	lines.push(`<!-- Generated by notes/tools/extract-adherence.mjs at ${timestamp}. Do not edit by hand. -->`);
	lines.push('');
	lines.push('# Adherence dashboard');
	lines.push('');

	if (actions.length === 0) {
		lines.push('**All clear — no action needed.**');
		lines.push('');
	} else {
		const item_word = actions.length === 1 ? 'item' : 'items';
		lines.push(`**Action needed: ${actions.length} ${item_word}.**`);
		lines.push('');
		for (const a of actions) {
			lines.push(`- **${a.what}** ${a.todo} *Owner: ${a.owner}.*`);
		}
		lines.push('');
	}

	lines.push('---');
	lines.push('');
	lines.push(`*As of build ${build_number ?? '(unknown)'}, generated at ${timestamp}.*`);

	return lines.join('\n') + '\n';
}

function main() {
	const stip_text = readFileSync(STIPULATIONS, 'utf-8');
	const test_text = readFileSync(TESTING, 'utf-8');
	const areas_data = JSON.parse(readFileSync(AREAS_JSON, 'utf-8'));
	const stipulations = parse_stipulations(stip_text);
	const tests = parse_test_index(test_text);
	const result = cross_join(stipulations, tests);
	const metrics = compute_metrics(result, stipulations, tests, areas_data);
	const report = format_report(result, metrics, stipulations.length, tests.length);
	process.stdout.write(report + '\n');

	const build_number = read_build_number();
	const timestamp = new Date().toISOString();
	const dashboard = format_dashboard(result, metrics, build_number, timestamp);
	writeFileSync(DASHBOARD, dashboard, 'utf-8');
	process.stdout.write(`\nDashboard written to ${DASHBOARD}\n`);

	if (result.malformed.length > 0) process.exit(1);
}

const this_file = fileURLToPath(import.meta.url);
if (process.argv[1] === this_file) main();

#!/usr/bin/env node
// build-with-status.mjs
//
// Runs the docs build and records its outcome to a small status file. The
// adherence extractor reads that file on its next run to populate the
// build-gate metric.
//
// The status file lives at notes/guides/project/development/build-status.json
// and contains: { status: "green" | "red", exit_code: <number>, at: <iso> }.
//
// This script always exits with the build's exit code, so callers see a real
// failure when the build fails.

import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const STATUS = join(ROOT, 'notes/guides/project/development/build-status.json');

function run_build() {
	return new Promise(resolve => {
		const child = spawn('yarn', ['docs:build'], {
			cwd:   ROOT,
			stdio: 'inherit',
			shell: false,
		});
		child.on('exit', (code) => resolve(code ?? 1));
		child.on('error', () => resolve(1));
	});
}

const exit_code = await run_build();
const status = exit_code === 0 ? 'green' : 'red';
const at = new Date().toISOString();
writeFileSync(STATUS, JSON.stringify({ status, exit_code, at }, null, '\t') + '\n', 'utf-8');
process.exit(exit_code);

import { defineConfig } from 'vitest/config';

// Run from the repo's top, vitest used to sweep every *.test.ts with no project's own
// settings applied — whole suites failed on import before a single test ran. This file
// names the real suites instead: the three with configs of their own run under them,
// and the three plain-TypeScript suites get a project each. Nothing else is collected.
export default defineConfig({
	test: {
		projects: [
			'di/vitest.config.ts',
			'ws/vitest.config.ts',
			'ov/vitest.config.ts',
			{ test: { name: 'ji', include: ['ji/src/**/*.test.ts'] } },
			{ test: { name: 'lv', include: ['lv/src/**/*.test.ts'] } },
			{ test: { name: 's3', include: ['s3/src/**/*.test.ts'] } },
		],
	},
});

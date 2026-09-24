import { defineConfig, devices } from '@playwright/test';

// Capture the eight first-steps screenshots. Runs against the same dev server
// the regular e2e config uses, but isolated to this folder so the regular
// `yarn e2e` does not pick it up.

const PORT = 5175;

export default defineConfig({
	testDir: '.',
	timeout: 60_000,
	expect: { timeout: 5_000 },
	fullyParallel: false,
	retries: 0,
	reporter: [['list']],
	use: {
		baseURL: `http://localhost:${PORT}/`,
		trace: 'retain-on-failure',
		viewport: { width: 1400, height: 900 },
		deviceScaleFactor: 2,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'yarn dev',
		port: PORT,
		reuseExistingServer: true,
		stdout: 'ignore',
		stderr: 'pipe',
		timeout: 60_000,
		cwd: '../..',
	},
});

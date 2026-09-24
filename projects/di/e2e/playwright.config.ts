import { defineConfig, devices } from '@playwright/test';

// Browser-driven tests for user-flow rules the unit-test runner cannot exercise.
// One browser is enough for these flows; the four tests run on Chromium only.
// The development server is started by the runner; if one is already running
// on the project's port, the runner reuses it.

const PORT = 5175;

export default defineConfig({
	testDir: './tests',
	timeout: 30_000,
	expect: { timeout: 5_000 },
	fullyParallel: false,
	retries: 0,
	reporter: [['list']],
	use: {
		baseURL: `http://localhost:${PORT}/?test=1`,
		trace: 'retain-on-failure',
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
		cwd: '..',
	},
});

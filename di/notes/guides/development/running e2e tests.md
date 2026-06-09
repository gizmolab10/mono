# Running the end-to-end tests

The end-to-end test suite is driven by Playwright. It needs two things running before any spec can pass:

1. A browser instance Playwright can drive. The standard setup is whatever Playwright's default browser install gives you (Chromium-based).
2. The development server. The tests load the app from the running dev server, so the dev server must be up and serving before the suite runs.

When the suite is run without either of these, every spec fails with the same browser-cannot-reach-server error. The error is not informative about which prerequisite is missing — check both first.

Sessions that touch dim-placement logic and want to run the end-to-end specs need to be set up with both pieces from the start. Sessions that only touch unit tests do not need either.

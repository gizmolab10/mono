// Preloads the latin Montserrat files (weights 300, 400) the instant the bundle
// runs, so the browser fetches them in parallel and can have them ready by the
// first paint — this keeps the segment pill from reflowing when the web font
// would otherwise arrive late and swap in over the fallback.
//
// The URLs come from importing the very same files the font CSS points at, so
// the preload matches the font actually used (no double fetch) and there is no
// hardcoded, build-hashed path that could go stale.

import url300 from '@fontsource/montserrat/files/montserrat-latin-300-normal.woff2';
import url400 from '@fontsource/montserrat/files/montserrat-latin-400-normal.woff2';

for (const href of [url400, url300]) {
	const link = document.createElement('link');
	link.rel         = 'preload';
	link.as          = 'font';
	link.type        = 'font/woff2';
	link.crossOrigin = 'anonymous';
	link.href        = href;
	document.head.appendChild(link);
}

// The thin proxy — Phase A of the thin-proxy proposal.
//
// A tiny server that sits on the mac, next to AnythingLLM, and forwards only ji's
// calls. It holds the AnythingLLM address and key on this side, so the browser never
// sees them; ji sends a shared token instead, which this checks and swaps for the real
// key. Only the handful of paths ji actually uses are allowed — everything else is
// refused, so even a valid token can only do ji-shaped things.
//
// No dependencies — Node's own http and global fetch. Run it (Node 18+):
//
//   ANYTHINGLLM_KEY=<key> PROXY_TOKEN=<shared-token> node proxy.mjs
//
// Config comes from the environment, never the repo:
//   ANYTHINGLLM_URL   where AnythingLLM listens        (default http://localhost:3001)
//   ANYTHINGLLM_KEY   the AnythingLLM API key          (required)
//   PROXY_TOKEN       the shared token ji must present  (required)
//   ALLOWED_ORIGIN    the deployed ji's origin for CORS (default *)
//   PORT              the port this listens on          (default 3017)

import http from 'node:http';
import { Readable } from 'node:stream';

const ANYTHINGLLM_URL = (process.env.ANYTHINGLLM_URL || 'http://localhost:3001').replace(/\/+$/, '');
const ANYTHINGLLM_KEY = process.env.ANYTHINGLLM_KEY || '';
const PROXY_TOKEN     = process.env.PROXY_TOKEN || '';
const ALLOWED_ORIGIN  = process.env.ALLOWED_ORIGIN || '*';
const PORT            = Number(process.env.PORT || 3017);

if (!ANYTHINGLLM_KEY || !PROXY_TOKEN) {
	console.error('Proxy: set ANYTHINGLLM_KEY and PROXY_TOKEN in the environment before starting — refusing to run without them.');
	process.exit(1);
}

// The narrow doorway: the only calls ji makes, each a method plus a path matcher. The
// path is matched without its query string; the query rides along when forwarded.
const ALLOW = [
	{ method: 'GET',    re: /^\/api\/v1\/workspaces$/ },                         // find the workspace
	{ method: 'GET',    re: /^\/api\/v1\/workspace\/[^/]+$/ },                   // read its embedded documents
	{ method: 'POST',   re: /^\/api\/v1\/workspace\/new$/ },                     // make the workspace
	{ method: 'POST',   re: /^\/api\/v1\/document\/upload$/ },                   // upload a document's words
	{ method: 'POST',   re: /^\/api\/v1\/document\/raw-text$/ },                 // stash a document's content (side store)
	{ method: 'GET',    re: /^\/api\/v1\/documents$/ },                          // list stored documents (to find a side store)
	{ method: 'GET',    re: /^\/api\/v1\/document\/[^/]+$/ },                    // read one document's details (its side content)
	{ method: 'POST',   re: /^\/api\/v1\/workspace\/[^/]+\/update-embeddings$/ },// embed / un-embed it
	{ method: 'POST',   re: /^\/api\/v1\/workspace\/[^/]+\/chat$/ },             // ask a question
	{ method: 'POST',   re: /^\/api\/v1\/workspace\/[^/]+\/stream-chat$/ },      // ask, answer word-by-word
	{ method: 'GET',    re: /^\/api\/v1\/workspace\/[^/]+\/chats$/ },            // read the saved chat
	{ method: 'DELETE', re: /^\/api\/v1\/system\/remove-documents$/ },          // delete the document
];

function is_allowed(method, pathname) {
	return ALLOW.some((a) => a.method === method && a.re.test(pathname));
}

function set_cors(res) {
	res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function read_body(req) {
	return new Promise((resolve) => {
		const chunks = [];
		req.on('data', (chunk) => chunks.push(chunk));
		req.on('end', () => resolve(Buffer.concat(chunks)));
	});
}

function log(message) {
	console.log(`[proxy] ${message}`);
}

const server = http.createServer(async (req, res) => {
	const method   = req.method || 'GET';
	const path     = req.url || '/';           // includes the query string
	const pathname = path.split('?')[0];
	set_cors(res);

	// Preflight — the browser asks before a cross-origin call.
	if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

	// A token-free health check, so a URL-finder can tell the proxy is up.
	if (method === 'GET' && pathname === '/health') {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ ok: true }));
		return;
	}

	// The lock: the shared token ji presents. No valid token, no call.
	const auth  = req.headers['authorization'] || '';
	const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
	if (token !== PROXY_TOKEN) {
		log(`refused ${method} ${pathname} — bad or missing token.`);
		res.writeHead(401, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ error: 'bad token' }));
		return;
	}

	// The narrow doorway: only ji-shaped calls get through.
	if (!is_allowed(method, pathname)) {
		log(`refused ${method} ${pathname} — not one of ji's calls.`);
		res.writeHead(403, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ error: 'not allowed' }));
		return;
	}

	// Forward to AnythingLLM with the real key swapped in. The body (JSON, or the
	// multipart of an upload) is passed through untouched, with its own content-type.
	try {
		const body    = method === 'GET' ? undefined : await read_body(req);
		const headers = { Authorization: `Bearer ${ANYTHINGLLM_KEY}` };
		const type    = req.headers['content-type'];
		if (type) { headers['Content-Type'] = type; }

		const upstream    = await fetch(`${ANYTHINGLLM_URL}${path}`, { method, headers, body });
		const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
		const out         = { 'Content-Type': contentType };

		// A live answer (the streaming ask) comes as a run of small pieces. Forward each the
		// instant it arrives, and tell every hop in between not to hold pieces back — so the
		// browser sees words appear one at a time instead of the whole answer at once.
		const streaming = contentType.includes('text/event-stream');
		if (streaming) {
			out['Cache-Control']     = 'no-cache';
			out['Connection']        = 'keep-alive';
			out['X-Accel-Buffering']  = 'no';
		}
		res.writeHead(upstream.status, out);

		if (!upstream.body) {
			res.end();
			log(`${method} ${pathname} -> ${upstream.status} (no body).`);
		} else {
			let bytes = 0;
			const stream = Readable.fromWeb(upstream.body);
			stream.on('data', (chunk) => { bytes += chunk.length; });
			stream.on('end',   () => log(`${method} ${pathname} -> ${upstream.status} (${streaming ? 'streamed ' : ''}${bytes} byte(s)).`));
			stream.on('error', (err) => { log(`stream from ${pathname} broke — ${err.message}.`); res.end(); });
			stream.pipe(res);
		}
	} catch (e) {
		log(`forwarding ${method} ${pathname} failed — ${e.message}.`);
		res.writeHead(502, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ error: 'AnythingLLM unreachable' }));
	}
});

server.listen(PORT, () => {
	log(`up on port ${PORT}, forwarding ji's calls to ${ANYTHINGLLM_URL}; origin ${ALLOWED_ORIGIN}.`);
});

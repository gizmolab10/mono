// Adding a file to the repository from the published site.
//
// The file itself arrives in the request, so this only takes what Netlify will
// hand a function — about five megabytes. A photo from a phone fits; a movie
// does not. The larger path is written up in
// `notes/work/editing the published site.md`.
//
// The caption is written inside the file here, and the file is committed the
// long way — a blob, a tree, a commit, then the branch moved. Netlify sees the
// commit and rebuilds.

import { canHoldACaption, stamp } from '../../plugins/stamp';

const REPO = process.env.GITHUB_REPO ?? 'gizmolab10/mono';
const BRANCH = process.env.GITHUB_BRANCH ?? 'main';
const ASSETS = 'gallery/src/assets';
const API = 'https://api.github.com';
const MOST = 5 * 1024 * 1024;

function flatten(folder: string): string {
  return folder.trim().toLowerCase().replace(/[ _-]+/g, '-');
}

function said(request: Request, key: string): string {
  return decodeURIComponent(request.headers.get(key) ?? '');
}

async function ask(path: string, how: RequestInit = {}): Promise<any> {
  const answer = await fetch(`${API}${path}`, {
    ...how,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'content-type': 'application/json',
      ...(how.headers ?? {}),
    },
  });
  if (!answer.ok) { throw new Error(`GitHub said ${answer.status}: ${(await answer.text()).slice(0, 200)}`); }
  return answer.json();
}

// The folder in the repository this name means. The one already there wins;
// where none matches, the name is taken as it was written.
async function folderInRepo(folder: string): Promise<string> {
  const want = flatten(folder);
  const here = await ask(`/repos/${REPO}/contents/${encodeURI(ASSETS)}?ref=${BRANCH}`);
  for (const one of here) {
    if (one.type === 'dir' && flatten(one.name) === want) { return one.name; }
  }
  return folder;
}

async function commit(path: string, bytes: Buffer, message: string): Promise<string> {
  const ref = await ask(`/repos/${REPO}/git/ref/heads/${BRANCH}`);
  const head = ref.object.sha;
  const was = await ask(`/repos/${REPO}/git/commits/${head}`);
  const blob = await ask(`/repos/${REPO}/git/blobs`, {
    method: 'POST',
    body: JSON.stringify({ content: bytes.toString('base64'), encoding: 'base64' }),
  });
  const tree = await ask(`/repos/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: was.tree.sha,
      tree: [{ path, mode: '100644', type: 'blob', sha: blob.sha }],
    }),
  });
  const now = await ask(`/repos/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents: [head] }),
  });
  await ask(`/repos/${REPO}/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: now.sha }),
  });
  return now.sha;
}

export default async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') { return new Response('post only', { status: 405 }); }

  const pass = process.env.LV_PASSPHRASE;
  if (!pass) { return new Response('this site has no passphrase set, so nothing can be added', { status: 503 }); }
  if (said(request, 'x-pass') !== pass) { return new Response('that passphrase is wrong', { status: 401 }); }

  const name = said(request, 'x-name').split('/').pop() ?? '';
  const caption = said(request, 'x-caption');

  try {
    if (!canHoldACaption(name)) { throw new Error(`"${name}" cannot carry a caption — png, jpeg, gif and movies do`); }
    const bytes = Buffer.from(await request.arrayBuffer());
    if (bytes.length > MOST) {
      throw new Error(`"${name}" is ${Math.round(bytes.length / 1024 / 1024)} MB — the site takes 5 MB at most. Add it with the dev server.`);
    }
    const folder = await folderInRepo(said(request, 'x-folder').split('/').pop() ?? '');
    const path = `${ASSETS}/${folder}/${name}`;
    const sha = await commit(path, stamp(name, bytes, caption), `gallery: added "${name}" to ${folder} — "${caption}"`);
    return Response.json({ wrote: `${folder}/${name}`, commit: sha.slice(0, 7) });
  } catch (e) {
    return new Response(String((e as Error).message), { status: 400 });
  }
};

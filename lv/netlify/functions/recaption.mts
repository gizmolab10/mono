// Changing the caption of a file that is already in the repository, from the
// published site.
//
// The page cannot hold the key to the repository — anyone could read it out of
// the page — so this runs at Netlify, where the key is kept, and the page asks
// it to do the writing.
//
// Nothing large travels: the words arrive, the file is read out of GitHub, the
// caption is written inside it, and it is committed back. Netlify sees the
// commit and rebuilds, so the new caption is live a minute or two later.
//
// Adding a new file is a different job — see `notes/work/editing the published
// site.md`.
//
// What Netlify must hold, and the page never does:
//   LV_PASSPHRASE   the word typed once into the browser
//   GITHUB_TOKEN    a token that may write to the repository
//   GITHUB_REPO     owner/name, e.g. gizmolab10/mono   (optional)
//   GITHUB_BRANCH   which branch to commit on          (optional, main)

import { canHoldACaption, stamp } from '../../plugins/stamp';

const REPO = process.env.GITHUB_REPO ?? 'gizmolab10/mono';
const BRANCH = process.env.GITHUB_BRANCH ?? 'main';
const ASSETS = 'lv/src/assets';
const API = 'https://api.github.com';

// A folder name, flattened for matching — the same rule the app uses, so a page
// asking for "the-vineyard" finds the folder called "the vineyard".
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

// The folder in the repository this name means. The one already there wins.
async function folderInRepo(folder: string): Promise<string> {
  const want = flatten(folder);
  const here = await ask(`/repos/${REPO}/contents/${encodeURI(ASSETS)}?ref=${BRANCH}`);
  for (const one of here) {
    if (one.type === 'dir' && flatten(one.name) === want) { return one.name; }
  }
  throw new Error(`no folder called "${folder}" in ${ASSETS}`);
}

// A file's bytes. Anything over a megabyte comes back without its content, and
// is fetched by the name GitHub keeps it under instead.
async function bytesOf(path: string): Promise<{ bytes: Buffer; sha: string }> {
  const one = await ask(`/repos/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`);
  if (one.content) { return { bytes: Buffer.from(one.content, 'base64'), sha: one.sha }; }
  const blob = await ask(`/repos/${REPO}/git/blobs/${one.sha}`);
  return { bytes: Buffer.from(blob.content, 'base64'), sha: one.sha };
}

// A commit holding one changed file. Written the long way — a blob, a tree, a
// commit, then the branch moved — since that path takes a file of any size.
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
  if (!pass) { return new Response('this site has no passphrase set, so nothing can be written', { status: 503 }); }
  if (said(request, 'x-pass') !== pass) { return new Response('that passphrase is wrong', { status: 401 }); }

  const name = said(request, 'x-name').split('/').pop() ?? '';
  const caption = said(request, 'x-caption');

  try {
    if (!canHoldACaption(name)) { throw new Error(`"${name}" cannot carry a caption — png, jpeg, gif and movies do`); }
    const folder = await folderInRepo(said(request, 'x-folder').split('/').pop() ?? '');
    const path = `${ASSETS}/${folder}/${name}`;
    const { bytes } = await bytesOf(path);
    const sha = await commit(path, stamp(name, bytes, caption), `lv: "${name}" now reads "${caption}"`);
    return Response.json({ wrote: `${folder}/${name}`, commit: sha.slice(0, 7) });
  } catch (e) {
    return new Response(String((e as Error).message), { status: 400 });
  }
};

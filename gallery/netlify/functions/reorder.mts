// Changing the order one gallery is shown in, from the published site.
//
// The order belongs to the folder, in one list — `order.md` beside the
// pictures, naming them one to a line. Only that list is written, so a move
// costs a few bytes however heavy the pictures are, and no picture is ever
// rewritten to reorder it.
//
// The page cannot hold the key to the repository — anyone could read it out of
// the page — so this runs at Netlify, where the key is kept, and the page asks
// it to do the writing. Netlify sees the commit and rebuilds, so the new order
// is live a minute or two later.
//
// What Netlify must hold, and the page never does:
//   LV_PASSPHRASE   the word typed once into the browser
//   GITHUB_TOKEN    a token that may write to the repository
//   GITHUB_REPO     owner/name, e.g. gizmolab10/mono   (optional)
//   GITHUB_BRANCH   which branch to commit on          (optional, main)

import { ORDER_FILE, orderText } from '../../src/lib/ts/utilities/order';

const REPO = process.env.GITHUB_REPO ?? 'gizmolab10/mono';
const BRANCH = process.env.GITHUB_BRANCH ?? 'main';
const ASSETS = 'gallery/src/assets';
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

// A commit holding the one changed list. Written the long way — a blob, a tree,
// a commit, then the branch moved — the same path the other three take.
async function commit(path: string, text: string, message: string): Promise<string> {
  const ref = await ask(`/repos/${REPO}/git/ref/heads/${BRANCH}`);
  const head = ref.object.sha;
  const was = await ask(`/repos/${REPO}/git/commits/${head}`);
  const blob = await ask(`/repos/${REPO}/git/blobs`, {
    method: 'POST',
    body: JSON.stringify({ content: text, encoding: 'utf-8' }),
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

  try {
    const folder = await folderInRepo(said(request, 'x-folder').split('/').pop() ?? '');
    // Every name is taken as a bare file name: a line naming a path would write
    // the order of some other folder.
    const names = (await request.text()).split('\n')
      .map((one) => one.trim().split('/').pop() ?? '')
      .filter((one) => one !== '');
    if (names.length === 0) { throw new Error('no order arrived'); }
    const path = `${ASSETS}/${folder}/${ORDER_FILE}`;
    const sha = await commit(path, orderText(names), `gallery: ${folder} is shown in a new order`);
    return Response.json({ wrote: `${folder}/${ORDER_FILE}`, commit: sha.slice(0, 7) });
  } catch (e) {
    return new Response(String((e as Error).message), { status: 400 });
  }
};

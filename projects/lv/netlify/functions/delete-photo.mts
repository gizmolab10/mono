// Throwing a file out of the repository, from the published site.
//
// The same shape as `recaption.mts`: the passphrase is checked here, where the
// key to the repository is kept, and the file is removed in a commit. Netlify
// sees the commit and rebuilds, so the file leaves the site a minute or two
// later.
//
// The file leaves the working files only. Every commit that ever held it still
// holds it, so this frees no room in the repository.

const REPO = process.env.GITHUB_REPO ?? 'gizmolab10/mono';
const BRANCH = process.env.GITHUB_BRANCH ?? 'main';
const ASSETS = 'lv/src/assets';
const API = 'https://api.github.com';

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

async function folderInRepo(folder: string): Promise<string> {
  const want = flatten(folder);
  const here = await ask(`/repos/${REPO}/contents/${encodeURI(ASSETS)}?ref=${BRANCH}`);
  for (const one of here) {
    if (one.type === 'dir' && flatten(one.name) === want) { return one.name; }
  }
  throw new Error(`no folder called "${folder}" in ${ASSETS}`);
}

export default async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') { return new Response('post only', { status: 405 }); }

  const pass = process.env.LV_PASSPHRASE;
  if (!pass) { return new Response('this site has no passphrase set, so nothing can be thrown away', { status: 503 }); }
  if (said(request, 'x-pass') !== pass) { return new Response('that passphrase is wrong', { status: 401 }); }

  const name = said(request, 'x-name').split('/').pop() ?? '';

  try {
    const folder = await folderInRepo(said(request, 'x-folder').split('/').pop() ?? '');
    const path = `${ASSETS}/${folder}/${name}`;
    const one = await ask(`/repos/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`);
    await ask(`/repos/${REPO}/contents/${encodeURI(path)}`, {
      method: 'DELETE',
      body: JSON.stringify({ message: `lv: threw "${name}" out of ${folder}`, sha: one.sha, branch: BRANCH }),
    });
    return Response.json({ threw: `${folder}/${name}` });
  } catch (e) {
    return new Response(String((e as Error).message), { status: 400 });
  }
};

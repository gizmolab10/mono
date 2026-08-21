// Taking a dropped photo and its caption, and writing both into
// `src/assets/<folder>/`. A page in a browser cannot write to disk, so the
// writing happens here, in the dev server, and the page asks for it.
//
// This is a dev-server doorway only: the built site has no server behind it, so
// the edit button does nothing there.

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve, basename } from 'node:path';
import type { Plugin } from 'vite';
import { stamp, canHoldACaption } from './stamp';

const DOORWAY = '/__caption';       // a file arriving, its bytes in the body
const AGAIN = '/__recaption';       // a file already here, its caption alone

// What rides with the file: the folder it belongs to, its name, and its
// caption — each one written as a header, since the body is the file itself.
function said(request: { headers: Record<string, string | string[] | undefined> }, key: string): string {
  const one = request.headers[key];
  return decodeURIComponent(Array.isArray(one) ? (one[0] ?? '') : (one ?? ''));
}

// A folder name, flattened for matching — the same rule the loader uses, so a
// page asking for "the-vineyard" writes into the folder called "the vineyard".
function flatten(folder: string): string {
  return folder.trim().toLowerCase().replace(/[ _-]+/g, '-');
}

// The folder on disk this name means. The one already there wins; where none
// matches, the name is taken as it was written and the folder is made.
async function folderOnDisk(root: string, said: string): Promise<string> {
  const want = flatten(said);
  const here = await readdir(root, { withFileTypes: true }).catch(() => []);
  for (const one of here) {
    if (one.isDirectory() && flatten(one.name) === want) { return one.name; }
  }
  return said;
}

export function captionDrop(assets = 'src/assets'): Plugin {
  const root = resolve(process.cwd(), assets);
  return {
    name: 'caption-drop',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(DOORWAY, (request, response) => {
        if (request.method !== 'POST') { response.statusCode = 405; return response.end('post only'); }
        const chunks: Buffer[] = [];
        request.on('data', (one: Buffer) => chunks.push(one));
        request.on('end', async () => {
          const name = basename(said(request as never, 'x-name'));
          const caption = said(request as never, 'x-caption');
          try {
            const folder = await folderOnDisk(root, basename(said(request as never, 'x-folder')));
            if (!canHoldACaption(name)) { throw new Error(`"${name}" cannot carry a caption — png, jpeg, gif and movies do`); }
            const bytes = stamp(name, Buffer.concat(chunks), caption);
            const where = join(root, folder);
            await mkdir(where, { recursive: true });
            await writeFile(join(where, name), bytes);
            server.config.logger.info(`caption: wrote "${name}" into ${folder} — "${caption}"`);
            response.setHeader('content-type', 'application/json');
            response.end(JSON.stringify({ wrote: `${folder}/${name}` }));
          } catch (e) {
            // Said out loud as well as sent back: a refusal that only reaches
            // the screen leaves the log saying nothing happened at all.
            server.config.logger.error(`caption: nothing written for "${name}" — ${(e as Error).message}`);
            response.statusCode = 400;
            response.end(String((e as Error).message));
          }
        });
      });

      // The caption of a file already in the folder. The words arrive; the
      // bytes never move.
      server.middlewares.use(AGAIN, (request, response) => {
        if (request.method !== 'POST') { response.statusCode = 405; return response.end('post only'); }
        const name = basename(said(request as never, 'x-name'));
        const caption = said(request as never, 'x-caption');
        void (async () => {
          try {
            const folder = await folderOnDisk(root, basename(said(request as never, 'x-folder')));
            if (!canHoldACaption(name)) { throw new Error(`"${name}" cannot carry a caption — png, jpeg, gif and movies do`); }
            const path = join(root, folder, name);
            const bytes = stamp(name, await readFile(path), caption);
            await writeFile(path, bytes);
            server.config.logger.info(`caption: "${name}" in ${folder} now reads "${caption}"`);
            response.setHeader('content-type', 'application/json');
            response.end(JSON.stringify({ wrote: `${folder}/${name}` }));
          } catch (e) {
            server.config.logger.error(`caption: "${name}" unchanged — ${(e as Error).message}`);
            response.statusCode = 400;
            response.end(String((e as Error).message));
          }
        })();
      });
    },
  };
}

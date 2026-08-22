---
kind: specify
title: "Editing the published site"
description: "How a photo dropped on the live site reaches the repository: straight to remote hosted storage, then a function stamps it and commits."
tags: [now, proposal]
date: 2026-08-21
---
# Editing the published site

Today a caption can only be written while `yarn dev` runs: the writing is done by the dev server, and the published site has no server behind it. This is how the published site does it too.

## Built — changing a caption on a file already in the repository

`lv/netlify/functions/recaption.mts`. Nothing large travels: the page sends the words, the function reads that file out of GitHub, writes the caption inside it, and commits it back. Netlify sees the commit and rebuilds. The 28 MB gif and the 53 MB movie are already in the repository, so their captions can be changed this way with no remote hosted storage at all.

The page picks its doorway by where it is running: the dev server while `yarn dev` runs, Netlify on the published site. The published one asks for a passphrase, typed once and remembered in that browser; a wrong one is forgotten so the next try asks again.

**Netlify must hold three things**, and the page holds none of them:

```text
LV_PASSPHRASE   the word typed once into the browser
GITHUB_TOKEN    a token that may write to gizmolab10/mono
GITHUB_REPO     owner/name — optional, gizmolab10/mono unless said
GITHUB_BRANCH   which branch — optional, main unless said
```

Until `LV_PASSPHRASE` is set, the function answers that nothing can be written, and writes nothing.

### Setting them, once

**At GitHub — make the token**

1. github.com → your avatar → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
2. Repository access: **Only select repositories** → `gizmolab10/mono`. Permissions → Repository permissions → **Contents: Read and write**. Nothing else.
3. Generate, and copy the token — GitHub shows it once.

**At Netlify — set them**

4. app.netlify.com → the **littlecloudvineyard** site → **Site configuration** → **Environment variables** → **Add a variable** → **Add a single variable**.
5. Add each, scoped to **Functions**: `LV_PASSPHRASE` and `GITHUB_TOKEN` (the one you copied). `GITHUB_REPO` and `GITHUB_BRANCH` can be skipped — `gizmolab10/mono` and `main` are what the function uses unless told otherwise.
6. **Deploys** → **Trigger deploy** → **Deploy site**. A function only sees a variable that was set before it was deployed.

**Then, in the browser**

7. On the live site, turn editing on and change a caption. The browser asks for the word; type it. It is remembered there, and a wrong one is forgotten, so the next try asks again.

The commit is made the long way — a blob, a tree, a commit, then the branch moved — because that path takes a file of any size, where the plain one stops at a megabyte.

**One limit not yet met:** Netlify gives a function ten seconds. Reading fifty megabytes out of GitHub and committing it back may take longer, so the movie may fail where a photo will not. If it does, the answer is to do that work in the background and stop waiting for it.

## Still to build — adding a large file

## The path a new file takes

1. **The page asks for somewhere to put it.** It sends the file's name and the passphrase to a Netlify function. The function checks the passphrase and answers with a one-time address to upload to.
2. **The browser sends the file straight to the remote hosted storage** — a rented folder on somebody else's computer, reachable at a web address, where each file has its own address and nothing of ours runs. Netlify is not in the way, so nothing caps the size. A Netlify function may only be handed about 5 MB; remote hosted storage takes gigabytes.
3. **The page tells the function it is there**, with the folder and the caption.
4. **The function fetches the file from the remote hosted storage**, writes the caption inside it, and commits it to `lv/src/assets/<folder>/<name>` on `main`.
5. **Netlify sees the commit and rebuilds.** The photo and its caption are live a minute or two later.

Step 4 runs as a background function: a plain one is given ten seconds, and fetching fifty megabytes and committing it takes longer.

## What has to exist first

- **Remote hosted storage** that takes a one-time upload address — Cloudflare R2, Amazon S3, Backblaze B2 all rent it. Cloudflare's first 10 GB is free.
- **Two keys** for it, and **a GitHub token** that may write to `gizmolab10/mono`, all three held by Netlify and never by the page.
- **A passphrase**, held by Netlify, typed once into the browser and remembered there. Without one, anyone who finds the function can write to the repository.

## The cost, said plainly

**Every commit of a large file adds another whole copy to the repository, forever.** Recaptioning that 53 MB movie four times leaves four 53 MB copies in the history, and every clone carries all of them. Git has no way to forget them short of rewriting history.

So there is a fork here, and it is worth taking deliberately:

- **Large media in the repository** — what this plan does. Simple to reason about, and the repository grows without bound.
- **Large media in the remote hosted storage, and nowhere else** — the site reads a list of what the remote hosted storage holds rather than a list of what the build found. The repository stays small, editing needs no commit and no rebuild, and the gallery's list has to come from somewhere new.

The second is the better home for a vineyard's photos and movies. It is also a change to how a gallery finds its pictures, which is why it is written down here rather than assumed.

## Until then

Large files are added with `yarn dev`, or by hand.

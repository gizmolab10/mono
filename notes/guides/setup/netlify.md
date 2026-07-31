---
kind: reference
title: "Netlify Deploys"
description: "The seven published sites, where each one builds from, and how to add another."
tags: [deploy]
date: 2026-07-30
---

# Deploy to Netlify

## Overview

Seven sites are published. Every one of them builds out of the one repo, `gizmolab10/mono` — each project is a folder at the top of it, and Netlify is told which folder to build.

## Current sites

| Site      | Netlify project              | Folder it builds from | Build command    | Publish folder    |
| --------- | ---------------------------- | --------------------- | ---------------- | ----------------- |
| ws app    | webseriously                 | `ws`                  | `yarn build`     | `dist`            |
| ws docs   | webseriously-documentation   | `ws`                  | `yarn docs:build`| `.vitepress/dist` |
| di app    | designintuition              | `di`                  | `yarn build`     | `dist`            |
| di docs   | designintuition-documentation| `di`                  | `yarn docs:build`| `.vitepress/dist` |
| mono docs | monorepo-documentation       | the repo root         | `yarn docs:build`| `.vitepress/dist` |
| lv app    | littlecloudvineyard          | `lv`                  | `yarn build`     | `dist`            |
| ji app    | jeff-intersection            | `ji`                  | `yarn build`     | `dist`            |

The folders and the build commands above are what this repo actually holds. The values Netlify is really running with live in each site's dashboard — this table says what they ought to be, not what was read off the dashboard.

## Where each one lives

| Site      | Netlify address                                     | My own address                     |
| --------- | --------------------------------------------------- | ---------------------------------- |
| ws app    | <https://webseriously.netlify.app>                  | <https://webseriously.org>         |
| ws docs   | <https://webseriously-documentation.netlify.app>    | <https://docs.webseriously.org>    |
| di app    | <https://designintuition.netlify.app>               | <https://designintuition.app>      |
| di docs   | <https://designintuition-documentation.netlify.app> | <https://docs.designintuition.app> |
| mono docs | <https://monorepo-documentation.netlify.app>        | <https://docs.gizmolab.com>        |
| lv app    | <https://littlecloudvineyard.netlify.app>           | <https://littlecloudvineyard.com>  |
| ji app    | <https://jeff-intersection.netlify.app>             | <https://intersection.lol>         |

Every one of these addresses is written down in one place: `notes/tools/hub/ports.json`. Nothing else keeps its own copy.

## Dashboards

Each site's deploy page is `https://app.netlify.com/projects/<netlify project>/deploys` — those, too, are in the ports file. The build settings sit at the same address with `/settings/build-and-deploy` on the end.

## Docs settings files

| Site      | Settings file              |
| --------- | -------------------------- |
| ws docs   | `ws/.vitepress/config.mts` |
| di docs   | `di/.vitepress/config.mts` |
| mono docs | `.vitepress/config.mts`    |

(ga, ma and s3 each carry one of these too, but none of them is published.)

**Important:** there are no `netlify.toml` files anywhere in the repo — every build setting lives in the Netlify dashboard.

## Is it building?

The hub answers this:

```bash
# every site
curl http://localhost:5171/deploy-status

# one site
curl http://localhost:5171/deploy-status/ws
curl http://localhost:5171/deploy-status/di-docs
```

It hands back whether the site is building, done or broken, when the build started and finished, and what went wrong if anything did. It needs `NETLIFY_ACCESS_TOKEN` set.

## Adding a new site

1. In Netlify, start a new site from the `gizmolab10/mono` repo.
2. Set the folder it builds from to the project's folder name (`ji`, `ov`, …), or leave it at the repo root for the main docs.
3. Set the build command: `yarn build` for an app, `yarn docs:build` for docs.
4. Set the publish folder: `dist` for an app, `.vitepress/dist` for docs.
5. Rename the Netlify site to match the naming above.
6. Write the site address and its deploy page into that project's entry in `notes/tools/hub/ports.json`. An app uses the plain names, docs use the docs ones. Add the custom address too, if it has one.

That last step is usually the whole of it. The hub's deploy-status list builds itself from the ports file, and so do the hub's buttons for a live site, a published site and a deploy page — an entry that gains an address gains its button.

Two things do **not** build themselves:

- **A brand-new project needs a button.** Add it to the project row, give it a free letter on the keyboard, and add it to both the app list and the docs list in `notes/tools/hub/index.html`.
- **A local dev server needs a line.** Give the project a port in the ports file, then add it to the site list in `notes/tools/hub/servers.sh` (read the port, one line saying how to start it, and add its name to the list the script accepts).

## When it goes wrong

### The build fails on a docs settings file

1. Look at the line number in the error.
2. Look for a missing comma after a `link:` line.
3. Run `notes/tools/docs/update-project-docs.sh` to rebuild the sidebar with the commas right.

### It built the wrong thing

1. Check the folder-to-build-from setting in the dashboard.
2. It has to be the project's folder name (`di`), not the repo root — unless it *is* the main docs, which build from the root.
3. Make sure no `netlify.toml` has appeared; one would quietly override the dashboard.

### "No content change"

Not an error. Netlify skips a build when nothing changed, and the hub hides these.

### Nothing happened after i pushed

1. Check the repo is `gizmolab10/mono`, not one of the old standalone ones.
2. Check the branch is `main`.
3. Check auto-publishing is on in the dashboard.

## Clearing out old deploys (Jonathan only)

`notes/tools/scripts/delete-netlify-deploys.sh` clears old deploys away.

### Setup

Add to `~/.zshrc`:

```bash
export NETLIFY_ACCESS_TOKEN="your-token-here"
```

Then: `source ~/.zshrc`

### Getting the token

1. Log in to Netlify at <https://app.netlify.com>
2. Click your avatar (top right) → **User settings**
3. In the left sidebar, click **Applications**
4. Scroll to **Personal access tokens**
5. Click **New access token**
6. Give it a name you'll recognize (e.g. `macbook-pro-2024`)
7. Click **Generate token**
8. **Copy it right then** — it's never shown again

### Running it

```bash
~/GitHub/mono/notes/tools/scripts/delete-netlify-deploys.sh
```

### Keeping the token safe

- Tokens don't expire on their own — look them over now and then
- Revoke at: <https://app.netlify.com/user/applications#personal-access-tokens>
- If one leaks: revoke it, make a new one, update `~/.zshrc`

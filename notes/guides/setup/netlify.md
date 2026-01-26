# Deploy to Netlify

## Overview

The monorepo has 5 deployable sites across 3 projects. All deploy from the `gizmolab10/mono` repo.

## Current Sites

| Site | Netlify Project | Base Dir | Build Command | Publish Dir |
|------|-----------------|----------|---------------|-------------|
| ws app | webseriously | `projects/ws` | `yarn build` | `dist` |
| ws docs | webseriously-documentation | `projects/ws` | `yarn docs:build` | `.vitepress/dist` |
| di app | designintuition | `projects/di` | `yarn build` | `dist` |
| di docs | designintuition-documentation | `projects/di` | `yarn docs:build` | `.vitepress/dist` |
| mono docs | monorepo-documentation | `sites/docs` | `yarn docs:build` | `.vitepress/dist` |

## Public URLs

| Site | Netlify URL | Custom Domain |
|------|-------------|---------------|
| ws app | https://webseriously.netlify.app | https://webseriously.org |
| ws docs | https://webseriously-documentation.netlify.app | https://docs.webseriously.org |
| di app | https://designintuition.netlify.app | https://designintuition.app |
| di docs | https://designintuition-documentation.netlify.app | https://docs.designintuition.app |
| mono docs | https://monorepo-documentation.netlify.app | https://docs.gizmolab.com |

## Dashboard URLs

- ws app: https://app.netlify.com/projects/webseriously/settings/build-and-deploy
- ws docs: https://app.netlify.com/projects/webseriously-documentation/settings/build-and-deploy
- di app: https://app.netlify.com/projects/designintuition/settings/build-and-deploy
- di docs: https://app.netlify.com/projects/designintuition-documentation/settings/build-and-deploy
- mono docs: https://app.netlify.com/projects/monorepo-documentation/settings/build-and-deploy

## Config Files

Each docs site has its own VitePress config:

| Site | Config Path |
|------|-------------|
| ws docs | `projects/ws/.vitepress/config.mts` |
| di docs | `projects/di/.vitepress/config.mts` |
| mono docs | `sites/docs/.vitepress/config.mts` |

**Important:** No `netlify.toml` files — all build settings are in the Netlify dashboard.

## Check Deploy Status

The hub API provides deploy status:

```bash
# All sites
curl http://localhost:5171/deploy-status

# Single site
curl http://localhost:5171/deploy-status/ws
curl http://localhost:5171/deploy-status/di-docs
```

Returns:
- `state`: `building`, `ready`, or `error`
- `created_at`: when deploy started
- `published_at`: when deploy finished
- `error_message`: if failed

Requires `NETLIFY_ACCESS_TOKEN` environment variable.

## Troubleshooting

### Deploy fails with syntax error in config.mts

1. Check the error line number
2. Look for missing comma after `link:` property
3. Run `update-project-docs.sh` to regenerate sidebar with correct syntax

### Deploy builds wrong content

1. Check Netlify base directory setting in dashboard
2. Must match project path (e.g., `projects/di` not `/`)
3. Verify no `netlify.toml` file exists (they override dashboard settings)

### "No content change" error

Not a real error — Netlify skips builds when nothing changed. The hub filters these out.

### Deploy not triggered after push

1. Check the repo is `gizmolab10/mono` (not old standalone repos)
2. Check the branch is `main`
3. Check auto-publishing is enabled in Netlify dashboard

## Adding a New Site

1. Create site in Netlify → Import existing project → GitHub → `gizmolab10/mono`
2. Set Base directory to the project path (e.g., `projects/newproject`)
3. Set Build command (`yarn build` for app, `yarn docs:build` for docs)
4. Set Publish directory (`dist` for app, `.vitepress/dist` for docs)
5. Rename site to follow naming convention
6. Add to `sites/api.py` NETLIFY_SITES dict
7. Add to `sites/index.html` config
8. Add to `sites/ports.json` if it has a local dev server

## Deploy Cleanup (Jonathan only)

The `delete-netlify-deploys.sh` script cleans up old Netlify deploys.

### Setup

Add to `~/.zshrc`:

```bash
export NETLIFY_ACCESS_TOKEN="your-token-here"
```

Then: `source ~/.zshrc`

### Getting the Netlify Token

1. Log in to Netlify at https://app.netlify.com
2. Click your avatar (top right) → **User settings**
3. In the left sidebar, click **Applications**
4. Scroll to **Personal access tokens**
5. Click **New access token**
6. Give it a descriptive name (e.g., `macbook-pro-2024`)
7. Click **Generate token**
8. **Copy the token immediately** — you won't be able to see it again

### Running the Script

```bash
~/GitHub/mono/notes/tools/scripts/delete-netlify-deploys.sh
```

### Token Security

- Tokens don't expire by default — review periodically
- Revoke at: https://app.netlify.com/user/applications#personal-access-tokens
- If compromised: revoke immediately, create new one, update `~/.zshrc`

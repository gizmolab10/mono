# Deploy Architecture

## Overview

The monorepo has 6 deployable sites across 3 projects.

## Sites

| Site | Netlify Project | Repo | Base Dir | Build Command | Publish Dir |
|------|-----------------|------|----------|---------------|-------------|
| ws app | webseriously | mono | `projects/ws` | `yarn build` | `dist` |
| ws docs | webseriously-documentation | mono | `projects/ws` | `yarn docs:build` | `.vitepress/dist` |
| di app | designintuition | mono | `projects/di` | `yarn build` | `dist` |
| di docs | designintuition-documentation | mono | `projects/di` | `yarn docs:build` | `.vitepress/dist` |
| mono docs | monorepo-documentation | mono | `sites/docs` | `yarn docs:build` | `.vitepress/dist` |
| hub | ? | mono | `sites` | `python3 -m http.server` | N/A (local only) |

## Config Files

Each docs site has its own VitePress config:

| Site | Config Path |
|------|-------------|
| ws docs | `projects/ws/.vitepress/config.mts` |
| di docs | `projects/di/.vitepress/config.mts` |
| mono docs | `sites/docs/.vitepress/config.mts` |

## Local Dev Ports

Defined in `sites/ports.json`:

| Site | Port |
|------|------|
| hub | 5170 |
| api | 5171 |
| ws app | 5172 |
| di app | 5173 |
| ws docs | 5174 |
| di docs | 5175 |
| mono docs | 5176 |

## Tools

| Tool | Path | Purpose |
|------|------|---------|
| servers.sh | `sites/servers.sh` | Start/restart local dev servers |
| api.py | `sites/api.py` | API for hub UI |
| update-project-docs.sh | `tools/docs/update-project-docs.sh` | Rebuild docs + sync sidebar |
| sync-sidebar.ts | `tools/docs/lib/sync-sidebar.ts` | Generate sidebar from filesystem |

## Current Status

### ✅ Done

- [x] Deleted all `netlify.toml` files (dashboard settings now control builds)
- [x] Fixed `sync-sidebar.ts` to detect project context (ws/di vs mono)
- [x] Fixed comma bug in `sync-sidebar.ts` formatItem function
- [x] Relaxed Node version constraint in ws (`>=20.19.0`)
- [x] Fixed di-docs Netlify base directory (`/` → `projects/di`)

### ⚠️ Needs Verification

- [ ] Verify di-docs Netlify base directory is set to `projects/di`
- [ ] Verify di app Netlify base directory is set to `projects/di`
- [ ] Verify ws app Netlify base directory is set to `projects/ws`
- [ ] Verify ws docs Netlify base directory is set to `projects/ws`
- [ ] Verify mono docs Netlify base directory is set to `sites/docs`
- [ ] Recompile `sync-sidebar.ts` (`cd tools/docs && npx tsc`)
- [ ] Test rebuild-docs for each project (ws, di, mono)
- [ ] Verify all 5 Netlify sites deploy successfully

### ❌ Not Yet Done

- [ ] Verify all Netlify sites are connected to `gizmolab10/mono` repo (not old standalone repos)
- [ ] Document how to add a new project to the monorepo
- [ ] Add lint/validation for config.mts files before commit
- [ ] Consider pre-commit hook to catch syntax errors

## Netlify Dashboard URLs

- ws app: https://app.netlify.com/projects/webseriously/settings/build-and-deploy
- ws docs: https://app.netlify.com/projects/webseriously-documentation/settings/build-and-deploy
- di app: https://app.netlify.com/projects/designintuition/settings/build-and-deploy
- di docs: https://app.netlify.com/projects/designintuition-documentation/settings/build-and-deploy
- mono docs: https://app.netlify.com/projects/monorepo-documentation/settings/build-and-deploy

## Troubleshooting

### Check Deploy Status

The API provides deploy status from Netlify:

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

Requires `NETLIFY_ACCESS_TOKEN` environment variable (already in zshrc).

### Deploy fails with syntax error in config.mts

1. Check the error line number
2. Look for missing comma after `link:` property
3. Fix manually or run `update-project-docs.sh` after fixing `sync-sidebar.ts`

### Deploy builds wrong content

1. Check Netlify base directory setting
2. Must match project path (e.g., `projects/di` not `/`)
3. Check that `netlify.toml` doesn't exist (deleted)

### Rebuild-docs hangs in hub

1. API may be hung - restart it: `kill -9 $(lsof -ti :5171); cd ~/GitHub/mono/sites && python3 api.py &`
2. Or use `restart-api` alias if configured

### Manual restart doesn't restart API

By design - API can't restart itself. Use `restart-api` alias separately.

# Deploy to Netlify

How to add a new site to Netlify for any project/mode combination.

## Prerequisites

- Netlify account with access to the team
- GitHub repo connected to Netlify
- Project builds locally (`yarn build` or `yarn docs:build`)

## Site Naming Convention

Sites follow the pattern: `{project}` or `{project}-docs`

| Project | Mode | Netlify Site Name |
|---------|------|-------------------|
| ws | dev | webseriously |
| ws | docs | webseriously-docs |
| di | dev | di |
| di | docs | di-docs |
| shared | docs | shared-docs |

## Steps to Add a New Site

### 1. Create the Site in Netlify

1. Log in to [Netlify](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Select **GitHub**
4. Choose the repository (e.g., `gizmolab10/di`)
5. Configure build settings (leave base directory blank):

| Project | Mode | Build command     | Publish directory            | Done |
| ------- | ---- | ----------------- | ---------------------------- | ---- |
| ws      | dev  | `yarn build`      | `dist`                       | yes  |
| ws      | docs | `yarn docs:build` | `notes/docs/.vitepress/dist` | yes  |
| di      | dev  | `yarn build`      | `dist`                       | no   |
| di      | docs | `yarn docs:build` | `notes/docs/.vitepress/dist` | no   |
| shared  | docs | `yarn docs:build` | `notes/docs/.vitepress/dist` | no   |

6. Click **Deploy**

### 2. Rename the Site

Netlify assigns a random name. Change it:

1. Go to **Site settings** → **General** → **Site details**
2. Click **Change site name**
3. Enter the name from the naming convention above
4. Save

### 3. Get the Site ID

1. Go to **Site settings** → **General** → **Site details**
2. Copy the **Site ID** (a UUID like `0770f16d-e009-48e8-a548-38a5bb2c18f5`)
3. Add to project's `notes/tools/config.sh`:
   ```bash
   NETLIFY_SITE_ID="your-site-id-here"
   ```

### 4. Update dev-hub.html Config

Add URLs to the config in `dev-hub.html`:

```javascript
di: {
  port: 5174,
  site: 'di',
  public: 'https://di.netlify.app',  // ← add this
  repo: 'https://github.com/gizmolab10/di',
  deploy: 'https://app.netlify.com/sites/di/deploys',
  dns: 'https://app.netlify.com/sites/di/settings/domain',
  bubble: null
}
```

### 5. Verify Deployment

1. Push a change to the repo
2. Check Netlify dashboard for build status
3. Visit the public URL to confirm it works
4. Test the **Public** button in dev-hub.html

## Troubleshooting

### Build fails

- Check build command matches what works locally
- Verify publish directory path is correct
- Check Netlify build logs for specific errors

### Site not updating

- Confirm the branch is set correctly (usually `main`)
- Check if auto-publishing is enabled in **Site settings** → **Build & deploy**

### Custom domain

See **Site settings** → **Domain management** to add a custom domain.

## Current Deployments

| Site | Status | URL |
|------|--------|-----|
| webseriously | ✅ | https://webseriously.netlify.app |
| webseriously-docs | ✅ | https://webseriously-docs.netlify.app |
| di | ❌ | (not deployed) |
| di-docs | ❌ | (not deployed) |
| shared-docs | ❌ | (not deployed) |

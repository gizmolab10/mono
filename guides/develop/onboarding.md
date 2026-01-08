# Developer Onboarding

How to set up a new machine for development on these projects.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Clone the Repos](#clone-the-repos)
- [Make Scripts Executable](#make-scripts-executable)
- [Install Dependencies](#install-dependencies)
- [Compile Shared Tools](#compile-shared-tools)
- [Open in VSCode](#open-in-vscode)
- [Verify Setup](#verify-setup)
- [Project-Specific Config](#project-specific-config)
- [Daily Workflow](#daily-workflow)
- [Troubleshooting](#troubleshooting)
- [Questions?](#questions)

## Prerequisites

You'll need these installed first:

- **Node.js** (v20 or later) — JavaScript runtime
- **Yarn** — package manager (preferred over npm)
- **Git** — version control
- **VSCode** — editor (recommended)

### Installing Prerequisites on Mac

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js via nvm (recommended for managing Node versions)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# Restart terminal, then:
nvm install 20
nvm use 20

# Install Yarn
npm install -g yarn

# Install Git (usually pre-installed on Mac, but just in case)
brew install git

# Install VSCode
brew install --cask visual-studio-code
```

## Clone the Repos

All three repos must be siblings in the same parent directory:

```bash
cd ~/GitHub

# Clone all three as siblings
git clone git@github.com:gizmolab10/shared.git shared
git clone git@github.com:gizmolab10/webseriously.git ws
git clone git@github.com:gizmolab10/di.git di
```

Your folder structure should look like:

```
~/GitHub/
  shared/
  ws/
  di/
```

**Important:** The relative paths between repos matter. Scripts and configs assume this sibling structure.

## Make Scripts Executable

The shared tools include shell scripts that need execute permission:

```bash
chmod +x ~/GitHub/shared/tools/*.sh
```

## Install Dependencies

Each project has its own dependencies:

```bash
# Shared tools (for TypeScript compilation)
cd ~/GitHub/shared/tools
yarn install

# Webseriously
cd ~/GitHub/ws
yarn install

# Di
cd ~/GitHub/di
yarn install
```

## Compile Shared Tools

The TypeScript tools need to be compiled before use:

```bash
cd ~/GitHub/shared/tools
npx tsc
```

This creates `.js` files in each project's `notes/tools/dist/` directory.

## Open in VSCode

Open each repo as a separate VSCode window:

```bash
code ~/GitHub/shared
code ~/GitHub/ws
code ~/GitHub/di
```

Or create a workspace that includes all three.

## Verify Setup

### Test shared tools

```bash
cd ~/GitHub/ws
bash ~/GitHub/shared/tools/analyze-counts.sh .
```

Should print file/line counts for the codebase.

### Test webseriously

```bash
cd ~/GitHub/ws
yarn dev
```

Should start the dev server. Open http://localhost:5173 in your browser.

### Test di

```bash
cd ~/GitHub/di
yarn dev
```

Should start the dev server. Open http://localhost:5174 in your browser.

### Test docs build (webseriously)

```bash
cd ~/GitHub/ws
yarn docs:dev
```

Should start the VitePress docs server.

## Project-Specific Config

Each project has a config file at `notes/tools/config.sh` with project-specific settings:

```bash
# Example: ws/notes/tools/config.sh
NOTES_DIR="notes"
DOCS_SOURCE_DIR="notes/designs"
DOCS_OUTPUT="src/lib/ts/files/Docs.ts"
NETLIFY_SITE_ID="0770f16d-e009-48e8-a548-38a5bb2c18f5"
```

You shouldn't need to edit these unless you're setting up a new project.

## Daily Workflow

### Starting work

1. Pull latest changes from all repos:
   ```bash
   cd ~/GitHub/shared && git pull
   cd ~/GitHub/ws && git pull
   cd ~/GitHub/di && git pull
   ```

2. Start the dev server for whichever project you're working on:
   ```bash
   cd ~/GitHub/ws && yarn dev
   # or
   cd ~/GitHub/di && yarn dev
   ```

### Making changes

1. Edit files in VSCode
2. Save — the dev server hot-reloads automatically
3. Test in browser

### Committing

```bash
cd ~/GitHub/ws  # or whichever repo you changed
git add .
git commit -m "describe your changes"
git push
```

### If you edited shared

Remember to push shared separately:

```bash
cd ~/GitHub/shared
git add .
git commit -m "describe your changes"
git push
```

And tell teammates to pull shared.

## Troubleshooting

### "command not found: yarn"

Yarn isn't installed. Run:
```bash
npm install -g yarn
```

### "permission denied" when running scripts

Scripts aren't executable. Run:
```bash
chmod +x ~/GitHub/shared/tools/*.sh
```

### Dev server won't start

Dependencies might be missing or outdated:
```bash
cd ~/GitHub/ws  # or di
rm -rf node_modules
yarn install
```

### TypeScript errors in shared/tools

Compile the TypeScript:
```bash
cd ~/GitHub/shared/tools
npx tsc
```

### Git permission denied

Your SSH key isn't set up. Follow GitHub's guide:
https://docs.github.com/en/authentication/connecting-to-github-with-ssh

## Questions?

Ask Jonathan. Or check the guides in `shared/guides/` — especially:
- `collaborate/chat.md` — how to work with Claude effectively
- `collaborate/docs.md` — how the shared architecture works
- `develop/style.md` — code conventions

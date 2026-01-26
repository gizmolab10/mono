# Developer Onboarding

How to set up a new machine for development on the monorepo.

## Prerequisites

- **Node.js** (v20 or later)
- **Yarn** — package manager
- **Git**
- **VSCode** (recommended)

### Installing on Mac

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# Restart terminal, then:
nvm install 20
nvm use 20

# Install Yarn
npm install -g yarn

# Install Git (usually pre-installed on Mac)
brew install git

# Install VSCode
brew install --cask visual-studio-code
```

## Clone the Repo

```bash
cd ~/GitHub
git clone git@github.com:gizmolab10/mono.git mono
```

Your folder structure:

```
~/GitHub/
  mono/
    CLAUDE.MD
    notes/
    ws/
    di/
    package.json
```

## Install Dependencies

```bash
cd ~/GitHub/mono
yarn install
```

This installs dependencies for the root and all workspaces (ws, di).

## Verify Setup

### Test ws app

```bash
cd ~/GitHub/mono/ws
yarn dev
```

Open http://localhost:5172

### Test di app

```bash
cd ~/GitHub/mono/di
yarn dev
```

Open http://localhost:5173

### Test docs

```bash
cd ~/GitHub/mono
yarn docs:dev
```

Opens the unified docs site.

## Daily Workflow

### Starting work

```bash
cd ~/GitHub/mono
git pull
```

Then start whichever dev server you need.

### Making changes

1. Edit files in VSCode
2. Save — dev server hot-reloads
3. Test in browser

### Committing

```bash
cd ~/GitHub/mono
git add .
git commit -m "describe your changes"
git push
```

## Troubleshooting

### "command not found: yarn"

```bash
npm install -g yarn
```

### Dev server won't start

```bash
cd ~/GitHub/mono
rm -rf node_modules
yarn install
```

### Git permission denied

Set up SSH key: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

## Next Steps

- Read `CLAUDE.MD` for project context
- Check `notes/guides/collaborate/` for how to work with Claude
- Check `notes/guides/setup/` for deployment and tooling docs

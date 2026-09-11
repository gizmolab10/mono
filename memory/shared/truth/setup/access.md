# Giving Claude Filesystem Access

Quick guide for setting up Claude Desktop to access your local filesystem.

## Why This Matters

By default, Claude can't access your local files. Setting up filesystem access lets Claude:
- Read files from your repo
- Write/modify files directly
- Run commands in your project directory
- Work with your actual codebase instead of uploaded copies

## Setup Steps

### 1. Open Claude Desktop Settings
- Click "Claude" menu → "Settings" (or `Cmd+,`)

### 2. Go to Developer Tab
- Look for "Developer" or "Advanced" settings

### 3. Enable MCP/Filesystem Access
- Look for "Model Context Protocol" or "MCP Servers"
- There should be a filesystem server option

### 4. Add Your Project Directory

**Option A: Through UI**
- Add `~/GitHub/YOUR_PROJECT` to allowed directories

**Option B: Edit Config File**

The MCP config is at:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Edit it to add:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/YOUR_USERNAME/GitHub/YOUR_PROJECT"]
    }
  }
}
```

### 5. Restart Claude Desktop

After restarting, Claude will have access to your project directory.

## What Claude Can Do After Setup

With filesystem access configured:
- ✅ Read any file in your project
- ✅ Write/modify files in the repo
- ✅ Run commands like `yarn docs:build`
- ✅ Create new files
- ✅ Search through your codebase

## Security Note

Claude will only have access to the specific directory you configure. It cannot access other parts of your filesystem unless you explicitly add them to the allowed directories list.

## Verification

To test if it's working, ask Claude to:
- Read a file: "Read the package.json file"
- List directory: "List the files in src/lib"
- Run a command: "Run yarn docs:build"

If Claude can do these things, the setup worked!

## Troubleshooting

**Disconnect error when restarting Claude Desktop**
- The error may appear on startup but filesystem access still works afterward
- Test by asking Claude to read a file. If it works, ignore the error.

**Config issues**
- Use `"command": "npx"` (not the full path to npx)
- Check JSON syntax carefully — valid JSON has no trailing commas
- Test the MCP server directly:
  ```bash
  npx -y @modelcontextprotocol/server-filesystem ~/GitHub/YOUR_PROJECT
  ```

**"Can't cd to ~/GitHub/YOUR_PROJECT"**
- Filesystem access isn't configured yet
- Try the manual config file method above

**Commands still fail**
- Make sure you restarted Claude Desktop after editing config
- Check that the path in the config is exactly right

## Alternative: Manual Upload/Download

If you don't want to set up filesystem access, you can still work with Claude by:
- Uploading specific files to the chat when needed
- Claude creates files on its filesystem, then provides download links
- You manually save downloaded files to your repo

This works but is slower and more manual than direct filesystem access.

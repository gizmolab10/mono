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

### 4. Add Your Webseriously Directory

**Option A: Through UI**
- Add `/Users/sand/GitHub/webseriously` to allowed directories

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
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/sand/GitHub/webseriously"]
    }
  }
}
```

### 5. Restart Claude Desktop

After restarting, Claude will have access to your webseriously directory.

## What Claude Can Do After Setup

With filesystem access configured:
- ✅ Read any file in `/Users/sand/GitHub/webseriously`
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

## Disabling MCP (If You're Having Issues)

If you're experiencing persistent disconnect errors even when the MCP server test succeeds, you can disable MCP entirely and use the manual upload/download workflow instead.

### How to Disable MCP

1. **Edit your config file** at:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

2. **Remove the `mcpServers` section**, leaving just:
   ```json
   {
     "preferences": {
       "quickEntryShortcut": {
         "accelerator": "Alt+Space"
       }
     }
   }
   ```

3. **Restart Claude Desktop** - should start without disconnect errors

### Working Without MCP

With MCP disabled, the workflow becomes:
- **Upload files**: Attach specific files to the chat when Claude needs them
- **Claude works on its filesystem**: Claude creates/edits files in `/home/claude` and `/mnt/user-data/outputs`
- **Download results**: Claude provides download links for files you want to save to your repo
- **You save manually**: Download files and save them to your webseriously repo yourself

It's more manual, but it works reliably without MCP connection issues.

### Note About Filesystem Tools

The `Filesystem:` tools you see Claude using in claude.ai (like `Filesystem:read_text_file`, `Filesystem:edit_file`) are a different MCP server built into the web interface. Those are separate from the Claude Desktop MCP filesystem integration and will continue working even if you disable MCP in Claude Desktop.

## Preventing Intermittent Disconnect Errors

If you're seeing intermittent "MCP filesystem: Server disconnected" or "write EPIPE" errors:

### 1. Check MCP Server Configuration
- Open Claude Desktop → Settings → Developer Settings
- Review your MCP server configuration for the filesystem server
- Look for timeout or connection settings you can adjust

### 2. Restart MCP Server
- Sometimes a clean restart establishes a more stable connection
- Restart Claude Desktop entirely (quit and relaunch)

### 3. Check System Resources
- Close other heavy applications that might compete for resources
- Open Activity Monitor and check for processes consuming excessive CPU/memory
- MCP server disconnects can happen under resource pressure
- Note: Claude can't check your local processes remotely - you need to check Activity Monitor yourself

### 4. Update Claude Desktop
- Ensure you're running the latest version
- Connection stability improvements are ongoing
- Check for updates in Claude Desktop settings or About menu

### 5. Monitor for Patterns
- Note when disconnects happen (startup, during long operations, etc.)
- If errors appear but filesystem access still works afterward, they may be ignorable
- Test actual functionality: ask Claude to read a file to verify access works
- **Verification method**: Ask Claude to run `Filesystem:list_directory` or read a known file

### Results from Testing (Dec 31, 2024)

**Filesystem Access Status**: ✅ Working
- Successfully verified access to `/Users/sand/GitHub/webseriously` twice
- `Filesystem:list_directory` returned full directory listing
- MCP server appears functional despite intermittent error messages

**Conclusion**: These prevention steps have failed to eliminate the intermittent errors. The "Server disconnected" and "write EPIPE" errors may appear but can be safely ignored. **Note**: There is no way to suppress these error notifications in Claude Desktop - no UI setting exists to hide them.

**🔖 RESUME POINT: Intermittent MCP errors are appearing but filesystem access is confirmed working**

## Troubleshooting

**Disconnect error when restarting Claude Desktop**
- This is the most common issue - happens when Claude Desktop can't load the MCP server
- **However**: The error may appear on startup but filesystem access still works afterward
- **Check if it's actually broken**: Try asking Claude to read a file from your repo. If it works, you can ignore the disconnect error.

If filesystem access is actually broken:
1. Use `"command": "npx"` (not the full path to npx)
2. Check JSON syntax carefully - valid JSON has no trailing commas, matching brackets
3. Test the MCP server directly:
   ```bash
   npx -y @modelcontextprotocol/server-filesystem /Users/sand/GitHub/webseriously
   ```
   If this succeeds but Claude Desktop still disconnects, the issue is with Claude Desktop's MCP integration itself, not your config or the MCP server
4. **If MCP server test succeeds but disconnect persists:**
   - This appears to be a Claude Desktop bug with MCP server loading
   - The config is correct and the server works, but Claude Desktop fails to connect
   - Current workaround: Unknown - may require Claude Desktop update
5. If MCP server test fails, the MCP server itself isn't working
6. If all else fails: temporarily delete/rename the config file, restart Claude, then recreate it

**"Can't cd to /Users/sand/GitHub/webseriously"**
- Filesystem access isn't configured yet
- Try the manual config file method above

**Commands still fail**
- Make sure you restarted Claude Desktop after editing config
- Check that the path in the config is exactly right
- Verify the config file syntax is valid JSON

**Using full path to npx causes issues**
- Don't use paths like `/Users/sand/.nvms/versions/node/v20.19.5/bin/npx`
- Just use `"command": "npx"` - Claude Desktop will find it in your PATH

## Alternative: Manual Upload/Download

If you don't want to set up filesystem access, you can still work with Claude by:
- Uploading specific files to the chat when needed
- Claude creates files on its filesystem, then provides download links
- You manually save downloaded files to your repo

This works but is slower and more manual than direct filesystem access.

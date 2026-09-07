# Jonathan-Only Setup

Things only Jonathan needs.

## Netlify Deploy Cleanup

The `delete-netlify-deploys.sh` script cleans up old Netlify deploys. Only Jonathan should run this.

### Setup

Add to `~/.zshrc`:

```bash
export NETLIFY_ACCESS_TOKEN="your-token-here"
```

Then reload:

```bash
source ~/.zshrc
```

### Getting the Netlify Token

1. Log in to Netlify at https://app.netlify.com
2. Click your avatar (top right) → **User settings**
3. In the left sidebar, click **Applications**
4. Scroll to **Personal access tokens**
5. Click **New access token**
6. Give it a descriptive name (e.g., `macbook-pro-2024`)
7. Click **Generate token**
8. **Copy the token immediately** — you won't be able to see it again
9. Paste it in your `~/.zshrc` as shown above
10. Run `source ~/.zshrc` to reload

### Verifying Your Token Works

```bash
curl -H "Authorization: Bearer $NETLIFY_ACCESS_TOKEN" https://api.netlify.com/api/v1/user
```

If valid, you'll see your user info. If invalid:

```json
{"message":"Invalid token"}
```

### Running the Script

```bash
~/GitHub/shared/tools/delete-netlify-deploys.sh
```

### Token Security

- Tokens don't expire by default — review periodically
- Revoke at: https://app.netlify.com/user/applications#personal-access-tokens
- If compromised: revoke immediately, create new one, update `~/.zshrc`

---
kind: howto
title: "Compose an email"
description: "Handing a file on by mail: what the app opens, and why it does nothing on Windows."
tags: [setup]
date: 2026-08-17
---
# compose an email

## Emailing a file from Windows

The ⤴ mark starts a new message with the file already in it. It does that by handing the browser a
`mailto:` address, and the machine decides what opens.

Windows hands `mailto:` to a program it knows about, and a browser tab is not one. Gmail in a tab
never gets it unless two separate things are set: Windows must point `mailto:` at Chrome, and Chrome
must have Gmail registered as its own handler. With Outlook holding that registration instead, the
press works exactly as designed and opens Outlook.

Do Chrome first — Windows will not offer Chrome for mail until Chrome has claimed it.

### In Chrome

1. Three dots at the top right → Settings → Privacy and security → Site settings → Additional
   permissions → Protocol handlers. Make sure "Sites can ask to handle protocols" is on.
2. Go to `mail.google.com` and sign in. Two overlapping diamonds appear at the right end of the
   address bar. Click them, then Allow.
3. If the diamonds never appear, open `chrome://settings/handlers`, remove whatever is listed for
   mail, and reload Gmail.

### In Windows

4. Press Windows + I → Apps → Default apps.
5. Scroll to `MAILTO` in the list of link types. Select what is set there now, choose Google Chrome,
   and press Set default.

### To check

6. Type `mailto:test@example.com` into the address bar and press Return. A Gmail compose window
   should open.

### The second wall

Overview's ⤴ puts the whole file in the body, and that is a separate problem this setup does not
solve. Gmail's handler caps at about 4,096 characters after encoding, counting the address, the
subject and the body together — and Chrome reaches Gmail by putting the whole `mailto:` inside a
second address, so every escape is escaped again. Measured on our own files:

```text
                    raw     once     twice
handoff.md         2151     3225      4289
response.md        3995     5821      7633
code debt.md      20694    32628     44496
```

Every guide is past the ceiling before the doubling. A mac's mail app takes far more, which is why
it has always worked here. Carrying a whole file to Gmail needs another way altogether — the
clipboard, or a file the dispatcher writes and then shows.

ji's ⤴ sends an empty message, so the setup above is the whole of it there:
[Controls.svelte:49-52](../../../../ji/src/lib/svelte/main/Controls.svelte#L49-L52).

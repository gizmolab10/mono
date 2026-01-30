# Workarounds

Tool limitations and how to handle them.

If `filesystem:create_directory` fails → use `bash_tool` with `mkdir -p`

`delete` unavailable → user must delete manually

`view` tool fails on valid paths → use `filesystem:read_text_file` instead

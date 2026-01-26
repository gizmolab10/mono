# Single-Line Progress Display

i wanted my build script to stop spewing noise. One calm line, updating in place, showing what's happening without scrolling my terminal into oblivion.

## The Goal

```
Step 3/7: Building docs... processing sidebar.ts
```

Each sub-item overwrites the last. When the step finishes, the next step takes over. Errors get logged to a file and dumped at the end.

## The Tricks

### Overwriting a Line

```bash
printf "\r\033[K"
```

- `\r` — carriage return (back to start of line)
- `\033[K` — ANSI escape to clear from cursor to end of line

Without the clear, shorter messages leave cruft from longer ones.

### Truncating Long Output

```bash
"${line:0:50}"
```

Bash substring expansion. Keeps lines from wrapping ugly.

### Streaming Command Output

Can't just pipe through `while read` — the exit code gets lost in a subshell. Instead:

```bash
"$@" > "$tmp_out" 2>&1 &
local pid=$!

while kill -0 $pid 2>/dev/null; do
  local last_line=$(tail -1 "$tmp_out")
  [ -n "$last_line" ] && progress_item "$last_line"
  sleep 0.1
done

wait $pid
local exit_code=$?
```

- Run command in background, capture output to temp file
- Poll every 0.1s, show the last line
- `kill -0` checks if process is still running (no signal sent)
- `wait` retrieves the actual exit code

### Capturing Errors

On failure, append the full output to an error log:

```bash
if [ $exit_code -ne 0 ]; then
  echo "=== Step $CURRENT_STEP: $STEP_NAME ===" >> "$ERROR_LOG"
  cat "$tmp_out" >> "$ERROR_LOG"
fi
```

Then dump it at the end instead of making the user hunt for a file.

### Absolute Paths Matter

If your script `cd`s around (mine does for TypeScript compilation), relative paths break. Convert early:

```bash
cd "$PROJECT_ROOT" || exit 1
PROJECT_ROOT=$(pwd)  # Now it's absolute
```

### Verbose Escape Hatch

Sometimes you need the firehose for debugging:

```bash
if [ "$VERBOSE" = true ]; then
  "$@"
  return $?
fi
```

Flag it with `--verbose` and skip all the single-line magic.

## The Result

Seven steps, one line, errors collected. Much calmer.

# Running the Fix Links Tool

## Compilation Required

Since ts-node ESM isn't working, we need to compile TypeScript to JavaScript first.

## Steps to Test:

### 1. Compile TypeScript
```bash
cd /Users/sand/GitHub/webseriously/notes/tools
npx tsc
```

This creates JavaScript files in `notes/tools/dist/`

### 2. Run the test
```bash
cd /Users/sand/GitHub/webseriously
node notes/tools/dist/fix-links.js --test -v
```

### 3. Check results

Look at the console output and verify:
- `notes/work/test-fixtures/index.md` - links updated
- `notes/work/test-fixtures/config.mts` - config updated

## Alternative: Use tsx

If you have tsx installed:
```bash
npx tsx notes/tools/fix-links.ts --test -v
```

## Quick Test Script

Or run this all-in-one:
```bash
cd /Users/sand/GitHub/webseriously/notes/tools && \
npx tsc && \
cd ../.. && \
node notes/tools/dist/fix-links.js --test -v
```

# Tools Testing & Documentation

This directory contains testing resources and documentation for the webseriously tooling.

## Documentation Files

- **PHASE1-FINAL.md** - Complete Phase 1 summary and usage guide
- **PHASE1-COMPLETE.md** - Initial Phase 1 completion report
- **PHASE1-RESULTS.md** - Test results from Phase 1
- **CLAUDE-MD-UPDATED.md** - Documentation of CLAUDE.MD integration
- **HOW-TO-TEST.md** - Testing instructions

## Test Scripts

- **test.sh** - Main test script (in parent directory, runs Phase 1 tests)
  - Uses fixtures in `fixtures/` directory
- **test-fix-links.sh** - Legacy test script
- **test-runner.mjs** - Node-based test runner
- **run-test.sh** - Alternative test runner

## Test Fixtures

Located in `fixtures/` directory:
- `index.md` - Test markdown with various link types
- `advanced/test-moved.md` - File that was "moved"
- `config.mts` - Test VitePress config
- `vitepress.build.txt` - Simulated broken link report

## Main Tools (in parent directory)

- **fix-links.ts** - Automatic broken link fixer
- **update-docs.sh** - Complete update docs workflow
- **lib/** - Shared library components
- **dist/** - Compiled JavaScript output

## Quick Start

To test the fix-links tool:
```bash
cd /Users/sand/GitHub/webseriously
bash notes/tools/test.sh
```

To run the full update docs workflow:
```bash
cd /Users/sand/GitHub/webseriously
bash notes/tools/update-docs.sh
```

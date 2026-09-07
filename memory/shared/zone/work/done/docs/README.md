# Tools Documentation

This directory contains all documentation, testing resources, and legacy code for the webseriously tooling system.

## Structure

```
docs/
├── test/              # Test fixtures and documentation
│   ├── fixtures/      # Test files for fix-links tool
│   │   ├── index.md
│   │   ├── advanced/test-moved.md
│   │   ├── config.mts
│   │   └── vitepress.build.txt
│   ├── README.md      # Testing documentation
│   ├── PHASE1-*.md    # Phase 1 completion docs
│   └── test-*.sh      # Test scripts
├── legacy/            # Old/deprecated tools
│   ├── fix_vitepress_links.sh
│   ├── generate-move-commands.ts
│   └── move-doc.ts
└── test.sh            # Main test runner
```

## Quick Start

### Run Tests
```bash
cd /Users/sand/GitHub/webseriously
bash notes/tools/docs/test.sh
```

### View Documentation
- **Phase 1 Final:** `test/PHASE1-FINAL.md` - Complete guide and usage
- **Testing Guide:** `test/HOW-TO-TEST.md` - How to test the tools

## Main Tools (in parent directory)

- **fix-links.ts** - Automatic broken link fixer (production)
- **update-docs.sh** - Complete update docs workflow (production)
- **lib/** - Shared library components

## Legacy Tools

The `legacy/` directory contains older implementations that have been superseded by the current fix-links tool:
- Old shell-based link fixing
- Manual move-doc commands
- Command generation utilities

These are kept for reference but should not be used in production.

#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { MarkdownParser } from './markdown-parser.js';
import { LinkFinder } from './link-finder.js';
import { ConfigUpdater } from './config-updater.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BrokenLink {
  sourcePath: string;
  targetPath: string;
}

class FixLinks {
  private verbose: boolean = false;
  private buildFilePath: string;
  private repoRoot: string;
  private configPath: string;
  private stats = {
    fixed: 0,
    deleted: 0,
    unfixable: 0,
  };

  constructor(verbose: boolean = false, testMode: boolean = false) {
    this.verbose = verbose;
    this.repoRoot = this.findRepoRoot();
    
    if (testMode) {
      // Use test fixtures
      const testDir = path.join(this.repoRoot, 'notes', 'tools', 'docs', 'test', 'fixtures');
      this.buildFilePath = path.join(testDir, 'vitepress.build.txt');
      this.configPath = path.join(testDir, 'config.mts');
    } else {
      this.buildFilePath = path.join(this.repoRoot, 'vitepress.build.txt');
      this.configPath = path.join(this.repoRoot, '.vitepress', 'config.mts');
    }
  }

  private findRepoRoot(): string {
    let currentDir = path.dirname(__dirname);
    
    while (currentDir !== '/') {
      if (fs.existsSync(path.join(currentDir, '.git'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    
    return process.cwd();
  }

  private parseBuildFile(): BrokenLink[] {
    if (!fs.existsSync(this.buildFilePath)) {
      console.warn(`Warning: Build file not found at ${this.buildFilePath}`);
      return [];
    }

    const content = fs.readFileSync(this.buildFilePath, 'utf-8');
    const lines = content.split('\n');
    const brokenLinks: BrokenLink[] = [];

    for (const line of lines) {
      // VitePress format: (!) Found dead link ./../refactor/clicks in file guides/digest.md
      const vitepressMatch = line.match(/Found dead link\s+(.+?)\s+in file\s+(.+)/);
      if (vitepressMatch) {
        const targetPath = vitepressMatch[1].trim();
        const sourceFile = vitepressMatch[2].trim();
        brokenLinks.push({
          sourcePath: sourceFile,
          targetPath: targetPath,
        });
        continue;
      }
      
      // Old format: Dead link: path/to/file.md -> missing-file.md
      const oldMatch = line.match(/Dead link:\s*(.+?)\s*->\s*(.+)/);
      if (oldMatch) {
        brokenLinks.push({
          sourcePath: oldMatch[1].trim(),
          targetPath: oldMatch[2].trim(),
        });
      }
    }

    return brokenLinks;
  }

  async run(): Promise<void> {
    console.log('Fix Broken Links Tool\n');
    console.log(`Build file: ${this.buildFilePath}`);
    console.log(`Config file: ${this.configPath}\n`);

    const brokenLinks = this.parseBuildFile();
    
    if (brokenLinks.length === 0) {
      console.log('No broken links found.');
      return;
    }

    console.log(`Found ${brokenLinks.length} broken link(s)\n`);

    const linksByTarget = new Map<string, BrokenLink[]>();
    for (const link of brokenLinks) {
      if (!linksByTarget.has(link.targetPath)) {
        linksByTarget.set(link.targetPath, []);
      }
      linksByTarget.get(link.targetPath)!.push(link);
    }

    const replacements = new Map<string, string | null>();
    
    for (const [targetPath, links] of linksByTarget.entries()) {
      // Extract just the filename from the target path
      const filename = path.basename(targetPath).replace(/\.md$/, '') + '.md';
      
      if (this.verbose) {
        console.log(`\nProcessing: ${targetPath}`);
        console.log(`  Searching for filename: ${filename}`);
        console.log(`  Referenced in ${links.length} location(s)`);
      }

      const notesDir = path.join(this.repoRoot, 'notes');
      const matches = LinkFinder.findFilesByName(notesDir, filename);

      if (matches.length === 0) {
        console.log(`  ❌ Not found - will DELETE ${links.length} link(s) to: ${targetPath}`);
        replacements.set(targetPath, null);
        this.stats.deleted += links.length;
      } else if (matches.length === 1) {
        const newPath = path.relative(this.repoRoot, matches[0].fullPath);
        console.log(`  ✅ Found at: ${newPath}`);
        replacements.set(targetPath, newPath);
        this.stats.fixed += links.length;
      } else {
        console.log(`  ⚠️  Multiple matches found:`);
        matches.forEach((m, i) => {
          console.log(`    ${i + 1}. ${path.relative(this.repoRoot, m.fullPath)}`);
        });
        const choice = LinkFinder.promptUserChoice(matches, targetPath);
        if (choice) {
          const newPath = path.relative(this.repoRoot, choice);
          replacements.set(targetPath, newPath);
          this.stats.fixed += links.length;
        } else {
          console.log(`  ⚠️  Skipped - marked as unfixable`);
          this.stats.unfixable += links.length;
        }
      }
    }

    console.log('\nUpdating markdown files...');
    const markdownFiles = this.findMarkdownFiles(path.join(this.repoRoot, 'notes'));
    
    for (const mdFile of markdownFiles) {
      const updated = MarkdownParser.updateLinks(mdFile, replacements, this.repoRoot);
      if (updated > 0 && this.verbose) {
        console.log(`  Updated ${updated} link(s) in ${path.relative(this.repoRoot, mdFile)}`);
      }
    }

    if (fs.existsSync(this.configPath)) {
      console.log('\nUpdating VitePress config...');
      try {
        const configUpdated = ConfigUpdater.updateConfig(this.configPath, replacements);
        if (configUpdated > 0 && this.verbose) {
          console.log(`  Updated ${configUpdated} config entry/entries`);
        }
      } catch (error) {
        console.error(`Error updating VitePress config: ${error}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Summary:');
    console.log(`  Fixed: ${this.stats.fixed}`);
    console.log(`  Deleted: ${this.stats.deleted}`);
    console.log(`  Unfixable: ${this.stats.unfixable}`);
    console.log('='.repeat(50));

    if (this.stats.unfixable > 0) {
      process.exit(2);
    } else {
      process.exit(0);
    }
  }

  private findMarkdownFiles(dir: string): string[] {
    const files: string[] = [];
    
    const search = (currentDir: string) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'build', '.vitepress'].includes(entry.name)) {
              search(fullPath);
            }
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${currentDir}: ${error}`);
      }
    };
    
    search(dir);
    return files;
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Fix Broken Links Tool

Usage:
  node fix-links.ts           Run with default settings
  node fix-links.ts -v        Verbose mode (show each change)
  node fix-links.ts --test    Test mode (use test fixtures)
  node fix-links.ts --help    Show this help

Exit codes:
  0 - Success
  1 - Error
  2 - Warning (some operations skipped)
  `);
  process.exit(0);
}

const verbose = args.includes('-v') || args.includes('--verbose');
const testMode = args.includes('--test');
const tool = new FixLinks(verbose, testMode);
tool.run().catch(error => {
  console.error(`Fatal error: ${error}`);
  process.exit(1);
});

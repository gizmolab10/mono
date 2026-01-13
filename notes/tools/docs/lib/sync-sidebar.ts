#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { SidebarGenerator } from './generate-sidebar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface KeptItem {
  text: string;
  content: string;  // Full item text including braces
}

class SyncSidebar {
  private verbose: boolean = false;
  private repoRoot: string;
  private configPath: string;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
    this.repoRoot = this.findRepoRoot();
    this.configPath = path.join(this.repoRoot, '.vitepress', 'config.mts');
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

  /**
   * Extract items marked with // @keep from the sidebar
   */
  private extractKeptItems(sidebarStr: string): KeptItem[] {
    const kept: KeptItem[] = [];
    
    // Find items followed by // @keep
    // Match: { ... }, // @keep or { ... } // @keep
    const regex = /(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})\s*,?\s*\/\/\s*@keep/g;
    let match;
    
    while ((match = regex.exec(sidebarStr)) !== null) {
      const itemContent = match[1];
      // Extract the text property
      const textMatch = itemContent.match(/text:\s*['"]([^'"]+)['"]/);
      if (textMatch) {
        kept.push({
          text: textMatch[1],
          content: itemContent
        });
        if (this.verbose) {
          console.log(`  Found @keep item: ${textMatch[1]}`);
        }
      }
    }
    
    return kept;
  }

  async sync(): Promise<void> {
    console.log(`Syncing sidebar with filesystem...`);

    // Read current config
    if (!fs.existsSync(this.configPath)) {
      console.error(`Error: Cannot find config at ${this.configPath}`);
      process.exit(1);
    }

    const configContent = fs.readFileSync(this.configPath, 'utf-8');
    
    // Extract srcDir and srcExclude from config
    const srcDirMatch = configContent.match(/srcDir:\s*['"](.+?)['"]/);
    const srcExcludeMatch = configContent.match(/srcExclude:\s*\[([^\]]+)\]/);
    
    const srcDir = srcDirMatch ? path.join(this.repoRoot, srcDirMatch[1]) : path.join(this.repoRoot, 'notes', 'designs');
    const srcExclude = srcExcludeMatch 
      ? srcExcludeMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''))
      : [];

    if (this.verbose) {
      console.log(`  Source directory: ${srcDir}`);
      console.log(`  Excluded: ${srcExclude.join(', ')}`);
    }

    // Find sidebar in config using bracket matching
    const sidebarStart = configContent.indexOf('sidebar:');
    if (sidebarStart === -1) {
      console.error('Error: Could not find sidebar in config');
      process.exit(1);
    }

    // Find the opening bracket
    const openBracket = configContent.indexOf('[', sidebarStart);
    if (openBracket === -1) {
      console.error('Error: Could not find sidebar array start');
      process.exit(1);
    }

    // Find matching closing bracket by counting depth
    let depth = 0;
    let closeBracket = -1;
    for (let i = openBracket; i < configContent.length; i++) {
      if (configContent[i] === '[') {
        depth++;
      } else if (configContent[i] === ']') {
        depth--;
        if (depth === 0) {
          closeBracket = i;
          break;
        }
      }
    }

    if (closeBracket === -1) {
      console.error('Error: Could not find sidebar array end');
      process.exit(1);
    }

    const oldSidebarStr = configContent.substring(openBracket, closeBracket + 1);
    
    // Extract @keep items before regenerating
    const keptItems = this.extractKeptItems(oldSidebarStr);
    
    // Count items for stats
    const oldCount = (oldSidebarStr.match(/text:/g) || []).length;

    // Generate new sidebar
    const generator = new SidebarGenerator(srcDir, srcExclude);
    let newSidebar = generator.generateSidebar();
    
    // Filter out items that duplicate @keep items (by text or link)
    const keptTexts = new Set(keptItems.map(k => k.text.toLowerCase()));
    const keptLinks = new Set<string>();
    for (const kept of keptItems) {
      const linkMatch = kept.content.match(/link:\s*['"]([^'"]+)['"]/);
      if (linkMatch) {
        keptLinks.add(linkMatch[1]);
      }
    }
    
    newSidebar = newSidebar.filter(item => {
      const textDupe = keptTexts.has(item.text.toLowerCase());
      const linkDupe = item.link && keptLinks.has(item.link);
      if (textDupe || linkDupe) {
        if (this.verbose) {
          console.log(`  Skipping duplicate: ${item.text}`);
        }
        return false;
      }
      return true;
    });
    
    const newCount = this.countItems(newSidebar);

    // Build new sidebar string with kept items at the top
    const newSidebarStr = this.formatSidebarWithKept(newSidebar, keptItems, 8);

    // Replace sidebar in config
    const newConfigContent = 
      configContent.substring(0, openBracket) +
      newSidebarStr +
      configContent.substring(closeBracket + 1);

    // Create backup
    const backupDir = path.join(this.repoRoot, '.vitepress', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, 'config.mts.backup');
    fs.copyFileSync(this.configPath, backupPath);

    // Write new config
    fs.writeFileSync(this.configPath, newConfigContent);

    const totalNew = newCount + keptItems.length;
    const diff = totalNew - oldCount;
    console.log(`✅ Complete`);
    console.log(`  Items: ${oldCount} → ${totalNew} (${diff >= 0 ? '+' : ''}${diff})`);
    if (keptItems.length > 0) {
      console.log(`  Preserved: ${keptItems.length} @keep item(s)`);
    }
    if (this.verbose) {
      console.log(`  Backup: ${backupPath}`);
    }
  }

  private countItems(sidebar: any[]): number {
    let count = 0;
    for (const item of sidebar) {
      count++;
      if (item.items) {
        count += this.countItems(item.items);
      }
    }
    return count;
  }

  private formatSidebarWithKept(sidebar: any[], keptItems: KeptItem[], indent: number = 8): string {
    const lines: string[] = ['['];
    
    // Add kept items first
    for (const kept of keptItems) {
      // Indent the kept content
      const indentedContent = kept.content
        .split('\n')
        .map((line, i) => i === 0 ? ' '.repeat(indent) + line.trim() : ' '.repeat(indent) + line.trim())
        .join('\n');
      lines.push(indentedContent + ', // @keep');
    }
    
    // Add generated items
    for (let i = 0; i < sidebar.length; i++) {
      const item = sidebar[i];
      const isLast = i === sidebar.length - 1;
      this.formatItem(item, indent, lines, isLast);
    }
    
    lines.push(' '.repeat(indent - 2) + ']');
    return lines.join('\n');
  }

  private formatItem(item: any, indent: number, lines: string[], isLast: boolean): void {
    const pad = ' '.repeat(indent);
    const hasChildren = item.items && item.items.length > 0;
    const displayText = hasChildren ? `${item.text} >` : item.text;
    
    lines.push(pad + '{');
    lines.push(pad + `  text: '${displayText}',`);
    
    if (item.link) {
      if (item.items) {
        lines.push(pad + `  link: '${item.link}',`);
      } else {
        lines.push(pad + `  link: '${item.link}'`);
      }
    }
    
    if (item.collapsed !== undefined) {
      lines.push(pad + `  collapsed: ${item.collapsed},`);
    }
    
    if (item.items && item.items.length > 0) {
      lines.push(pad + `  items: [`);
      for (let i = 0; i < item.items.length; i++) {
        const subItem = item.items[i];
        const subIsLast = i === item.items.length - 1;
        this.formatItem(subItem, indent + 4, lines, subIsLast);
      }
      lines.push(pad + `  ]`);
    }
    
    lines.push(pad + '}' + (isLast ? '' : ','));
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Sync Sidebar Tool

Usage:
  node sync-sidebar.ts         Sync sidebar with filesystem
  node sync-sidebar.ts -v      Verbose mode
  node sync-sidebar.ts --help  Show this help

Description:
  Scans the /notes/designs directory and updates the VitePress sidebar
  to match the actual filesystem structure.

  The tool:
  - Adds links to directories with index.md files
  - Skips index.md files in the item list
  - Respects srcExclude directories from config
  - Preserves items marked with // @keep
  - Creates backup (.vitepress/config.mts.backup)

To keep a sidebar item from being removed, add // @keep after it:

    {
      text: 'Project',
      link: '/project'
    }, // @keep

Exit codes:
  0 - Success
  1 - Error
  `);
  process.exit(0);
}

const verbose = args.includes('-v') || args.includes('--verbose');

const tool = new SyncSidebar(verbose);
tool.sync().catch(error => {
  console.error(`Fatal error: ${error}`);
  process.exit(1);
});

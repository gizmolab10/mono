#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { MarkdownParser } from './markdown-parser.js';
import { ConfigUpdater } from './config-updater.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Section {
  heading: string;
  level: number;
  content: string;
  startLine: number;
  endLine: number;
}

class MergeFiles {
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
   * Parse markdown file into sections by heading
   */
  private parseSections(content: string): Section[] {
    const lines = content.split('\n');
    const sections: Section[] = [];
    let currentSection: Section | null = null;
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = currentContent.join('\n');
          currentSection.endLine = i - 1;
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          heading: headingMatch[2].trim(),
          level: headingMatch[1].length,
          content: '',
          startLine: i,
          endLine: i,
        };
        currentContent = [line];
      } else if (currentSection) {
        currentContent.push(line);
      } else {
        // Content before first heading - treat as preamble
        if (sections.length === 0) {
          sections.push({
            heading: '__preamble__',
            level: 0,
            content: line,
            startLine: i,
            endLine: i,
          });
        } else {
          sections[0].content += '\n' + line;
          sections[0].endLine = i;
        }
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n');
      currentSection.endLine = lines.length - 1;
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Check if two sections have similar content (for deduplication)
   */
  private areSectionsSimilar(section1: Section, section2: Section): boolean {
    // Simple similarity check - headings match
    if (section1.heading.toLowerCase() === section2.heading.toLowerCase()) {
      return true;
    }

    // Content similarity (more than 80% similar)
    const content1 = section1.content.trim().toLowerCase();
    const content2 = section2.content.trim().toLowerCase();
    
    if (content1 === content2) {
      return true;
    }

    return false;
  }

  /**
   * Find best matching heading in target file for a section
   */
  private findBestHeading(section: Section, targetSections: Section[]): Section | null {
    // First try exact heading match
    for (const target of targetSections) {
      if (target.heading.toLowerCase() === section.heading.toLowerCase()) {
        return target;
      }
    }

    // Try similar level headings
    for (const target of targetSections) {
      if (target.level === section.level && target.heading !== '__preamble__') {
        return target;
      }
    }

    return null;
  }

  /**
   * Update TOC in file content
   */
  private updateTOC(content: string, sections: Section[]): string {
    // Look for existing TOC (common patterns)
    const tocPatterns = [
      /## Table of Contents\n([\s\S]*?)(?=\n##|\n#|$)/,
      /## Contents\n([\s\S]*?)(?=\n##|\n#|$)/,
      /## TOC\n([\s\S]*?)(?=\n##|\n#|$)/,
    ];

    let tocMatch: RegExpMatchArray | null = null;
    let tocPattern: RegExp | null = null;

    for (const pattern of tocPatterns) {
      tocMatch = content.match(pattern);
      if (tocMatch) {
        tocPattern = pattern;
        break;
      }
    }

    if (!tocMatch || !tocPattern) {
      if (this.verbose) {
        console.log('  No TOC found to update');
      }
      return content;
    }

    // Generate new TOC
    const tocLines: string[] = [];
    for (const section of sections) {
      if (section.heading === '__preamble__') continue;
      
      const indent = '  '.repeat(section.level - 1);
      const link = section.heading.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      tocLines.push(`${indent}- [${section.heading}](#${link})`);
    }

    const newTOC = `## Table of Contents\n${tocLines.join('\n')}`;
    return content.replace(tocPattern, newTOC);
  }

  async merge(fileA: string, fileB: string): Promise<void> {
    // Validate files exist
    if (!fs.existsSync(fileA)) {
      console.error(`Error: File A does not exist: ${fileA}`);
      process.exit(1);
    }

    if (!fs.existsSync(fileB)) {
      console.error(`Error: File B does not exist: ${fileB}`);
      process.exit(1);
    }

    // Check if same file
    if (path.resolve(fileA) === path.resolve(fileB)) {
      console.error('Error: Cannot merge a file with itself');
      process.exit(1);
    }

    console.log(`Merging ${path.basename(fileA)} → ${path.basename(fileB)}`);

    // Create backups
    const backupA = fileA + '.original';
    const backupB = fileB + '.original';
    
    fs.copyFileSync(fileA, backupA);
    fs.copyFileSync(fileB, backupB);

    // Read files
    const contentA = fs.readFileSync(fileA, 'utf-8');
    const contentB = fs.readFileSync(fileB, 'utf-8');

    // Handle edge cases
    if (contentA.trim() === '') {
      await this.updateLinksAndConfig(fileA, fileB);
      console.log('✅ Complete');
      return;
    }

    if (contentB.trim() === '') {
      fs.writeFileSync(fileB, contentA);
      await this.updateLinksAndConfig(fileA, fileB);
      console.log('✅ Complete');
      return;
    }

    if (contentA === contentB) {
      await this.updateLinksAndConfig(fileA, fileB);
      console.log('✅ Complete');
      return;
    }

    // Parse sections
    const sectionsA = this.parseSections(contentA);
    const sectionsB = this.parseSections(contentB);

    // Find unique sections in A
    const uniqueSections: Section[] = [];
    for (const sectionA of sectionsA) {
      let isDuplicate = false;
      for (const sectionB of sectionsB) {
        if (this.areSectionsSimilar(sectionA, sectionB)) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        uniqueSections.push(sectionA);
      }
    }

    if (uniqueSections.length === 0) {
      await this.updateLinksAndConfig(fileA, fileB);
      console.log('✅ Complete');
      return;
    }

    // Build merged content by appending unique sections at the end
    let newContentB = contentB;

    for (const section of uniqueSections) {
      if (section.heading === '__preamble__') continue;
      newContentB += '\n\n' + section.content;
    }

    // Update TOC if exists
    const updatedSectionsB = this.parseSections(newContentB);
    newContentB = this.updateTOC(newContentB, updatedSectionsB);

    // Write merged content
    fs.writeFileSync(fileB, newContentB);

    // Update links and config
    await this.updateLinksAndConfig(fileA, fileB);

    console.log('✅ Complete');
  }

  private async updateLinksAndConfig(fileA: string, fileB: string): Promise<void> {
    const aPath = path.relative(this.repoRoot, fileA);
    const bPath = path.relative(this.repoRoot, fileB);
    
    const replacements = new Map<string, string>();
    replacements.set(aPath, bPath);

    // Find all markdown files
    const markdownFiles = this.findMarkdownFiles(path.join(this.repoRoot, 'notes'));
    let linkUpdateCount = 0;

    for (const mdFile of markdownFiles) {
      const updated = MarkdownParser.updateLinks(mdFile, replacements);
      if (updated > 0) {
        linkUpdateCount += updated;
      }
    }

    if (linkUpdateCount > 0) {
      console.log(`Updated ${linkUpdateCount} links`);
    }

    // Update VitePress config
    if (fs.existsSync(this.configPath)) {
      try {
        const configReplacements = new Map<string, string | null>();
        configReplacements.set(aPath, null);
        
        const configUpdated = ConfigUpdater.updateConfig(this.configPath, configReplacements);
        if (configUpdated > 0 && this.verbose) {
          console.log(`Removed ${configUpdated} config entries`);
        }
      } catch (error) {
        console.error(`Warning: Error updating VitePress config: ${error}`);
      }
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
Merge Files Tool

Usage:
  node merge-files.ts A.md B.md       Merge A into B
  node merge-files.ts -v A.md B.md    Verbose mode
  node merge-files.ts --help          Show this help

Description:
  Merges unique content from file A into file B, updates all links,
  and removes A from VitePress config.

  The tool:
  - Creates backups (A.original, B.original)
  - Identifies unique sections in A
  - Merges them into B under appropriate headings
  - Updates TOC in B
  - Updates all links from A → B
  - Removes A from VitePress config
  - Preserves A, A.original, B.original for review

Exit codes:
  0 - Success
  1 - Error
  `);
  process.exit(0);
}

const verbose = args.includes('-v') || args.includes('--verbose');
const fileArgs = args.filter(arg => !arg.startsWith('-'));

if (fileArgs.length !== 2) {
  console.error('Error: Expected exactly 2 file arguments');
  console.error('Usage: node merge-files.ts A.md B.md');
  process.exit(1);
}

const tool = new MergeFiles(verbose);
tool.merge(fileArgs[0], fileArgs[1]).catch(error => {
  console.error(`Fatal error: ${error}`);
  process.exit(1);
});

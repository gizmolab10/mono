import * as fs from 'fs';
import * as path from 'path';

export interface Link {
  text: string;
  target: string;
  line: number;
  isWikilink: boolean;
  anchor?: string;
}

export class MarkdownParser {
  /**
   * Parse a markdown file and extract all links
   * @param filePath Path to the markdown file
   * @returns Array of links found in the file
   */
  static parseFile(filePath: string): Link[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    return this.parseContent(content);
  }

  /**
   * Parse markdown content and extract all links
   * @param content Markdown content as string
   * @returns Array of links found in the content
   */
  static parseContent(content: string): Link[] {
    const links: Link[] = [];
    const lines = content.split('\n');
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Track code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      // Skip lines inside code blocks
      if (inCodeBlock) {
        continue;
      }

      // Find wikilinks [[file]] or [[file.md]]
      const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = wikilinkRegex.exec(line)) !== null) {
        const target = match[1];
        const [file, anchor] = target.split('#');
        links.push({
          text: target,
          target: file.endsWith('.md') ? file : `${file}.md`,
          line: i + 1,
          isWikilink: true,
          anchor: anchor || undefined,
        });
      }

      // Find markdown links [text](path/file.md)
      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      while ((match = markdownLinkRegex.exec(line)) !== null) {
        const text = match[1];
        const target = match[2];

        // Skip image links and external links
        if (target.startsWith('http://') || target.startsWith('https://') || target.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
          continue;
        }

        const [file, anchor] = target.split('#');
        links.push({
          text,
          target: file,
          line: i + 1,
          isWikilink: false,
          anchor: anchor || undefined,
        });
      }
    }

    return links;
  }

  /**
   * Update links in a markdown file
   * @param filePath Path to the markdown file (absolute or relative to cwd)
   * @param replacements Map of old target -> new target (paths relative to repo root)
   * @param repoRoot Optional repo root path for computing relative links
   * @returns Number of links updated
   */
  static updateLinks(filePath: string, replacements: Map<string, string | null>, repoRoot?: string): number {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let inCodeBlock = false;
    let updatedCount = 0;

    // Determine the directory of the source file for computing relative paths
    const sourceDir = path.dirname(filePath);

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Track code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      // Skip lines inside code blocks
      if (inCodeBlock) {
        continue;
      }

      let shouldDeleteLine = false;

      // Update wikilinks
      const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
      line = line.replace(wikilinkRegex, (match, target) => {
        const [file, anchor] = target.split('#');
        const normalizedFile = file.endsWith('.md') ? file : `${file}.md`;
        
        for (const [oldPath, newPath] of replacements.entries()) {
          if (this.pathsMatch(normalizedFile, oldPath)) {
            updatedCount++;
            if (newPath === null) {
              // Mark line for deletion
              shouldDeleteLine = true;
              return '';
            }
            // Compute relative path from source file to new target
            const relativePath = this.computeRelativePath(sourceDir, newPath, repoRoot);
            // Update the link, preserving anchor
            const newTarget = anchor ? `${relativePath}#${anchor}` : relativePath;
            return `[[${newTarget.replace('.md', '')}]]`;
          }
        }
        return match;
      });

      // Update markdown links
      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      line = line.replace(markdownLinkRegex, (match, text, target) => {
        // Skip image links and external links
        if (target.startsWith('http://') || target.startsWith('https://') || target.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
          return match;
        }

        const [file, anchor] = target.split('#');
        
        for (const [oldPath, newPath] of replacements.entries()) {
          if (this.pathsMatch(file, oldPath)) {
            updatedCount++;
            if (newPath === null) {
              // Mark line for deletion
              shouldDeleteLine = true;
              return '';
            }
            // Compute relative path from source file to new target
            const relativePath = this.computeRelativePath(sourceDir, newPath, repoRoot);
            // Update the link, preserving anchor
            const newTarget = anchor ? `${relativePath}#${anchor}` : relativePath;
            return `[${text}](${newTarget})`;
          }
        }
        return match;
      });

      // If line had a deleted link, check if we should remove the entire line
      if (shouldDeleteLine) {
        // Remove the line entirely if it's become meaningless after deletion
        const trimmed = line.trim();
        // Match patterns like:
        // - Empty: ''
        // - Just bullet: '-' or '*'
        // - Bullet with whitespace: '- ' or '* '
        // - Bullet with dash and short trailing text: '-  - This file was deleted'
        if (!trimmed || 
            trimmed === '-' || 
            trimmed === '*' ||
            trimmed.match(/^[-*]\s*$/) || 
            trimmed.match(/^[-*]\s+-\s+/)) {
          lines[i] = '';
          continue;
        }
      }

      lines[i] = line;
    }

    if (updatedCount > 0) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    }

    return updatedCount;
  }

  /**
   * Compute relative path from source directory to target file
   * @param sourceDir Directory containing the source markdown file
   * @param targetPath Path to target file (relative to repo root)
   * @param repoRoot Optional repo root for absolute path computation
   * @returns Relative path with ./ prefix
   */
  private static computeRelativePath(sourceDir: string, targetPath: string, repoRoot?: string): string {
    // If targetPath is already relative (starts with ./ or ../), use as-is
    if (targetPath.startsWith('./') || targetPath.startsWith('../')) {
      return targetPath;
    }

    // Make targetPath absolute if we have repoRoot
    let absoluteTarget: string;
    if (repoRoot) {
      absoluteTarget = path.join(repoRoot, targetPath);
    } else if (path.isAbsolute(targetPath)) {
      absoluteTarget = targetPath;
    } else {
      // Assume targetPath is relative to current working directory
      absoluteTarget = path.resolve(targetPath);
    }

    // Compute relative path from sourceDir to target
    let relativePath = path.relative(sourceDir, absoluteTarget);
    
    // Ensure it starts with ./ for same-directory or child paths
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }

    return relativePath;
  }

  /**
   * Check if two file paths refer to the same file
   * Handles relative paths, with/without .md extension, and path normalization
   */
  private static pathsMatch(linkPath: string, targetPath: string): boolean {
    // Normalize both paths
    const normalizePath = (p: string) => {
      // Remove .md extension if present
      p = p.replace(/\.md$/, '');
      // Remove leading ./ 
      p = p.replace(/^\.?\//, '');
      // Normalize ../ sequences
      const parts = p.split('/');
      const normalized: string[] = [];
      for (const part of parts) {
        if (part === '..') {
          normalized.pop();
        } else if (part !== '.' && part !== '') {
          normalized.push(part);
        }
      }
      return normalized.join('/');
    };
    
    const normalizedLink = normalizePath(linkPath);
    const normalizedTarget = normalizePath(targetPath);
    
    // Check if they match after normalization
    if (normalizedLink === normalizedTarget) {
      return true;
    }
    
    // Also check if just the filenames match (for simple cases)
    const linkBasename = path.basename(normalizedLink);
    const targetBasename = path.basename(normalizedTarget);
    
    return linkBasename === targetBasename;
  }
}

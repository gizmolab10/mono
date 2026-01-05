import * as fs from 'fs';
import * as path from 'path';

export interface FileMatch {
  filename: string;
  fullPath: string;
}

export class LinkFinder {
  /**
   * Search the repository for files matching a filename
   * @param baseDir Base directory to search from
   * @param filename Filename to search for (e.g., "debugging.md")
   * @returns Array of matching file paths
   */
  static findFilesByName(baseDir: string, filename: string): FileMatch[] {
    const matches: FileMatch[] = [];
    
    // Normalize the filename
    const normalizedFilename = path.basename(filename);
    
    this.searchDirectory(baseDir, normalizedFilename, matches);
    
    return matches;
  }

  /**
   * Recursively search a directory for matching files
   */
  private static searchDirectory(dir: string, filename: string, matches: FileMatch[]): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip node_modules, .git, and other common directories
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', '.vitepress'].includes(entry.name)) {
            this.searchDirectory(fullPath, filename, matches);
          }
        } else if (entry.isFile()) {
          if (entry.name === filename) {
            matches.push({
              filename: entry.name,
              fullPath: fullPath,
            });
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
      console.error(`Error reading directory ${dir}: ${error}`);
    }
  }

  /**
   * Prompt user to choose from multiple file matches
   * @param matches Array of file matches
   * @param brokenLink The original broken link
   * @returns Selected file path or null if skipped
   */
  static promptUserChoice(matches: FileMatch[], brokenLink: string): string | null {
    if (matches.length === 0) {
      return null;
    }

    if (matches.length === 1) {
      return matches[0].fullPath;
    }

    console.log(`\nMultiple files found for broken link: ${brokenLink}`);
    matches.forEach((match, index) => {
      console.log(`  ${index + 1}. ${match.fullPath}`);
    });
    console.log(`  s. Skip this link`);

    // For now, return null (skip) when multiple matches
    // In a real implementation, this would use readline or inquirer to get user input
    console.log(`Skipping (multiple matches, user interaction needed)`);
    return null;
  }
}

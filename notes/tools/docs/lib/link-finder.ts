import * as fs from 'fs';
import * as path from 'path';

export interface FileMatch {
  filename: string;
  fullPath: string;
  score?: number;
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
   * Score a match by how many path segments it shares with the broken link
   * @param match The file match to score
   * @param brokenLink The original broken link path
   * @returns Score (higher = more path segments match)
   */
  static scoreMatch(match: FileMatch, brokenLink: string): number {
    // Extract path segments from broken link (e.g., "./architecture/ux/search" -> ["architecture", "ux", "search"])
    const linkSegments = brokenLink
      .replace(/^\.\/?/, '')  // Remove leading ./
      .replace(/\.md$/, '')   // Remove .md extension
      .split('/')
      .filter(s => s.length > 0);
    
    // Extract path segments from match
    const matchSegments = match.fullPath
      .replace(/\.md$/, '')
      .split(path.sep)
      .filter(s => s.length > 0);
    
    // Count matching segments
    let score = 0;
    for (const segment of linkSegments) {
      if (matchSegments.includes(segment)) {
        score++;
      }
    }
    
    return score;
  }

  /**
   * Select best match from multiple candidates using path similarity
   * @param matches Array of file matches
   * @param brokenLink The original broken link
   * @returns Best match if clear winner, null if ambiguous
   */
  static selectBestMatch(matches: FileMatch[], brokenLink: string): FileMatch | null {
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];

    // Score all matches
    for (const match of matches) {
      match.score = this.scoreMatch(match, brokenLink);
    }

    // Sort by score descending
    matches.sort((a, b) => (b.score || 0) - (a.score || 0));

    // If top score is higher than second, we have a winner
    if (matches[0].score! > matches[1].score!) {
      return matches[0];
    }

    // Tied - no clear winner
    return null;
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

    // Try to auto-select based on path similarity
    const bestMatch = this.selectBestMatch(matches, brokenLink);
    if (bestMatch) {
      console.log(`  ✅ Auto-selected by path similarity (score: ${bestMatch.score})`);
      return bestMatch.fullPath;
    }

    // Scores tied - show options
    console.log(`\nMultiple files found for broken link: ${brokenLink}`);
    matches.forEach((match, index) => {
      console.log(`  ${index + 1}. ${match.fullPath} (score: ${match.score})`);
    });
    console.log(`  s. Skip this link`);

    // For now, return null (skip) when scores are tied
    console.log(`Skipping (multiple matches with same score, user interaction needed)`);
    return null;
  }
}

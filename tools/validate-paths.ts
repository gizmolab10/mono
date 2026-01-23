import { readdirSync, statSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONO_ROOT = resolve(__dirname, '..');
const LOG_FILE = join(MONO_ROOT, 'logs', 'paths.log');
const HOME = homedir();

// Counters
let checked = 0;
let passed = 0;
let broken = 0;
const brokenPaths: string[] = [];

// Exclusions for file discovery
const EXCLUDE_DIRS = [
  'node_modules', '.git', '.svelte-kit', 'dist', 'done', 
  'logs', '.obsidian', '.vitepress', 'archives'
];

const EXCLUDE_FILES = ['index.md', 'package.json'];

// Path skip patterns
function shouldSkipPath(path: string): boolean {
  if (!path || path.length === 0) return true;
  
  // Trim and reject if different (had leading/trailing space)
  const trimmed = path.trim();
  if (trimmed !== path) return true;
  
  // Multiple spaces = prose/sentence
  if (/  /.test(path)) return true;
  if ((path.match(/ /g) || []).length > 3) return true;
  
  // URLs and anchors
  if (/^https?:\/\//.test(path)) return true;
  if (/^mailto:/.test(path)) return true;
  if (path.startsWith('#')) return true;
  
  // Variables and templates
  if (path.startsWith('$')) return true;
  if (path.startsWith('{')) return true;
  if (path.includes('\\')) return true;
  if (path.includes('${')) return true;
  if (path.includes('<') && path.includes('>')) return true;
  if (path.includes('/X/')) return true;
  if (path.includes('.N.')) return true;
  if (/\$[0-9]/.test(path)) return true;
  
  // Package refs
  if (path.startsWith('node_modules')) return true;
  if (path.startsWith('@')) return true;
  if (path.startsWith('svelte')) return true;
  if (path.startsWith('vite')) return true;
  
  // Trailing slash, method calls
  if (path.endsWith('/')) return true;
  if (/^\.[a-zA-Z]+\(\)$/.test(path)) return true;
  
  // Bare words (no / and no file extension)
  if (!path.includes('/') && !/\.[a-z]{1,4}$/.test(path)) return true;
  
  // Bare extensions
  if (/^\.[a-zA-Z0-9]+$/.test(path)) return true;
  
  // Compound extensions like .svelte.ts
  if (/^\.[a-zA-Z]+\.[a-zA-Z]+$/.test(path)) return true;
  
  // /mnt paths
  if (path.startsWith('/mnt')) return true;
  
  // Glob patterns
  if (path.includes('*')) return true;
  
  // Command-like (contains && or ||)
  if (path.includes('&&') || path.includes('||')) return true;
  
  // Status messages with emoji
  if (/[\u{1F300}-\u{1F9FF}]/u.test(path)) return true;
  
  // Code snippets (starts with } or contains //)
  if (path.startsWith('}')) return true;
  if (path.includes('//')) return true;
  
  // Pipe-delimited data
  if (path.includes('|')) return true;
  
  // Command arguments
  if (path.includes(' --')) return true;
  
  // Status messages (Step X/Y, result X/Y)
  if (/\d+\/\d+/.test(path)) return true;
  
  // Starts with common verbs (prose)
  if (/^(Read|List|When|Step|Mouse|Touch|API) /.test(path)) return true;
  
  // Config/build directories (often referenced but don't exist)
  if (path.startsWith('.vitepress')) return true;
  if (path.startsWith('.github')) return true;
  
  // Directory references without extension (prose)
  if (!path.includes('.') && path.includes('/')) {
    // Allow if starts with ./ or ../ (explicit relative)
    if (!path.startsWith('./') && !path.startsWith('../')) return true;
  }
  
  // Tilde paths outside mono
  if (path.startsWith('~/')) {
    if (!path.startsWith('~/GitHub/mono')) return true;
  }
  
  return false;
}

// Extract paths from a line
function extractPaths(line: string): string[] {
  const paths: string[] = [];
  
  // Markdown links: ](path)
  const mdLinks = line.matchAll(/\]\(([^)]+)\)/g);
  for (const m of mdLinks) paths.push(m[1]);
  
  // Backtick paths: `./path` or `~/path`
  const backticks = line.matchAll(/`([.~/][^`]+)`/g);
  for (const m of backticks) paths.push(m[1]);
  
  // ~/GitHub paths
  const tildeGithub = line.matchAll(/~\/GitHub\/[^ "'`)<>]+/g);
  for (const m of tildeGithub) paths.push(m[0]);
  
  // Quoted paths with slashes
  const quoted = line.matchAll(/"([^"]*\/[^"]*)"/g);
  for (const m of quoted) paths.push(m[1]);
  
  return paths;
}

// Resolve a path relative to a file
function resolvePath(path: string, fileDir: string): string {
  // Strip anchors
  path = path.split('#')[0];
  if (!path) return '';
  
  if (path.startsWith('~/')) {
    return HOME + path.slice(1);
  } else if (path.startsWith('/')) {
    return path;
  } else {
    return resolve(fileDir, path);
  }
}

// Update single-line display
function updateDisplay(currentFile: string): void {
  const rel = relative(MONO_ROOT, currentFile) || currentFile;
  process.stdout.write(`\r\x1b[KChecked: ${checked}  Passed: ${passed}  Broken: ${broken}  Path: ${rel}`);
}

// Check a single path
function checkPath(file: string, lineNum: number, rawPath: string): boolean {
  if (shouldSkipPath(rawPath)) return true;
  
  const fileDir = dirname(file);
  const resolved = resolvePath(rawPath, fileDir);
  
  if (!resolved) return true;
  
  // Only validate paths within mono
  if (!resolved.startsWith(MONO_ROOT)) return true;
  
  checked++;
  
  if (existsSync(resolved)) {
    passed++;
    updateDisplay(file);
    return true;
  } else {
    broken++;
    brokenPaths.push(`BROKEN: ${relative(MONO_ROOT, file)}:${lineNum}\n  Path: ${rawPath}\n  Resolved: ${resolved}\n`);
    updateDisplay(file);
    return false;
  }
}

// Scan a single file
function scanFile(file: string): void {
  const content = readFileSync(file, 'utf-8');
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
    if (inCodeBlock) continue;
    
    const paths = extractPaths(line);
    for (const p of paths) {
      const ok = checkPath(file, i + 1, p);
      if (!ok) return; // Stop on first broken per file
    }
  }
}

// Find all files to scan
function findFiles(dir: string, depth = 0): string[] {
  if (depth > 6) return [];
  
  const files: string[] = [];
  
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  
  for (const entry of entries) {
    if (EXCLUDE_DIRS.includes(entry)) continue;
    if (entry.startsWith('.')) continue;
    
    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    
    if (stat.isDirectory()) {
      files.push(...findFiles(fullPath, depth + 1));
    } else if (stat.isFile()) {
      if (EXCLUDE_FILES.includes(entry)) continue;
      if (/\.(md|py)$/.test(entry)) {
        files.push(fullPath);
      }
    }
  }
  
  return files.sort();
}

// Main
function main(): void {
  const startTime = Date.now();
  
  // Setup log
  mkdirSync(dirname(LOG_FILE), { recursive: true });
  
  const files = findFiles(MONO_ROOT);
  
  for (const file of files) {
    scanFile(file);
  }
  
  const elapsed = (Date.now() - startTime) / 1000;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.round(elapsed % 60);
  
  // Write log
  const logContent = [
    '=== Path Validator ===',
    `Root: ${MONO_ROOT}`,
    `Run: ${new Date().toLocaleString()}`,
    '',
    ...brokenPaths
  ].join('\n');
  writeFileSync(LOG_FILE, logContent);
  
  // Final output
  console.log('');
  console.log(`Log: ${LOG_FILE}`);
  console.log(`Time: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
  
  if (broken > 0) {
    console.log(`RESULT: ${broken} broken path(s)`);
    process.exit(1);
  } else {
    console.log(`RESULT: All ${passed} paths valid`);
    process.exit(0);
  }
}

main();

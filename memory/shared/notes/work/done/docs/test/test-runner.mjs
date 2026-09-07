import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

console.log('=== Fix Links Tool Test ===\n');
console.log('Test Setup:');
console.log('  - index.md has links to guides/test-moved.md and guides/test-deleted.md');
console.log('  - test-moved.md exists at advanced/test-moved.md');
console.log('  - test-deleted.md doesn\'t exist anywhere');
console.log('  - vitepress.build.txt reports both as broken links\n');

console.log('Expected Results:');
console.log('  - Links to test-moved.md should update to notes/work/test-fixtures/advanced/test-moved.md');
console.log('  - Links to test-deleted.md should be deleted');
console.log('  - Links in code blocks should NOT be modified');
console.log('  - Anchors should be preserved\n');

const indexPath = path.join(repoRoot, 'notes/work/test-fixtures/index.md');
const configPath = path.join(repoRoot, 'notes/work/test-fixtures/config.mts');

console.log('Before running tool - index.md content:');
console.log('---');
console.log(fs.readFileSync(indexPath, 'utf-8'));
console.log('---\n');

console.log('Running fix-links tool...\n');

try {
  execSync('npx ts-node --esm notes/tools/fix-links.ts --test -v', {
    cwd: repoRoot,
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Tool execution failed:', error.message);
}

console.log('\nAfter running tool - index.md content:');
console.log('---');
console.log(fs.readFileSync(indexPath, 'utf-8'));
console.log('---\n');

console.log('Config file after:');
console.log('---');
console.log(fs.readFileSync(configPath, 'utf-8'));
console.log('---');

import * as fs from 'fs';
import * as path from 'path';
export class SidebarGenerator {
    constructor(srcDir, srcExclude = []) {
        this.srcDir = srcDir;
        this.srcExclude = srcExclude;
    }
    /**
     * Generate sidebar structure from filesystem
     */
    generateSidebar() {
        const sidebar = [];
        // Get all top-level items
        const entries = fs.readdirSync(this.srcDir, { withFileTypes: true });
        // Sort: files first, then directories
        const sorted = entries.sort((a, b) => {
            if (a.isFile() && b.isDirectory())
                return -1;
            if (a.isDirectory() && b.isFile())
                return 1;
            return a.name.localeCompare(b.name);
        });
        for (const entry of sorted) {
            if (this.shouldSkip(entry.name))
                continue;
            const fullPath = path.join(this.srcDir, entry.name);
            if (entry.isDirectory()) {
                const dirItem = this.processDirectory(entry.name, fullPath, '');
                if (dirItem) {
                    sidebar.push(dirItem);
                }
            }
            else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md') {
                const fileItem = this.processFile(entry.name, fullPath);
                if (fileItem) {
                    sidebar.push(fileItem);
                }
            }
        }
        return sidebar;
    }
    processDirectory(dirName, dirPath, parentPath) {
        const items = [];
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        // Check if this directory has an index.md
        const hasIndex = entries.some(e => e.isFile() && e.name === 'index.md');
        // Sort: files first (except index.md), then directories
        const sorted = entries.sort((a, b) => {
            if (a.name === 'index.md')
                return 1; // index.md goes last (skip it anyway)
            if (b.name === 'index.md')
                return -1;
            if (a.isFile() && b.isDirectory())
                return -1;
            if (a.isDirectory() && b.isFile())
                return 1;
            return a.name.localeCompare(b.name);
        });
        for (const entry of sorted) {
            if (this.shouldSkip(entry.name))
                continue;
            const fullPath = path.join(dirPath, entry.name);
            const currentPath = parentPath + '/' + dirName;
            if (entry.isDirectory()) {
                const subDir = this.processDirectory(entry.name, fullPath, currentPath);
                if (subDir) {
                    items.push(subDir);
                }
            }
            else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md') {
                const fileItem = this.processFile(entry.name, fullPath);
                if (fileItem) {
                    items.push(fileItem);
                }
            }
        }
        // Skip empty directories
        if (items.length === 0 && !hasIndex) {
            return null;
        }
        const result = {
            text: this.formatTitle(dirName),
            collapsed: true,
        };
        // Add link if directory has index.md
        if (hasIndex) {
            result.link = parentPath + '/' + dirName + '/';
        }
        if (items.length > 0) {
            result.items = items;
        }
        return result;
    }
    processFile(fileName, filePath) {
        // Skip index files (handled at directory level)
        if (fileName === 'index.md') {
            return null;
        }
        // Generate link path relative to srcDir
        const relativePath = path.relative(this.srcDir, filePath);
        const linkPath = '/' + relativePath.replace(/\.md$/, '');
        return {
            text: this.formatTitle(fileName.replace(/\.md$/, '')),
            link: linkPath
        };
    }
    shouldSkip(name) {
        // Skip system files
        if (name.startsWith('.')) {
            return true;
        }
        // Skip excluded patterns
        for (const pattern of this.srcExclude) {
            if (pattern.endsWith('/**')) {
                const dirName = pattern.replace('/**', '');
                if (name === dirName) {
                    return true;
                }
            }
            else if (name === pattern) {
                return true;
            }
        }
        return false;
    }
    formatTitle(name) {
        // Convert filename to title
        // Special cases
        const specialCases = {
            'vitepress': 'VitePress',
            'ux': 'UX',
            'ui': 'UI',
            'api': 'API',
            'readme': 'README',
            'gotchas': 'Gotchas',
            'svelte.5': 'Svelte 5',
        };
        const lower = name.toLowerCase();
        if (specialCases[lower]) {
            return specialCases[lower];
        }
        // Convert kebab-case and snake_case to Title Case
        return name
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

import * as fs from 'fs';
export class ConfigUpdater {
    /**
     * Update VitePress config.mts sidebar entries
     * @param configPath Path to config.mts file
     * @param replacements Map of old link -> new link (or null to delete)
     * @returns Number of entries updated
     */
    static updateConfig(configPath, replacements) {
        let content = fs.readFileSync(configPath, 'utf-8');
        let updatedCount = 0;
        // Extract all links from config to find matches
        const linkRegex = /link:\s*['"]([^'"]+)['"]/g;
        let match;
        const linksToUpdate = new Map();
        while ((match = linkRegex.exec(content)) !== null) {
            const configLink = match[1];
            // Check if this config link matches any of our replacements
            for (const [oldPath, newPath] of replacements.entries()) {
                if (this.linkMatchesFile(configLink, oldPath)) {
                    linksToUpdate.set(configLink, newPath);
                    break;
                }
            }
        }
        // Now update/delete the matched links
        for (const [configLink, newPath] of linksToUpdate.entries()) {
            if (newPath === null) {
                // Remove the sidebar entry
                const entryRegex = new RegExp(`\\{[^}]*link:\\s*['"]${configLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"][^}]*\\},?\\s*\n?`, 'g');
                const beforeUpdate = content;
                content = content.replace(entryRegex, '');
                if (content !== beforeUpdate) {
                    updatedCount++;
                }
            }
            else {
                // Update the link
                const newLink = this.normalizeLink(newPath);
                const linkReplaceRegex = new RegExp(`(link:\\s*['"])${configLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"])`, 'g');
                const beforeUpdate = content;
                content = content.replace(linkReplaceRegex, `$1${newLink}$2`);
                if (content !== beforeUpdate) {
                    updatedCount++;
                }
            }
        }
        if (updatedCount > 0) {
            fs.writeFileSync(configPath, content, 'utf-8');
        }
        return updatedCount;
    }
    /**
     * Normalize a file path to VitePress link format
     * @param filePath File path like "notes/guides/debugging.md" or "guides/debugging.md"
     * @returns Link like "/notes/guides/debugging"
     */
    static normalizeLink(filePath) {
        // Remove .md extension
        let link = filePath.replace(/\.md$/, '');
        // Ensure it starts with /
        if (!link.startsWith('/')) {
            link = '/' + link;
        }
        return link;
    }
    /**
     * Check if a config link path matches a file path
     * Handles cases like: config has "/notes/work/test-fixtures/guides/test-moved"
     * and we're looking for "guides/test-moved.md"
     */
    static linkMatchesFile(configLink, filePath) {
        const filename = filePath.split('/').pop()?.replace(/\.md$/, '');
        if (!filename)
            return false;
        return configLink.endsWith('/' + filename) || configLink === '/' + filename;
    }
    /**
     * Parse VitePress config to extract all sidebar links
     * @param configPath Path to config.mts file
     * @returns Array of link paths found in config
     */
    static extractLinks(configPath) {
        const content = fs.readFileSync(configPath, 'utf-8');
        const links = [];
        // Match link: '/notes/...' or link: "/notes/..."
        const linkRegex = /link:\s*['"]([^'"]+)['"]/g;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            links.push(match[1]);
        }
        return links;
    }
}

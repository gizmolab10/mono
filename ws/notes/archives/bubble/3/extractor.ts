import * as fs from 'fs';
import * as path from 'path';

// Function to extract inline styles, scripts, and HTML content
function extractHTMLComponents(inputFilePath: string) {
    // Read the input HTML file
    const htmlContent = fs.readFileSync(inputFilePath, 'utf8');

    // Regex patterns for <style> and <script> tags
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;

    // Extract inline styles
    let styles = '';
    htmlContent.replace(styleRegex, (_, styleContent) => {
        styles += styleContent + '\n';
        return '';
    });

    // Extract inline scripts
    let scripts = '';
    htmlContent.replace(scriptRegex, (_, scriptContent) => {
        scripts += scriptContent + '\n';
        return '';
    });

    // Remove styles and scripts to get remaining HTML
    const remainingHTML = htmlContent
        .replace(styleRegex, '')
        .replace(scriptRegex, '')
        .trim();

    // Define output paths
    const outputDir = path.dirname(inputFilePath);
    const stylesPath = path.join(outputDir, 'webseriously.css');
    const scriptsPath = path.join(outputDir, 'webseriously.js');
    const contentPath = path.join(outputDir, 'content.html');

    // Write the extracted content to separate files
    fs.writeFileSync(stylesPath, styles.trim());
    fs.writeFileSync(scriptsPath, scripts.trim());
    fs.writeFileSync(contentPath, remainingHTML);

    console.log('Three files extracted:');
    console.log(`  ${path.basename(stylesPath)}`);
    console.log(`  ${path.basename(scriptsPath)}`);
    console.log(`  ${path.basename(contentPath)}`);
}

// Entry point
const inputFilePath = path.resolve(__dirname, 'index.html');
if (!fs.existsSync(inputFilePath)) {
    console.error('Error: index.html not found in the db_now directory.');
    process.exit(1);
}

extractHTMLComponents(inputFilePath);

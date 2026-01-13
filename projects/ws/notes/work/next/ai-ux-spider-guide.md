# Building an AI-Powered UX Testing Spider

A step-by-step guide to creating an automated system that navigates websites like a user and reports UX problems, dead ends, and confusing flows.

## Overview

We'll build a system that:
- Automatically navigates through website pages and user flows
- Takes screenshots at each step
- Identifies UX issues (broken links, loops, dead ends, confusing UI)
- Generates a detailed report with findings

## Tech Stack Options

### Option 1: Playwright + Claude API (Recommended)
**Best for:** Comprehensive testing with intelligent decision-making
**Complexity:** Medium
**Cost:** API calls to Claude (~$0.10-1.00 per site tested)

### Option 2: Playwright + GPT-4 Vision
**Best for:** Similar to Option 1, OpenAI ecosystem
**Complexity:** Medium
**Cost:** Similar API costs

### Option 3: Pure Playwright with Heuristics
**Best for:** Simpler, cheaper, but less intelligent
**Complexity:** Low
**Cost:** Free (just compute)

We'll focus on **Option 1** as it gives the best balance of intelligence and control.

---

## Step-by-Step Build: Playwright + Claude

### Step 1: Set Up Your Environment

```bash
# Create project directory
mkdir ux-spider
cd ux-spider

# Initialize Node.js project
npm init -y

# Install dependencies
npm install playwright @anthropic-ai/sdk dotenv
npm install --save-dev @types/node typescript

# Initialize TypeScript
npx tsc --init

# Install Playwright browsers
npx playwright install
```

### Step 2: Set Up API Keys

Create a `.env` file:
```
ANTHROPIC_API_KEY=your_api_key_here
```

Get your API key from: https://console.anthropic.com/

### Step 3: Create Basic Spider Structure

Create `src/spider.ts`:

```typescript
import { chromium, Browser, Page } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

interface Finding {
  type: 'dead_link' | 'loop' | 'confusing_ui' | 'error' | 'friction';
  severity: 'low' | 'medium' | 'high';
  description: string;
  url: string;
  screenshot?: string;
  timestamp: Date;
}

class UXSpider {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private anthropic: Anthropic;
  private visitedUrls: Set<string> = new Set();
  private findings: Finding[] = [];
  private screenshotDir: string;
  private startUrl: string;
  private maxPages: number;

  constructor(startUrl: string, maxPages: number = 50) {
    this.startUrl = startUrl;
    this.maxPages = maxPages;
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.screenshotDir = path.join(__dirname, '../screenshots', Date.now().toString());
    fs.mkdirSync(this.screenshotDir, { recursive: true });
  }

  async initialize() {
    this.browser = await chromium.launch({ headless: false }); // Set to true for production
    this.page = await this.browser.newPage();
    
    // Set viewport for consistent screenshots
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async takeScreenshot(name: string): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');
    
    const filename = `${name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }

  async analyzePageWithClaude(screenshotPath: string, url: string): Promise<string> {
    // Read screenshot as base64
    const imageBuffer = fs.readFileSync(screenshotPath);
    const base64Image = imageBuffer.toString('base64');

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `You are a UX auditor. Analyze this screenshot from ${url}.

Identify any of these issues:
1. Broken or unclear navigation
2. Dead-end pages (no way forward)
3. Confusing UI elements or layouts
4. Error messages or broken functionality
5. Forms that are difficult to understand or complete
6. Accessibility issues (poor contrast, tiny text, etc.)
7. Friction points that would frustrate users

For each issue found, respond in this format:
ISSUE: [type]
SEVERITY: [low/medium/high]
DESCRIPTION: [clear description of the problem]

If no issues found, respond with: NO_ISSUES_FOUND`,
            },
          ],
        },
      ],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  }

  parseClaudeResponse(response: string, url: string, screenshotPath: string) {
    if (response.includes('NO_ISSUES_FOUND')) {
      return;
    }

    // Simple parser for Claude's response
    const issueBlocks = response.split('ISSUE:').slice(1);
    
    for (const block of issueBlocks) {
      const typeMatch = block.match(/^\s*(.+?)\s*SEVERITY:/);
      const severityMatch = block.match(/SEVERITY:\s*(low|medium|high)/i);
      const descMatch = block.match(/DESCRIPTION:\s*(.+?)(?=ISSUE:|$)/s);

      if (typeMatch && severityMatch && descMatch) {
        this.findings.push({
          type: this.categorizeIssue(typeMatch[1].trim()),
          severity: severityMatch[1].toLowerCase() as 'low' | 'medium' | 'high',
          description: descMatch[1].trim(),
          url: url,
          screenshot: screenshotPath,
          timestamp: new Date(),
        });
      }
    }
  }

  categorizeIssue(type: string): Finding['type'] {
    const normalized = type.toLowerCase();
    if (normalized.includes('dead') || normalized.includes('end')) return 'dead_link';
    if (normalized.includes('loop')) return 'loop';
    if (normalized.includes('error')) return 'error';
    if (normalized.includes('confus')) return 'confusing_ui';
    return 'friction';
  }

  async crawlPage(url: string) {
    if (this.visitedUrls.has(url) || this.visitedUrls.size >= this.maxPages) {
      return;
    }

    if (!this.page) throw new Error('Page not initialized');

    console.log(`Crawling: ${url}`);
    this.visitedUrls.add(url);

    try {
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Wait a bit for dynamic content
      await this.page.waitForTimeout(2000);

      // Take screenshot
      const screenshotPath = await this.takeScreenshot(url);

      // Analyze with Claude
      const analysis = await this.analyzePageWithClaude(screenshotPath, url);
      this.parseClaudeResponse(analysis, url, screenshotPath);

      // Find all links on the page
      const links = await this.page.$$eval('a[href]', (elements) =>
        elements.map((el) => (el as HTMLAnchorElement).href)
      );

      // Filter to same-domain links
      const baseDomain = new URL(this.startUrl).hostname;
      const sameDomainLinks = links.filter((link) => {
        try {
          return new URL(link).hostname === baseDomain;
        } catch {
          return false;
        }
      });

      // Crawl linked pages (limited to avoid infinite loops)
      for (const link of sameDomainLinks.slice(0, 5)) {
        if (!this.visitedUrls.has(link)) {
          await this.crawlPage(link);
        }
      }
    } catch (error) {
      this.findings.push({
        type: 'error',
        severity: 'high',
        description: `Failed to load page: ${error}`,
        url: url,
        timestamp: new Date(),
      });
    }
  }

  async generateReport() {
    const reportPath = path.join(this.screenshotDir, 'report.html');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>UX Audit Report</title>
  <style>
    body { font-family: system-ui; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .finding { border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .finding.high { border-left: 4px solid #d32f2f; }
    .finding.medium { border-left: 4px solid #f57c00; }
    .finding.low { border-left: 4px solid #fbc02d; }
    .screenshot { max-width: 100%; margin-top: 10px; cursor: pointer; }
    .url { color: #666; font-size: 0.9em; word-break: break-all; }
    .timestamp { color: #999; font-size: 0.85em; }
  </style>
</head>
<body>
  <h1>UX Audit Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Start URL:</strong> ${this.startUrl}</p>
    <p><strong>Pages Crawled:</strong> ${this.visitedUrls.size}</p>
    <p><strong>Issues Found:</strong> ${this.findings.length}</p>
    <p><strong>High Severity:</strong> ${this.findings.filter(f => f.severity === 'high').length}</p>
    <p><strong>Medium Severity:</strong> ${this.findings.filter(f => f.severity === 'medium').length}</p>
    <p><strong>Low Severity:</strong> ${this.findings.filter(f => f.severity === 'low').length}</p>
  </div>

  <h2>Findings</h2>
  ${this.findings
    .sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .map(
      (finding, i) => `
    <div class="finding ${finding.severity}">
      <h3>Finding #${i + 1} - ${finding.type} (${finding.severity})</h3>
      <p><strong>Description:</strong> ${finding.description}</p>
      <p class="url"><strong>URL:</strong> ${finding.url}</p>
      <p class="timestamp">${finding.timestamp.toLocaleString()}</p>
      ${
        finding.screenshot
          ? `<img class="screenshot" src="${path.basename(finding.screenshot)}" 
               onclick="window.open(this.src)" title="Click to view full size" />`
          : ''
      }
    </div>
  `
    )
    .join('')}
</body>
</html>
    `;

    fs.writeFileSync(reportPath, html);
    console.log(`\nReport generated: ${reportPath}`);
    
    // Also output JSON for programmatic use
    const jsonPath = path.join(this.screenshotDir, 'findings.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.findings, null, 2));
    console.log(`JSON report: ${jsonPath}`);
  }

  async run() {
    try {
      await this.initialize();
      await this.crawlPage(this.startUrl);
      await this.generateReport();
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the spider
const targetUrl = process.argv[2] || 'https://example.com';
const maxPages = parseInt(process.argv[3]) || 20;

const spider = new UXSpider(targetUrl, maxPages);
spider.run().catch(console.error);
```

### Step 4: Update package.json

Add to your `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "spider": "npm run build && node dist/spider.js"
  }
}
```

### Step 5: Run Your Spider

```bash
# Test on a simple site first
npm run spider https://example.com 10

# For your own site
npm run spider https://yoursite.com 50
```

---

## Advanced Enhancements

### 1. Test Specific User Flows

Add flow testing to track if users can complete common tasks:

```typescript
async testCheckoutFlow() {
  // Navigate to product
  await this.page.goto('https://yoursite.com/products/item-1');
  await this.takeScreenshot('checkout_1_product');
  
  // Add to cart
  await this.page.click('[data-testid="add-to-cart"]');
  await this.takeScreenshot('checkout_2_cart');
  
  // Check if cart updated
  const cartCount = await this.page.textContent('.cart-count');
  if (cartCount === '0') {
    this.findings.push({
      type: 'error',
      severity: 'high',
      description: 'Add to cart did not update cart count',
      url: this.page.url(),
      timestamp: new Date()
    });
  }
  
  // Continue to checkout...
}
```

### 2. Check for Loops

Track navigation history to detect when users get stuck in loops:

```typescript
private navigationHistory: string[] = [];

async detectLoop(url: string) {
  this.navigationHistory.push(url);
  
  // Check if we've seen this URL 3+ times recently
  const recentVisits = this.navigationHistory.slice(-10);
  const visitCount = recentVisits.filter(u => u === url).length;
  
  if (visitCount >= 3) {
    this.findings.push({
      type: 'loop',
      severity: 'high',
      description: `User appears stuck in loop - visited ${url} ${visitCount} times`,
      url: url,
      timestamp: new Date()
    });
  }
}
```

### 3. Test Accessibility

```typescript
async checkAccessibility() {
  // Check for images without alt text
  const imagesWithoutAlt = await this.page.$$eval('img:not([alt])', 
    imgs => imgs.length
  );
  
  if (imagesWithoutAlt > 0) {
    this.findings.push({
      type: 'friction',
      severity: 'medium',
      description: `Found ${imagesWithoutAlt} images without alt text`,
      url: this.page.url(),
      timestamp: new Date()
    });
  }
  
  // Check for low contrast text
  // Check for missing form labels
  // etc.
}
```

### 4. Mobile Testing

```typescript
async testMobile() {
  await this.page.setViewportSize({ 
    width: 375, 
    height: 667 
  });
  
  // Re-run tests on mobile viewport
}
```

### 5. Performance Monitoring

```typescript
async checkPerformance() {
  const metrics = await this.page.evaluate(() => {
    return JSON.stringify(window.performance.timing);
  });
  
  const timing = JSON.parse(metrics);
  const loadTime = timing.loadEventEnd - timing.navigationStart;
  
  if (loadTime > 3000) {
    this.findings.push({
      type: 'friction',
      severity: 'medium',
      description: `Slow page load: ${loadTime}ms`,
      url: this.page.url(),
      timestamp: new Date()
    });
  }
}
```

---

## Cost Optimization

### Reduce API Calls

Instead of analyzing every page:
1. Only analyze pages where something changed (compare screenshots)
2. Batch multiple screenshots into one Claude call
3. Use cheaper models for initial screening, Claude for deep analysis

### Example: Smart Analysis

```typescript
async shouldAnalyze(url: string): Promise<boolean> {
  // Skip common pages that rarely have issues
  const skipPatterns = ['/privacy', '/terms', '/about'];
  if (skipPatterns.some(p => url.includes(p))) {
    return false;
  }
  
  // Always analyze checkout/critical flows
  const criticalPatterns = ['/checkout', '/cart', '/payment'];
  if (criticalPatterns.some(p => url.includes(p))) {
    return true;
  }
  
  // For others, use heuristics first
  return await this.hasVisibleErrors();
}

async hasVisibleErrors(): Promise<boolean> {
  // Check for obvious error indicators without AI
  const errorIndicators = await this.page.$$eval('body', () => {
    const text = document.body.innerText.toLowerCase();
    return text.includes('error') || 
           text.includes('404') || 
           text.includes('something went wrong');
  });
  
  return errorIndicators;
}
```

---

## Deployment Options

### 1. Run Locally
Good for: Testing your own sites during development

```bash
npm run spider https://localhost:3000
```

### 2. GitHub Actions (Scheduled)
Good for: Regular audits of production sites

Create `.github/workflows/ux-audit.yml`:

```yaml
name: UX Audit
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:  # Manual trigger

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run spider https://yoursite.com 50
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      - uses: actions/upload-artifact@v3
        with:
          name: audit-report
          path: screenshots/
```

### 3. Cloud Function
Good for: On-demand audits via API

Deploy to AWS Lambda, Google Cloud Functions, or similar.

---

## Example Output

Running the spider will produce:

```
Crawling: https://example.com
Crawling: https://example.com/about
Crawling: https://example.com/contact
...

Report generated: ./screenshots/1234567890/report.html
JSON report: ./screenshots/1234567890/findings.json

Summary:
- Pages crawled: 23
- Issues found: 7
  - High: 2
  - Medium: 3
  - Low: 2
```

The HTML report will show each finding with:
- Severity and type
- Description of the issue
- Screenshot
- URL where it occurred
- Timestamp

---

## Next Steps

1. Start with a small test site (10-20 pages)
2. Refine the prompts to Claude based on what it catches/misses
3. Add custom checks for your specific use cases
4. Set up scheduled runs to catch regressions
5. Integrate with your CI/CD pipeline

## Troubleshooting

**"Too many API calls"**
- Reduce maxPages
- Add smarter filtering (shouldAnalyze)
- Cache screenshot analyses

**"Claude missing obvious issues"**
- Improve the prompt with specific examples
- Add explicit checks for known problem patterns
- Use vision + text analysis together

**"Spider gets stuck"**
- Add timeout limits
- Track navigation depth
- Implement better loop detection

---

## Alternative: Simple Version Without AI

If you want something simpler and free, here's a basic version:

```typescript
// Just check for broken links, slow pages, console errors
async simpleAudit() {
  // Check response codes
  const response = await this.page.goto(url);
  if (response?.status() >= 400) {
    this.findings.push({
      type: 'dead_link',
      severity: 'high',
      description: `Page returned ${response.status()}`,
      url: url,
      timestamp: new Date()
    });
  }
  
  // Listen for console errors
  this.page.on('console', msg => {
    if (msg.type() === 'error') {
      this.findings.push({
        type: 'error',
        severity: 'medium',
        description: `Console error: ${msg.text()}`,
        url: url,
        timestamp: new Date()
      });
    }
  });
  
  // Check load time
  // Check for broken images
  // etc.
}
```

This won't catch UX issues but will find technical problems, and it's free to run.

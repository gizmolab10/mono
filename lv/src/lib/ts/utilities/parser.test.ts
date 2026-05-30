// Tests for the rules in `notes/work/bare bone website.md` that the parser owns:
// the standard markdown syntax, frontmatter removal, callouts, image embeds,
// wiki-links (plain and aliased), and the relaxed link-with-spaces form.
//
// Three rules the spec lists are NOT built yet, so their tests are marked
// `skip` with a note rather than left failing:
//   - outside links opening in a new tab
//   - one page body pulled inline into another
//   - tables
// See the "Not yet built" note at the foot of the spec file.

import { describe, it, expect } from 'vitest';
import { render } from './parser';

describe('standard markdown', () => {
  it('turns a hash line into a top heading', () => {
    expect(render('# Hello')).toContain('<h1>Hello</h1>');
  });

  it('keeps a plain line as a paragraph', () => {
    expect(render('Just words.')).toContain('<p>Just words.</p>');
  });

  it('turns dash lines into a bullet list', () => {
    const html = render('- one\n- two');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<li>two</li>');
  });

  it('turns numbered lines into an ordered list', () => {
    const html = render('1. first\n2. second');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>first</li>');
  });

  it('makes double stars bold', () => {
    expect(render('**loud**')).toContain('<strong>loud</strong>');
  });

  it('makes single stars italic', () => {
    expect(render('*soft*')).toContain('<em>soft</em>');
  });

  it('makes a standard link', () => {
    expect(render('[label](page)')).toContain('<a href="page">label</a>');
  });

  it('makes backtick text inline code', () => {
    expect(render('`x = 1`')).toContain('<code>x = 1</code>');
  });

  it('makes a fenced block a code block', () => {
    const html = render('```\nx = 1\n```');
    expect(html).toContain('<pre>');
    expect(html).toContain('<code>');
  });

  it('makes an angle line a quote', () => {
    expect(render('> a saying')).toContain('<blockquote>');
  });

  it('makes three dashes a divider', () => {
    expect(render('above\n\n---\n\nbelow')).toContain('<hr>');
  });
});

describe('frontmatter', () => {
  it('pulls the top dashed block out of the visible content', () => {
    const html = render('---\ntitle: My Page\n---\n\n# Body');
    expect(html).not.toContain('title: My Page');
    expect(html).toContain('<h1>Body</h1>');
  });
});

describe('callouts', () => {
  it('consumes the bang marker and keeps the words', () => {
    const html = render('> [!note] remember this');
    expect(html).not.toContain('[!note]');
    expect(html).toContain('remember this');
  });
});

describe('image embeds', () => {
  it('turns a double-bracket image into a real image tag', () => {
    const html = render('![[lcv.label.png]]');
    expect(html).toContain('<img');
    expect(html).toContain('src=');
  });

  it('uses the alias as the alt text when one is given', () => {
    const html = render('![[lcv.label.png|the label]]');
    expect(html).toContain('alt="the label"');
  });
});

describe('wiki-links', () => {
  it('turns a double-bracket name into a link to that page', () => {
    const html = render('[[Little Cloud Vineyard]]');
    expect(html).toContain('href="/Little%20Cloud%20Vineyard"');
    expect(html).toContain('>Little Cloud Vineyard</a>');
  });

  it('shows the alias text but still points at the target', () => {
    const html = render('[[Little Cloud Vineyard|Home]]');
    expect(html).toContain('href="/Little%20Cloud%20Vineyard"');
    expect(html).toContain('>Home</a>');
  });
});

describe('relaxed link with spaces', () => {
  it('keeps reading past spaces in the target by encoding them', () => {
    const html = render('[label](Some Page)');
    expect(html).toContain('href="Some%20Page"');
    expect(html).toContain('>label</a>');
  });

  it('leaves a titled link alone', () => {
    const html = render('[label](page "a title")');
    expect(html).toContain('<a href="page"');
    expect(html).toContain('label</a>');
  });
});

describe('rules the code does not satisfy yet', () => {
  it.skip('outside links should open in a new tab', () => {
    // Spec line 37: external links open in a new tab. The parser chain has
    // no step that adds a new-tab marker, so nothing opens a new tab today.
    const html = render('[label](https://example.com)');
    expect(html).toContain('target="_blank"');
  });

  it.skip('one page body should appear inline inside another', () => {
    // Spec line 34: a page embed pulls another page's body in. Today the
    // code turns `![[Other Note]]` into a broken image instead.
    const html = render('![[Sidebar]]');
    expect(html).not.toContain('<img');
    expect(html).toContain('under construction');
  });

  it.skip('a pipe table should render as a table', () => {
    // Spec line 43 lists tables. The stack has no GFM step, so a pipe table
    // renders as a plain paragraph, not a table.
    const html = render('| a | b |\n| - | - |\n| 1 | 2 |');
    expect(html).toContain('<table>');
  });

  it.skip('a center callout should carry a center marker for the styling to catch', () => {
    // Spec line 36: a `[!center]` line shows centered, no box. The styling
    // file targets `.callout.center`, but the markdown engine maps the
    // unknown "center" type to the default "note" style, so the HTML comes
    // out as `class="callout note"` with a pencil icon. The center marker
    // never reaches the page, so the centering CSS never fires.
    const html = render('> [!center] middle');
    expect(html).toContain('callout center');
  });
});

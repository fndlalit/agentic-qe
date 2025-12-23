/**
 * Vibium-based Accessibility Scanner
 *
 * Uses Vibium browser automation for WCAG 2.2 compliance testing
 * with copy-paste ready fixes for developers.
 */

// Note: Import Vibium when available
// import { browser, browserSync } from 'vibium';

export interface A11yViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: A11yNode[];
}

export interface A11yNode {
  html: string;
  target: string[];
  failureSummary: string;
  data?: Record<string, unknown>;
}

export interface A11yScanResult {
  url: string;
  timestamp: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  violations: A11yViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
}

export interface VideoInfo {
  type: string;
  src: string;
  hasTrack: boolean;
  trackKinds: Array<{ kind: string; label: string; src: string }>;
}

export interface KeyboardNavResult {
  tabOrder: Array<{
    tagName: string;
    id: string;
    className: string;
    text: string;
    hasFocusIndicator: boolean;
  }>;
  focusTraps: unknown[];
  missingFocusIndicators: unknown[];
}

export interface CopyPasteFix {
  issue: string;
  impact: string;
  wcagCriteria: string[];
  elements: number;
  fix: string;
}

/**
 * Generate copy-paste ready fix for a violation
 */
export function generateFix(violation: A11yViolation): string {
  const node = violation.nodes[0];
  const html = node?.html || '';
  const target = node?.target[0] || '';
  const data = node?.data as Record<string, string> | undefined;

  const fixes: Record<string, string> = {
    'color-contrast': `
/* Fix: Insufficient color contrast */
/* Current ratio: ${data?.ratio || 'unknown'} (required: 4.5:1 for normal text, 3:1 for large text) */
/* WCAG: 1.4.3 Contrast (Minimum) Level AA */

/* Option 1: Darken text color */
${target} {
  color: #1a1a1a; /* Higher contrast dark color */
}

/* Option 2: Lighten background */
${target} {
  background-color: #ffffff;
}

/* Option 3: Both adjustments */
${target} {
  color: #333333;
  background-color: #fafafa;
}
`,

    'label': `
<!-- Fix: Form input missing label -->
<!-- WCAG: 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value -->
<!-- Before: -->
${html}

<!-- After: Add explicit label -->
<label for="input-id">
  Descriptive Label Text
</label>
<input type="text" id="input-id" name="field-name" />

<!-- Or use aria-label for visual hiding -->
<input
  type="text"
  aria-label="Descriptive label for screen readers"
  placeholder="Visual placeholder"
/>
`,

    'image-alt': `
<!-- Fix: Image missing alternative text -->
<!-- WCAG: 1.1.1 Non-text Content Level A -->
<!-- Before: -->
${html}

<!-- After: Add descriptive alt text -->
${html.replace(/\/?>/, ' alt="[Describe the image content and purpose]" />')}

<!-- For decorative images only: -->
${html.replace(/\/?>/, ' alt="" role="presentation" />')}
`,

    'button-name': `
<!-- Fix: Button has no accessible name -->
<!-- WCAG: 4.1.2 Name, Role, Value Level A -->
<!-- Before: -->
${html}

<!-- Option 1: Add visible text -->
<button type="button">
  Click to Submit
</button>

<!-- Option 2: Add aria-label (for icon-only buttons) -->
<button type="button" aria-label="Submit form">
  <svg aria-hidden="true"><!-- icon --></svg>
</button>

<!-- Option 3: Use aria-labelledby -->
<button type="button" aria-labelledby="btn-label">
  <span id="btn-label" class="visually-hidden">Submit form</span>
  <svg aria-hidden="true"><!-- icon --></svg>
</button>
`,

    'link-name': `
<!-- Fix: Link has no accessible name -->
<!-- WCAG: 2.4.4 Link Purpose, 4.1.2 Name, Role, Value -->
<!-- Before: -->
${html}

<!-- After: Add descriptive text -->
<a href="/destination">
  Descriptive Link Text
</a>

<!-- For icon links: -->
<a href="/destination" aria-label="View user profile">
  <svg aria-hidden="true"><!-- icon --></svg>
</a>
`,

    'html-has-lang': `
<!-- Fix: Page missing language attribute -->
<!-- WCAG: 3.1.1 Language of Page Level A -->
<!-- Before: -->
<html>

<!-- After: Add lang attribute -->
<html lang="en">
<!-- Use appropriate language code: en, es, fr, de, zh, etc. -->
`,

    'landmark-one-main': `
<!-- Fix: Page should have one main landmark -->
<!-- WCAG: 1.3.1 Info and Relationships -->

<!-- Add main landmark to page content -->
<body>
  <header>...</header>
  <nav>...</nav>

  <main id="main-content">
    <!-- Primary page content here -->
  </main>

  <footer>...</footer>
</body>
`,

    'region': `
<!-- Fix: Content not contained in a landmark region -->
<!-- WCAG: 1.3.1 Info and Relationships -->

<!-- Wrap content in appropriate landmarks -->
<header role="banner">
  <!-- Site header content -->
</header>

<nav role="navigation" aria-label="Main">
  <!-- Navigation links -->
</nav>

<main role="main">
  <!-- Primary content -->
</main>

<aside role="complementary">
  <!-- Secondary content -->
</aside>

<footer role="contentinfo">
  <!-- Footer content -->
</footer>
`,

    'heading-order': `
<!-- Fix: Heading levels should only increase by one -->
<!-- WCAG: 1.3.1 Info and Relationships -->
<!-- Don't skip from h1 to h3, or h2 to h4 -->

<!-- Before (incorrect): -->
<h1>Page Title</h1>
<h3>Subsection</h3>  <!-- Skipped h2! -->

<!-- After (correct): -->
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
`,

    'focus-order-semantics': `
<!-- Fix: Focus order should follow logical reading order -->
<!-- WCAG: 2.4.3 Focus Order Level A -->

/* Avoid positive tabindex values */
/* Before (incorrect): */
<button tabindex="3">Third</button>
<button tabindex="1">First</button>
<button tabindex="2">Second</button>

/* After (correct - use DOM order): */
<button>First</button>
<button>Second</button>
<button>Third</button>

/* Use tabindex="0" for custom focusable elements */
<div role="button" tabindex="0">Custom Button</div>

/* Use tabindex="-1" for programmatic focus only */
<div tabindex="-1" id="error-message">Error!</div>
`,

    'target-size': `
<!-- Fix: Target size too small for touch -->
<!-- WCAG: 2.5.8 Target Size (Minimum) Level AA -->
<!-- Minimum 24x24 CSS pixels -->

/* Before: */
.small-button {
  width: 16px;
  height: 16px;
}

/* After: Meet minimum 24x24px */
.accessible-button {
  min-width: 24px;
  min-height: 24px;
  /* Or better: 44x44px for comfortable touch */
  min-width: 44px;
  min-height: 44px;
}
`,
  };

  return fixes[violation.id] || `
/* Manual fix required for: ${violation.id} */
/* Description: ${violation.description} */
/* Help: ${violation.helpUrl} */
/* Impact: ${violation.impact} */

/* Affected element: */
${html}

/* Recommendation: */
/* ${violation.help} */
`;
}

/**
 * Generate video caption fix template
 */
export function generateCaptionFix(video: VideoInfo): string {
  const filename = video.src.split('/').pop()?.replace(/\.[^.]+$/, '') || 'video';

  return `
<!-- Video missing captions: ${video.src} -->
<!-- WCAG: 1.2.2 Captions (Prerecorded) Level A -->
<!-- WCAG: 1.2.3 Audio Description or Media Alternative Level A -->

<!-- Before: -->
<video src="${video.src}"></video>

<!-- After: Add caption and description tracks -->
<video src="${video.src}" controls>
  <!-- Captions for deaf/hard-of-hearing users -->
  <track
    kind="captions"
    src="/captions/${filename}.vtt"
    srclang="en"
    label="English Captions"
    default
  />

  <!-- Subtitles for non-native speakers (optional) -->
  <track
    kind="subtitles"
    src="/subtitles/${filename}-es.vtt"
    srclang="es"
    label="Spanish Subtitles"
  />

  <!-- Audio descriptions for blind users (optional but recommended) -->
  <track
    kind="descriptions"
    src="/descriptions/${filename}-descriptions.vtt"
    srclang="en"
    label="Audio Descriptions"
  />

  <!-- Fallback for browsers that don't support video -->
  <p>
    Your browser doesn't support HTML5 video.
    <a href="${video.src}">Download the video</a> or
    <a href="/transcripts/${filename}.html">read the transcript</a>.
  </p>
</video>

<!-- WebVTT Caption File Template (${filename}.vtt): -->
<!--
WEBVTT

1
00:00:00.000 --> 00:00:03.000
[Speaker name] First line of dialogue.

2
00:00:03.500 --> 00:00:07.000
Second line of dialogue continues here.

3
00:00:07.500 --> 00:00:10.000
[Sound effect description in brackets]
-->
`;
}

/**
 * Generate focus indicator CSS fix
 */
export function generateFocusIndicatorFix(element: {
  tagName: string;
  className: string;
}): string {
  const selector = element.className
    ? `.${element.className.split(' ')[0]}`
    : element.tagName.toLowerCase();

  return `
/* Fix: Missing visible focus indicator */
/* WCAG: 2.4.7 Focus Visible Level AA */
/* WCAG: 2.4.13 Focus Appearance Level AAA */

/* Global focus styles */
*:focus {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}

/* Or use focus-visible for keyboard-only focus */
*:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}

/* Hide outline on mouse click but show for keyboard */
*:focus:not(:focus-visible) {
  outline: none;
}

/* Specific element fix */
${selector}:focus,
${selector}:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
  /* Alternative: box-shadow for rounded elements */
  box-shadow: 0 0 0 3px rgba(0, 95, 204, 0.5);
}

/* High contrast mode support */
@media (forced-colors: active) {
  ${selector}:focus {
    outline: 3px solid CanvasText;
  }
}
`;
}

/**
 * Configuration for Vibium-based scanning
 */
export interface VibiumScanConfig {
  url: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  includeKeyboardTest: boolean;
  includeVideoCheck: boolean;
  waitForSelector?: string;
  timeout?: number;
  viewport?: { width: number; height: number };
}

/**
 * axe-core WCAG tag mapping
 */
export function getWcagTags(level: 'A' | 'AA' | 'AAA'): string[] {
  const baseTags = ['wcag2a', 'wcag21a'];

  if (level === 'AA' || level === 'AAA') {
    baseTags.push('wcag2aa', 'wcag21aa', 'wcag22aa');
  }

  if (level === 'AAA') {
    baseTags.push('wcag2aaa', 'wcag21aaa');
  }

  return baseTags;
}

/**
 * Main accessibility scanner class
 * Uses Vibium for browser automation when available
 */
export class VibiumAccessibilityScanner {
  private config: VibiumScanConfig;

  constructor(config: VibiumScanConfig) {
    this.config = {
      wcagLevel: 'AA',
      includeKeyboardTest: true,
      includeVideoCheck: true,
      timeout: 60000,
      viewport: { width: 1920, height: 1080 },
      ...config,
    };
  }

  /**
   * Check if Vibium is available
   */
  async checkVibiumAvailable(): Promise<boolean> {
    try {
      // Try to import Vibium
      await import('vibium');
      return true;
    } catch {
      console.warn('Vibium not installed. Install with: npm install vibium');
      return false;
    }
  }

  /**
   * Run full accessibility scan
   */
  async scan(): Promise<{
    results: A11yScanResult;
    fixes: CopyPasteFix[];
    keyboard?: KeyboardNavResult;
    videos?: VideoInfo[];
  }> {
    const hasVibium = await this.checkVibiumAvailable();

    if (!hasVibium) {
      throw new Error(
        'Vibium is required for accessibility scanning. ' +
        'Install with: npm install vibium'
      );
    }

    // Dynamic import of Vibium
    const { browser } = await import('vibium');

    const vibe = await browser.launch({
      headless: true,
    });

    try {
      await vibe.go(this.config.url);

      // Wait for page to load
      if (this.config.waitForSelector) {
        await vibe.find(this.config.waitForSelector);
      }

      // Run axe-core scan via page evaluation
      const wcagTags = getWcagTags(this.config.wcagLevel);

      const axeResults = await this.runAxeScan(vibe, wcagTags);

      // Generate copy-paste fixes
      const fixes = axeResults.violations.map(v => ({
        issue: v.description,
        impact: v.impact,
        wcagCriteria: v.tags.filter(t => t.startsWith('wcag')),
        elements: v.nodes.length,
        fix: generateFix(v),
      }));

      const result: {
        results: A11yScanResult;
        fixes: CopyPasteFix[];
        keyboard?: KeyboardNavResult;
        videos?: VideoInfo[];
      } = {
        results: {
          url: this.config.url,
          timestamp: new Date().toISOString(),
          wcagLevel: this.config.wcagLevel,
          violations: axeResults.violations,
          passes: axeResults.passes,
          incomplete: axeResults.incomplete,
          inapplicable: axeResults.inapplicable,
        },
        fixes,
      };

      // Keyboard navigation test
      if (this.config.includeKeyboardTest) {
        result.keyboard = await this.runKeyboardTest(vibe);
      }

      // Video caption check
      if (this.config.includeVideoCheck) {
        result.videos = await this.detectVideos(vibe);
      }

      return result;
    } finally {
      await vibe.quit();
    }
  }

  /**
   * Run axe-core scan via Vibium
   */
  private async runAxeScan(
    vibe: unknown,
    tags: string[]
  ): Promise<{
    violations: A11yViolation[];
    passes: number;
    incomplete: number;
    inapplicable: number;
  }> {
    // Inject and run axe-core
    const results = await (vibe as { evaluate: (script: string) => Promise<unknown> }).evaluate(`
      (async () => {
        // Load axe-core if not present
        if (!window.axe) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.4/axe.min.js';
          document.head.appendChild(script);
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
        }

        // Run scan
        return await axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ${JSON.stringify(tags)}
          }
        });
      })()
    `);

    const axeResults = results as {
      violations: A11yViolation[];
      passes: unknown[];
      incomplete: unknown[];
      inapplicable: unknown[];
    };

    return {
      violations: axeResults.violations,
      passes: axeResults.passes.length,
      incomplete: axeResults.incomplete.length,
      inapplicable: axeResults.inapplicable.length,
    };
  }

  /**
   * Run keyboard navigation test
   */
  private async runKeyboardTest(vibe: unknown): Promise<KeyboardNavResult> {
    const results: KeyboardNavResult = {
      tabOrder: [],
      focusTraps: [],
      missingFocusIndicators: [],
    };

    const vibeTyped = vibe as {
      keyboard: { press: (key: string) => Promise<void> };
      evaluate: (script: string) => Promise<unknown>;
    };

    // Tab through interactive elements
    for (let i = 0; i < 30; i++) {
      await vibeTyped.keyboard.press('Tab');

      const activeElement = await vibeTyped.evaluate(`
        (() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;

          const styles = window.getComputedStyle(el);
          return {
            tagName: el.tagName,
            id: el.id || '',
            className: el.className || '',
            text: el.textContent?.substring(0, 50) || '',
            hasFocusIndicator:
              styles.outline !== 'none' && styles.outline !== '' ||
              styles.boxShadow !== 'none' && styles.boxShadow !== ''
          };
        })()
      `);

      if (!activeElement) continue;

      const element = activeElement as KeyboardNavResult['tabOrder'][0];
      results.tabOrder.push(element);

      if (!element.hasFocusIndicator) {
        results.missingFocusIndicators.push(element);
      }

      // Check for focus trap
      if (
        i > 0 &&
        results.tabOrder[i]?.id === results.tabOrder[i - 1]?.id &&
        results.tabOrder[i]?.id !== ''
      ) {
        results.focusTraps.push(element);
        break;
      }
    }

    return results;
  }

  /**
   * Detect videos and check for captions
   */
  private async detectVideos(vibe: unknown): Promise<VideoInfo[]> {
    const vibeTyped = vibe as {
      evaluate: (script: string) => Promise<unknown>;
    };

    const videos = await vibeTyped.evaluate(`
      Array.from(document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="wistia"]'))
        .map(el => ({
          type: el.tagName,
          src: el.src || el.currentSrc || '',
          hasTrack: el.tagName === 'VIDEO' ?
            el.querySelectorAll('track').length > 0 : false,
          trackKinds: el.tagName === 'VIDEO' ?
            Array.from(el.querySelectorAll('track')).map(t => ({
              kind: t.kind,
              label: t.label,
              src: t.src
            })) : []
        }))
    `);

    return videos as VideoInfo[];
  }
}

export default VibiumAccessibilityScanner;

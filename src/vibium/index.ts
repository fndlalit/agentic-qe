/**
 * Vibium Integration Module
 *
 * Provides accessibility testing capabilities using Vibium browser automation.
 * Vibium is a lightweight (~10MB) browser control system for AI agents.
 *
 * @example
 * ```typescript
 * import { VibiumAccessibilityScanner, generateFix } from './vibium';
 *
 * const scanner = new VibiumAccessibilityScanner({
 *   url: 'https://example.com',
 *   wcagLevel: 'AA',
 *   includeKeyboardTest: true,
 *   includeVideoCheck: true
 * });
 *
 * const results = await scanner.scan();
 * console.log(results.fixes);
 * ```
 */

export {
  VibiumAccessibilityScanner,
  generateFix,
  generateCaptionFix,
  generateFocusIndicatorFix,
  getWcagTags,
  type A11yViolation,
  type A11yNode,
  type A11yScanResult,
  type VideoInfo,
  type KeyboardNavResult,
  type CopyPasteFix,
  type VibiumScanConfig,
} from './accessibility-scanner';

/**
 * Quick accessibility scan using Vibium
 *
 * @param url - URL to scan
 * @param options - Scan options
 * @returns Scan results with copy-paste fixes
 */
export async function quickA11yScan(
  url: string,
  options?: {
    wcagLevel?: 'A' | 'AA' | 'AAA';
    includeKeyboardTest?: boolean;
    includeVideoCheck?: boolean;
  }
) {
  const { VibiumAccessibilityScanner } = await import('./accessibility-scanner');

  const scanner = new VibiumAccessibilityScanner({
    url,
    wcagLevel: options?.wcagLevel ?? 'AA',
    includeKeyboardTest: options?.includeKeyboardTest ?? true,
    includeVideoCheck: options?.includeVideoCheck ?? true,
  });

  return scanner.scan();
}

/**
 * Check if Vibium is installed and available
 */
export async function isVibiumAvailable(): Promise<boolean> {
  try {
    await import('vibium');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Vibium installation instructions
 */
export function getVibiumInstallInstructions(): string {
  return `
Vibium Installation Instructions
================================

1. Install via npm:
   npm install vibium

2. Add Vibium MCP server to Claude Code:
   claude mcp add vibium -- npx -y vibium

3. Vibium will automatically download Chrome for Testing
   on first use (no manual browser setup required).

Available MCP Tools:
- browser_launch    : Initialize browser
- browser_navigate  : Load URL
- browser_find      : Locate element
- browser_click     : Click element
- browser_type      : Type text
- browser_screenshot: Capture viewport
- browser_quit      : Close browser

Documentation: https://github.com/VibiumDev/vibium
`;
}

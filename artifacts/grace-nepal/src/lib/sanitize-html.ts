/**
 * Frontend HTML sanitization utilities.
 *
 * These are used when rendering content that might have been stored with
 * potentially unsafe HTML. Together with server-side sanitization they form
 * a defense-in-depth against stored XSS.
 *
 * Export a minimal `escapeHtml` so any component passing user content into
 * `dangerouslySetInnerHTML` receives a pre-sanitized string.
 */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escape all HTML special characters in a plain-text value.
 * Use this when you intend to render text literally and never accept HTML.
 */
export function escapeHtml(raw: string): string {
  return raw.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

/**
 * Strip all HTML tags from a string and escape the remaining text.
 * Use this when you want to display rich-text content as plain text only.
 */
export function stripHtml(raw: string): string {
  return escapeHtml(raw.replace(/<[^>]*>/g, ''));
}

/**
 * Only keep a whitelist of safe formatting tags, stripping everything else.
 * Allowed tags: p, br, b, i, strong, em, ul, li
 */
const SAFE_TAG_RE = /^\/?(p|br|b|i|strong|em|ul|li)(\s|$|\/)/i;

export function sanitizeHtml(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(\/?)(\w+)[^>]*>/g, (match, slash, tag) => {
      if (SAFE_TAG_RE.test(slash + tag)) {
        return match;
      }
      return '';
    });
}

/**
 * Render a rich-text string into the DOM by escaping it. Safe for use with
 * dangerouslySetInnerHTML because the result contains no HTML tags.
 * Equivalent to stripHtml but returns an HTML-safe whitespace-preserving
 * string suitable for injection.
 */
export function toSafeHtml(raw: string): string {
  return stripHtml(raw);
}

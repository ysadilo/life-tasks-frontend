import DOMPurify from 'dompurify';

// Task descriptions are authored in a contentEditable WYSIWYG and stored as HTML.
// Every render path must sanitize — the field also comes back from the API.
const ALLOWED_TAGS = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'ul', 'ol', 'li', 'a'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

// Links open in a new tab so they never navigate away from the SPA.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  }
});

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}

/** Plain-text projection for dense list rows (keeps the single-line clamp meaningful). */
export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** contentEditable leaves `<br>`, `<p></p>`, `&nbsp;` behind when "cleared" — treat those as empty. */
export function isBlankHtml(html: string): boolean {
  return htmlToText(html) === '';
}

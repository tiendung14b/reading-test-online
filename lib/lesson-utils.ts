/**
 * Utility to process lesson content HTML and inject IDs into headings
 * for the Table of Contents.
 */
export function injectHeadingIds(html: string): string {
  if (typeof window === 'undefined' || !html) return html;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3');
  
  headings.forEach((heading, index) => {
    if (!heading.id) {
      const text = heading.textContent || '';
      const slug = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      heading.id = slug ? `section-${slug}-${index}` : `section-${index}`;
    }
  });
  
  return doc.body.innerHTML;
}

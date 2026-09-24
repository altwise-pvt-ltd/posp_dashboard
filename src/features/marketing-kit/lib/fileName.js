/**
 * `Happy Bhai Dooj` → `happy-bhai-dooj.jpg`.
 *
 * The name is what the agent sees in their gallery and what a customer sees
 * under a PDF attachment, so both halves of the module use this one rule —
 * cards arriving from the same agent named two different ways reads as
 * sloppiness on the agent's part rather than ours.
 *
 * Lowercase ASCII and hyphens only. This file crosses into someone else's
 * filesystem, and a name that survives Android, iOS and Windows alike is worth
 * more than keeping the original's punctuation.
 */
export function fileNameFor(title, extension, fallback = 'marketing-card') {
  const slug = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    /* Long enough to stay recognisable, short enough that no filesystem
       truncates it into a collision with the next card. */
    .slice(0, 60);

  return `${slug || fallback}.${extension}`;
}

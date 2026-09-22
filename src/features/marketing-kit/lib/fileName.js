/**
 * `Diwali Greeting` → `diwali-greeting.jpg`.
 *
 * Shared by the two things that produce a file — the canvas that draws a banner
 * and the fetch that pulls a brochure — because the name is what a recipient
 * sees. WhatsApp prints it under a PDF attachment, and two cards arriving from
 * the same agent named by two different rules is the kind of detail that reads
 * as sloppiness on the agent's part rather than ours.
 *
 * The slug is lowercase ASCII and hyphens only: this crosses a share sheet into
 * someone else's filesystem, and a name that survives Android, iOS and Windows
 * alike is worth more than keeping the original punctuation.
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

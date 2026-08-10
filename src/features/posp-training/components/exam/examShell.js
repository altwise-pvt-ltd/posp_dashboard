/**
 * The box every exam screen sits in — instructions, the live section and the
 * hand-off between sections are all the same size, so the view does not resize
 * as the learner moves between them.
 *
 * Square-cornered: the shell is full-bleed, so a radius here only ever shows as
 * four clipped corners against the browser chrome rather than as the edge of a
 * card.
 *
 * The exam is full-bleed: the training page hides the brand bar and drops its
 * own padding while it is open, so the shell has the viewport to itself and
 * takes all of it. `min-h` on small screens (content can be taller than the
 * viewport and should scroll the page), a fixed height from `lg` (the runner
 * scrolls its two columns independently). Each screen adds its own border,
 * surface and overflow on top.
 */
export const EXAM_SHELL = 'relative w-full min-h-screen lg:h-screen';

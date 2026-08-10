/**
 * The box every exam screen sits in — instructions, the live section and the
 * hand-off between sections are all the same size and rounding, so the view
 * does not resize as the learner moves between them.
 *
 * Height is the viewport less the 4rem the training page reserves above it.
 * `min-h` on small screens (content can be taller than the viewport and should
 * scroll the page), a fixed height from `lg` (the runner scrolls its two
 * columns independently). Each screen adds its own border, surface and
 * overflow on top.
 */
export const EXAM_SHELL = 'relative w-full min-h-[calc(100vh-4rem)] rounded-3xl lg:h-[calc(100vh-4rem)]';

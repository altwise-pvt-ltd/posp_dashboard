import { Clock3, ExternalLink, FileText } from 'lucide-react';

/**
 * One chapter of the study material.
 *
 * Two states, because the LMS has two. A chapter with a published file is a link
 * — the whole row is the target rather than a trailing button, since the card
 * carries no other action and a separate hit area only shrinks the one that
 * matters. A chapter the LMS has listed but not yet published a file for is a
 * flat, muted row: it is part of the syllabus a POSP is being examined on, so
 * hiding it would understate what the programme covers, and making it look
 * clickable would promise a file that isn't there.
 *
 * `courseApi` used to drop the second kind entirely. That turned a 38-chapter
 * syllabus into two rows and read as "this is all there is".
 */
function ChapterCard({ chapter }) {
  if (!chapter.link) {
    return (
      /* Dashed and unsaturated on purpose: the same visual grammar the page
         already uses for "nothing here yet", so it reads as pending rather than
         as a card that failed to load. Not focusable — there is nothing to do
         with it — but the state is in the text, not only in the colour. */
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-slate-300">
          <FileText className="size-4" strokeWidth={2} aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-500">
            {chapter.title}
          </span>
          <span className="block text-xs text-slate-400">{chapter.type}</span>
        </span>

        <span className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-300">
          <Clock3 className="size-4" strokeWidth={2.25} aria-hidden="true" />
        </span>
      </div>
    );
  }

  return (
    /* Opens rather than downloads, and says so. `download` is ignored by every
       browser on a cross-origin href — the PDFs are served by the API, not this
       origin — so an anchor carrying it would promise a save and deliver a tab.
       The viewer it opens in has a save button of its own. */
    <a
      href={chapter.link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${chapter.title} (${chapter.type}, opens in a new tab)`}
      className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_16px_32px_-24px_rgba(15,23,42,0.45)] focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/25"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-400 transition-colors duration-200 group-hover:bg-orange-50 group-hover:text-orange-600">
        <FileText className="size-4" strokeWidth={2} aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-800">{chapter.title}</span>
        <span className="block text-xs text-slate-400">{chapter.type}</span>
      </span>

      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-400 transition-colors duration-200 group-hover:bg-orange-600 group-hover:text-white">
        <ExternalLink className="size-4" strokeWidth={2.25} aria-hidden="true" />
      </span>
    </a>
  );
}

export default ChapterCard;

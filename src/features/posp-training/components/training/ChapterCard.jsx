import { ExternalLink, FileText } from 'lucide-react';

/**
 * One chapter of the study material — always a published PDF.
 *
 * One state, not two. Chapters the LMS has no file for are dropped upstream in
 * `courseApi`, so nothing here renders a greyed-out "Coming soon" row: this
 * screen shows the material the backend published and nothing this app imagined
 * around it. The guard below is for a chapter that somehow arrives without a
 * link — it renders nothing rather than an empty href.
 *
 * The card used to intercept its own click and pop a "Downloading..." notice
 * over a link to '#'. There is no such link left to intercept.
 *
 * The whole row is the target rather than a trailing button — the card carries
 * no other action, so a separate hit area only shrinks the one that matters.
 */
function ChapterCard({ chapter }) {
  if (!chapter.link) return null;

  return (
    /* Opens rather than downloads, and says so. `download` is ignored by every
       browser on a cross-origin href — the PDFs live on the LMS's own host — so
       an anchor carrying it would promise a save and deliver a tab. The viewer
       it opens in has a save button of its own. */
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

import { Download, FileText } from 'lucide-react';
import { showAlert } from '@/shared/store/alertStore';

/**
 * One downloadable chapter.
 *
 * The whole row is the download target rather than a trailing button: the card
 * carries no other action, so a separate hit area only shrinks the one that
 * matters. The plate on the right is an affordance, not a second link.
 */
function ChapterCard({ chapter }) {
  // Chapters whose PDF isn't wired up yet carry link '#'. Following it would
  // reload the page, so intercept and say so through the app's alert system.
  const isPlaceholder = chapter.link === '#';

  const handleClick = (event) => {
    if (!isPlaceholder) return;
    event.preventDefault();
    showAlert({ variant: 'info', title: chapter.title, message: 'Downloading...' });
  };

  return (
    <a
      href={chapter.link}
      download
      aria-label={`Download ${chapter.title}`}
      onClick={handleClick}
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
        <Download className="size-4" strokeWidth={2.25} aria-hidden="true" />
      </span>
    </a>
  );
}

export default ChapterCard;

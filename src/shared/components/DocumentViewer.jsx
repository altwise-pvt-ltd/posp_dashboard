import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, FileText, X } from "lucide-react";
import { useMatchMedia, MOBILE_QUERY } from "@/shared/hooks/useMatchMedia";

/** Shows an image or PDF from a URL. Android Chrome can't render a PDF in an iframe, so phones get a link out. */
function Stage({ url, type, title, isMobile }) {
  if (type?.startsWith("image/")) {
    return (
      <motion.img
        key={url}
        src={url}
        alt={title}
        draggable={false}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="max-h-full max-w-full rounded-md object-contain shadow-2xl"
      />
    );
  }

  if (type === "application/pdf" && !isMobile) {
    return <iframe src={url} title={title} className="size-full max-w-5xl rounded-lg bg-white shadow-2xl" />;
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center text-white/80">
      <FileText className="size-10" aria-hidden="true" />
      <p className="text-sm">This file opens in your phone's viewer.</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-white/90"
      >
        <ExternalLink className="size-4" aria-hidden="true" />
        Open file
      </a>
    </div>
  );
}

/**
 * Full-screen view of one uploaded document. Open while `url` is set.
 * `type` is the file's MIME type.
 */
export default function DocumentViewer({ url, type, title, onClose }) {
  const isMobile = useMatchMedia(MOBILE_QUERY);
  const open = Boolean(url);

  useEffect(() => {
    if (!open) return undefined;

    // Capture phase so a dialog underneath doesn't also close on Escape.
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    };

    const savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.body.style.overflow = savedOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-60 flex flex-col bg-slate-950/95 backdrop-blur-sm"
        >
          <header className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <h2 className="min-w-0 truncate text-base font-medium text-white">{title}</h2>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              aria-label="Close preview"
              title="Close (Esc)"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>

          {/* Tapping the empty area around the document closes. */}
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-20"
            onClick={(event) => event.target === event.currentTarget && onClose()}
          >
            <Stage url={url} type={type} title={title} isMobile={isMobile} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

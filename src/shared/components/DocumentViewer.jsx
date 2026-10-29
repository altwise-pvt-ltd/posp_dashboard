import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import DocumentStage from "@/shared/components/DocumentStage";
import { documentKind } from "@/shared/lib/documentKind";

/**
 * Full-screen view of one uploaded document. Open while `url` is set.
 * `type` is the file's MIME type.
 */
export default function DocumentViewer({ url, type, title, onClose }) {
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
            <DocumentStage url={url} kind={documentKind(type)} title={title} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

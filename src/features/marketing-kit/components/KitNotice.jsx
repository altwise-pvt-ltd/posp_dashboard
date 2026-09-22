/**
 * The frame every one of this module's non-grid states is drawn in — loading,
 * failed, nothing published, nothing matched.
 *
 * Shared so those four read as one voice rather than four slightly different
 * paddings, and so the section below can tell them apart by what it puts inside
 * rather than by rebuilding the layout each time.
 */
function KitNotice({ children }) {
  return (
    <div className="font-body-md text-body-md flex flex-col items-center justify-center gap-3 py-10 text-center text-on-surface-variant">
      {children}
    </div>
  );
}

export default KitNotice;

import { useId, useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { PANEL, PANEL_TITLE } from '../lib/panel';
import Fact from './Fact';

function AnswerPanel({ panel, open, onToggle }) {
  const bodyId = useId();

  return (
    <li className="border-b border-hairline-soft last:border-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 rounded-lg py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
      >
        <span className="min-w-0">
          <span className="font-body-lg text-body-lg block font-semibold text-on-surface">
            {panel.title}
          </span>
          {panel.caption && (
            <span className="font-body-md text-body-md block text-on-surface-variant">
              {panel.caption}
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <dl id={bodyId} className="grid grid-cols-2 gap-x-4 gap-y-4 pb-4 sm:grid-cols-3">
          {panel.entries.map((entry) => (
            <Fact key={entry.code} label={entry.label}>
              {entry.text}
            </Fact>
          ))}
        </dl>
      )}
    </li>
  );
}

/** The quote's answers, one collapsible panel per section row, orphans last. */
function QuoteAnswersAccordion({ sections = [], orphans = [], unlabelled = false, defaultOpen = true }) {
  const panels = sections.flatMap((section) =>
    section.rows.map((row) => ({
      key: `${section.code}-${row.index}`,
      title: section.name,
      // Only numbered when the section actually repeated.
      caption: section.rows.length > 1 ? `Entry ${row.index + 1}` : null,
      entries: row.entries,
    })),
  );

  if (orphans.length > 0) {
    panels.push({
      key: 'orphans',
      title: 'Other answers',
      caption: "Stored on this quote, but no longer part of this product's form.",
      entries: orphans,
    });
  }

  const keys = panels.map((p) => p.key);
  const [known, setKnown] = useState(() => new Set(keys));
  const [openKeys, setOpenKeys] = useState(() => new Set(defaultOpen ? keys : []));

  /**
   * A quiet refresh swaps the answers under a mounted accordion, so the panels
   * can change without a remount. Keys that are new follow `defaultOpen`; keys
   * the agent closed by hand stay closed; keys that have gone are dropped.
   */
  if (keys.length !== known.size || keys.some((key) => !known.has(key))) {
    const current = new Set(keys);
    setKnown(current);
    setOpenKeys((open) => {
      const next = new Set([...open].filter((key) => current.has(key)));
      if (defaultOpen) keys.forEach((key) => !known.has(key) && next.add(key));
      return next;
    });
  }

  if (panels.length === 0) return null;

  const allOpen = panels.every((panel) => openKeys.has(panel.key));

  const toggle = (key) =>
    setOpenKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleAll = () => setOpenKeys(allOpen ? new Set() : new Set(panels.map((p) => p.key)));

  return (
    <section className={PANEL}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className={PANEL_TITLE}>Quote details</h3>
        <button
          type="button"
          onClick={toggleAll}
          className="font-body-md text-body-md rounded-lg font-medium text-orange-700 transition-colors hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* Labels fall back to field codes when the question list didn't load. */}
      {unlabelled && (
        <p className="font-body-md text-body-md mt-3 flex items-start gap-2 rounded-xl border border-warning-outline bg-warning-container px-3 py-2 text-on-warning-container">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          The question list for this product couldn&apos;t be loaded, so the answers below are
          labelled by field code.
        </p>
      )}

      <ul className="mt-2">
        {panels.map((panel) => (
          <AnswerPanel
            key={panel.key}
            panel={panel}
            open={openKeys.has(panel.key)}
            onToggle={() => toggle(panel.key)}
          />
        ))}
      </ul>
    </section>
  );
}

export default QuoteAnswersAccordion;

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Loader2, Search } from 'lucide-react';

/**
 * Loose comparison — case and punctuation are ignored.
 *
 * The same rule `matchMasterValue` uses on the API side, and for the same
 * reason: it lets someone type "tamilnadu" or "Jammu & Kashmir" and still land
 * on the server's own spelling. Filtering and exact-matching share it so that
 * anything the list is willing to *show* for a query is also something the
 * query is allowed to *become*.
 */
const loosely = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/**
 * A text field that suggests, rather than a dropdown that dictates.
 *
 * The wrapper, label, input and error line are deliberately identical to
 * `Input`'s — including the two-line label reserve at `sm:` — so one of these
 * can sit in a grid row beside a plain field without a half-line offset giving
 * the seam away.
 *
 * ── The one idea worth knowing ──
 * There are two values here, not one, and keeping them apart is what makes the
 * component safe to hand a required field:
 *
 *   `query` — what is typed. Local, free-form, changes on every keystroke.
 *   `value` — what the *form* holds. Only ever a `value` from `options`.
 *
 * Typing something unmatched sets `query` and clears `value`. That is the whole
 * trick: a half-typed or misspelt state never reaches the form, so a dependent
 * request built from it — `districts?state=…` — cannot be fired with garbage,
 * and the field's existing "required" error covers the case for free. Nothing
 * the user typed is erased to achieve that; the text stays on screen while the
 * form quietly holds nothing.
 *
 * `options` is `[{ value, label }]` — the shape the masters endpoints return.
 */
function Autocomplete({
  id,
  label,
  error,
  hint,
  value = '',
  onChange,
  onBlur,
  options = [],
  loading = false,
  disabled = false,
  placeholder,
  emptyMessage = 'No matches — check the spelling',
  className = '',
  labelClassName = '',
}) {
  const [query, setQuery] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listId = `${id}-listbox`;

  /**
   * Re-sync the text when the form value changes from *outside* — the PIN
   * lookup filling in a state, or Review seeding the editor.
   *
   * Adjusting state during render rather than in an effect: this is React's
   * documented pattern for exactly this case, and it avoids the extra
   * commit-then-correct pass an effect would cost on every external write.
   */
  const [lastValue, setLastValue] = useState(value ?? '');
  if (value !== lastValue) {
    setLastValue(value);
    setQuery(value ?? '');
  }

  /** Suggestions for the current text. An empty query lists everything, so
   *  clicking into the field and pressing Down browses rather than requiring a
   *  guess at the first letter. */
  const matches = useMemo(() => {
    const needle = loosely(query);
    if (!needle) return options;
    return options.filter((option) => loosely(option.label).includes(needle));
  }, [options, query]);

  /** Commit the text if — and only if — it *is* one of the options. */
  const commit = (text) => {
    const exact = options.find(
      (option) => loosely(option.label) === loosely(text) || loosely(option.value) === loosely(text)
    );
    onChange?.(exact ? exact.value : '');
  };

  const handleType = (event) => {
    const text = event.target.value;
    setQuery(text);
    setHighlight(0);
    setOpen(true);
    commit(text);
  };

  const pick = (option) => {
    setQuery(option.label);
    setOpen(false);
    onChange?.(option.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlight(0);
        return;
      }
      if (!matches.length) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setHighlight((current) => (current + step + matches.length) % matches.length);
      return;
    }

    if (event.key === 'Enter' && open && matches[highlight]) {
      // Only swallowed when it's actually picking something — otherwise Enter
      // stays the submit key it is everywhere else in the form.
      event.preventDefault();
      pick(matches[highlight]);
    }
  };

  /** The list is closed on blur, but the click that *caused* the blur has to
   *  land first — see the mousedown guard on the list below. */
  const handleBlur = (event) => {
    setOpen(false);
    onBlur?.(event);
  };

  const matched = Boolean(value);

  return (
    <div className="mb-3 sm:mb-3.5">
      <label
        htmlFor={id}
        className={`block mb-1 sm:mb-1.5 text-xs sm:text-sm font-semibold text-slate-700 ${
          label ? 'sm:flex sm:items-end sm:min-h-[2.5rem]' : ''
        } ${labelClassName}`}
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[highlight] ? `${id}-option-${highlight}` : undefined}
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={handleType}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          className={`w-full px-3 py-2 pr-10 sm:px-3.5 sm:py-2.5 sm:pr-10 rounded-xl border bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200'
          } ${className}`}
        />

        {/* Right-hand affordance, in priority order: still fetching → the field
            is busy; committed → a quiet confirmation that what's typed is a
            real option; otherwise → the chevron, which is what makes this read
            as a thing you can open rather than a plain text box. */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 size={16} strokeWidth={2.5} className="animate-spin text-slate-400" />
          ) : matched ? (
            <Check size={16} strokeWidth={2.5} className="text-emerald-500" />
          ) : (
            <ChevronDown size={16} strokeWidth={2.5} className="text-slate-400" />
          )}
        </span>

        {open && !disabled && !loading && (
          <ul
            id={listId}
            role="listbox"
            /* The click that picks an option fires *after* the blur it causes,
               by which point the list is unmounted and the click lands on
               nothing. Cancelling mousedown stops the blur ever happening, so
               focus stays in the input and onClick gets to run. */
            onMouseDown={(event) => event.preventDefault()}
            className="absolute z-20 mt-1.5 w-full max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_32px_rgba(222,123,61,0.12)] animate-in fade-in slide-in-from-top-1 duration-200"
          >
            {matches.length === 0 ? (
              <li className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-400">
                <Search size={14} strokeWidth={2.5} className="shrink-0" />
                {emptyMessage}
              </li>
            ) : (
              matches.map((option, index) => {
                const isHighlighted = index === highlight;
                const isPicked = option.value === value;
                return (
                  /* The `li` is the option itself rather than a wrapper around
                     a button. Focus never leaves the input in a combobox — the
                     highlighted row is announced through `aria-activedescendant`
                     — so a focusable control in here would be a second tab stop
                     that the keyboard pattern never visits. */
                  <li
                    key={option.value}
                    id={`${id}-option-${index}`}
                    role="option"
                    aria-selected={isPicked}
                    onClick={() => pick(option)}
                    onMouseEnter={() => setHighlight(index)}
                    className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition-colors duration-150 ${
                      isHighlighted ? 'bg-orange-50 text-orange-700' : 'text-slate-600'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isPicked && <Check size={14} strokeWidth={2.5} className="shrink-0 text-orange-500" />}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {error ? (
        <p
          className="mt-1 sm:mt-1.5 text-xs sm:text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1 duration-300"
          role="alert"
        >
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 sm:mt-1.5 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

export default Autocomplete;

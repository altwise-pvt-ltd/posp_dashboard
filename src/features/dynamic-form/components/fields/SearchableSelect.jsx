import { useState, useRef, useEffect, useId } from "react";

const CONTROL_BASE =
    "w-full rounded-xl border bg-slate-50 px-3 py-2 text-[0.8125rem] text-slate-900 placeholder-slate-400 transition-all duration-200 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:px-3.5 sm:py-2.5 sm:text-sm";

export default function SearchableSelect({
    field,
    value,
    error,
    disabled,
    onChange,
    onBlur,
}) {
    const {
        code,
        label,
        required,
        placeholder = "Select...",
        helperText,
        options = [],
        loading,
        loadError,
    } = field;

    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef(null);
    const listboxId = useId();

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }

        if (filteredOptions.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
                break;

            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
                break;

            case "Enter":
                e.preventDefault();

                if (highlightedIndex >= 0) {
                    handleSelect(filteredOptions[highlightedIndex].value);
                }
                break;

            case "Escape":
                e.preventDefault();
                setIsOpen(false);
                break;

            default:
                break;
        }
    };
    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    useEffect(() => {
        if (!isOpen) {
            setSearch(selectedOption ? selectedOption.text : "");
        }
    }, [isOpen, selectedOption]);


    // to manage the scroll position in the drop down <li using the arrow keys>
    useEffect(() => {
        if (!isOpen || highlightedIndex < 0) return;

        const element = document.getElementById(
            `${listboxId}-option-${highlightedIndex}`
        );

        if (element) {
            element.scrollIntoView({
                block: "nearest",
                behavior: "auto",
            });
        }
    }, [highlightedIndex, isOpen, listboxId]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                onBlur?.();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onBlur]);

    const filteredOptions = options.filter((opt, index) =>
        opt.text.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (optionValue) => {
        onChange?.(optionValue);
        setIsOpen(false);
    };

    const describedBy = error
        ? `${code}-error`
        : helperText
            ? `${code}-help`
            : undefined;

    const stateStyles = error
        ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
        : "border-slate-200 focus:border-orange-500 focus:ring-orange-500/20";

    return (
        <div className="flex flex-col gap-1.5" ref={containerRef}>
            <label htmlFor={code} className="block text-nav-sub font-semibold text-slate-700">
                {label}
                {required && <span className="ml-0.5 text-orange-500">*</span>}
            </label>

            <div className="relative">
                <input
                    id={code}
                    type="text"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-controls={listboxId}
                    aria-autocomplete="list"
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy}
                    aria-activedescendant={
                        highlightedIndex >= 0
                            ? `${listboxId}-option-${highlightedIndex}`
                            : undefined
                    }
                    disabled={disabled || loading}
                    placeholder={loading ? "Loading..." : placeholder}
                    value={isOpen ? search : selectedOption?.text ?? ""}
                    onFocus={() => {
                        setSearch("");
                        setIsOpen(true);
                        setHighlightedIndex(0);
                    }}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                        setHighlightedIndex(0);
                    }}
                    onKeyDown={handleKeyDown}
                    className={`${CONTROL_BASE} ${stateStyles} pr-9`}
                />


                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    {loading ? (
                        <svg className="h-4 w-4 animate-spin text-orange-500" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                    ) : (
                        <svg
                            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </div>


                {isOpen && (
                    <ul
                        id={listboxId}
                        role="listbox"
                        className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
                    >
                        {filteredOptions.length === 0 ? (
                            <li className="px-3 py-2 text-nav-sub text-slate-400">
                                {loading ? "Fetching options..." : "No matches found"}
                            </li>
                        ) : (
                            filteredOptions.map((opt, index) => {
                                const isSelected = String(opt.value) === String(value);
                                return (
                                    <li
                                        key={String(opt.value)}
                                        id={`${listboxId}-option-${index}`}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(opt.value)}
                                        className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-nav-sub transition-colors ${index === highlightedIndex
                                                ? "bg-slate-300/50"
                                                : isSelected
                                                    ? "bg-orange-500/10 font-semibold text-orange-600"
                                                    : "text-slate-700 hover:bg-slate-300/50"
                                            }`}
                                    >
                                        <span>{opt.text}</span>
                                        {isSelected && (
                                            <svg className="h-4 w-4 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        )}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                )}
            </div>

            {error ? (
                <p id={`${code}-error`} role="alert" className="text-status-pill font-medium text-red-500">
                    {error}
                </p>
            ) : loadError ? (
                <p className="text-status-pill text-red-400">Failed to load options.</p>
            ) : helperText ? (
                <p id={`${code}-help`} className="text-status-pill text-slate-400">
                    {helperText}
                </p>
            ) : null}
        </div>
    );
}
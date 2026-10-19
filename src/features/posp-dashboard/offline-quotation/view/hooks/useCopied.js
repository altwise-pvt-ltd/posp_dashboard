import { useEffect, useRef, useState } from 'react';
import { copyText } from '../lib/clipboard';

/** Tracks which value was copied last, cleared after a moment. */
export function useCopied() {
  const [copied, setCopied] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (key, value) => {
    if (!value) return false;
    const ok = await copyText(value);
    if (!ok) return false;

    setCopied(key);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1800);
    return true;
  };

  return { copied, copy };
}

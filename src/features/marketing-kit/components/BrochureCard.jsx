import { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import CardShell from './CardShell';
import CardAction from './CardAction';
import { useMounted } from '../hooks/useMounted';
import { fetchAndSave } from '../lib/saveFile';
import { fileNameFor } from '../lib/fileName';

/**
 * One brochure: a page preview, its title and blurb, and the PDF behind it.
 *
 * NOTHING OF THE AGENT IS PRINTED ON A BROCHURE — deliberately, and it is the
 * whole difference between this card and `BannerCard`. A brochure is a
 * published document about a product; a greeting card is the agent's own
 * outreach. Stamping a POSP ID onto product literature would read as the agent
 * having authored it. So this downloads the file exactly as published, which
 * also means it works for an agent still in onboarding, who has no footer to
 * stamp with anyway.
 *
 * Two ways out, unlike a card: clicking the preview opens the PDF in a tab to
 * *read* it — the browser's own viewer is the faster way — and the button
 * beneath saves it to *keep* it. Both are worth having because they are
 * genuinely different intents; a banner has only the one.
 *
 * The state is a single value rather than the `saving` / `failed` pair it
 * started as. Two booleans describe a fourth state that cannot happen, and they
 * spoke a different vocabulary from `usePreparedCard` next door for what is the
 * same idea. This needs no hook of its own though — one fetch and no cache is
 * not the four-step machine a branded card needs, and giving it one for
 * symmetry would be the more expensive mistake.
 */
function BrochureCard({ brochure }) {
  const { title, description, thumbnailUrl, documentUrl } = brochure;

  const [status, setStatus] = useState('idle');
  const mounted = useMounted();

  /* No `useCallback`. The React Compiler is on in this repo, and a manual
     memo whose callback reads `mounted.current` makes it bail out entirely —
     it infers the dependency as `mounted.current`, which cannot be written in
     a dependency array. Handing it the plain function lets it memoize on its
     own terms, which is both correct and what the compiler is for. */
  const download = async () => {
    setStatus('saving');

    try {
      await fetchAndSave(documentUrl, fileNameFor(title, 'pdf', 'brochure'));
      if (mounted.current) setStatus('idle');
    } catch {
      if (mounted.current) setStatus('failed');
    }
  };

  return (
    <CardShell
      title={title}
      imageUrl={thumbnailUrl}
      href={documentUrl}
      openLabel="Open PDF"
      unavailableLabel="Not published"
      actions={
        documentUrl && (
          <CardAction
            busy={status === 'saving'}
            icon={<Download />}
            label={status === 'saving' ? 'Downloading…' : 'Download'}
            onClick={download}
          >
            {/*
              The fallback is a link the agent clicks, not a tab opened for
              them. A saved-file failure is realistically the uploads host
              refusing a cross-origin read, and the PDF is still perfectly
              reachable by navigating to it — but `window.open` after an awaited
              fetch has lost the tap's activation and is what popup blockers
              exist to stop. Their click carries its own.
            */}
            {status === 'failed' && (
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body-md text-body-md inline-flex items-center justify-center gap-1.5 rounded-lg py-1 text-primary underline-offset-2 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                Couldn&apos;t save — open it instead
              </a>
            )}
          </CardAction>
        )
      }
    >
      {description && (
        /* Two lines, then clipped: the blurb hints at what the brochure covers,
           and letting it set the card's height would give a ragged grid. */
        <span className="font-body-md text-body-md line-clamp-2 text-on-surface-variant">
          {description}
        </span>
      )}
    </CardShell>
  );
}

export default BrochureCard;

import { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import CardShell from './CardShell';
import CardAction from './CardAction';
import { useMounted } from '../hooks/useMounted';
import { fetchAndSave } from '@/shared/lib/saveFile';
import { fileNameFor } from '../lib/fileName';


function BrochureCard({ brochure }) {
  const { title, description, thumbnailUrl, documentUrl } = brochure;

  const [status, setStatus] = useState('idle');
  const mounted = useMounted();

  
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

import { Check, Copy } from 'lucide-react';

function CopyIconButton({ label, done, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={done ? `${label} copied` : `Copy ${label}`}
      title={done ? 'Copied' : 'Copy'}
      className={`shrink-0 rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
        done ? 'bg-orange-50 text-orange-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      {done ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
    </button>
  );
}

export default CopyIconButton;

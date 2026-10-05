import { useState } from 'react';
import { IdCard } from 'lucide-react';
import BusinessCardFront from '@/shared/components/BusinessCardFront';
import { businessCardFields } from '@/shared/lib/businessCard';
import BusinessCardDialog from './BusinessCardDialog';

const CARD =
  'w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6';

const HEADING = 'text-xs font-bold uppercase tracking-widest text-orange-600';

const ACTION =
  'flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:scale-[0.98] transition-all duration-300 text-sm font-semibold';

function BusinessCardBox({ profile }) {
  const [open, setOpen] = useState(false);
  const fields = businessCardFields(profile);

  if (!fields) {
    return (
      <div className={CARD}>
        <p className={HEADING}>Business Card</p>
        <p className="mt-3 text-sm font-medium text-slate-500">
          Available once your POSP ID has been issued.
        </p>
      </div>
    );
  }

  return (
    <div className={`card-lift ${CARD}`}>
      <p className={HEADING}>Business Card</p>

      <div className="mt-4 pointer-events-none" aria-hidden="true">
        <BusinessCardFront {...fields} />
      </div>

      <button type="button" onClick={() => setOpen(true)} className={`${ACTION} mt-5`}>
        <IdCard className="size-4" />
        Generate my business card
      </button>

      <BusinessCardDialog
        open={open}
        fields={fields}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

export default BusinessCardBox;

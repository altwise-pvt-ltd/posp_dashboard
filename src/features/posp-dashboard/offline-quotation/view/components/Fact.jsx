export const FACT_LABEL =
  'font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant';

function Fact({ label, children, mono = false }) {
  return (
    <div className="min-w-0">
      <dt className={FACT_LABEL}>{label}</dt>
      <dd
        className={`mt-0.5 break-words text-on-surface ${
          mono ? 'font-data-mono text-body-lg font-semibold' : 'font-body-lg text-body-lg'
        }`}
      >
        {children}
      </dd>
    </div>
  );
}

export default Fact;

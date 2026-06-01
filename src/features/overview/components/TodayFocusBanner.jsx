import { Link } from 'react-router-dom';

function TodayFocusBanner({
  count = 3,
  estimatedValue = '₹84,500',
  to = '/leads',
}) {
  return (
    <section className="rounded-xl p-gutter flex flex-col md:flex-row items-start md:items-center justify-between gap-gutter relative overflow-hidden bg-gradient-to-r from-primary-fixed to-primary-fixed/40 border border-gray-200 anim-fade-d2">
      <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-primary-container/10 pointer-events-none" />

      <div className="flex items-start md:items-center gap-gutter relative z-10">
        <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shrink-0 shadow-[0_4px_12px_-4px_rgba(255,107,0,.4)]">
          <span className="material-symbols-outlined text-white">my_location</span>
        </div>
        <div>
          <p className="font-label-caps text-label-caps mb-1 text-primary">TODAY'S FOCUS</p>
          <h3 className="font-headline-md text-headline-md text-on-surface">
            {count} leads are waiting for a call back
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Estimated value · {estimatedValue} in potential premium
          </p>
        </div>
      </div>

      <Link
        to={to}
        className="bg-primary-container px-gutter py-unit rounded font-body-lg text-body-lg flex items-center gap-unit shrink-0 hover:bg-primary-container/90 transition-all hover:gap-3 relative z-10 w-full md:w-auto justify-center font-semibold text-white shadow-[0_4px_12px_-4px_rgba(255,107,0,.4)]"
      >
        Start calling <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
      </Link>
    </section>
  );
}

export default TodayFocusBanner;

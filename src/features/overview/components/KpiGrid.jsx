import AppLink from '@/shared/components/AppLink';
import KpiCard from './KpiCard';

function Trend({ value, color = 'emerald', arrow = '↑' }) {
  const palette = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-label-caps text-label-caps ${palette[color]}`}>
      <span>{arrow}</span> {value}
    </span>
  );
}

function Sparkline({ points, color = 'text-emerald-500' }) {
  return (
    <svg viewBox="0 0 60 20" className={`w-16 h-5 ${color}`}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KpiGrid() {
  return (
    <section className="anim-fade-d3">
      <div className="flex flex-wrap items-center justify-between gap-unit mb-gutter">
        <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-emerald-600 text-[22px]">monitoring</span>
          Your numbers this month
        </h3>
        <AppLink
          to="/reports"
          className="font-data-mono text-data-mono text-primary hover:underline hidden md:inline-flex items-center gap-1"
        >
          View report <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
        </AppLink>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-unit md:gap-gutter">
        <KpiCard
          label="Leads"
          to="/leads"
          theme="sky"
          toggleIcon="groups"
          countView={
            <>
              <p className="font-headline-lg text-headline-lg text-on-surface mb-1">124</p>
              <div className="flex flex-wrap items-center justify-between gap-unit">
                <Trend value="12%" color="emerald" />
                <Sparkline points="0,15 10,12 20,14 30,8 40,9 50,4 60,2" color="text-emerald-500" />
              </div>
            </>
          }
          listItems={[
            { title: 'D. Mehta · Health', meta: '2h' },
            { title: 'P. Singh · Motor', meta: '5h' },
            { title: 'A. Roy · Term', meta: '1d' },
          ]}
          viewAllTo="/leads"
        />

        <KpiCard
          label="Quotations"
          to="/quotations"
          theme="violet"
          toggleIcon="request_quote"
          countView={
            <>
              <p className="font-headline-lg text-headline-lg text-on-surface mb-1">86</p>
              <div className="flex flex-wrap items-center justify-between gap-unit">
                <span className="font-body-md text-body-md text-on-surface-variant">69% conv.</span>
                <Sparkline points="0,10 10,12 20,8 30,11 40,7 50,9 60,6" color="text-violet-500" />
              </div>
            </>
          }
          listItems={[
            { title: 'R. Patel · Motor', meta: '₹18.2K', metaColor: 'text-on-surface' },
            { title: 'M. Khan · Term', meta: '₹24.0K', metaColor: 'text-on-surface' },
            { title: 'S. Verma · Health', meta: '₹31.5K', metaColor: 'text-on-surface' },
          ]}
          viewAllTo="/quotations"
        />

        <KpiCard
          label="Policies"
          to="/policies"
          highlighted
          theme="primary"
          toggleIcon="workspace_premium"
          countView={
            <>
              <p className="font-headline-lg text-headline-lg text-primary mb-1">52</p>
              <div className="flex flex-wrap items-center justify-between gap-unit">
                <span className="font-body-md text-body-md text-on-surface">₹14.2L premium</span>
                <Trend value="8%" color="emerald" />
              </div>
            </>
          }
          listItems={[
            { title: 'HLT-2841 · Sharma', meta: '12m', mono: true },
            { title: 'MTR-1942 · Bose', meta: '3h', mono: true },
            { title: 'TRM-0884 · Pillai', meta: '1d', mono: true },
          ]}
          viewAllTo="/policies"
        />

        <KpiCard
          label="Renewals"
          to="/renewals"
          theme="amber"
          toggleIcon="autorenew"
          countView={
            <>
              <p className="font-headline-lg text-headline-lg text-on-surface mb-1">18</p>
              <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 2 pending this week
              </p>
            </>
          }
          listItems={[
            { title: 'S. Iyer · HLT-2102', meta: 'tmrw', metaColor: 'text-amber-600' },
            { title: 'J. Reddy · MTR-1856', meta: '3d' },
            { title: 'V. Nair · LFE-0492', meta: '5d' },
          ]}
          viewAllTo="/renewals"
        />

        <KpiCard
          label="Open claims"
          to="/claims"
          theme="rose"
          toggleIcon="receipt_long"
          countView={
            <>
              <p className="font-headline-lg text-headline-lg text-on-surface mb-1">7</p>
              <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> 3 require attention
              </p>
            </>
          }
          listItems={[
            { title: 'CLM-0184 · Joshi', meta: 'review', mono: true, metaColor: 'text-rose-600' },
            { title: 'CLM-0179 · Banerjee', meta: 'docs', mono: true, metaColor: 'text-amber-600' },
            { title: 'CLM-0172 · Pillai', meta: 'open', mono: true },
          ]}
          viewAllTo="/claims"
        />

        <KpiCard
          label="Support tickets"
          to="/tickets"
          theme="emerald"
          toggleIcon="support_agent"
          countView={
            <>
              <p className="font-headline-lg text-headline-lg text-on-surface mb-1">3</p>
              <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> All assigned
              </p>
            </>
          }
          listItems={[
            { title: '#3294 · S. Iyer', meta: 'done', mono: true, metaColor: 'text-emerald-600' },
            { title: '#3291 · M. Khan', meta: 'esc', mono: true, metaColor: 'text-rose-600' },
            { title: '#3287 · R. Patel', meta: 'wip', mono: true, metaColor: 'text-amber-600' },
          ]}
          viewAllTo="/tickets"
        />
      </div>
    </section>
  );
}

export default KpiGrid;

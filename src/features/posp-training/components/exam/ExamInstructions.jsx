import { motion } from 'framer-motion';
import { ArrowRight, Clock, CircleCheckBig, TriangleAlert } from 'lucide-react';
import { EXAM_SHELL } from './examShell';
import BrandTopbar from '@/shared/layouts/BrandTopbar';
import OnboardingFooter from '@/features/onboarding/components/OnboardingFooter';

function ExamInstructions({ sections, sectionMinutes, passPercentage, onStart }) {
  const sectionNames = sections.map((section) => section.label).join(' & ');
  const firstSection = sections[0];

  const instructions = [
    {
      icon: Clock,
      title: 'Time Limit',
      description: `You have exactly ${sectionMinutes} minutes for each section (${sectionNames}).`,
      color: 'text-orange-500 bg-orange-50 border-orange-100/50',
    },
    {
      icon: CircleCheckBig,
      title: 'Passing Criteria',
      description: `You must score at least ${passPercentage}% in each section individually to pass.`,
      color: 'text-orange-500 bg-orange-50 border-orange-100/50',
    },
    {
      icon: TriangleAlert,
      title: 'Important Warning',
      description: 'Do not close or refresh this page. You cannot return once submitted.',
      color: 'text-red-500 bg-red-50 border-red-100/50',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <BrandTopbar />

      <main className="flex w-full flex-1 flex-col p-4 md:p-6 lg:p-8">
        <div className={`${EXAM_SHELL} flex items-center justify-center bg-slate-50/50 p-6 md:p-12`}>
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-center">
            {/* Left Info Column */}
            <div className="md:col-span-2 flex flex-col items-start text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50/80 px-3 py-1 text-xs font-semibold text-orange-600 mb-3 border border-orange-100/30">
                POSP Certification
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 leading-tight">
                Ready to Begin?
              </h2>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                Please read the instruction cards carefully. Once you start, the timer will begin running and cannot be paused.
              </p>

              <button
                type="button"
                onClick={onStart}
                className="group mt-8 flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(234,88,12,0.15)] transition-all hover:bg-orange-700 hover:shadow-[0_6px_20px_rgba(234,88,12,0.25)] active:scale-[0.98]"
              >
                Start {firstSection.title} Exam
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <p className="mt-3 text-xs text-slate-400">
                Your progress will be saved automatically.
              </p>
            </div>

            {/* Right Cards Column */}
            <div className="md:col-span-3 space-y-4">
              {instructions.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="group relative flex items-center gap-5 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md"
                  >
                    {/* Icon Container */}
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 shadow-inner transition-transform duration-300 group-hover:scale-105 ${item.color}`}>
                      <Icon className="h-7 w-7 text-orange-600" strokeWidth={2} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-slate-800 transition-colors group-hover:text-slate-900">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <OnboardingFooter />
    </div>
  );
}

export default ExamInstructions;

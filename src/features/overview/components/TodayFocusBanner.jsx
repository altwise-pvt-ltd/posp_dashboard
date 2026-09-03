import CustomButton from "../../../shared/components/CustomButton.jsx";
function TodayFocusBanner({ count = 3, estimatedValue = "₹84,500" }) {
  return (
    <section className="isolate rounded-xl p-4 sm:p-gutter flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 sm:gap-gutter relative overflow-hidden bg-linear-to-r from-primary-fixed to-primary-fixed/40 border border-gray-200 anim-fade-d2">
      <div className="absolute -right-10 -bottom-10 -z-10 w-40 h-40 rounded-full bg-primary-container/10" />

      <div className="flex items-start xl:items-center gap-4 sm:gap-gutter">
        <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shrink-0 shadow-[0_4px_12px_-4px_rgba(255,107,0,0.4)]">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-white"
          >
            my_location
          </span>
        </div>
        <div>
          <p className="font-label-caps text-label-caps mb-1 text-primary">
            TODAY'S FOCUS
          </p>
          <h3 className="font-headline-md text-headline-md text-on-surface">
            {count} leads are waiting for a call back
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Estimated value · {estimatedValue} in potential premium
          </p>
        </div>
      </div>
      <CustomButton
        variant="tonal"
        size="dash"
        className="w-full xl:w-auto"
        rightIcon={
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[20px]"
          >
            arrow_forward
          </span>
        }
      >
        Start calling
      </CustomButton>
    </section>
  );
}

export default TodayFocusBanner;

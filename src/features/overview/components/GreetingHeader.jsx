function GreetingHeader({ name = 'Rohan', dateLabel = "Tuesday, 26 May" }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-unit anim-fade">
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
          Good morning, {name} 
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          {dateLabel} · Here's what's happening today.
        </p>
      </div>
      <div className="flex items-center gap-unit bg-surface-container-lowest border border-gray-200 rounded-full px-gutter py-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
        <span className="font-label-caps text-label-caps text-on-surface-variant">
          ACTIVE · ON SHIFT
        </span>
      </div>
    </div>
  );
}

export default GreetingHeader;

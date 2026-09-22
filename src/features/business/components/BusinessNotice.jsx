/**
 * The centred icon-title-body block the page uses for all four of its
 * non-list states.
 *
 * A local copy of the shape `QuoteNotice` draws rather than an import across
 * feature folders — fourteen lines of presentational markup is a cheaper thing
 * to repeat than a dependency from Business into the offline-quotation module,
 * which owns nothing this module needs.
 */
function BusinessNotice({ icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-primary">
        {icon}
      </span>
      <p className="font-headline-md text-headline-md text-on-surface">{title}</p>
      <p className="font-body-md text-body-md max-w-sm text-on-surface-variant">{body}</p>
      {action}
    </div>
  );
}

export default BusinessNotice;

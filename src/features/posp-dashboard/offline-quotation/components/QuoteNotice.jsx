function QuoteNotice({ icon, title, body, action }) {
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

export default QuoteNotice;

function CustomLabel({ field }) {
  const { label, helperText } = field;

  return (
    <div className="flex flex-col gap-0.5 border-l-2 border-orange-500/40 py-0.5 pl-3">
      <p className="text-[0.8125rem] font-semibold text-slate-800">{label}</p>
      {helperText && <p className="text-[0.6875rem] text-slate-400">{helperText}</p>}
    </div>
  );
}

export default CustomLabel;

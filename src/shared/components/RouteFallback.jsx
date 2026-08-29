export default function RouteFallback() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-screen items-center justify-center bg-slate-50"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/25 border-t-brand" />
    </div>
  );
}

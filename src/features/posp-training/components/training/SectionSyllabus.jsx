import ChapterCard from './ChapterCard';

/**
 * One section of the syllabus — its heading, then every module and the chapters
 * inside it.
 *
 * The heading is a hairline rule and a tinted icon plate rather than a filled
 * orange band: a solid banner across the column reads as an alert, and the page
 * stacks one of these per section.
 */
function SectionSyllabus({ title, icon: Icon, modules }) {
  const chapterCount = modules.reduce((total, module) => total + module.chapters.length, 0);

  return (
    <section>
      <header className="flex items-center gap-3 border-b border-slate-200/80 pb-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
          <Icon className="size-5" strokeWidth={2.25} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {modules.length} {modules.length === 1 ? 'module' : 'modules'} · {chapterCount}{' '}
            {chapterCount === 1 ? 'chapter' : 'chapters'}
          </p>
        </div>
      </header>

      <div className="mt-6 space-y-6">
        {modules.map((module) => (
          <div key={module.id}>
            {/* The module name is the eyebrow and its blurb sits under the rule,
                so a long description can't push the divider off the line. */}
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                {module.title}
              </h3>
              <span aria-hidden="true" className="h-px flex-1 bg-slate-100" />
            </div>

            {module.description ? (
              <p className="mb-3 text-xs leading-5 text-slate-500">{module.description}</p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              {module.chapters.map((chapter) => (
                <ChapterCard key={chapter.id} chapter={chapter} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SectionSyllabus;

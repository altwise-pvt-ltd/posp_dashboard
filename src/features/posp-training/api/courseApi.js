import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

/**
 * The study material — `GET /lms/course`.
 *
 * Kept apart from `trainingApi.js`, which is the training *lifecycle*: choosing
 * a line, consenting, starting the clock, reporting hours. Nothing here writes
 * anything, and nothing here is on the critical path of that lifecycle — the
 * hours run whether or not this call ever answers.
 */

/** Ascending `displayOrder`. The API already sends them ordered; this makes the
 *  page's ordering its own guarantee rather than a borrowed one. */
const byOrder = (a, b) => a.order - b.order;

/**
 * Bytes → what goes under a chapter title. Rounded hard on purpose: this is a
 * "do I have signal for this" glance, not an accounting figure.
 */
const formatSize = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
};

/**
 * One chapter.
 *
 * `link` is null — never '#' — when there is no file, and a chapter with a null
 * link never reaches the page: `normalizeModule` drops it. The screen shows the
 * material the LMS published and nothing else, so a chapter the backend has no
 * file for is absent rather than rendered as a greyed-out promise. "Coming soon"
 * was this app's word, not the API's.
 *
 * `hasPdf` and `pdfUrl` are both checked because they can disagree — a chapter
 * flagged as having a file but carrying no URL is not something to hand a
 * learner an empty link for.
 */
const normalizeChapter = (entry = {}) => {
  const url = typeof entry.pdfUrl === 'string' ? entry.pdfUrl.trim() : '';
  const size = formatSize(Number(entry.pdfFileSizeBytes) || 0);

  return {
    id: entry.id ?? null,
    title: entry.title ?? 'Untitled chapter',
    description: entry.description || null,
    order: Number(entry.displayOrder) || 0,

    link: entry.hasPdf && url ? url : null,
    fileName: entry.pdfFileName || null,

    /** The line under the title: the format and its weight, both the server's. */
    type: ['PDF', size].filter(Boolean).join(' · '),
  };
};

/**
 * One sub-module → the shape `SectionSyllabus` already speaks, which is why
 * `name` becomes `title`. The server calls these sub-modules; the page has
 * always called them modules, and the learner sees "Module".
 *
 * Only chapters with a file survive — see `normalizeChapter`. Most come back
 * `hasPdf: false` today, so this is the difference between a page of material
 * and a page of placeholders.
 */
const normalizeModule = (entry = {}) => ({
  id: entry.id ?? null,
  title: entry.name ?? '',
  description: entry.description || null,
  order: Number(entry.displayOrder) || 0,
  chapters: (entry.chapters ?? [])
    .map(normalizeChapter)
    .filter((chapter) => chapter.link)
    .sort(byOrder),
});

const normalizeCourse = (entry = {}) => ({
  id: entry.id ?? null,
  name: entry.name ?? '',
  description: entry.description || null,
  /** The int from `/lms/insurance-types` — 1 Life, 2 General. Never 3: "Both"
   *  is two courses, not a course of its own. */
  insuranceTypeId: Number(entry.insuranceTypeId) || null,
  order: Number(entry.displayOrder) || 0,
  /* Modules left with no published chapter go with them — an empty heading
     announces material that isn't there. */
  modules: (entry.subModules ?? [])
    .map(normalizeModule)
    .filter((module) => module.chapters.length > 0)
    .sort(byOrder),
});

/**
 * Cut the reply to the line this POSP enrolled in.
 *
 * The server ought to be doing this — that is what `insurnaceTypeId` is for —
 * but it currently answers every request with every course (see the note on the
 * endpoint), so a POSP training in Life alone would otherwise be shown the whole
 * general syllabus and reasonably assume it was examinable.
 *
 * "Both" is id 3 and matches no course, which is exactly right: nothing matches,
 * so everything is kept. That is also the fallback for an id we don't recognise
 * — over-serving material beats silently hiding chapters someone is paying
 * fifteen hours to read, the same call `sectionIdsFor` makes in `trainingApi`.
 *
 * When the backend starts honouring the parameter this quietly becomes a no-op
 * rather than a second filter fighting the first.
 */
const forInsuranceType = (courses, insuranceTypeId) => {
  const id = Number(insuranceTypeId);
  const mine = courses.filter((course) => course.insuranceTypeId === id);
  return mine.length ? mine : courses;
};

/**
 * The material for one insurance type, ready to render.
 *
 * What survives is exactly what the LMS has published: chapters with a file,
 * the modules that still have one, and the courses that still have a module.
 * The page reads an empty array as "no material yet" and says so once, which is
 * a better answer than a screen of headings with nothing underneath.
 *
 * Rejects on failure. The study material is the whole point of the screen, and
 * an empty list shown as "no chapters" would read as the LMS's answer rather
 * than a call that never landed.
 */
export async function fetchCourseMaterial(insuranceTypeId) {
  const response = await api.get(ENDPOINTS.lms.course, {
    // The server's spelling. See the endpoint note before touching it.
    params: { insurnaceTypeId: insuranceTypeId },
  });
  const data = unwrap(response);
  if (!Array.isArray(data)) return [];

  const courses = data.map(normalizeCourse).sort(byOrder);

  return forInsuranceType(courses, insuranceTypeId).filter(
    (course) => course.modules.length > 0
  );
}

import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

/**
 * The study material — `GET /lms/course`.
 *
 * Kept apart from `trainingApi.js`, which is the training *lifecycle*: choosing
 * a line, consenting, starting the clock, reporting hours. Nothing here writes
 * anything, and nothing here is on the critical path of that lifecycle — the
 * hours run whether or not this call ever answers.
 *
 * This module normalizes and orders the reply. It no longer *cuts* it. What the
 * LMS sends is what the page shows: every course, every module, every chapter,
 * published file or not. Two filters used to live here — one dropping chapters
 * without a PDF, one cutting the reply to the enrolled insurance type — and
 * between them they turned a 2-course, 9-module, 38-chapter syllabus into a
 * single module of two chapters. The syllabus is the server's to decide; the
 * only honest way to show a chapter with no file yet is to show it as a chapter
 * with no file yet.
 *
 * ⚠ That means scoping to the enrolled line is now the backend's job. It is
 * currently not doing it — `insurnaceTypeId` is ignored and every request
 * answers with both courses — so a POSP training in Life alone will see the
 * general syllabus until the server honours the parameter.
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
 * `link` is null — never '#' — when the LMS has no file for it, and that null is
 * the whole of the signal `ChapterCard` reads: a chapter with a link is an
 * openable card, a chapter without one is a listed-but-unpublished row. Both
 * reach the page.
 *
 * `hasPdf` and `pdfUrl` are both checked because they can disagree — a chapter
 * flagged as having a file but carrying no URL is not something to hand a
 * learner an empty link for.
 *
 * `type` is the line under the title, and it says which of the two states this
 * is: the format and its weight when there is a file, and why there is nothing
 * to open when there isn't.
 */
const normalizeChapter = (entry = {}) => {
  const url = typeof entry.pdfUrl === 'string' ? entry.pdfUrl.trim() : '';
  const size = formatSize(Number(entry.pdfFileSizeBytes) || 0);
  const link = entry.hasPdf && url ? url : null;

  return {
    id: entry.id ?? null,
    title: entry.title ?? 'Untitled chapter',
    description: entry.description || null,
    order: Number(entry.displayOrder) || 0,

    link,
    fileName: entry.pdfFileName || null,

    type: link ? ['PDF', size].filter(Boolean).join(' · ') : 'Material not published yet',
  };
};

/**
 * One sub-module → the shape `SectionSyllabus` already speaks, which is why
 * `name` becomes `title`. The server calls these sub-modules; the page has
 * always called them modules, and the learner sees "Module".
 */
const normalizeModule = (entry = {}) => ({
  id: entry.id ?? null,
  title: entry.name ?? '',
  description: entry.description || null,
  order: Number(entry.displayOrder) || 0,
  chapters: (entry.chapters ?? []).map(normalizeChapter).sort(byOrder),
});

const normalizeCourse = (entry = {}) => ({
  id: entry.id ?? null,
  name: entry.name ?? '',
  description: entry.description || null,
  /** The int from `/lms/insurance-types` — 1 Life, 2 General. Never 3: "Both"
   *  is two courses, not a course of its own. Still carried because
   *  `StudyMaterial` keys the section icon off it. */
  insuranceTypeId: Number(entry.insuranceTypeId) || null,
  order: Number(entry.displayOrder) || 0,
  modules: (entry.subModules ?? []).map(normalizeModule).sort(byOrder),
});

/**
 * The full syllabus the LMS holds for this insurance type, ready to render.
 *
 * `insurnaceTypeId` is still sent — the server's spelling, see the endpoint note
 * before touching it — so this narrows on its own the day the backend starts
 * reading it. Nothing is dropped on the way through.
 *
 * Rejects on failure. The study material is the whole point of the screen, and
 * an empty list shown as "no chapters" would read as the LMS's answer rather
 * than a call that never landed.
 */
export async function fetchCourseMaterial(insuranceTypeId) {
  const response = await api.get(ENDPOINTS.lms.course, {
    params: { insurnaceTypeId: insuranceTypeId },
  });
  const data = unwrap(response);
  if (!Array.isArray(data)) return [];

  return data.map(normalizeCourse).sort(byOrder);
}

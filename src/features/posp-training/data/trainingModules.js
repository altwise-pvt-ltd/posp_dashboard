/**
 * The study material, keyed by section id — see `sections.js`.
 *
 * A section is a list of modules, each module a list of chapters the learner
 * downloads and works through. `link` is the PDF; '#' means the file is not
 * wired up yet and the UI falls back to a "downloading" notice.
 */
export const trainingModules = {
  general: [
    {
      id: 'general-m1',
      title: 'Module 1',
      chapters: [
        { id: 'general-m1-c1', title: 'Chapter 1', type: 'PDF Document', link: '#' },
        { id: 'general-m1-c2', title: 'Chapter 2', type: 'PDF Document', link: '#' },
      ],
    },
    {
      id: 'general-m2',
      title: 'Module 2',
      chapters: [
        { id: 'general-m2-c1', title: 'Chapter 1', type: 'PDF Document', link: '#' },
        { id: 'general-m2-c2', title: 'Chapter 2', type: 'PDF Document', link: '#' },
      ],
    },
  ],
  life: [
    {
      id: 'life-m1',
      title: 'Module 1',
      chapters: [
        { id: 'life-m1-c1', title: 'Chapter 1', type: 'PDF Document', link: '#' },
        { id: 'life-m1-c2', title: 'Chapter 2', type: 'PDF Document', link: '#' },
        { id: 'life-m1-c3', title: 'Chapter 3', type: 'PDF Document', link: '#' },
        { id: 'life-m1-c4', title: 'Chapter 4', type: 'PDF Document', link: '#' },
      ],
    },
  ],
};

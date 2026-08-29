import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookText } from "lucide-react";
import successIllustration from "@/assets/exam/Exam_completion.webp";
import { EXAM_SHELL } from "./examShell";
import SectionScoreCard from "./SectionScoreCard";

const CARD = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
      delayChildren: 0.12,
      staggerChildren: 0.08,
    },
  },
};

const RISE = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 160, damping: 20 },
  },
};

/** The score card container — the figure the learner is actually here for. */
const SCORE = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 140, damping: 18, mass: 0.9 },
  },
};

/** The illustration, held back a beat so the headline lands first. */
const ILLUSTRATION = {
  hidden: { opacity: 0, scale: 0.88, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 15,
      mass: 0.9,
      delay: 0.18,
    },
  },
};

const STILL = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
};

function ExamResults({ results, onViewCertificate, onExit }) {
  const passed = results.every((result) => result.score.passed);
  const message = results[0]?.score?.message;

  /* Honoured rather than inherited: framer-motion does not consult the OS
     setting on its own unless it is told to. */
  const reduceMotion = useReducedMotion();
  const rise = reduceMotion ? STILL : RISE;
  const score = reduceMotion ? STILL : SCORE;
  const illustration = reduceMotion ? STILL : ILLUSTRATION;

  return (
    <div
      className={`${EXAM_SHELL} flex justify-center overflow-y-auto border border-slate-200 bg-slate-50 p-6 md:p-10`}
    >
      {/* `my-auto` rather than `items-center`: both centre the card in the
          viewport, but auto margins stop centring once the content outgrows the
          room, where `align-items` would keep going and push the top of the card
          out of reach of the scrollbar. */}
      <motion.div
        variants={reduceMotion ? STILL : CARD}
        initial="hidden"
        animate="show"
        className={`my-auto h-fit w-full ${
          passed ? "max-w-4xl" : "max-w-3xl"
        } border border-slate-200 bg-white p-8 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-10`}
      >
        <div
          className={
            passed
              ? "grid gap-8 md:grid-cols-[minmax(0,1fr)_240px] md:items-center lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10"
              : ""
          }
        >
          {/* Ordered ahead of the copy in the DOM so it opens the screen on a
              phone, then sent to the second column from `md` where it sits
              beside the score instead of above the button. */}
          {passed && (
            <motion.div variants={illustration} className="md:order-2">
              <motion.img
                src={successIllustration}
                alt=""
                aria-hidden="true"
                draggable="false"
                /* Intrinsic size given so the browser reserves the 3:2 box
                   before the file decodes. Without it the card reflows on load
                   and the score card springs in against a shifting layout. */
                width={1536}
                height={1024}
                className="mx-auto h-auto w-full max-w-65 select-none md:max-w-none"
                animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: 5.5,
                        ease: "easeInOut",
                        repeat: Infinity,
                        delay: 0.9,
                      }
                }
              />
            </motion.div>
          )}

          <div className={passed ? "md:order-1" : ""}>
            {/* Fail only. On a pass the illustration already carries a tick,
                and a second one in the corner just says it twice. */}
            {!passed && (
              <motion.div
                variants={rise}
                className="border-error/30 bg-error/5 text-error mb-6 flex h-11 w-11 items-center justify-center border"
              >
                <BookText size={20} strokeWidth={2} aria-hidden="true" />
              </motion.div>
            )}

            <motion.div variants={rise}>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                {passed ? "Exam complete" : "Not cleared yet"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {passed
                  ? "You cleared the certification exam. Your POSP certificate is ready."
                  : "The material is still yours to revise, and you can sit the exam again when you are ready."}
              </p>
            </motion.div>

            {/* The server's own sentence, when it sent one. It carries the score
                and the pass mark together, which is the one thing the cards
                below can't say on their own. */}
            {message && (
              <motion.p
                variants={rise}
                className="mt-3 border-l-2 border-slate-200 pl-3 text-sm leading-relaxed text-slate-600"
              >
                {message}
              </motion.p>
            )}

            {/* A single section has no second column to balance against, so it
                is left at a readable width instead of stretched across the page.
                Two of them only split once there is room — on a pass the copy is
                already sharing the card with the illustration. */}
            <motion.div
              variants={score}
              className={`mt-8 grid grid-cols-1 gap-4 ${
                results.length > 1
                  ? passed
                    ? "xl:grid-cols-2"
                    : "md:grid-cols-2"
                  : "max-w-sm"
              }`}
            >
              {results.map(({ section, score: sectionScore }) => (
                <SectionScoreCard
                  key={section.id}
                  title={section.title}
                  score={sectionScore}
                />
              ))}
            </motion.div>

            <motion.button
              variants={rise}
              type="button"
              onClick={passed ? onViewCertificate : onExit}
              whileHover={reduceMotion ? undefined : { scale: 1.01 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              className="group mt-8 flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-on-primary-fixed-variant focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {passed ? "View Certificate" : "Back to training"}
              <ArrowRight
                size={16}
                strokeWidth={2}
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ExamResults;

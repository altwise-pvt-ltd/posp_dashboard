import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { ArrowRightCircle } from "lucide-react";
import stepsIllustration from "@/assets/landing/steps-illustration.png";
import step1Icon from "@/assets/landing/step1-icon.png";
import step2Icon from "@/assets/landing/step2-icon.png";
import step3Icon from "@/assets/landing/step3-icon.png";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";
import Highlight from "./ui/Highlight";
import BrandButton from "./ui/BrandButton";

const STEPS = [
  {
    icon: step1Icon,
    title: "Create Your Account",
    desc: "Sign up with your mobile number and basic details. It takes less than 2 minutes.",
  },
  {
    icon: step2Icon,
    title: "Complete KYC Verification",
    desc: "Upload your PAN, Aadhaar, and other documents for quick verification.",
  },
  {
    icon: step3Icon,
    title: "Finish Online Training",
    desc: "Complete a short IRDAI-mandated training module and start selling instantly.",
  },
];

/* Below `md` the three steps become a swipeable deck instead of a column. The
   swap is decided in JS rather than with `md:hidden` on two copies of the list,
   because the deck's positioning comes from motion transforms (inline styles a
   breakpoint class can't undo) — and rendering both layouts would put every
   step heading in the document twice. */
const DECK_QUERY = "(max-width: 47.99rem)";

/* Deck geometry. These are plain pixel numbers because they end up in
   transforms, which the landing page's <640px rescale (`.landing-scale` in
   index.css) can't reach the way it reaches spacing utilities — it works by
   redefining --spacing, and transforms don't read it. They're small enough to
   read correctly at both scales. */
const CARD_OFFSET = 14; // px each card sits below the one in front of it
const CARD_SCALE = 0.05; // scale lost per position back in the deck
const THROW_DISTANCE = 420; // px a dismissed card travels before it's gone

const AUTO_ADVANCE_MS = 4500;
const SWIPE_DISTANCE = 56; // px of drag that counts as a deliberate swipe…
const SWIPE_VELOCITY = 400; // …or, for a short flick, px/s of release speed

/* Only `exit` needs to be a variant: the direction a card is thrown is decided
   at the moment it's removed, when it can no longer receive props — so it comes
   in through AnimatePresence's `custom` instead. Everything else is a plain
   animate object, re-evaluated on every render as cards move up the deck. */
const CARD_VARIANTS = {
  thrown: (direction) => ({
    x: direction * THROW_DISTANCE,
    rotate: direction * 8,
    opacity: 0,
    /* Above the card behind it, which is simultaneously animating into the
       front slot — without this the thrown card slides out underneath. */
    zIndex: STEPS.length + 1,
    transition: { duration: 0.3, ease: "easeIn", zIndex: { duration: 0 } },
  }),
};

function useMatchMedia(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function StepCard({ num, icon, title, desc, className = "" }) {
  return (
    <div
      className={`flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-md md:gap-5 md:p-6 ${className}`}
    >
      {/* Desktop step number */}
      <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white md:flex">
        {num}
      </div>

      {/* Icon container with absolute mobile badge */}
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-50">
        {/* Mobile step number badge */}
        <div className="absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-sm md:hidden">
          {num}
        </div>
        <img src={icon} alt="" loading="lazy" className="h-8 w-8 object-contain" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-medium text-gray-900 md:text-lg">{title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500 md:text-sm">{desc}</p>
      </div>
    </div>
  );
}

/**
 * StepsDeck — the mobile layout: the three steps stacked like a hand of cards,
 * front card draggable, the rest peeking out below it.
 *
 * `cursor` counts advances rather than tracking a current index, so the three
 * rendered cards are always the window `cursor … cursor + 2` and each card's
 * React key is its cursor slot. A card that leaves the front therefore gets a
 * brand-new key when it comes back round to the bottom of the deck, which is
 * what lets AnimatePresence treat the same step as "thrown away" and "dealt
 * again" instead of one element teleporting across the screen.
 */
function StepsDeck() {
  const reduceMotion = useReducedMotion();
  const [cursor, setCursor] = useState(0);
  const [direction, setDirection] = useState(-1);
  const [held, setHeld] = useState(false);

  const active = cursor % STEPS.length;

  const advanceBy = (steps, dir) => {
    if (steps <= 0) return;
    setDirection(dir);
    setCursor((c) => c + steps);
  };

  /* Keyed on `cursor`, so every advance — auto or hand-swiped — restarts the
     clock. A swipe is otherwise liable to be chased by an auto-advance that was
     already most of the way through its wait. `held` parks it mid-drag. */
  useEffect(() => {
    if (held || reduceMotion) return;
    const id = setTimeout(() => {
      setDirection(-1);
      setCursor((c) => c + 1);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(id);
  }, [cursor, held, reduceMotion]);

  return (
    /* reducedMotion="user" lets Framer drop the transform animations for anyone
       who's asked for that, without a second set of transitions here. */
    <MotionConfig reducedMotion="user">
      {/* A one-cell grid with every card in that same cell: the cards stack
          without leaving the flow, so the row is as tall as the tallest card and
          all three stretch to match it. Absolute positioning would need that
          height measured by hand. The transforms don't take up space, hence the
          padding for the two cards peeking out past the bottom edge. */}
      <div
        role="group"
        aria-label="The 3 onboarding steps — swipe to browse"
        className="grid pb-10"
      >
        <AnimatePresence initial={false} custom={direction}>
          {STEPS.map((_, slot) => {
            const key = cursor + slot;
            const index = key % STEPS.length;
            const step = STEPS[index];

            return (
              <motion.div
                key={key}
                custom={direction}
                variants={CARD_VARIANTS}
                exit="thrown"
                /* Dealt in at the back of the deck, so a thrown card fades back
                   in where it belongs rather than flying in from off-screen. */
                initial={{
                  y: (STEPS.length - 1) * CARD_OFFSET,
                  scale: 1 - (STEPS.length - 1) * CARD_SCALE,
                  opacity: 0,
                  zIndex: 1,
                }}
                animate={{
                  x: 0,
                  y: slot * CARD_OFFSET,
                  rotate: 0,
                  scale: 1 - slot * CARD_SCALE,
                  opacity: 1,
                  zIndex: STEPS.length - slot,
                }}
                transition={{
                  type: "spring",
                  stiffness: 320,
                  damping: 34,
                  opacity: { duration: 0.25 },
                  /* z-index has to be an integer — a spring would run it through
                     fractional values the browser throws out, dropping the card
                     to `auto` for the length of the animation. */
                  zIndex: { duration: 0 },
                }}
                drag={slot === 0 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.9}
                dragMomentum={false}
                onDragStart={() => setHeld(true)}
                onDragEnd={(event, info) => {
                  setHeld(false);
                  const thrown =
                    Math.abs(info.offset.x) > SWIPE_DISTANCE ||
                    Math.abs(info.velocity.x) > SWIPE_VELOCITY;
                  if (thrown) advanceBy(1, Math.sign(info.offset.x) || -1);
                }}
                /* Scaling from the bottom edge keeps each card behind peeking by
                   exactly CARD_OFFSET; from the centre they'd creep back up. */
                className="col-start-1 row-start-1 origin-bottom"
              >
                <StepCard num={index + 1} {...step} className="h-full select-none" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Dots double as the affordance — a deck doesn't otherwise advertise that
          there's anything behind the top card — and as the way to reach a step
          without swiping past the ones in front of it. */}
      <div className="-mt-4 flex items-center justify-center gap-2">
        {STEPS.map((step, i) => (
          <button
            key={step.title}
            type="button"
            onClick={() => advanceBy((i - active + STEPS.length) % STEPS.length, -1)}
            aria-label={`Step ${i + 1}: ${step.title}`}
            aria-current={i === active}
            className={`h-2.5 rounded-full transition-all duration-300 ${i === active ? "w-8 bg-brand" : "w-2.5 bg-gray-300 hover:bg-gray-400"
              }`}
          />
        ))}
      </div>
    </MotionConfig>
  );
}

export default function StepsSection() {
  const isDeck = useMatchMedia(DECK_QUERY);

  return (
    <Section>
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
        {/* ── Left ── */}
        <div>
          <SectionHeading className="mb-4">
            Become a <Highlight>LetsInsurance</Highlight> POSP Advisor in{" "}
            <Highlight>3 Easy Steps</Highlight>
          </SectionHeading>

          <p className="mb-10 max-w-lg text-sm leading-relaxed text-gray-500">
            Our onboarding process is simple, fast, and completely online. You can
            start selling insurance policies within 24 hours of signing up.
          </p>

          <img
            src={stepsIllustration}
            alt="Steps illustration"
            loading="lazy"
            className="mx-auto h-50 sm:h-70 w-auto object-contain lg:mx-0"
          />

          {/* Trust bar */}
          <div className="mt-8 rounded-xl bg-white p-5 text-center text-sm font-medium text-gray-600 shadow-brand-soft">
            Trusted by <Highlight>10,000+</Highlight> Advisors &nbsp;|&nbsp; 100%
            Secure Process &nbsp;|&nbsp; Unlimited Earning Potential
          </div>
        </div>

        {/* ── Right: step cards — a deck on phones, a column from `md` up ── */}
        <div className="flex flex-col gap-6">
          {isDeck ? (
            <StepsDeck />
          ) : (
            STEPS.map((step, i) => (
              <StepCard key={step.title} num={i + 1} {...step} />
            ))
          )}

          <BrandButton size="lg" className="mt-2 w-full">
            Start Earning Now
            <ArrowRightCircle className="size-5" />
          </BrandButton>

          <p className="-mt-2 text-center text-xs text-gray-400">
            100% Free &bull; No Investment &bull; Lifetime Support
          </p>
        </div>
      </div>
    </Section>
  );
}

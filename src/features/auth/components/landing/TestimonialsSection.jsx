import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import quoteIcon from "@/assets/landing/quote-icon.svg";
import priyaPhoto from "@/assets/landing/testimonial1.png";
import rahulPhoto from "@/assets/landing/testimonial2.png";
import anitaPhoto from "@/assets/landing/testimonial3.png";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";
import Highlight from "./ui/Highlight";

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    location: "Housewife, Mumbai",
    photo: priyaPhoto,
    quote:
      "LetsInsurance changed my life. As a homemaker, I never thought I could earn on my own. Now I earn over 40K every month from home!",
    monthlyEarnings: 42000,
  },
  {
    name: "Rahul Verma",
    location: "Student, Delhi",
    photo: rahulPhoto,
    quote:
      "I started selling insurance during college and now I have a steady side income. The app makes everything so easy — even my parents are impressed.",
    monthlyEarnings: 28000,
  },
  {
    name: "Anita Desai",
    location: "Retired Teacher, Pune",
    photo: anitaPhoto,
    quote:
      "After retirement, I was looking for something meaningful. LetsInsurance gave me purpose and a great income. The training was excellent.",
    monthlyEarnings: 35000,
  },
];

/* Earnings are stored as plain numbers so the ₹ and the Indian digit grouping
   (₹1,50,000, not ₹150,000) come from the locale rather than from hand-typed
   strings that can drift apart. */
const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/**
 * Reports which card is currently sitting over the middle of the rail.
 *
 * The negative inline rootMargin shrinks the observer's box to a 1%-wide strip
 * down the centre of the scroller, so at most one card can be intersecting it
 * at any moment — that one is the active card. No scroll maths, no resize
 * listener, and it stays correct through momentum scrolling. While the strip
 * falls in the gap between two cards nothing intersects and the last value
 * holds, which is exactly the behaviour you want mid-swipe.
 *
 * From `md` up the rail is a static grid: nothing scrolls, so the hook simply
 * idles. The active styling it drives is `max-md:`-only for that reason.
 */
function useCenteredCard(railRef) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const cards = Array.from(rail.children);
    const observer = new IntersectionObserver(
      (entries) => {
        const centred = entries.find((entry) => entry.isIntersecting);
        if (centred) setActive(cards.indexOf(centred.target));
      },
      { root: rail, rootMargin: "0px -49.5%" },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [railRef]);

  return active;
}

function StarRating() {
  return (
    <div className="flex gap-0.5" role="img" aria-label="Rated 5 out of 5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} aria-hidden className="size-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function TestimonialCard({
  name,
  location,
  photo,
  quote,
  monthlyEarnings,
  active,
  onSelect,
}) {
  return (
    /* Mobile: a fixed-width slide that snaps to the centre of the rail. Desktop
       (`md:w-auto`): an ordinary grid cell.
       The active/inactive treatment is the whole point of the mobile layout —
       the centred card sits forward with a brand hairline and the deep brand
       shadow, its neighbours are scaled back and faded so they read as cards
       behind it rather than two more cards queued up next to it. All of it is
       `max-md:` scoped so the desktop grid stays three equal cards. */
    <li
      onClick={active ? undefined : onSelect}
      className={`relative flex w-[78%] shrink-0 snap-center flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-brand-soft transition-[transform,opacity,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none md:w-auto md:hover:-translate-y-1 md:hover:shadow-brand-card ${
        active
          ? "max-md:border-brand/30 max-md:shadow-brand-card"
          : "max-md:scale-[0.92] max-md:opacity-55 max-md:cursor-pointer"
      }`}
    >
      <img
        src={quoteIcon}
        alt=""
        loading="lazy"
        width={32}
        height={32}
        className="absolute right-5 top-5 size-10"
      />

      <div className="mb-5 flex items-center gap-4">
        {/* size-20 pins both axes and object-cover does the cropping, so these
            reserve the avatar's box — the source photos aren't square. */}
        <img
          src={photo}
          alt={name}
          loading="lazy"
          width={80}
          height={80}
          className="size-20 rounded-full object-cover ring-2 ring-brand/30 ring-offset-2 ring-offset-white"
        />
        <div>
          <h3 className="text-base font-semibold text-gray-900">{name}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{location}</p>
          <div className="mt-1.5">
            <StarRating />
          </div>
        </div>
      </div>

      <blockquote className="mb-5 flex-1 text-sm leading-relaxed text-gray-600">
        “{quote}”
      </blockquote>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-xs text-gray-400">Monthly Earnings</span>
        <span className="text-base font-semibold text-brand">
          {INR.format(monthlyEarnings)}
        </span>
      </div>
    </li>
  );
}

export default function TestimonialsSection() {
  const railRef = useRef(null);
  const active = useCenteredCard(railRef);

  /* Centres a card by hand rather than via scrollIntoView, which would also
     scroll the page vertically to bring the rail into view. */
  const showCard = (index) => {
    const rail = railRef.current;
    const card = rail?.children[index];
    if (!card) return;

    rail.scrollTo({
      left: card.offsetLeft - (rail.clientWidth - card.clientWidth) / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  return (
    <Section tone="muted">
      <SectionHeading center className="mb-3">
        Hear From Our <Highlight>Successful Advisors</Highlight>
      </SectionHeading>
      <p className="mx-auto mb-12 max-w-xl text-center text-sm text-gray-500">
        Real stories from advisors who transformed their careers with{" "}
        <Highlight className="font-medium">LetsInsurance</Highlight>.
      </p>

      {/* ── The rail ──
          Below `md` this is a snap carousel; from `md` up the same element is a
          three-column grid and every carousel utility on it goes inert.

          Two numbers do the centring, and they're a pair: the cards are 78% of
          the rail wide and the rail is padded by (100% − 78%) ÷ 2 = 11% on each
          side. That symmetric padding is what lets the *first* and *last* card
          reach the middle — without it they'd snap flush to the edges — and it
          leaves the neighbours peeking in from both sides at every position.
          The negative margins let the rail bleed past Section's gutters so that
          peek runs to the edge of the screen.

          `relative` isn't decoration: it makes the rail the offsetParent its
          cards measure against in showCard(). */}
      <ol
        ref={railRef}
        tabIndex={0}
        aria-label="Advisor testimonials"
        className="no-scrollbar relative -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[11%] py-4 sm:-mx-8 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0"
      >
        {TESTIMONIALS.map((testimonial, i) => (
          <TestimonialCard
            key={testimonial.name}
            {...testimonial}
            active={i === active}
            onSelect={() => showCard(i)}
          />
        ))}
      </ol>

      {/* Dots track the real scroll position and drive it — on mobile only,
          where there's something to page through. */}
      <div className="mt-8 flex items-center justify-center gap-2 md:hidden">
        {TESTIMONIALS.map((testimonial, i) => (
          <button
            key={testimonial.name}
            type="button"
            onClick={() => showCard(i)}
            aria-label={`Testimonial ${i + 1}: ${testimonial.name}`}
            aria-current={i === active}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === active ? "w-8 bg-brand" : "w-2.5 bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </Section>
  );
}

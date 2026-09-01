import { useEffect, useRef, useState } from "react";
import logo from "@/assets/let'sInsuranceLogo.svg";

// Header height (h-16 = 64px). Also the scroll depth we allow before hiding, so
// the bar never flickers away on a tiny nudge near the top of the page.
const HEADER_H = 64;

/**
 * Topbar — auto-hiding header for the onboarding flow.
 * Shows the brand logo.
 *
 * Stays sticky, but slides out of the way once the user scrolls down past the
 * header's own height, and slides back in the moment they scroll up. On long
 * pages (Review & Submit) that hands the whole viewport back to the content.
 */
export default function Topbar() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    // Scroll fires far more often than we can paint — collapse each burst into
    // one rAF callback so we read scrollY at most once per frame.
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const goingDown = y > lastY.current;
      // Near the top there is nothing to reclaim, so always keep the bar out.
      setHidden(goingDown && y > HEADER_H);
      // Clamp: iOS rubber-band scrolling reports negative offsets, which would
      // otherwise read as "scrolling down" on the bounce back.
      lastY.current = Math.max(y, 0);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "shrink-0 border-b border-orange-100/70 bg-white/80 backdrop-blur sticky top-0 z-30 " +
        "transition-transform duration-300 ease-out motion-reduce:transition-none " +
        (hidden ? "-translate-y-full" : "translate-y-0")
      }
    >
      {/*
        max-w-7xl  -> caps at 1280px on most screens
        2xl:max-w-[96rem] -> allows growth to 1536px on very large monitors
        Keep this max-w value IDENTICAL across Topbar, Stepper, and OnboardingScreen
        so the header, steps, and content all line up at the same left/right edges.
      */}
      <div className="flex h-16 items-center justify-start px-4 sm:px-6 lg:px-10 2xl:px-12 max-w-7xl 2xl:max-w-384 mx-auto">

        {/* Brand logo */}
        <img src={logo} alt="POSP" width={172} height={40} className="h-10 w-auto" />

      </div>
    </header>
  );
}

/**
 * The confetti pieces are drawn on a 24-unit grid, so each one carries a
 * viewBox — without it the coordinates are read as pixels and anything scaled
 * below 24px (the star, the dot) is cropped by its own box rather than fitted
 * to it.
 */
const SPARKLE_PATH = 'M12 2v4m0 12v4M2 12h4m12 0h4m-16-7l3 3m10 10l3 3m-3-13l3-3M5 19l3-3';
const STAR_POINTS = '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2';

/** The four-point sparkle, in whatever size and colour the caller asks for. */
function Sparkle({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d={SPARKLE_PATH} />
    </svg>
  );
}

/**
 * The coloured band across the top of the results screen — gold and confetti
 * when every section is cleared, a calmer rose when one isn't.
 *
 * Pure decoration: the shapes are hidden from assistive tech, and the verdict
 * is carried by the heading and score cards underneath.
 */
function ResultsBanner({ passed }) {
  return (
    <div
      aria-hidden="true"
      className={`relative h-32 w-full shrink-0 overflow-hidden md:h-40 ${
        passed
          ? 'bg-linear-to-r from-amber-400 via-orange-500 to-orange-600'
          : 'bg-linear-to-r from-orange-400 via-rose-400 to-pink-500'
      }`}
    >
      {/* The curve that hands the band over to the white page below it */}
      <svg viewBox="0 0 100 20" className="absolute bottom-0 z-10 h-8 w-full md:h-12" preserveAspectRatio="none">
        <path fill="#ffffff" d="M0,20 L0,0 Q50,20 100,0 L100,20 Z" />
      </svg>

      {passed ? (
        <div className="absolute inset-0 opacity-90">
          <Sparkle className="absolute top-4 left-16 h-6 w-6 animate-[spin_4s_linear_infinite] text-yellow-300" />
          <Sparkle className="absolute top-8 right-20 h-5 w-5 animate-pulse text-pink-300" />
          <svg
            viewBox="0 0 24 24"
            className="absolute top-20 left-1/4 h-4 w-4 text-white opacity-70"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
          <svg
            viewBox="0 0 24 24"
            className="absolute top-12 right-1/3 h-5 w-5 animate-bounce text-yellow-400"
            fill="currentColor"
          >
            <polygon points={STAR_POINTS} />
          </svg>
          <div className="absolute top-10 left-1/3 h-2 w-2 animate-bounce rounded-full bg-orange-300" />
          <div className="absolute top-12 right-1/4 h-3 w-3 rotate-45 bg-amber-200" />
          <div className="absolute top-24 left-24 h-2 w-2 rotate-12 bg-yellow-200" />
        </div>
      ) : (
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-4 left-1/4 h-12 w-12 rounded-full border-4 border-white/30" />
          <div className="absolute top-12 right-1/4 h-8 w-8 rounded-full border-4 border-white/20" />
          <div className="absolute top-20 left-12 h-6 w-6 rounded-full border-4 border-white/40" />
          <div className="absolute top-8 right-16 h-16 w-16 rounded-full border-4 border-white/10" />
        </div>
      )}
    </div>
  );
}

export default ResultsBanner;

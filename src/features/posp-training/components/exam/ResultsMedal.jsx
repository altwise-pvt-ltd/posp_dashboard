import { BookText, Star } from 'lucide-react';

/** The two ribbon tails behind the medal, mirrored left and right. */
const RIBBON_CLIP = 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)';

function Ribbon({ side, color }) {
  return (
    <div className="absolute top-0 z-0 flex w-full justify-center">
      <div
        className={`h-16 w-8 origin-top rounded-b-md shadow-md ${color} ${
          side === 'left' ? 'ml-12' : 'mr-12'
        }`}
        style={{ clipPath: RIBBON_CLIP, transform: `rotate(${side === 'left' ? 25 : -25}deg)` }}
      />
    </div>
  );
}

/**
 * The medal that straddles the banner and the page: a gold star for a clean
 * pass, an open book for "back to the material".
 */
function ResultsMedal({ passed }) {
  return (
    <div className="relative z-10 flex h-16 shrink-0 justify-center bg-white md:h-20">
      <Ribbon side="left" color={passed ? 'bg-amber-500' : 'bg-orange-600'} />
      <Ribbon side="right" color={passed ? 'bg-amber-500' : 'bg-orange-600'} />

      <div
        className={`absolute -top-12 z-10 flex h-24 w-24 items-center justify-center rounded-full border-[5px] border-white md:-top-16 md:h-28 md:w-28 md:border-[6px] ${
          passed
            ? 'bg-linear-to-br from-yellow-300 via-amber-400 to-yellow-500 shadow-[0_12px_30px_rgba(251,191,36,0.5)]'
            : 'bg-linear-to-br from-orange-300 via-orange-400 to-orange-500 shadow-[0_12px_30px_rgba(249,115,22,0.4)]'
        }`}
      >
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full border bg-linear-to-b from-transparent md:h-20 md:w-20 ${
            passed ? 'border-amber-200 to-amber-500/20' : 'border-orange-200 to-orange-600/20'
          }`}
        >
          {passed ? (
            <Star
              size={40}
              fill="#fef08a"
              stroke="#d97706"
              strokeWidth={1}
              aria-hidden="true"
              className="drop-shadow-md"
            />
          ) : (
            <BookText size={36} strokeWidth={2.5} aria-hidden="true" className="text-white drop-shadow-sm" />
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsMedal;

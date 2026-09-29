import { useLayoutEffect, useRef } from 'react';
import { CARD_HEIGHT, CARD_WIDTH } from '@/shared/lib/businessCard';
import logoLockup from '@/assets/business-card/logo.png';
import topRightDecor from '@/assets/business-card/top-right-decor.svg';
import creamField from '@/assets/business-card/right-large-cream-field.svg';
import bottomDecorOrange from '@/assets/business-card/bottom-decor-orange.svg';
import bottomDecorChocolate from '@/assets/business-card/bottom-decor-chocolate.svg';
import roleUnderline from '@/assets/business-card/role-underline.svg';
import phoneIcon from '@/assets/business-card/phone.svg';
import mailIcon from '@/assets/business-card/mail.svg';
import globeIcon from '@/assets/business-card/globe.svg';
import mapPinIcon from '@/assets/business-card/map-pin.svg';

/**
 * The agent's business card, front face.
 *
 * DRAWN AT ITS PRINT SIZE, THEN SCALED. Every number below is the literal
 * pixel from the design at 700x400, and that is deliberate twice over:
 *
 *   1. index.css carries three "display scale" blocks that redefine
 *      --spacing and the --text-* tokens on landing and dashboard wrappers.
 *      A card built from `p-9`/`text-2xl` would therefore come out a
 *      different size depending on which page it was dropped into, and the
 *      decor circles — which are positioned against the card's edges — would
 *      drift away from the corners they are cut by. Arbitrary values resolve
 *      to literals and are immune to that.
 *   2. It is artwork with a fixed aspect ratio, so there is no "responsive
 *      layout" to reflow to. It gets smaller, not narrower.
 *
 * HOW IT FITS: the outer box holds the card's aspect ratio at whatever width
 * the layout hands it, and the 700x400 face inside is scaled down to match.
 *
 * ⚠ THE SCALE FACTOR CANNOT COME FROM CSS. The obvious version —
 * `transform: scale(calc(100cqw / 700))` on a container-query wrapper — is
 * invalid and silently dropped: dividing a length by a number yields a length,
 * and `scale()` takes a unitless number. The card then renders at its full
 * 700px and overflows whatever column it was put in, with nothing in the
 * console to say why. A `ResizeObserver` is the fix, and it writes the
 * transform straight onto the node rather than through state — one style
 * mutation per resize instead of a re-render of the whole card, and no
 * setState inside an effect for the linter to object to.
 *
 * THE WORDS COME FROM `shared/lib/businessCard`, never from the profile record
 * directly — see the note there on why the screen and the downloaded file are
 * not allowed to compose them separately.
 *
 * ICONS ARE THE EXPORTED SVGs, NOT lucide-react. The four node names match
 * lucide's, but these are exported at an 11px viewBox with stroke-width 2 —
 * lucide draws at 24 and would land at a visibly lighter weight inside a
 * 20px chip. The repo's own `let'sInsuranceLogo.svg` is likewise not this
 * asset: the lockup here includes the broker line and the tagline rule.
 */
function BusinessCardFront({
  name = 'Aarav Sharma',
  pospId = 'LIPOSOO2',
  phone = '+91 98765 43210',
  email = 'aarav@letsinsurance.com',
  website = 'www.letsinsurance.com',
  location = 'Pune, Maharashtra',
  className = '',
}) {
  /* Filtered, not blanked. `businessCardFields` returns null for anything the
     profile does not carry — an agent with no city on file should get three
     rows that sit tight, not a fourth with an icon chip and nothing beside
     it. */
  const contactRows = [
    { icon: phoneIcon, label: 'Phone', value: phone },
    { icon: mailIcon, label: 'Email', value: email },
    { icon: globeIcon, label: 'Website', value: website },
    { icon: mapPinIcon, label: 'Address', value: location },
  ].filter((row) => row.value);

  const boxRef = useRef(null);
  const faceRef = useRef(null);

  /* `useLayoutEffect`, not `useEffect`: this runs before the browser paints,
     so the card is never shown at its full 700px for a frame before shrinking
     — which in a 300px rail would be a visible lurch on every mount. */
  useLayoutEffect(() => {
    const box = boxRef.current;
    const face = faceRef.current;
    if (!box || !face) return undefined;

    const fit = () => {
      const width = box.clientWidth;
      /* Zero while the box is display:none or mid-layout. Leaving the previous
         transform alone beats writing `scale(0)` and having to recover. */
      if (width > 0) face.style.transform = `scale(${width / CARD_WIDTH})`;
    };

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(box);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`w-full ${className}`} style={{ maxWidth: CARD_WIDTH }}>
      <div
        ref={boxRef}
        /* The aspect ratio is what reserves height in the flow — the face is
           `absolute` and contributes none. Deliberately NOT `overflow-hidden`:
           the card's drop shadow falls outside its 700x400 box and clipping
           here would shave it off on all four sides. Nothing escapes anyway,
           because the fit runs in a layout effect, before the first paint. */
        className="relative aspect-[7/4] w-full"
      >
        <div
          ref={faceRef}
          /* origin-top-left so the scale collapses toward the box's corner
             rather than about its centre, which would leave the face hanging
             outside the wrapper on three sides. */
          style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
          className="absolute top-0 left-0 origin-top-left overflow-clip rounded-[12px] bg-card-surface shadow-[0px_16px_32px_0px_rgba(58,23,13,0.13)]"
        >
          {/* Decor. Ordered back-to-front; all four are clipped by the card's
              own rounded edge, which is where the crescents come from. */}
          <img
            alt=""
            aria-hidden="true"
            src={topRightDecor}
            className="absolute top-[-40px] right-[-40px] size-[180px] max-w-none"
          />
          <img
            alt=""
            aria-hidden="true"
            src={creamField}
            className="absolute top-[40px] left-[320px] size-[420px] max-w-none"
          />
          <img
            alt=""
            aria-hidden="true"
            src={bottomDecorOrange}
            className="absolute top-[260px] left-[480px] h-[200px] w-[280px] max-w-none"
          />
          <img
            alt=""
            aria-hidden="true"
            src={bottomDecorChocolate}
            className="absolute top-[280px] left-[510px] h-[200px] w-[280px] max-w-none"
          />

          {/* The script mark sits over the cream field, not inside the content
              column, so it is positioned rather than placed in the flow. */}
          <div className="absolute top-[150px] left-[440px] flex flex-col items-center font-card-script whitespace-nowrap text-card-ink">
            <p className="text-[40px] leading-normal">Protecting</p>
            <p className="text-[36px] leading-normal opacity-90">You and Yours</p>
          </div>

          <div className="absolute inset-0 flex flex-col items-start gap-[33px] p-[36px]">
            <img
              src={logoLockup}
              alt="Lets Insurance — Altsure Insurance Brokers"
              className="h-[88px] w-[255px] shrink-0 object-cover"
            />

            <div className="flex w-[320px] shrink-0 flex-col items-start gap-[24px]">
              <div className="flex shrink-0 flex-col items-start gap-[4px]">
                <p className="font-card-sans text-[24px] leading-normal font-extrabold text-card-ink">
                  {name}
                </p>

                <div className="flex w-full shrink-0 flex-col items-start gap-[6px]">
                  <p className="font-card-sans text-[11px] leading-normal font-bold text-card-ink uppercase opacity-80">
                    POSP ID: {pospId}
                  </p>
                  <img
                    alt=""
                    aria-hidden="true"
                    src={roleUnderline}
                    className="h-[2px] w-[45px] max-w-none shrink-0"
                  />
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col items-start gap-[8px]">
                {contactRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex w-full shrink-0 items-center gap-[10px]"
                  >
                    <div className="flex size-[20px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-card-cream">
                      <img
                        alt=""
                        aria-hidden="true"
                        src={row.icon}
                        className="size-[11px] max-w-none"
                      />
                    </div>
                    <p className="font-card-sans text-[11px] leading-normal font-medium whitespace-nowrap text-card-ink">
                      <span className="sr-only">{row.label}: </span>
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessCardFront;

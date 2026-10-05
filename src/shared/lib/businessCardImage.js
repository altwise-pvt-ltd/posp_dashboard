import logoLockup from '@/assets/business-card/logo.png';
import phoneIcon from '@/assets/business-card/phone.svg';
import mailIcon from '@/assets/business-card/mail.svg';
import globeIcon from '@/assets/business-card/globe.svg';
import mapPinIcon from '@/assets/business-card/map-pin.svg';
import {
  CARD_BRAND,
  CARD_HEIGHT,
  CARD_PALETTE,
  CARD_WIDTH,
} from './businessCard';

/**
 * The business card as a PNG the agent can save.
 *
 * WHY A CANVAS AND NOT A SCREENSHOT OF THE DOM. Turning an element into an
 * image means serialising it into an `<svg><foreignObject>`, and that fragment
 * carries none of the page's stylesheet — every Tailwind class would have to
 * be inlined as a computed style first. That is a library (html-to-image and
 * friends), and it is one that silently drops external fonts and fails on
 * anything cross-origin. Drawing it directly is a hundred lines with no
 * dependency, and `marketing-kit/lib/brandFooter` already establishes the
 * pattern in this codebase.
 *
 * THE COORDINATES MIRROR `shared/components/BusinessCardFront`, and both come
 * from the same Figma node (1212:972) at 700x400. They are allowed to drift a
 * pixel; the *text* is not, which is why both are handed the same `fields`
 * object and neither builds one. See the note in `shared/lib/businessCard`.
 *
 * ⚠ NOTHING HERE IS CROSS-ORIGIN, and that is what keeps `toBlob` working.
 * The logo and the four icons are bundled assets served from this origin, so
 * the canvas is never tainted — unlike the marketing-kit path, which has to
 * fetch artwork off the uploads host and fight a `Vary: Origin` cache bug to
 * do it. Do not swap any of these for a remote URL without reading that file.
 */

/**
 * Drawn at 2x and exported at 1400x800.
 *
 * A 700px-wide PNG is the design's own size and looks soft the moment anyone
 * views it full-screen on a phone, which is exactly what happens to a card
 * sent over chat. 2x is the cheapest fix — every number below stays the
 * design's, and the context is scaled once.
 */
const SCALE = 2;

const SANS = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
const SCRIPT = "'Parisienne', 'Segoe Script', cursive";

/**
 * Canvas falls back silently to a default face if the family has not loaded,
 * so this blocks until both are genuinely resolvable. `document.fonts.ready`
 * alone is not enough — it can settle before a weight this draws has been
 * requested by anything on the page, and Parisienne in particular appears
 * nowhere else in the app.
 */
async function ensureFonts() {
  if (!document.fonts) return;

  try {
    await Promise.all([
      document.fonts.load(`800 48px ${SANS}`),
      document.fonts.load(`700 48px ${SANS}`),
      document.fonts.load(`500 48px ${SANS}`),
      document.fonts.load(`400 80px ${SCRIPT}`),
    ]);
    await document.fonts.ready;
  } catch {
    /* A card in the fallback face still carries the right details. Never worth
       failing the export over. */
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

/** An ellipse as a filled path — `roundRect`-free so it works everywhere. */
function fillEllipse(ctx, cx, cy, rx, ry, colour) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = colour;
  ctx.fill();
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/**
 * `fields` is the object from `businessCardFields` — the same one on screen.
 * Resolves to a PNG blob; rejects only if an asset or `toBlob` fails, which
 * the caller is expected to surface rather than swallow.
 */
export async function renderBusinessCard(fields) {
  await ensureFonts();

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH * SCALE;
  canvas.height = CARD_HEIGHT * SCALE;

  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  /* Clipped to the card's own rounded edge before anything is drawn — that
     clip is what turns the four decor ellipses into the crescents the design
     shows, exactly as `overflow-clip` does on the DOM side. */
  roundedRectPath(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, 12);
  ctx.clip();

  ctx.fillStyle = CARD_PALETTE.surface;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  /* Decor, back to front. Centres and radii, where the design gives a box:
     top-right 180² at (-40,-40); cream 420² at (320,40); the two bottom
     ellipses 280x200 at (480,260) and (510,280). */
  fillEllipse(ctx, 650, 50, 90, 90, CARD_PALETTE.accent);
  fillEllipse(ctx, 530, 250, 210, 210, CARD_PALETTE.cream);
  fillEllipse(ctx, 620, 360, 140, 100, CARD_PALETTE.accent);
  fillEllipse(ctx, 650, 380, 140, 100, CARD_PALETTE.ink);

  /* The script mark, centred on the same axis the DOM version centres on:
     left 440 + half of the wider line (219) = 549.5. */
  ctx.fillStyle = CARD_PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `400 40px ${SCRIPT}`;
  ctx.fillText(CARD_BRAND.scriptLine1, 549.5, 191);
  ctx.globalAlpha = 0.9;
  ctx.font = `400 36px ${SCRIPT}`;
  ctx.fillText(CARD_BRAND.scriptLine2, 549.5, 243);
  ctx.globalAlpha = 1;

  ctx.textAlign = 'left';

  const logo = await loadImage(logoLockup);
  const logoScale = Math.min(255 / logo.width, 88 / logo.height);
  const logoW = logo.width * logoScale;
  const logoH = logo.height * logoScale;
  ctx.drawImage(logo, 36 + (255 - logoW) / 2, 36 + (88 - logoH) / 2, logoW, logoH);

  /* Identity block: 36 + 88 (logo) + 33 (gap) = 157, matching the design. */
  ctx.fillStyle = CARD_PALETTE.ink;
  ctx.font = `800 24px ${SANS}`;
  ctx.textBaseline = 'top';
  ctx.fillText(fields.name || '', 36, 157);

  ctx.globalAlpha = 0.8;
  ctx.font = `700 11px ${SANS}`;
  ctx.fillText(`POSP ID: ${fields.pospId}`.toUpperCase(), 36, 191);
  ctx.globalAlpha = 1;

  ctx.fillStyle = CARD_PALETTE.accent;
  ctx.fillRect(36, 210, 45, 2);

  const rows = [
    [phoneIcon, fields.phone],
    [mailIcon, fields.email],
    [globeIcon, fields.website],
    [mapPinIcon, fields.location],
  ].filter(([, value]) => value);

  const icons = await Promise.all(rows.map(([src]) => loadImage(src)));

  /* Rows are 20 tall on a 28 pitch, the first at y=235 (157 + 78). */
  rows.forEach(([, value], index) => {
    const top = 235 + index * 28;

    fillEllipse(ctx, 46, top + 10, 10, 10, CARD_PALETTE.cream);
    ctx.drawImage(icons[index], 40.5, top + 4.5, 11, 11);

    ctx.fillStyle = CARD_PALETTE.ink;
    ctx.font = `500 11px ${SANS}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(value, 66, top + 10.5);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('The card could not be turned into an image.')),
      'image/png'
    );
  });
}

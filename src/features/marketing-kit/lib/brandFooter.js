import { formatMobile, initials } from '@/features/profile/lib/profileFields';

/**
 * The agent's footer, drawn onto a card before it is saved.
 *
 * WHY THE PIXELS AND NOT A CAPTION — the agent saves this file and sends it on
 * themselves, from their own gallery. Whatever we could attach alongside the
 * image (a caption, a filename, metadata) does not survive that trip: the
 * gallery drops it, and a customer forwarding the card onward drops it twice.
 * Drawn into the image, the agent's name and POSP ID travel as far as the
 * artwork does — which is the entire point of a marketing kit.
 *
 * WHY THIS CAN FAIL — reading a cross-origin image back out of a canvas taints
 * it and `toBlob` then throws, so the uploads host has to allow this origin.
 * It is an explicit allowlist in `ReactPolicy` on the LetsNotification.API
 * side, matched by exact ordinal compare — a trailing slash silently never
 * matches. Verified 2026-09-23: `ibmsuat.shrisoft.co.in` and `localhost:5173`
 * are allowed, **`ibms.shrisoft.co.in` (prod) is not** and will fail there
 * until the backend adds it.
 *
 * ⚠ AND WHY IT USED TO FAIL EVEN WHERE CORS WAS ALLOWED — `/uploads/**` sends
 * `Vary: Origin` on a request that carries an `Origin`, but sends *no* CORS
 * headers and *no* `Vary` on one that does not. A plain `<img>` sends no
 * `Origin`, so the grid's own preview caches a header-less copy that the
 * browser then treats as valid for every variant. A later `crossOrigin` load of
 * the same URL is served that cached copy, finds no `Access-Control-Allow-
 * Origin`, and taints the canvas — while the preview on screen looks perfect
 * and the console blames CORS for what is really a caching bug.
 *
 * `loadArtwork` below is the way around it: fetch the bytes with
 * `cache: 'reload'` and draw from a `blob:` URL, which is same-origin by
 * definition and cannot taint anything. That also leaves the grid's `<img>`
 * alone — putting `crossOrigin` on *it* would fix the cache entry but blank
 * every preview on any origin the allowlist does not name.
 */

/**
 * Long edge of the output.
 *
 * The originals are ~2444×3128 at 1.3–3.7 MB. Nobody needs print resolution in
 * a chat thread, and 1080 is the width WhatsApp itself compresses to — so this
 * loses nothing a recipient would ever have seen and turns a ~3 MB file into a
 * ~240 KB one. Never upscales: a smaller original is composited at its own size
 * rather than blown up into softness.
 */
const OUTPUT_WIDTH = 1080;
const JPEG_QUALITY = 0.9;

/* Matches `--font-sans` in `app/index.css`. Canvas takes a CSS font shorthand
   and falls back silently if the family has not loaded, which is why
   `ensureFonts` below blocks until Inter is actually resolvable. */
const FONT_STACK = "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif";

/**
 * Every measurement is a fraction of the output *width*, never of its height.
 *
 * The artwork's aspect varies (the live library runs 0.667 to 1.0) and its
 * height is therefore not a stable thing to hang a layout off — a footer sized
 * against it would be a different size on every card. Against the width, one
 * set of numbers gives the same footer whatever shape the card above it is.
 */
const RULE = 0.0037; // the brand separator, ~4px at 1080
const BAND = 0.224; // the white strip below it, ~242px at 1080
const PAD_X = 0.0454; // left and right margin, ~49px
const PORTRAIT = 0.13; // diameter of the agent's photo, ~140px
const RING = 0.0028; // the hairline around it, ~3px
const GAP = 0.023; // portrait to text column, ~25px

/* Derived, never written down twice. The text column starts where the portrait
   ends — a separate constant for it is a constant that can fall out of step
   with the two it is supposed to follow. */
const TEXT_X = PAD_X + PORTRAIT + GAP;

/* ── Typography ────────────────────────────────────────────────────────── */

/**
 * The footer is set in the dashboard's own type scale rather than a second one
 * invented for the canvas, so `px` below is literally the app's token size —
 * `headline-md` is 20/600, `body-lg` 16/400, `label-caps` 12/600 at +0.05em,
 * all straight out of `@theme` in `app/index.css`.
 *
 * `TYPE_SCALE` is the one number that maps those onto the card. A card is
 * drawn 1080px wide and the dashboard renders the same tokens at roughly half
 * that, so the footer reads at arm's length exactly as the app does on screen.
 *
 * WHY IT IS QUIETER THAN IT WAS — the first cut ran 47px bold over 35px
 * semibold in near-black, which shouted over artwork that is itself the
 * message. Three moves fix that without losing anything: the weights come down
 * to the app's (600 over 400, no 700 anywhere), the sizes close up so the jump
 * between lines is a step rather than a drop, and the colours become the app's
 * warm `on-surface` / `on-surface-variant` browns instead of a cold
 * near-black that belonged to no palette at all.
 *
 * There are only two colours across three lines. The last line separates itself
 * by being small and set in caps, which is what `label-caps` is for — a third
 * colour to say the same thing would be one more thing to keep in tune.
 */
const TYPE_SCALE = 2;

/**
 * The three lines, in drawing order: who, their credentials, the firm.
 *
 * Baselines are offsets from the top of the white band, not from the top of the
 * canvas — the artwork's height is not known until it loads, and a layout that
 * has to subtract it is a layout that gets it wrong once. The three are spaced
 * so the block sits optically centred against the portrait beside it.
 *
 * `min` is how far a line may shrink before it is clipped with an ellipsis
 * instead, in the same app-token units as `px`. A long name should get smaller;
 * it should not get smaller than the corporate line below it, or the card reads
 * as though the firm outranks the agent whose card it is.
 */
const LINES = [
  { baseline: 0.0796, px: 20, min: 14, weight: 600, tracking: -0.01, ink: 'onSurface' },
  { baseline: 0.1278, px: 16, min: 12, weight: 400, tracking: 0, ink: 'onSurfaceVariant' },
  { baseline: 0.1667, px: 12, min: 10, weight: 600, tracking: 0.05, ink: 'onSurfaceVariant', caps: true },
];

/** A line's size on the card, in real pixels. See `TYPE_SCALE`. */
const sizeOf = (tokenPx, width) => Math.round((tokenPx * TYPE_SCALE * width) / OUTPUT_WIDTH);

/* ── Colour ────────────────────────────────────────────────────────────── */

/**
 * Which `@theme` custom property each part of the footer is painted in.
 *
 * READ FROM THE STYLESHEET, NOT COPIED INTO THIS FILE. A canvas cannot take a
 * Tailwind class, so the first cut hardcoded the hex values — which quietly
 * made this module the one place in the app that would keep painting the old
 * palette after a theme change. That matters more here than anywhere else in
 * the codebase: a card is a *file*, already saved and already sent, so drift
 * cannot be fixed by a redeploy the way an on-screen colour can.
 *
 * It also caught a real bug. `PORTRAIT_FILL` was `#fdf1e7`, which is not a
 * token at all — an invented near-miss between `--color-surface-variant`
 * (#fce1d1) and `--color-inverse-on-surface` (#fff1e7). Naming the token makes
 * that kind of drift impossible to introduce silently.
 *
 * The brand orange is the one accent: the rule under the artwork. The portrait
 * ring used to be orange too, which put the accent in two places a few hundred
 * pixels apart and made the footer busier than it is.
 */
const TOKENS = {
  brand: ['--color-primary', '#de7b3d'],
  onSurface: ['--color-on-surface', '#4a3328'],
  onSurfaceVariant: ['--color-on-surface-variant', '#876658'],
  ring: ['--color-secondary-container', '#f7e3d6'],
  portraitFill: ['--color-surface-variant', '#fce1d1'],
  band: ['--color-surface-container-lowest', '#ffffff'],
};

/**
 * The palette as real colours, resolved once per card.
 *
 * Each token carries a literal fallback for the case where the property does
 * not resolve — a stylesheet that has not applied yet, or a canvas built
 * outside the app shell. Falling back to the value the token holds today keeps
 * a card correct rather than painting it in whatever `fillStyle` was last set.
 */
function readPalette() {
  const styles = getComputedStyle(document.documentElement);

  return Object.fromEntries(
    Object.entries(TOKENS).map(([name, [property, fallback]]) => [
      name,
      styles.getPropertyValue(property).trim() || fallback,
    ])
  );
}

/**
 * The firm behind the agent, exactly as `OnboardingFooter` already states it.
 *
 * One line, not two. The artwork itself carries the LetsInsurance logo and the
 * "protecting you and yours" tagline — repeating either here would spend the
 * footer's last line on something the customer can already see. What the
 * artwork does *not* carry is the regulated identity, and that is the line an
 * agent is expected to be able to show.
 *
 * ⚠ If the entity name or the licence number changes it changes here and in
 * `OnboardingFooter.jsx`. Two places, and they must not disagree — a card in a
 * customer's chat history is not something that can be corrected later.
 */
const CORPORATE_LINE = 'ALTSURE INSURANCE BROKERS PVT LTD · IRDAI Lic. 1163';

/**
 * The agent's three lines, as text.
 *
 * Module-private, like `CORPORATE_LINE` above. Both were exported on the
 * assumption the preview dialog would want to caption what it shows; it never
 * did, because the dialog renders the finished JPEG and the wording is already
 * in the pixels. Exporting them anyway would publish an API with no caller and
 * invite a second, drifting copy of this text.
 *
 * The middle line drops whichever half is missing rather than printing a label
 * with nothing after it. Both halves absent is not a case worth handling:
 * `useAgentFooter` refuses to build an agent without a POSP code at all.
 */
function footerLines(agent) {
  const credentials = [
    agent?.pospCode ? `POSP ID: ${agent.pospCode}` : null,
    formatMobile(agent?.mobile),
  ]
    .filter(Boolean)
    .join('   ·   ');

  return [agent?.name || '', credentials, CORPORATE_LINE];
}

/* ── Drawing ───────────────────────────────────────────────────────────── */

/**
 * Canvas resolves a font family the moment it is asked to draw, and silently
 * substitutes the fallback if that family is not ready — which produces a card
 * set in Segoe UI that nobody notices until it is in a customer's thread.
 *
 * Asking for each weight separately matters: Inter is loaded as a variable font
 * and `document.fonts.ready` alone can resolve before the weights this draws
 * with are usable. A failure here is not fatal — the stack falls back to
 * `system-ui` and the card is still correct, just not on-brand.
 */
async function ensureFonts() {
  if (!document.fonts) return;

  try {
    await Promise.all(LINES.map((line) => document.fonts.load(`${line.weight} 48px 'Inter'`)));
    await document.fonts.ready;
  } catch {
    /* Deliberately swallowed — see above. */
  }
}

/**
 * Decode something already local — a `blob:` URL, never a remote one.
 *
 * No `crossOrigin` anywhere in here on purpose. Both images this draws arrive
 * as blobs: the portrait from the authenticated axios client, the artwork from
 * `loadArtwork`. A blob is same-origin by definition, so it can neither taint
 * the canvas nor be served a poisoned cache entry.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The artwork could not be read.'));
    img.src = src;
  });
}

/**
 * The remote artwork as a local blob URL. See the `Vary: Origin` note above —
 * this function is that workaround, and the caller owns what it returns.
 *
 * `cache: 'reload'` is load-bearing, not caution: the grid's preview `<img>`
 * has almost certainly already cached a header-less copy of this exact URL by
 * the time anyone taps the button, and without it that copy is what comes back.
 *
 * A network-level rejection here is a CORS refusal far more often than it is a
 * dropped connection — the browser reports both as an opaque `TypeError` with
 * nothing to distinguish them — so the message names the likely cause and
 * points at the people who can fix it, rather than inviting a retry that would
 * fail the same way every time.
 */
async function loadArtwork(url) {
  let response;

  try {
    response = await fetch(url, { mode: 'cors', cache: 'reload', credentials: 'omit' });
  } catch {
    throw new Error('This card cannot be branded from here yet. Please report it to support.');
  }

  if (!response.ok) {
    throw new Error(`The artwork could not be downloaded (${response.status}).`);
  }

  return URL.createObjectURL(await response.blob());
}

/**
 * One line's font and tracking, together.
 *
 * `letterSpacing` is a recent canvas attribute (Chrome 99, Safari 17.4,
 * Firefox 127). Where it is missing the caps line simply renders untracked —
 * slightly tighter than intended, never broken — so it is feature-checked
 * rather than depended on. It is assigned *after* `font` because assigning the
 * shorthand resets it in some implementations, and it is assigned on every line
 * rather than only the tracked one so a value can never leak from the line
 * above into the line below.
 */
function applyFont(ctx, line, size) {
  ctx.font = `${line.weight} ${size}px ${FONT_STACK}`;

  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = `${(line.tracking || 0) * size}px`;
  }
}

/** Shrink to fit, then clip — in that order. See `min` on `LINES`. */
function fitLine(ctx, text, maxWidth, line, width) {
  const floor = sizeOf(line.min, width);

  let size = sizeOf(line.px, width);
  applyFont(ctx, line, size);

  while (ctx.measureText(text).width > maxWidth && size > floor) {
    size -= 1;
    applyFont(ctx, line, size);
  }

  if (ctx.measureText(text).width <= maxWidth) return text;

  /* Still too wide at the smallest size it is allowed to be. Trim from the end
     — the informative half of every one of these lines is the front. */
  let clipped = text;
  while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }

  return `${clipped}…`;
}

/**
 * The agent's photograph, or their initials when there is none.
 *
 * Clipped to the circle and drawn *cover*, not contained: a portrait is being
 * cropped to a face here, and letterboxing one inside a circle looks like a
 * mistake in a way a crop does not. The ring is stroked after the clip is
 * released, so it sits on top of the photo's edge rather than under it.
 */
function drawPortrait(ctx, palette, photo, name, cx, cy, diameter, width) {
  const radius = diameter / 2;
  const ring = Math.max(1, Math.round(RING * width));

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (photo) {
    const scale = Math.max(diameter / photo.naturalWidth, diameter / photo.naturalHeight);
    const w = photo.naturalWidth * scale;
    const h = photo.naturalHeight * scale;
    ctx.drawImage(photo, cx - w / 2, cy - h / 2, w, h);
  } else {
    ctx.fillStyle = palette.portraitFill;
    ctx.fillRect(cx - radius, cy - radius, diameter, diameter);

    /* 600, matching the type below it rather than the 700 this used to be —
       initials set heavier than the agent's own name read as a logo. */
    ctx.fillStyle = palette.brand;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${Math.round(diameter * 0.36)}px ${FONT_STACK}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.fillText(initials(name), cx, cy + diameter * 0.02);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, radius - ring / 2, 0, Math.PI * 2);
  ctx.lineWidth = ring;
  ctx.strokeStyle = palette.ring;
  ctx.stroke();
}

/**
 * Artwork + footer → a JPEG the agent can save.
 *
 * Resolves to `{ blob, url, width, height }`. `url` is an object URL the caller
 * owns and must revoke — see `usePreparedCard`, which ties it to the card's
 * lifetime.
 */
export async function composeBrandedCard({ imageUrl, photoUrl, agent }) {
  if (!imageUrl) throw new Error('This card has no artwork to brand.');

  await ensureFonts();

  /* Revoked as soon as the image has decoded — the `Image` keeps its own copy
     of the bitmap, so the URL has no job left and holding it pins ~3 MB. */
  const artUrl = await loadArtwork(imageUrl);
  let art;

  try {
    art = await loadImage(artUrl);
  } finally {
    URL.revokeObjectURL(artUrl);
  }

  /* A missing portrait costs the card its photo and nothing else — the initials
     stand in. It is never worth failing the whole export over. */
  const photo = photoUrl ? await loadImage(photoUrl).catch(() => null) : null;

  const width = Math.min(OUTPUT_WIDTH, art.naturalWidth);
  const artHeight = Math.round((width * art.naturalHeight) / art.naturalWidth);
  const rule = Math.max(1, Math.round(RULE * width));
  const band = Math.round(BAND * width);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = artHeight + rule + band;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';

  const palette = readPalette();

  ctx.drawImage(art, 0, 0, width, artHeight);

  ctx.fillStyle = palette.brand;
  ctx.fillRect(0, artHeight, width, rule);

  const bandTop = artHeight + rule;
  ctx.fillStyle = palette.band;
  ctx.fillRect(0, bandTop, width, band);

  const diameter = Math.round(PORTRAIT * width);
  drawPortrait(
    ctx,
    palette,
    photo,
    agent?.name,
    Math.round(PAD_X * width) + diameter / 2,
    bandTop + band / 2,
    diameter,
    width
  );

  const textX = Math.round(TEXT_X * width);
  const maxWidth = width - textX - Math.round(PAD_X * width);

  footerLines(agent).forEach((raw, i) => {
    if (!raw) return;

    const line = LINES[i];

    /* Uppercased here rather than stored that way, so `footerLines` stays the
       plain wording the dialog and any future caption can reuse — casing is a
       property of this rendering, not of the text. */
    const text = line.caps ? raw.toUpperCase() : raw;

    /* `fitLine` leaves `ctx.font` set to whatever size it settled on, which is
       the size this then draws at. Do not hoist it out of the loop or set the
       font again below — the two would disagree and the text would be measured
       at one size and painted at another. */
    const fitted = fitLine(ctx, text, maxWidth, line, width);

    ctx.fillStyle = palette[line.ink];
    ctx.fillText(fitted, textX, bandTop + Math.round(line.baseline * width));
  });

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('The card could not be saved as an image.'));
            return;
          }

          resolve({
            blob,
            url: URL.createObjectURL(blob),
            width: canvas.width,
            height: canvas.height,
          });
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    } catch {
      /* A tainted canvas. `loadArtwork` should have made this unreachable —
         everything drawn above came from a blob — but `toBlob` throws this
         synchronously and silently, and a card that fails with no message at
         all is the one failure mode worth spending four lines to rule out. */
      reject(new Error('This card cannot be branded from here yet. Please report it to support.'));
    }
  });
}

/**
 * Burn the agent's details onto a card before it is shared.
 *
 * WHY THIS EXISTS AT ALL — `navigator.share` accepts a `text` alongside a file,
 * and it would be far less code to put the agent's name and POSP ID there. But
 * the receiving app decides what to do with that text, and WhatsApp on iOS
 * discards it whenever a file is attached; several Android builds do the same.
 * The details would vanish on a large share of real phones and look perfect on
 * whichever one we tested with. Drawn into the pixels they survive the share
 * sheet, and they survive the customer forwarding the card onward — which is
 * the whole point of a marketing kit.
 *
 * WHY THIS CAN WORK — reading a cross-origin image back out of a canvas taints
 * it and `toBlob` throws, unless the server sends CORS headers *and* the image
 * was requested with `crossOrigin`. The notification service does send them on
 * `/uploads/**` (verified 2026-09-22: `Access-Control-Allow-Origin` comes back
 * on the JPEG itself, not just on `/api`). If that ever stops being true this
 * module throws and the share falls back to a plain link — see `useShare`.
 */

/**
 * Long edge of the output, in pixels.
 *
 * The originals are ~2444×3128 at 1.3–3.7 MB. Nobody needs print resolution in
 * a WhatsApp thread, and the agent waits through every byte twice — once to
 * fetch, once to hand to the share sheet. 1080 is the width WhatsApp itself
 * compresses to, so this loses nothing the recipient would ever have seen and
 * turns a ~3 MB send into a ~200 KB one.
 *
 * Never upscales: a smaller original is composited at its own size.
 */
const OUTPUT_WIDTH = 1080;
const JPEG_QUALITY = 0.9;

/**
 * Diameter of the agent's portrait, as a fraction of the output width.
 *
 * Fixed rather than derived from the height of the text beside it, which would
 * be the prettier rule and is a circular one: the text's height depends on how
 * wide each line may be, and that depends on how much width the portrait has
 * taken. A constant breaks the loop, and at 0.15 the portrait comes out a
 * little shorter than a full four-line signature — which reads as a face beside
 * a block of details rather than as a logo the details hang off.
 */
const PORTRAIT = 0.15;

const INK = '#1b1b1f';
const MUTED = '#5f5f66';
const ACCENT = '#de7b3d';
const PAPER = '#ffffff';

/* No webfont. Canvas does not wait for `@font-face` the way layout does, so a
 * brand font here would render in the fallback on a cold load and in the real
 * face on a warm one — the same card, different on two sends. */
const FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const fontOf = (size, weight) => `${weight} ${Math.round(size)}px ${FONT_STACK}`;

/**
 * Type for each line the signature can carry, keyed by `signatureLines`.
 *
 * Sizes are fractions of the output width, not fixed pixels, so the strip keeps
 * its proportions whatever the artwork's own resolution turns out to be.
 *
 * This module knows nothing about agents — it is handed `{ key, text }` and
 * decides only how that text looks. The wording lives in `lib/agentSignature`,
 * where the share caption reads it too. Typography stays here rather than
 * travelling with the lines: a caller should not have to pick font weights to
 * get a card drawn.
 */
const LINE_STYLES = {
  name: { size: 0.042, weight: 700, color: INK },
  identity: { size: 0.032, weight: 600, color: INK },
  rm: { size: 0.027, weight: 400, color: MUTED },
  support: { size: 0.027, weight: 400, color: MUTED },
};

const DEFAULT_STYLE = LINE_STYLES.rm;

/**
 * `crossOrigin` must be set before `src` — assigning it afterwards is too late,
 * the request is already in flight without the CORS mode and the canvas ends up
 * tainted even though the server did everything right.
 */
async function loadImage(url) {
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.decoding = 'async';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('The artwork could not be loaded for sharing.'));
    el.src = url;
  });

  /* `decoding = 'async'` is inert on an element that never enters the DOM —
   * nothing decodes until `drawImage` forces it, synchronously, on the main
   * thread. For a 7.6 MP JPEG that is a few hundred milliseconds of frozen UI.
   * `decode()` does the same work off-thread first; if it rejects, `drawImage`
   * still decodes and the only cost is the stutter we were avoiding.
   *
   * Here rather than at the call site so the portrait gets it too — an agent's
   * photograph is a phone upload and can be every bit as large as the artwork. */
  if (img.decode) {
    try {
      await img.decode();
    } catch {
      /* Falls through to a synchronous decode in `drawImage`. */
    }
  }

  return img;
}

/**
 * The agent's photograph, circular, centre-cropped.
 *
 * Cropped square from the middle rather than squashed to fit: these arrive at
 * whatever aspect the camera gave them, and a stretched face on a card a
 * customer receives is worse than a tightly cropped one.
 */
function drawPortrait(ctx, img, x, y, size) {
  const edge = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - edge) / 2;
  const sy = (img.naturalHeight - edge) / 2;
  const r = size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, sx, sy, edge, edge, x, y, size, size);
  ctx.restore();

  /* A ring in the same accent as the rule above. Without it a photo shot
   * against a white wall — most of them — dissolves into the strip's paper and
   * the head appears to float. */
  const ring = Math.max(2, Math.round(size * 0.025));
  ctx.beginPath();
  ctx.arc(x + r, y + r, r - ring / 2, 0, Math.PI * 2);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = ring;
  ctx.stroke();
}

function toBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('The card could not be encoded for sharing.')),
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

/**
 * One context, reused, purely for `measureText`.
 *
 * The canvas is left at 0×0: measuring needs no backing store, and the default
 * 300×150 one is ~180 KB allocated per share for nothing. Module-level because
 * text metrics are a property of the font, not of the canvas being drawn.
 */
let measurer = null;
function measuringContext() {
  if (!measurer) {
    const canvas = document.createElement('canvas');
    canvas.width = 0;
    canvas.height = 0;
    measurer = canvas.getContext('2d');
  }
  return measurer;
}

/**
 * Shrink a line until it fits the strip's width.
 *
 * Wrapping would be the other answer, but these lines are a name and two phone
 * numbers — a wrapped phone number reads worse than a slightly smaller one, and
 * wrapping would also make the strip's height depend on the text, which is how
 * a two-line name ends up overlapping the artwork above it.
 *
 * Estimated, then checked, rather than stepped a pixel at a time. Advance width
 * is close to linear in font size for a fixed string, so one division lands on
 * or just past the answer that walking down would reach after up to eighteen
 * re-parses of the font shorthand. It is only *close* to linear — hinting and
 * kerning round per glyph — so the estimate is verified and nudged, which in
 * practice costs one extra measurement rather than eighteen.
 *
 * Everything works in whole pixels, because `fontOf` rounds: estimating against
 * a fractional size that is never actually rendered is how a line comes out
 * five pixels over the limit it was measured to fit.
 */
function fitFont(ctx, text, startSize, weight, maxWidth) {
  /* The same 60% floor the stepped version had: past that a line is better
   * slightly clipped than unreadable. */
  const floor = Math.max(1, Math.round(startSize * 0.6));

  let size = Math.round(startSize);
  ctx.font = fontOf(size, weight);
  let measured = ctx.measureText(text).width;
  if (measured <= maxWidth) return size;

  size = Math.max(Math.floor(size * (maxWidth / measured)), floor);

  while (size > floor) {
    ctx.font = fontOf(size, weight);
    measured = ctx.measureText(text).width;
    if (measured <= maxWidth) break;
    size -= 1;
  }

  return size;
}

/** `Diwali Greeting` → `diwali-greeting.jpg`, for the share sheet's label. */
function fileNameFor(title) {
  const slug = String(title || 'marketing-card')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'marketing-card'}.jpg`;
}

/**
 * The artwork with the agent's signature strip under it, as a shareable `File`.
 *
 * Throws rather than returning null on failure — a caller that cannot brand the
 * card needs to know it is falling back to a bare link, and a silent null would
 * make that look like a deliberate choice.
 *
 * `photoUrl` is the exception: a portrait that will not load costs the card its
 * portrait and nothing else. It is decoration on a signature that is already
 * complete without it, and it arrives from a different route than the artwork,
 * so letting it fail the card would trade a signed card for a bare link over a
 * missing photograph.
 */
export async function buildBrandedCard({ imageUrl, title, lines = [], photoUrl }) {
  if (!imageUrl) throw new Error('No artwork to share.');

  /* Together, not one after the other: the two come from different hosts and
   * there is no reason for the agent to wait out a round trip twice. */
  const [img, portrait] = await Promise.all([
    loadImage(imageUrl),
    photoUrl ? loadImage(photoUrl).catch(() => null) : null,
  ]);

  const width = Math.min(img.naturalWidth || OUTPUT_WIDTH, OUTPUT_WIDTH);
  const artHeight = Math.round((img.naturalHeight / img.naturalWidth) * width);

  const pad = Math.round(width * 0.045);
  const gap = Math.round(width * 0.02);
  const rule = Math.max(3, Math.round(width * 0.006));

  /* Measured before anything is allocated: the real canvas cannot be sized
   * until the strip's height is known, and the height depends on how tall each
   * line has to be drawn. */
  const portraitSize = portrait ? Math.round(width * PORTRAIT) : 0;
  const textLeft = pad + (portraitSize ? portraitSize + gap : 0);

  const probe = measuringContext();
  const drawn = lines.map((line) => {
    const style = LINE_STYLES[line.key] || DEFAULT_STYLE;
    const startSize = width * style.size;
    const size = fitFont(probe, line.text, startSize, style.weight, width - textLeft - pad);
    return { ...style, text: line.text, size, height: Math.round(size * 1.3) };
  });

  const textHeight = drawn.length
    ? drawn.reduce((total, line) => total + line.height, 0) + gap * (drawn.length - 1)
    : 0;

  /* Whichever column is taller sets the strip. Usually the text — but a
   * signature worn down to a name and a helpline is shorter than the portrait
   * beside it, and sizing to the text alone would crop the face. */
  const content = Math.max(textHeight, portraitSize);
  const stripHeight = content ? rule + pad + content + pad : 0;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = artHeight + stripHeight;

  /* `alpha: false` — the paper fill below makes every pixel opaque and JPEG
   * carries no alpha anyway, so blending a channel that is discarded at encode
   * is pure cost on a 1.5 MP canvas. */
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingQuality = 'high';

  /* JPEG has no alpha: without this, anything transparent in the source comes
   * out black rather than on the strip's own paper. */
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(img, 0, 0, width, artHeight);

  if (stripHeight) {
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, artHeight, width, rule);

    const top = artHeight + rule + pad;

    /* Both columns are centred within `content` rather than hung from its top,
       so the shorter of the two sits level with the taller instead of leaving
       all its slack at the bottom. */
    if (portrait) {
      drawPortrait(
        ctx,
        portrait,
        pad,
        top + Math.round((content - portraitSize) / 2),
        portraitSize
      );
    }

    ctx.textBaseline = 'top';
    let y = top + Math.round((content - textHeight) / 2);

    for (const line of drawn) {
      ctx.font = fontOf(line.size, line.weight);
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, textLeft, y);
      y += line.height + gap;
    }
  }

  const blob = await toBlob(canvas);

  /* Drop the backing store now rather than waiting for a collection. iOS Safari
   * reclaims canvas memory lazily and enforces a process-wide budget — cross it
   * and later canvases render blank — so several shares in one session can
   * stack ~6 MB each until something gives. */
  canvas.width = 0;
  canvas.height = 0;

  return new File([blob], fileNameFor(title), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

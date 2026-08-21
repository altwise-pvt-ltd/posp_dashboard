/**
 * Upload policy — what a file is allowed to be, in one place.
 *
 * This exists because `accept` was a string literal at six call sites, and the
 * six had already started to disagree with each other and with the caption
 * printed under the drop zone. Everything that describes the rules — the picker
 * filter, that caption, the validator, the zod refinement — is derived from the
 * format lists below, so a change lands everywhere at once and the UI can never
 * advertise a format the validator rejects.
 *
 * The distinction that shapes the rest of the module is between formats we
 * *accept* and formats we *store*. HEIC is accepted because it is what an
 * iPhone produces and blocking it would strand a large share of agents. It is
 * never stored: most browsers cannot display it, canvas cannot decode it, and
 * OCR vendors reject it. It is converted to JPEG at the door, so nothing
 * downstream — preview, form state, backend, OCR — ever sees a HEIC.
 *
 * Size is the one rule that bends instead of refusing: a file over the ceiling
 * is compressed down to fit it. Everything under the ceiling reaches the server
 * exactly as the agent picked it — original resolution, original quality — so
 * the common case still pays nothing for the rare one.
 */

const KB = 1024;
const MB = 1024 * KB;

/**
 * Formats that may reach the server. Anything the form holds is one of these.
 *
 * `mimeAliases` covers the labels browsers report that aren't the canonical
 * type — Windows still emits `image/jpg` for some JPEGs. Extensions are listed
 * separately because they're matched independently of the MIME: browsers derive
 * `file.type` from the extension, so the two agreeing proves nothing on its own.
 *
 * This list *is* the gate, and it is checked before anything is re-encoded, so
 * a dropped WebP or BMP can't compress its way in — it is refused, and the
 * caption and picker filter derived from this list are what tell the user so
 * before they try.
 */
export const OUTPUT_FORMATS = [
  { key: "jpeg", mime: "image/jpeg", mimeAliases: ["image/jpg"], extensions: [".jpg", ".jpeg"], label: "JPG" },
  { key: "png", mime: "image/png", mimeAliases: [], extensions: [".png"], label: "PNG" },
];

/**
 * Accepted at the picker, converted before the form ever holds them.
 *
 * `image/heif` is the container HEIC sits in and some platforms report it
 * instead; both extensions are listed because HEIC's MIME reporting is
 * inconsistent enough that the picker needs the extension as a fallback or iOS
 * users see their photos greyed out.
 */
export const INPUT_ONLY_FORMATS = [
  {
    key: "heic",
    mime: "image/heic",
    mimeAliases: ["image/heif"],
    extensions: [".heic", ".heif"],
    label: "HEIC",
    convertsTo: "jpeg",
  },
];

/**
 * JPEG quality used when transcoding a HEIC.
 *
 * Near-lossless, because this transcode is the only re-encode left in the
 * pipeline and its output is what gets stored — there is no second pass to
 * recover detail from. Fine print on an Aadhaar or a cheque is exactly where
 * JPEG artefacts cluster and exactly what OCR has to read, so the extra bytes
 * are worth spending.
 */
export const HEIC_JPEG_QUALITY = 0.95;

/**
 * A profile describes the shape a file must have, never whether it is present.
 *
 * `required` stays a prop on the field, because the certificate upload is
 * optional while everything else is mandatory, and folding that in here would
 * mean a DOCUMENT_OPTIONAL twin and the start of profile sprawl again.
 */

/** Aadhaar (front and back), PAN, passbook, cheque, education certificate. */
export const DOCUMENT = {
  name: "document",
  output: OUTPUT_FORMATS,
  inputOnly: INPUT_ONLY_FORMATS,

  /**
   * The ceiling the server sees. A pick under it is uploaded untouched; a pick
   * over it is compressed down to fit rather than refused, so a 20 MP phone
   * capture just works.
   *
   * Lower this if the backend has a smaller request limit — compression targets
   * whatever it says, so nothing else needs changing.
   */
  maxBytes: 5 * MB,

  /**
   * Below this on the short edge an image is a thumbnail, not a document.
   *
   * Measured in pixels rather than bytes, which is what the old `minBytes`
   * floor was a poor proxy for: a clean 40 KB screenshot of a PAN card is
   * perfectly readable, and a 300 KB thumbnail is not. 500 sits well clear of
   * anything a real capture or a DigiLocker screenshot produces.
   */
  minDimension: 500,

  capture: null,
};

/**
 * The selfie. Same formats, but the picker opens the front camera and there is
 * no reason to ever accept a scan here.
 */
export const SELFIE = {
  ...DOCUMENT,
  name: "selfie",
  capture: "user",
  // Tolerates a lower floor than a document: an old phone's front camera is
  // 480×640, which is a perfectly usable selfie and would fail the document
  // threshold.
  minDimension: 320,
};

/* ── Derived views ───────────────────────────────────────────────────────────
 * Everything below is computed from the lists above. Nothing here should ever
 * be hand-written at a call site.
 */

/** Every format a profile will take from the picker, converted or not. */
export function acceptedFormats(profile) {
  return [...profile.output, ...profile.inputOnly];
}

/**
 * The `accept` attribute for the hidden <input>.
 *
 * MIME types and bare extensions both, because the MIME alone is unreliable for
 * HEIC — on some platforms the browser reports an empty type and the picker
 * would filter out the very files we went to the trouble of supporting.
 */
export function acceptAttribute(profile) {
  const formats = acceptedFormats(profile);
  const mimes = formats.flatMap((f) => [f.mime, ...f.mimeAliases]);
  const extensions = formats.flatMap((f) => f.extensions);
  return [...mimes, ...extensions].join(",");
}

/** "JPG, PNG or HEIC" — the human list, in the same order as the picker's. */
export function formatList(profile) {
  const labels = acceptedFormats(profile).map((f) => f.label);
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;
}

/** Whole megabytes, for copy. Ceilings are set in round numbers so this is exact. */
export function maxMegabytes(profile) {
  return Math.round(profile.maxBytes / MB);
}

/**
 * The caption under an empty drop zone. It no longer quotes the ceiling,
 * because the ceiling isn't a rule the user has to meet any more — a big photo
 * is shrunk, not rejected, and printing "Max 5 MB" would make agents go looking
 * for a smaller file they don't need.
 */
export function policyCaption(profile) {
  return `${formatList(profile)} · Large photos are compressed`;
}

/** Formats allowed to sit in form state — used by the post-conversion checks. */
export function outputMimes(profile) {
  return profile.output.flatMap((f) => [f.mime, ...f.mimeAliases]);
}

import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

/**
 * The issued certificate → the shape the certificate screen reads.
 *
 * The two stamps are parsed to epoch ms like everything else in this feature
 * (`normalizeExam` does the same with `examStartTime`), so nothing downstream
 * handles the raw `+05:30` strings — and `issuedAt` in particular is what the
 * sheet prints as its date of issue. Printing `new Date()` instead, as the
 * screen used to, dates a document by when it was *looked at*: a certificate
 * opened a month after it was earned would claim to have been issued today, and
 * two prints of the same certificate would disagree.
 *
 * `number` is `certificateNumber` — the registration number on the sheet. It is
 * allocated by the back office when the pass is recorded, which is exactly why
 * the hardcoded holder this replaces could only ever have been a placeholder.
 *
 * `expired` is carried alongside `expiresAt` rather than computed from it. The
 * server decides when a certificate lapses; a browser comparing the stamp
 * against its own clock would be re-deciding that on a clock the server does not
 * trust.
 */
const normalizeCertificate = (data = {}) => ({
  id: data.certificateId ?? null,
  pospId: data.pospId ?? null,
  insuranceTypeId: data.insuranceTypeId ?? null,

  /** The registration number printed on the document. */
  number: data.certificateNumber ?? null,

  issuedAt: data.issuedDate ? Date.parse(data.issuedDate) : null,
  expiresAt: data.expiryDate ? Date.parse(data.expiryDate) : null,

  /**
   * The server's own rendering of the sheet, and its QR.
   *
   * `fileUrl` is now the document — the app no longer draws one. An issued
   * certificate whose `certificateUrl` is empty is a real state and not a
   * failure: the record exists and the file has not been rendered yet, which
   * the screen reports as "being prepared" rather than framing a blank.
   */
  fileUrl: data.certificateUrl || null,
  qrCodeUrl: data.qrCodeUrl || null,

  active: Boolean(data.isActive),
  expired: Boolean(data.isExpired),
});

/**
 * This POSP's certificate — `GET /certificates/me`.
 *
 * Resolves to the certificate, or to **null** when none has been issued yet.
 * Those are two different answers and the caller has to be able to tell them
 * apart, which is the whole reason for the `catch` below: the server says "not
 * issued" with a 404, and a 404 reaching a screen unhandled reads as a broken
 * app. A POSP whose pass was recorded a second ago can genuinely be in that
 * state — the certificate is generated on the server's own beat — so it is
 * ordinary, and the screen says "being prepared" rather than "failed".
 *
 * Every other status still rejects. "We could not ask" is not "you have none",
 * and quietly returning null for a 500 would tell a certified POSP their
 * certificate does not exist.
 *
 * ⚠ Not the whole document. This route describes the *certificate*; the name,
 * PAN, Aadhaar and photograph printed beside it belong to the POSP and come
 * from `/posp/me`. `useCertificate` is what puts the two together.
 */
export async function fetchMyCertificate() {
  try {
    const response = await api.get(ENDPOINTS.certificate.me);
    const data = unwrap(response);
    return data ? normalizeCertificate(data) : null;
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

const KIND_BY_EXTENSION = {
  pdf: 'pdf',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
};

/** Query strings and fragments are stripped first — a SAS-signed blob URL ends
 *  in its signature, not in `.pdf`. */
const kindFromPath = (value) => {
  const extension = value.split(/[?#]/)[0].split('.').pop()?.toLowerCase();
  return KIND_BY_EXTENSION[extension] ?? 'pdf';
};

/* The sheet is a fixed A4 width (210mm ≈ 794px). These shrink each page to fit
   a narrower frame and drop the scaling for print. */
const FIT_CSS = `
  .document-page, .expired-banner { zoom: var(--fit, 1); }
  @media print { .document-page { zoom: 1 !important; } }
`;

const FIT_SCRIPT = `
  (function () {
    function fit() {
      var scale = Math.min(1, (window.innerWidth - 16) / 794);
      document.documentElement.style.setProperty('--fit', String(scale));
    }
    fit();
    window.addEventListener('resize', fit);
  })();
`;

/**
 * Make the server's certificate HTML render from an object URL.
 *
 * Its asset paths are root-relative (`/_content/...`, `/api/...`), which would
 * resolve against this app instead of the API host, so a `<base>` points them
 * back. Images under `/api/` (the photo) need the bearer token, so they are
 * fetched through the client and swapped for object URLs. A failed image is
 * left as it was rather than failing the whole certificate.
 */
async function prepareHtml(blob, fileUrl) {
  const origin = new URL(fileUrl, api.defaults.baseURL).origin;
  const doc = new DOMParser().parseFromString(await blob.text(), 'text/html');

  const base = doc.createElement('base');
  base.href = `${origin}/`;
  doc.head.prepend(base);

  const fitStyle = doc.createElement('style');
  fitStyle.textContent = FIT_CSS;
  const fitScript = doc.createElement('script');
  fitScript.textContent = FIT_SCRIPT;
  doc.head.append(fitStyle, fitScript);

  const urls = [];
  const images = [...doc.querySelectorAll('img[src^="/api/"]')];

  await Promise.allSettled(
    images.map(async (img) => {
      const response = await api.get(`${origin}${img.getAttribute('src')}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      urls.push(url);
      img.setAttribute('src', url);
    })
  );

  const html = `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
  urls.push(URL.createObjectURL(new Blob([html], { type: 'text/html' })));

  return { src: urls.at(-1), urls };
}

/**
 * The certificate document itself, ready to put in a frame.
 *
 * `certificateUrl` (e.g. `https://ibmsapi.shrisoft.co.in/Certificate/View/<pospId>`)
 * needs the bearer token. A `src` can't send one, so the bytes come through the
 * API client (which attaches it, absolute URL or not) and become an object URL.
 * Today it answers with an HTML page, which `prepareHtml` fixes up first.
 *
 * The caller owns `revoke` and must call it when the source is replaced or the
 * screen goes away; an object URL pins the blob in memory until it does.
 */
export async function fetchCertificateFile(fileUrl) {
  const response = await api.get(fileUrl, { responseType: 'blob' });
  const blob = response.data;

  if (blob.type?.includes('text/html')) {
    const { src, urls } = await prepareHtml(blob, fileUrl);
    return { src, kind: 'html', revoke: () => urls.forEach((url) => URL.revokeObjectURL(url)) };
  }

  const src = URL.createObjectURL(blob);

  let kind = kindFromPath(fileUrl);
  if (blob.type?.startsWith('image/')) kind = 'image';
  else if (blob.type === 'application/pdf') kind = 'pdf';

  return { src, kind, revoke: () => URL.revokeObjectURL(src) };
}

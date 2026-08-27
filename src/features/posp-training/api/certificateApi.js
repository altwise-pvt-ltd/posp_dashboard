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

  /** The server's own rendering of the sheet, and its QR. Unused — the app
   *  draws the document itself; see the note on the endpoint. */
  fileUrl: data.certificateUrl ?? null,
  qrCodeUrl: data.qrCodeUrl ?? null,

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

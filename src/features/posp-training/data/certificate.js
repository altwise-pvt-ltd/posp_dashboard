/**
 * How the certificate's dates are written on screen.
 *
 * This module used to carry the whole document: `ISSUER` — the broker's legal
 * name, registered address, CIN and IRDAI licence — and `describeSections`, the
 * prose naming the lines examined. Both existed because the app drew the sheet
 * itself, from the standalone mockup at `src/assets/posp_certificate/
 * certificate.html`.
 *
 * The sheet is the backend's file now (see `CertificateScreen`), so the issuer's
 * statutory details are printed by whoever renders it. Keeping a second copy
 * here would be a copy nothing checks against the first — and the failure mode
 * of a stale CIN on an insurance certificate is not a cosmetic one.
 */

/** `DD/MM/YYYY`, the form the certificate and the appointment letter both use. */
export function formatCertificateDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${day}/${month}/${date.getFullYear()}`;
}

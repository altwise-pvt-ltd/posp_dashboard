/**
 * Everything printed on the POSP certificate that isn't the learner's exam
 * result: who issues it, who signs it, and how its dates and numbers are
 * written.
 *
 * Lifted from the standalone mockup at `src/assets/posp_certificate/
 * certificate.html`, which is where this document was designed. The values are
 * statutory — a registered address, a CIN, an IRDAI licence number — so they
 * live here as data rather than as strings inside JSX, where a careless edit to
 * the layout could quietly change what the certificate claims.
 */

/** The broker the certificate is issued by and under whose licence it stands. */
export const ISSUER = {
  legalName: 'Altsure Insurance Brokers Private Limited',
  address:
    'SR.NO.38/4, A/1, F.P.486, BLDG-A FL-1202, KUMAR SURBHI, OPP. SAIBABA MANDIR, Pune, Maharashtra – 411009',
  cin: 'U66220PN2022PTC215072',
  irdaiLicense: '1163',
  licenseCategory: 'Direct Broker - Life & General',
  principalOfficer: 'Nikhil Nimbhorkar',
};

/*
 * The certificate holder used to live here too — `DEMO_HOLDER`, a fictional
 * name, PAN, Aadhaar and photograph carried over from the standalone mockup,
 * which `CertificateScreen` printed as its default.
 *
 * It is gone rather than kept as a fallback, and that is the point of this note.
 * A placeholder is harmless on a dashboard tile; on a document that states at
 * the bottom that it is electronically generated and verified, it is a
 * convincing certificate issued to nobody — and a fallback is exactly the shape
 * that gets printed on the day the real call fails.
 *
 * The real thing comes from two places now, joined by `useCertificate`:
 * `GET /certificates/me` for the certificate — its number and its dates — and
 * `GET /posp/me` for the person holding it. When either is missing the screen
 * says so instead of drawing a sheet.
 */

/** `DD/MM/YYYY`, the form the certificate and the appointment letter both use. */
export function formatCertificateDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${day}/${month}/${date.getFullYear()}`;
}

/**
 * The insurance lines the certificate says were examined, written as prose.
 *
 * Built from the sections actually sat rather than hardcoded, so a certificate
 * can never claim a paper the learner was never shown: one section reads
 * "General Insurance", two read "General and Life Insurance".
 */
export function describeSections(sections) {
  const labels = sections.map((section) => section.label);
  const joined =
    labels.length > 1 ? `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}` : labels[0];

  return `${joined} Insurance`;
}

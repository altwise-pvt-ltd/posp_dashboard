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

import demoPhoto from '@/assets/posp_certificate/posp_agent.png';

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

/**
 * The certificate holder.
 *
 * Standing demo record, and the same one the mockup ships with — name, PAN,
 * Aadhaar and photograph all belong to one fictional person, so the document
 * reads as a coherent whole rather than a mix of placeholders.
 *
 * Onboarding already asks for every field here: `fullName` and `panNumber` in
 * the PAN step, `aadhaar` and a second `fullName` in the Aadhaar step, and the
 * photograph in the selfie step. None of it survives the wizard — it sits in
 * `OnboardingScreen`'s `formData` state and the submit handler only logs it —
 * so there is nothing yet for this screen to read. Once that payload is
 * persisted, pass a holder built from it into `CertificateScreen` and this
 * constant becomes the fallback rather than the source.
 */
export const DEMO_HOLDER = {
  name: 'Ram Vinay Yadav',
  pan: 'AIWPY9053H',
  aadhaar: '3390 3781 1193',
  /** Allocated by the back office when the pass is recorded — not derivable here. */
  registrationNumber: 'ALT/POSP/2026/0125',
  photo: demoPhoto,
};

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

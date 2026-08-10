import logo from "@/assets/let'sInsuranceLogo.svg";
import signature from '@/assets/posp_certificate/signature_nikhil.png';
import verifiedStamp from '@/assets/posp_certificate/verified_stamp.png';
import { ISSUER, describeSections, formatCertificateDate } from '../../data/certificate';
import './PospCertificate.css';

/** Stands in for the holder's photograph when none was captured. */
const PHOTO_PLACEHOLDER =
  'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z';

/**
 * The POSP certificate — one A4 sheet, printed or on screen.
 *
 * Pure presentation and fixed geometry: it takes a holder, the sections they
 * were examined in and the date, and draws the document. It holds no state and
 * no actions, so the same component serves the after-the-exam screen and any
 * later "view my certificate" route without changing.
 *
 * The `<article>` is the print root — everything outside it is hidden when the
 * sheet goes to the printer. See PospCertificate.css.
 */
function PospCertificate({ holder, sections, issuedOn = new Date() }) {
  const issuedDate = formatCertificateDate(issuedOn);
  const examinedIn = describeSections(sections);

  return (
    <div className="cert-doc cert-stage flex justify-center">
      <div className="cert-scaler">
        <article className="cert-page" aria-label="POSP certificate of completion">
          <div className="cert-border-outer" />
          <div className="cert-border-inner" />
          <div className="cert-corner cert-corner-tl" />
          <div className="cert-corner cert-corner-tr" />
          <div className="cert-corner cert-corner-bl" />
          <div className="cert-corner cert-corner-br" />

          <img
            src={logo}
            alt=""
            aria-hidden="true"
            width={172}
            height={40}
            className="cert-watermark"
          />

          <div className="cert-content">
            <img
              src={logo}
              alt={ISSUER.legalName}
              width={172}
              height={40}
              className="cert-logo"
            />

            <header className="cert-header">
              <h1>Certificate of Completion</h1>
              <div className="cert-divider">
                <span aria-hidden="true">★ ★ ★</span>
              </div>
              <h2>Point of Sales Person (POSP)</h2>
            </header>

            <div className="cert-body">
              <p className="cert-intro">This is to certify that</p>
              <p className="cert-name">{holder.name}</p>

              <p className="cert-description">
                Having successfully completed the prescribed training and passed the examination for{' '}
                <strong>{examinedIn}</strong> conducted on <strong>{issuedDate}</strong>, is hereby
                certified and authorized to act as a{' '}
                <strong>Point of Sales Person (POSP) – Broker</strong> for the solicitation and
                marketing of authorized insurance products.
              </p>

              <p className="cert-description">
                This certification has been issued under the Guidelines on Point of Sales Person
                (POSP) for Insurance Companies and Insurance Intermediaries in India.
              </p>
            </div>

            <div className="cert-details">
              <table className="cert-details-table">
                <tbody>
                  <tr>
                    <td className="label">POSP Reg. Number:</td>
                    <td className="value">{holder.registrationNumber}</td>
                  </tr>
                  <tr>
                    <td className="label">PAN Card Number:</td>
                    <td className="value">{holder.pan}</td>
                  </tr>
                  <tr>
                    <td className="label">Aadhaar Number:</td>
                    <td className="value">{holder.aadhaar}</td>
                  </tr>
                  <tr>
                    <td className="label">Authorizing Broker:</td>
                    <td className="value">{ISSUER.legalName}</td>
                  </tr>
                </tbody>
              </table>

              <div className="cert-photo">
                {holder.photo ? (
                  /* The holder's photo is captured at onboarding, so its intrinsic
                     size isn't knowable here — these carry .cert-photo's fixed
                     110×132 frame, which the CSS pins and object-cover fills. */
                  <img
                    src={holder.photo}
                    alt={`Photograph of ${holder.name}`}
                    width={110}
                    height={132}
                  />
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={PHOTO_PLACEHOLDER} />
                  </svg>
                )}
              </div>
            </div>

            <div className="cert-disclaimer">
              <strong>Important Notice:</strong> This certificate is electronically generated and
              verified. The authorization to act as a Point of Sales Person (POSP) is subject to the
              continuous compliance of the holder with the Code of Conduct and guidelines prescribed
              under the IRDAI (Insurance Brokers) Regulations, 2018.
            </div>

            <div className="cert-signs">
              <div className="cert-sign-col left">
                <div className="cert-date">{issuedDate}</div>
                <div className="cert-sign-label">Date of Issue</div>
              </div>

              <div className="cert-sign-col">
                <div className="cert-stamp">
                  <img
                    src={verifiedStamp}
                    alt="Digitally verified"
                    width={1024}
                    height={1024}
                  />
                </div>
              </div>

              <div className="cert-sign-col right">
                <div className="cert-signature">
                  <img
                    src={signature}
                    alt={`Signature of ${ISSUER.principalOfficer}`}
                    width={1024}
                    height={1024}
                  />
                </div>
                <div className="cert-signature-line" />
                <div className="cert-sign-label name">{ISSUER.principalOfficer}</div>
                <div className="cert-sign-label">Principal Officer</div>
              </div>
            </div>

            <footer className="cert-footer">
              <div className="legal-name">
                <strong>{ISSUER.legalName}</strong>
              </div>
              <div>Registered Address: {ISSUER.address}</div>
              <div>
                CIN: <strong>{ISSUER.cin}</strong> | IRDAI Broker License Number:{' '}
                <strong>{ISSUER.irdaiLicense}</strong> ({ISSUER.licenseCategory})
              </div>
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
}

export default PospCertificate;

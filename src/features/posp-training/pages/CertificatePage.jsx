import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CertificateScreen from '../components/certificate/CertificateScreen';

/**
 * `/certificate` — the document on its own route.
 *
 * The profile card's "View certificate" used to point at `/posp-training` and
 * hope. That route decides what to render from `GET /exam/eligibility`, so a
 * POSP holding a certificate landed on the syllabus whenever that one call
 * answered anything but `alreadyPassed` — including when it failed, which it is
 * designed to do quietly. `/certificates/me` was never consulted, so the request
 * for the certificate was not made at all.
 *
 * Here the screen is the route. It asks for the certificate on mount and reports
 * what it gets, which is the only question a POSP pressing "View certificate"
 * was asking.
 *
 * Guarded `through="training"` — the same stage `/profile` and `/overview` sit
 * behind, and the one that means "passed the exam". See `FUNNEL_STAGES`.
 */
function CertificatePage() {
  const navigate = useNavigate();

  return (
    <CertificateScreen
      actionLabel="Back to profile"
      actionIcon={ArrowLeft}
      onAction={() => navigate('/profile')}
    />
  );
}

export default CertificatePage;

import { useNavigate } from 'react-router-dom';
import OnboardingFooter from '@/features/onboarding/components/OnboardingFooter';
import VerificationCompleteCard from '../components/VerificationCompleteCard';

/**
 * VerificationCompletePage — the post-onboarding handoff on its own route.
 *
 * The card it wraps is the same one TrainingPage opens with; the only
 * difference is where Start Training goes. Here it routes into the training
 * module, there it starts the module in place.
 */
function VerificationCompletePage() {
  const navigate = useNavigate();

  return (
    /* training-scale renders this page at 75% of the app's base scale from
       `sm` up — see the comment beside the class in index.css. */
    <div className="training-scale flex min-h-screen flex-col bg-slate-50 font-sans">
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <VerificationCompleteCard onStart={() => navigate('/posp-training')} />
      </main>

      <OnboardingFooter />
    </div>
  );
}

export default VerificationCompletePage;

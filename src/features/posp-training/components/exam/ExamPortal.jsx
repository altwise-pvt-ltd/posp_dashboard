import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examQuestions } from '../../data/examQuestions';
import { SECTIONS } from '../../data/sections';
import { useCountdown } from '../../hooks/useCountdown';
import { PASS_PERCENTAGE, scoreSection } from '../../lib/examScoring';
import CertificateScreen from '../certificate/CertificateScreen';
import { SECTION_SECONDS, TIME_WARNINGS } from './examTiming';
import ExamInstructions from './ExamInstructions';
import ExamResults from './ExamResults';
import ExamRunner from './ExamRunner';
import SectionTransition from './SectionTransition';

/** The screens the portal moves between, in the order a learner meets them. */
const STAGE = {
  INSTRUCTIONS: 'instructions',
  SECTION: 'section',
  TRANSITION: 'transition',
  RESULTS: 'results',
  CERTIFICATE: 'certificate',
};

/**
 * The sections actually sat, in syllabus order — a section with no questions
 * written yet is skipped rather than presented as an empty paper. This is what
 * keeps the portal free of "is there a life section?" special cases: with one
 * bank it runs a single section straight to the results.
 */
const EXAM_SECTIONS = SECTIONS.filter((section) => examQuestions[section.id]?.length > 0);

/**
 * ExamPortal — the POSP certification exam, from instructions to verdict.
 *
 * Owns only what outlives a single section: which stage is on screen, which
 * section is being sat, the answers given so far and the clock. Everything
 * local to one section lives in ExamRunner, which is remounted per section.
 *
 * `answers` is keyed section id → question id → the index of the chosen
 * option, the same shape `scoreSection` reads at the end.
 */
function ExamPortal({ onRetakeTraining }) {
  const navigate = useNavigate();
  const [stage, setStage] = useState(STAGE.INSTRUCTIONS);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [toast, setToast] = useState(null);

  const section = EXAM_SECTIONS[sectionIndex];
  const nextSection = EXAM_SECTIONS[sectionIndex + 1];

  /** Stop the clock and move on — the same ending whether time ran out or the
   *  learner submitted early. */
  const finishSection = () => {
    setIsClockRunning(false);
    setStage(nextSection ? STAGE.TRANSITION : STAGE.RESULTS);
  };

  const { secondsLeft, reset } = useCountdown(SECTION_SECONDS, {
    running: isClockRunning,
    onTick: (remaining) => {
      const warning = TIME_WARNINGS.find((entry) => entry.at === remaining);
      if (warning) setToast(warning.message);
      if (remaining === 0) finishSection();
    },
  });

  const startSection = (index) => {
    setSectionIndex(index);
    setStage(STAGE.SECTION);
    // A warning raised in the dying seconds of the last section must not ride
    // along into this one — the toast outlives the runner that displayed it.
    setToast(null);
    reset(SECTION_SECONDS);
    setIsClockRunning(true);
  };

  const selectOption = (questionId, optionIndex) => {
    setAnswers((current) => ({
      ...current,
      [section.id]: { ...current[section.id], [questionId]: optionIndex },
    }));
  };

  const clearAnswer = (questionId) => {
    setAnswers((current) => {
      const sectionAnswers = { ...current[section.id] };
      delete sectionAnswers[questionId];
      return { ...current, [section.id]: sectionAnswers };
    });
  };

  // Stable identity: the toast schedules its own dismissal off this, and the
  // portal re-renders every second while the clock runs.
  const dismissToast = useCallback(() => setToast(null), []);

  if (stage === STAGE.INSTRUCTIONS) {
    return (
      <ExamInstructions
        sections={EXAM_SECTIONS}
        sectionMinutes={SECTION_SECONDS / 60}
        passPercentage={PASS_PERCENTAGE}
        onStart={() => startSection(0)}
      />
    );
  }

  if (stage === STAGE.TRANSITION) {
    return (
      <SectionTransition
        completedSection={section}
        nextSection={nextSection}
        onStartNext={() => startSection(sectionIndex + 1)}
      />
    );
  }

  if (stage === STAGE.RESULTS) {
    return (
      <ExamResults
        results={EXAM_SECTIONS.map((examSection) => ({
          section: examSection,
          score: scoreSection(examQuestions[examSection.id], answers[examSection.id]),
        }))}
        onViewCertificate={() => setStage(STAGE.CERTIFICATE)}
        onRetakeTraining={onRetakeTraining}
      />
    );
  }

  // Only ever reached from a pass — the results screen offers no way here
  // otherwise, so the certificate cannot be opened on a failed attempt.
  if (stage === STAGE.CERTIFICATE) {
    return (
      <CertificateScreen
        sections={EXAM_SECTIONS}
        onGoToDashboard={() => navigate('/overview')}
      />
    );
  }

  return (
    <ExamRunner
      key={section.id}
      section={section}
      questions={examQuestions[section.id]}
      answers={answers[section.id] ?? {}}
      secondsLeft={secondsLeft}
      toast={toast}
      onDismissToast={dismissToast}
      onSelectOption={selectOption}
      onClearAnswer={clearAnswer}
      onSubmitSection={finishSection}
    />
  );
}

export default ExamPortal;

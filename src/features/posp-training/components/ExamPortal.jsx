import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { examQuestions } from '../data/examQuestions';

function ExamPortal({ onRetakeTraining }) {
  const [stage, setStage] = useState('instructions'); // 'instructions', 'general', 'transition', 'life', 'results'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({ general: {}, life: {} });
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
  const [timerActive, setTimerActive] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 301) {
            alert("Only 5 minutes left in this section!");
          }
          if (prev === 61) {
            alert("Only 60 seconds left! Please wrap up.");
          }
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, stage]);

  const handleTimeUp = () => {
    setTimerActive(false);
    if (stage === 'general') {
      alert("Time is up for the General Insurance section!");
      if (examQuestions.life && examQuestions.life.length > 0) {
        setStage('transition');
      } else {
        setStage('results');
      }
    } else if (stage === 'life') {
      alert("Time is up for the Life Insurance section!");
      setStage('results');
    }
  };

  const startSection = (section) => {
    setStage(section);
    setCurrentQuestionIndex(0);
    setTimeLeft(1800);
    setTimerActive(true);
  };

  const handleEndTest = () => {
    setShowConfirmModal(true);
  };

  const confirmEndTest = () => {
    setShowConfirmModal(false);
    setTimerActive(false);
    if (stage === 'general') {
      if (examQuestions.life && examQuestions.life.length > 0) {
        setStage('transition');
      } else {
        setStage('results');
      }
    } else {
      setStage('results');
    }
  };

  const cancelEndTest = () => {
    setShowConfirmModal(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Results Calculation
  const calculateResults = (section) => {
    const questions = examQuestions[section];
    const sectionAnswers = answers[section];
    let correct = 0;

    questions.forEach(q => {
      if (sectionAnswers[q.id] === q.correctOption) {
        correct += 1;
      }
    });

    const total = questions.length;
    const attempted = Object.keys(sectionAnswers).length;
    const percentage = (correct / total) * 100;
    const passed = percentage >= 50;

    return { total, attempted, correct, percentage, passed };
  };

  if (stage === 'instructions') {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] relative flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto bg-gradient-to-br from-white via-orange-50/30 to-amber-50/50 rounded-[2rem] border border-orange-100/50 shadow-[inset_0_0_100px_rgba(255,255,255,0.5)]">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-[2rem]">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/20 blur-[80px] rounded-full mix-blend-multiply"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-200/20 blur-[80px] rounded-full mix-blend-multiply"></div>
        </div>

        <div className="max-w-4xl w-full relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
            className="flex flex-col items-center mb-6"
          >
            {/* Icon Container */}
            <div className="relative mb-4 group mt-2">
              <div className="absolute inset-0 bg-orange-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-pulse"></div>
              <div className="absolute inset-[-8px] border-2 border-orange-200 rounded-[1.5rem] border-dashed animate-[spin_15s_linear_infinite]"></div>

              <div className="relative w-20 h-20 bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.15)] border-4 border-white backdrop-blur-sm z-10 transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#orange-doc-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm">
                  <defs>
                    <linearGradient id="orange-doc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                  </defs>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-2 tracking-tight drop-shadow-sm text-center">
              Exam Instructions
            </h2>
            <p className="text-base text-slate-500 font-medium text-center">
              Please read carefully before starting the POSP Certification Exam
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <div className="flex flex-col items-center text-center gap-3 bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-orange-100 shadow-[0_8px_30px_rgba(249,115,22,0.04)] group hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] hover:bg-white transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 mb-1">Time Limit</h4>
                <p className="text-sm text-slate-600 leading-relaxed">You have exactly <strong className="text-orange-600">30 minutes</strong> for each section ({examQuestions.life && examQuestions.life.length > 0 ? "General & Life" : "General"}).</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-3 bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-orange-100 shadow-[0_8px_30px_rgba(249,115,22,0.04)] group hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] hover:bg-white transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 mb-1">Passing Criteria</h4>
                <p className="text-sm text-slate-600 leading-relaxed">You must score at least <strong className="text-orange-600">50%</strong> in each section individually to pass.</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-3 bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-red-100 shadow-[0_8px_30px_rgba(239,68,68,0.04)] group hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)] hover:bg-white transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
              <div>
                <h4 className="text-base font-bold text-red-600 mb-1">Important Warning</h4>
                <p className="text-sm text-slate-600 leading-relaxed"><strong className="text-slate-800">Do not close or refresh this page.</strong> You cannot return once submitted.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => startSection('general')}
              className="relative group w-full max-w-lg py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-[0_10px_40px_rgba(249,115,22,0.3)] hover:shadow-[0_15px_50px_rgba(249,115,22,0.4)] transition-all duration-300 text-lg overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"></div>

              <span className="relative flex items-center justify-center gap-3 drop-shadow-md">
                Start General Insurance Exam
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform duration-300">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (stage === 'transition') {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] bg-slate-50 rounded-3xl relative shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200 flex flex-col items-center justify-center p-6 md:p-8 overflow-y-auto overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 blur-[100px] rounded-full"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-xl w-full text-center relative z-10 bg-white p-10 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100"
        >
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative w-full h-full bg-gradient-to-tr from-green-400 to-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 tracking-tight">Section Completed!</h2>
          <p className="text-lg text-slate-500 mb-10 leading-relaxed">
            Awesome job! You have successfully completed the <strong className="text-slate-700">General Insurance</strong> section. Take a deep breath before moving on.
          </p>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 mb-10 flex items-center justify-between text-left shadow-sm">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Up Next</div>
              <div className="text-xl font-bold text-slate-800">Life Insurance</div>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-orange-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => startSection('life')}
            className="group relative w-full py-4 md:py-5 bg-slate-800 text-white font-bold rounded-2xl shadow-[0_8px_25px_rgba(30,41,59,0.3)] hover:bg-slate-900 transition-all text-lg flex items-center justify-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"></div>
            <span className="relative z-10 flex items-center gap-2">
              Start Next Section
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (stage === 'results') {
    const generalStats = calculateResults('general');
    const hasLife = examQuestions.life && examQuestions.life.length > 0;
    const lifeStats = hasLife ? calculateResults('life') : null;
    const overallPassed = generalStats.passed && (hasLife ? lifeStats.passed : true);

    return (
      <div className="w-full h-full min-h-screen bg-white flex flex-col items-center overflow-x-hidden">
        
        {overallPassed ? (
          <div className="relative w-full h-32 md:h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 overflow-hidden shrink-0">
            <svg viewBox="0 0 100 20" className="absolute bottom-0 w-full h-8 md:h-12 z-10" preserveAspectRatio="none">
              <path fill="#ffffff" d="M0,20 L0,0 Q50,20 100,0 L100,20 Z"></path>
            </svg>
            {/* Confetti */}
            <div className="absolute inset-0 opacity-90">
              <svg className="absolute top-4 left-16 text-yellow-300 w-6 h-6 animate-[spin_4s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4m0 12v4M2 12h4m12 0h4m-16-7l3 3m10 10l3 3m-3-13l3-3M5 19l3-3"></path></svg>
              <svg className="absolute top-8 right-20 text-pink-300 w-5 h-5 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4m0 12v4M2 12h4m12 0h4m-16-7l3 3m10 10l3 3m-3-13l3-3M5 19l3-3"></path></svg>
              <svg className="absolute top-20 left-1/4 text-white opacity-70 w-4 h-4" fill="currentColor"><circle cx="12" cy="12" r="10"></circle></svg>
              <svg className="absolute top-12 right-1/3 text-yellow-400 w-5 h-5 animate-bounce" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <div className="absolute top-10 left-1/3 w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
              <div className="absolute top-12 right-1/4 w-3 h-3 bg-indigo-200 transform rotate-45"></div>
              <div className="absolute top-24 left-24 w-2 h-2 bg-yellow-200 transform rotate-12"></div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-32 md:h-40 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 overflow-hidden shrink-0">
            <svg viewBox="0 0 100 20" className="absolute bottom-0 w-full h-8 md:h-12 z-10" preserveAspectRatio="none">
              <path fill="#ffffff" d="M0,20 L0,0 Q50,20 100,0 L100,20 Z"></path>
            </svg>
            {/* Subtle floating circles for texture */}
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-4 left-1/4 w-12 h-12 border-4 border-white/30 rounded-full"></div>
              <div className="absolute top-12 right-1/4 w-8 h-8 border-4 border-white/20 rounded-full"></div>
              <div className="absolute top-20 left-12 w-6 h-6 border-4 border-white/40 rounded-full"></div>
              <div className="absolute top-8 right-16 w-16 h-16 border-4 border-white/10 rounded-full"></div>
            </div>
          </div>
        )}

        <div className="w-full max-w-4xl mx-auto flex flex-col pb-6 md:pb-8">
          <div className="relative flex justify-center z-10 h-16 md:h-20 bg-white shrink-0">
            {overallPassed ? (
              <>
                <div className="absolute top-0 flex justify-center w-full z-0">
                  <div className="w-8 h-16 bg-indigo-600 shadow-md ml-12 origin-top rounded-b-md" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)', transform: 'rotate(25deg)' }}></div>
                </div>
                <div className="absolute top-0 flex justify-center w-full z-0">
                  <div className="w-8 h-16 bg-indigo-600 shadow-md mr-12 origin-top rounded-b-md" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)', transform: 'rotate(-25deg)' }}></div>
                </div>
                <div className="absolute -top-12 md:-top-16 z-10 w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 rounded-full shadow-[0_12px_30px_rgba(251,191,36,0.5)] flex items-center justify-center border-[5px] md:border-[6px] border-white">
                   <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-amber-200 flex items-center justify-center bg-gradient-to-b from-transparent to-amber-500/20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#fef08a" stroke="#d97706" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                   </div>
                </div>
              </>
            ) : (
              <>
                <div className="absolute top-0 flex justify-center w-full z-0">
                  <div className="w-8 h-16 bg-orange-600 shadow-md ml-12 origin-top rounded-b-md" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)', transform: 'rotate(25deg)' }}></div>
                </div>
                <div className="absolute top-0 flex justify-center w-full z-0">
                  <div className="w-8 h-16 bg-orange-600 shadow-md mr-12 origin-top rounded-b-md" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)', transform: 'rotate(-25deg)' }}></div>
                </div>
                <div className="absolute -top-12 md:-top-16 z-10 w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 rounded-full shadow-[0_12px_30px_rgba(249,115,22,0.4)] flex items-center justify-center border-[5px] md:border-[6px] border-white">
                   <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-orange-200 flex items-center justify-center bg-gradient-to-b from-transparent to-orange-600/20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path><path d="M12 13h5"></path><path d="M12 9h5"></path></svg>
                   </div>
                </div>
              </>
            )}
          </div>

          <div className="text-center px-6 pb-6 bg-white shrink-0">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-2 tracking-tight">{overallPassed ? 'Congratulations!' : 'Almost There!'}</h2>
            <p className="text-base md:text-lg text-slate-500 font-medium">{overallPassed ? 'You did a great job in the test!' : 'Review the material and give it another shot.'}</p>
          </div>

          <div className="px-4 md:px-12 pb-6 md:pb-8 bg-white">
            <div className={`grid grid-cols-1 gap-6 md:gap-8 ${hasLife ? 'md:grid-cols-2' : 'max-w-md mx-auto'}`}>
              {/* General Results */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className={`p-3 md:p-4 border-b flex justify-between items-center ${generalStats.passed ? 'bg-[#f4fcf6] border-green-50' : 'bg-red-50 border-red-50'}`}>
                  <h3 className={`text-base md:text-lg font-bold ${generalStats.passed ? 'text-emerald-800' : 'text-red-800'}`}>General Insurance</h3>
                  <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider ${generalStats.passed ? 'bg-green-200/50 text-green-700' : 'bg-red-200/50 text-red-700'}`}>
                    {generalStats.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="p-4 md:p-5">
                  <div className="flex justify-between items-center mb-3 md:mb-4 border-b border-slate-100 pb-3 md:pb-4">
                    <span className="text-slate-500 font-medium text-xs md:text-sm">Questions Attempted</span>
                    <span className="font-bold text-slate-800 text-sm md:text-base">{generalStats.attempted} / {generalStats.total}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3 md:mb-4 border-b border-slate-100 pb-3 md:pb-4">
                    <span className="text-slate-500 font-medium text-xs md:text-sm">Correct Answers</span>
                    <span className="font-bold text-slate-800 text-sm md:text-base">{generalStats.correct} / {generalStats.total}</span>
                  </div>
                  <div className="flex justify-between items-end mt-1 md:mt-2">
                    <span className="text-slate-500 font-medium text-xs md:text-sm">Score</span>
                    <div className="text-right">
                      <span className={`text-4xl md:text-5xl font-bold tracking-tight ${generalStats.passed ? 'text-[#10b981]' : 'text-red-500'}`}>{generalStats.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Life Results */}
              {hasLife && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
                  <div className={`p-3 md:p-4 border-b flex justify-between items-center ${lifeStats.passed ? 'bg-[#f4fcf6] border-green-50' : 'bg-red-50 border-red-50'}`}>
                    <h3 className={`text-base md:text-lg font-bold ${lifeStats.passed ? 'text-emerald-800' : 'text-red-800'}`}>Life Insurance</h3>
                    <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider ${lifeStats.passed ? 'bg-green-200/50 text-green-700' : 'bg-red-200/50 text-red-700'}`}>
                      {lifeStats.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div className="p-4 md:p-5">
                    <div className="flex justify-between items-center mb-3 md:mb-4 border-b border-slate-100 pb-3 md:pb-4">
                      <span className="text-slate-500 font-medium text-xs md:text-sm">Questions Attempted</span>
                      <span className="font-bold text-slate-800 text-sm md:text-base">{lifeStats.attempted} / {lifeStats.total}</span>
                    </div>
                    <div className="flex justify-between items-center mb-3 md:mb-4 border-b border-slate-100 pb-3 md:pb-4">
                      <span className="text-slate-500 font-medium text-xs md:text-sm">Correct Answers</span>
                      <span className="font-bold text-slate-800 text-sm md:text-base">{lifeStats.correct} / {lifeStats.total}</span>
                    </div>
                    <div className="flex justify-between items-end mt-1 md:mt-2">
                      <span className="text-slate-500 font-medium text-xs md:text-sm">Score</span>
                      <div className="text-right">
                        <span className={`text-4xl md:text-5xl font-bold tracking-tight ${lifeStats.passed ? 'text-[#10b981]' : 'text-red-500'}`}>{lifeStats.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center w-full pt-2 pb-8 md:pb-10">
            {overallPassed ? (
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 md:px-10 md:py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all shadow-[0_8px_20px_rgba(30,41,59,0.2)] hover:shadow-[0_8px_25px_rgba(30,41,59,0.4)] hover:-translate-y-0.5 text-base md:text-lg"
              >
                Welcome to Dashboard
              </button>
            ) : (
              <button
                onClick={onRetakeTraining}
                className="px-8 py-3 md:px-10 md:py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-[0_8px_20px_rgba(249,115,22,0.3)] hover:shadow-[0_8px_25px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 text-base md:text-lg"
              >
                Start Training Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active Exam Render
  const currentQuestionsList = examQuestions[stage];
  const currentQuestion = currentQuestionsList?.[currentQuestionIndex];
  const totalQuestions = currentQuestionsList?.length || 0;

  const currentAnswers = answers[stage] || {};
  const attemptedCount = Object.keys(currentAnswers).length;
  const notAttemptedCount = totalQuestions - attemptedCount;

  const handleOptionSelect = (optionIndex) => {
    setAnswers({
      ...answers,
      [stage]: {
        ...answers[stage],
        [currentQuestion.id]: optionIndex
      }
    });
  };

  const handleClearOption = () => {
    const newStageAnswers = { ...answers[stage] };
    delete newStageAnswers[currentQuestion.id];
    setAnswers({
      ...answers,
      [stage]: newStageAnswers
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const jumpToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] bg-slate-50 rounded-3xl relative shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200 flex flex-col lg:flex-row lg:overflow-hidden overflow-hidden">
      {/* Left Area: Main Question Container */}
      <div className="flex-1 flex flex-col lg:h-full lg:overflow-y-auto relative z-10">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 py-3 px-4 md:px-6 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-20 gap-3 md:gap-0">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <h2 className="text-base md:text-lg font-bold text-slate-800 capitalize">{stage} Insurance Exam</h2>
            <div className="bg-orange-50 text-orange-600 font-bold px-3 py-1 md:py-1.5 rounded-lg border border-orange-100 text-xs whitespace-nowrap">
              Q {currentQuestionIndex + 1} of {totalQuestions}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm md:text-base border transition-colors ${timeLeft <= 300 ? 'text-red-600 border-red-300 bg-red-50 animate-pulse' : 'text-slate-700 border-slate-200 bg-slate-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={timeLeft <= 300 ? '' : 'text-slate-400'}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={handleEndTest}
              className="text-slate-500 hover:text-red-600 font-bold text-xs md:text-sm transition-colors uppercase tracking-wider hover:bg-red-50 px-3 py-1.5 rounded-lg"
            >
              End Test Early
            </button>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 p-4 md:p-6 md:py-8 flex flex-col max-w-5xl mx-auto w-full relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion?.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex justify-between items-center mb-3 px-1">
                <div className="font-bold text-slate-800 text-base md:text-lg">Q: {currentQuestionIndex + 1}</div>
                <div className="text-slate-400 text-base">Report</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-5 md:p-6 mb-8 text-base md:text-lg text-slate-800 leading-relaxed shadow-sm">
                {currentQuestion?.question}
              </div>

              <div className="flex flex-col gap-3 md:gap-4">
                {currentQuestion?.options.map((option, index) => {
                  const isSelected = currentAnswers[currentQuestion.id] === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(index)}
                      className={`text-left p-4 md:p-5 rounded-lg border transition-all duration-200 flex items-center gap-4 ${isSelected
                        ? 'bg-[#e2e8f0] border-slate-800 text-slate-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                    >
                      <div className="font-bold text-base md:text-lg text-slate-800 shrink-0">
                        {String.fromCharCode(97 + index)})
                      </div>
                      <span className="text-base md:text-lg leading-snug">{option}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-8 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
                className={`flex items-center gap-2 font-medium text-sm transition-colors ${currentQuestionIndex === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                Previous
              </button>
            </div>

            <div className="flex items-center gap-3">
              {currentAnswers[currentQuestion?.id] !== undefined && (
                <button
                  onClick={handleClearOption}
                  className="px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 text-sm shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8" /><path d="M3 16.2V21m0 0h4.8M3 21l6-6" /><path d="M21 7.8V3m0 0h-4.8M21 3l-6 6" /><path d="M3 7.8V3m0 0h4.8M3 3l6 6" /></svg>
                  Clear Response
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === totalQuestions - 1}
                className={`px-5 py-2.5 font-medium rounded-md transition-colors flex items-center gap-2 text-sm ${currentQuestionIndex === totalQuestions - 1
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-transparent'
                  : 'bg-[#0B1B3D] text-white hover:bg-slate-800 shadow-sm'
                  }`}
              >
                Save and Next
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Area: Navigation Panel */}
      <div className="w-full lg:w-72 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col lg:h-full shrink-0 relative z-20">
        <div className="p-4 md:p-5 border-b border-slate-200 bg-white">
          <h3 className="font-bold text-slate-800 mb-3 capitalize text-sm">{stage} Summary</h3>
          <div className="flex gap-3">
            <div className="flex-1 bg-orange-50 border border-orange-100 rounded-xl p-2.5 text-center">
              <div className="text-xl font-black text-orange-600">{attemptedCount}</div>
              <div className="text-[9px] font-bold text-orange-700 uppercase tracking-wider mt-0.5">Attempted</div>
            </div>
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-center">
              <div className="text-xl font-black text-slate-500">{notAttemptedCount}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Not Visited</div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5 flex-1 lg:overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Questions Navigation</p>
          <div className="grid grid-cols-5 gap-2">
            {currentQuestionsList?.map((q, index) => {
              const isAttempted = currentAnswers[q.id] !== undefined;
              const isCurrent = currentQuestionIndex === index;

              return (
                <button
                  key={q.id}
                  onClick={() => jumpToQuestion(index)}
                  className={`w-full aspect-square rounded-lg font-bold text-sm flex items-center justify-center transition-all duration-200 ${isCurrent
                    ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-slate-50 z-10'
                    : ''
                    } ${isAttempted
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10 shrink-0">
          <button
            onClick={handleEndTest}
            className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
          >
            <span className="flex items-center gap-2">
              Submit Section
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
          </button>
        </div>
      </div>

      {/* End Test Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-amber-500"></div>

              <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>

              <h3 className="text-2xl font-black text-slate-800 text-center mb-3">Submit Section?</h3>
              <p className="text-slate-500 text-center mb-8">
                Are you sure you want to submit and end this section early? <strong className="text-slate-700">You cannot return to it once submitted.</strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={cancelEndTest}
                  className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEndTest}
                  className="flex-1 py-3 px-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-[0_4px_10px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_15px_rgba(249,115,22,0.4)] transition-all"
                >
                  Yes, Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExamPortal;

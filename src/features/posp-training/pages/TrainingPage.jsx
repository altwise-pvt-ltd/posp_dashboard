import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { trainingData } from './data';
import ExamPortal from '../components/ExamPortal';
import ShapeGrid from '../components/boxgrid';
import logo from '../../../assets/logo.png';

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

function TrainingPage() {
  const [started, setStarted] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60 * 60);

  useEffect(() => {
    let interval;
    if (started && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [started, timeLeft]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return {
      h: h.toString().padStart(2, '0'),
      m: m.toString().padStart(2, '0'),
      s: s.toString().padStart(2, '0')
    };
  };

  const time = formatTime(timeLeft);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">


      <main className={`flex-1 w-full flex flex-col ${examStarted ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`}>
        {examStarted ? (
          <ExamPortal onRetakeTraining={() => {
            setExamStarted(false);
            setTimeLeft(15 * 60 * 60);
          }} />
        ) : (
          <div className={`w-full min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] flex flex-col ${started ? 'bg-white rounded-3xl relative shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200 lg:overflow-hidden' : ''}`}>
            {!started ? (
              <div className="flex w-full flex-1 flex-col items-center justify-center p-4 md:p-8 text-center relative overflow-hidden">
                {/* Background Grid */}
                <div className="fixed inset-0 z-0 opacity-100">
                  <ShapeGrid 
                    shape="hexagon" 
                    speed={0.5} 
                    borderColor="rgba(0,0,0,0.06)" 
                    hoverFillColor="rgba(249,115,22,0.15)" 
                    squareSize={60} 
                    backgroundMode="transparent"
                    hoverTrailAmount={5}
                  />
                </div>

                {/* Premium Glassmorphism Card */}
                <motion.div 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="relative z-10 backdrop-blur-xl bg-white/70 border border-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] p-10 md:p-14 max-w-2xl w-full flex flex-col items-center"
                >
                  {/* Decorative glows inside the card */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-100/50 rounded-full blur-3xl opacity-60 z-0 pointer-events-none"></div>
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl opacity-60 z-0 pointer-events-none"></div>

                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    className="mb-8 w-24 h-24 bg-gradient-to-tr from-green-50 to-emerald-100 rounded-full flex items-center justify-center text-green-500 shadow-[0_8px_30px_rgba(34,197,94,0.2)] border-4 border-white z-10 relative"
                  >
                    <div className="absolute inset-0 rounded-full border border-green-200/50 animate-ping opacity-20"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </motion.div>
                  
                  <motion.img 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    src={logo} 
                    alt="Lets Insurance Broker" 
                    className="h-14 md:h-16 mb-8 object-contain z-10" 
                  />
                  
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-700 to-slate-800 mb-5 z-10 tracking-tight"
                  >
                    Verification Complete!
                  </motion.h2>
                  
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-slate-600/90 mb-10 max-w-md text-base md:text-lg z-10 leading-relaxed font-medium"
                  >
                    All your documents have been successfully verified. You are now ready to begin your mandatory 15-hour POSP training program.
                  </motion.p>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="z-10 w-full sm:w-auto relative group"
                  >
                    {/* Glowing aura under button */}
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500"></div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStarted(true)}
                      className="relative w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl border border-orange-400/50 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer text-lg"
                    >
                      Start Training Module
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  </motion.div>
                </motion.div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                <div className="bg-gradient-to-r from-orange-50 via-white to-amber-50 py-5 px-8 text-center rounded-t-3xl shadow-[0_2px_10px_rgba(249,115,22,0.05)] border-b border-orange-100 z-10 relative overflow-hidden shrink-0">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500"></div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center justify-center gap-3 relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                    <span>Congratulations! You are one step closer to become a POSP of <span className="text-orange-600 font-black tracking-wide">lets insurance broker</span></span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 hidden md:block"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                  </h2>
                </div>

                <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto lg:overflow-hidden">
                  {timeLeft > 0 ? (
                    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start h-full">

                      {/* Left Side: PDFs (70%) */}
                      <div className="w-full lg:col-span-8 xl:col-span-9 space-y-8 lg:h-full lg:overflow-y-auto lg:pr-8 lg:border-r lg:border-slate-200 pb-4 scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent order-2 lg:order-1">

                        {/* General Insurance Section */}
                        <div>
                          <div className="bg-orange-100 border border-orange-200 text-orange-700 px-5 py-3 rounded-xl shadow-sm mb-6">
                            <h4 className="text-lg font-bold flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                              General Insurance
                            </h4>
                          </div>

                          <div className="space-y-8 pl-2">
                            {trainingData.generalInsurance.map((module) => (
                              <div key={module.id} className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-100 rounded-full"></div>
                                <div className="pl-6">
                                  <h5 className="text-lg font-bold text-slate-700 mb-4">{module.module}</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {module.chapters.map((doc) => (
                                      <div key={doc.id} className="flex flex-row items-center justify-between bg-white p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500 shrink-0 group-hover:bg-orange-100 group-hover:scale-110 transition-all">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                              <polyline points="7 10 12 15 17 10"></polyline>
                                              <line x1="12" y1="15" x2="12" y2="3"></line>
                                            </svg>
                                          </div>
                                          <div>
                                            <h6 className="font-bold text-slate-800 text-sm leading-tight">{doc.title}</h6>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{doc.type}</p>
                                          </div>
                                        </div>
                                        <a
                                          href={doc.link}
                                          onClick={(e) => {
                                            if (doc.link === "#") {
                                              e.preventDefault();
                                              alert(`${doc.title} Downloading...`);
                                            }
                                          }}
                                          className="text-orange-600 hover:text-white font-bold px-3 py-1.5 bg-orange-50 hover:bg-orange-500 rounded-lg transition-colors text-xs whitespace-nowrap ml-2"
                                          download
                                        >
                                          Download
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Life Insurance Section */}
                        <div>
                          <div className="bg-orange-100 border border-orange-200 text-orange-700 px-5 py-3 rounded-xl shadow-sm mb-6 mt-8">
                            <h4 className="text-lg font-bold flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                              Life Insurance
                            </h4>
                          </div>

                          <div className="space-y-8 pl-2">
                            {trainingData.lifeInsurance.map((module) => (
                              <div key={module.id} className="relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-100 rounded-full"></div>
                                <div className="pl-6">
                                  <h5 className="text-lg font-bold text-slate-700 mb-4">{module.module}</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {module.chapters.map((doc) => (
                                      <div key={doc.id} className="flex flex-row items-center justify-between bg-white p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500 shrink-0 group-hover:bg-orange-100 group-hover:scale-110 transition-all">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                              <polyline points="7 10 12 15 17 10"></polyline>
                                              <line x1="12" y1="15" x2="12" y2="3"></line>
                                            </svg>
                                          </div>
                                          <div>
                                            <h6 className="font-bold text-slate-800 text-sm leading-tight">{doc.title}</h6>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{doc.type}</p>
                                          </div>
                                        </div>
                                        <a
                                          href={doc.link}
                                          onClick={(e) => {
                                            if (doc.link === "#") {
                                              e.preventDefault();
                                              alert(`${doc.title} Downloading...`);
                                            }
                                          }}
                                          className="text-orange-600 hover:text-white font-bold px-3 py-1.5 bg-orange-50 hover:bg-orange-500 rounded-lg transition-colors text-xs whitespace-nowrap ml-2"
                                          download
                                        >
                                          Download
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Right Side: Timer (30%) */}
                      <div className="w-full lg:col-span-4 xl:col-span-3 order-1 lg:order-2">
                        <div className="bg-gradient-to-br from-orange-50/80 to-orange-50/30 rounded-3xl p-6 lg:p-8 border border-orange-200/60 shadow-sm sticky top-0">
                          
                          {/* Header */}
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                              <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                              </div>
                              <span className="text-slate-800 font-black tracking-[0.1em] text-sm uppercase">Time Remaining</span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white border border-orange-100 shadow-sm text-orange-600 flex items-center justify-center shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                            </div>
                          </div>

                          {/* Timer Display */}
                          <div className="flex justify-center items-center gap-1 sm:gap-2 lg:gap-3 mb-10 w-full">
                            <div className="flex flex-col items-center flex-1 max-w-[96px]">
                              <div className="aspect-square w-full p-1 sm:p-2 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm transition-all">
                                <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none">{time.h}</span>
                              </div>
                              <span className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-widest mt-2 lg:mt-3">Hours</span>
                            </div>
                            
                            <div className="flex flex-col items-center justify-start pb-5 sm:pb-6 lg:pb-8 px-0.5 lg:px-1">
                              <span className="text-xl sm:text-2xl lg:text-3xl text-slate-800 animate-pulse font-black leading-none">:</span>
                            </div>

                            <div className="flex flex-col items-center flex-1 max-w-[96px]">
                              <div className="aspect-square w-full p-1 sm:p-2 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm transition-all">
                                <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none">{time.m}</span>
                              </div>
                              <span className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-widest mt-2 lg:mt-3">Mins</span>
                            </div>

                            <div className="flex flex-col items-center justify-start pb-5 sm:pb-6 lg:pb-8 px-0.5 lg:px-1">
                              <span className="text-xl sm:text-2xl lg:text-3xl text-slate-800 animate-pulse font-black leading-none">:</span>
                            </div>

                            <div className="flex flex-col items-center flex-1 max-w-[96px]">
                              <div className="aspect-square w-full p-1 sm:p-2 flex items-center justify-center bg-white rounded-2xl border border-orange-200 shadow-sm transition-all">
                                <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-orange-700 tracking-tight leading-none">{time.s}</span>
                              </div>
                              <span className="text-[10px] sm:text-xs font-black text-orange-700 uppercase tracking-widest mt-2 lg:mt-3">Secs</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-10">
                            <div className="flex justify-between text-xs text-slate-800 mb-3 font-black uppercase tracking-wider">
                              <span>Progress</span>
                              <span className="text-orange-700">{(100 - (timeLeft / (15*60*60)) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-orange-500 rounded-full transition-all duration-1000 ease-linear"
                                style={{ width: `${Math.max(0, 100 - (timeLeft / (15*60*60)) * 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Button */}
                          <button
                            onClick={() => setTimeLeft(0)}
                            className="w-full py-4 rounded-xl bg-white border-2 border-slate-300 text-slate-800 hover:text-orange-700 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:shadow"
                          >
                            Skip Timer 
                            <span className="text-xs opacity-70">(Test)</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-white via-orange-50/30 to-amber-50/50 p-12 rounded-[2rem] border border-orange-100/50 shadow-[inset_0_0_100px_rgba(255,255,255,0.5)] overflow-hidden min-h-[500px]">
                      {/* Decorative Background Elements */}
                      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/20 blur-[80px] rounded-full mix-blend-multiply"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-200/20 blur-[80px] rounded-full mix-blend-multiply"></div>
                      </div>

                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                        className="relative z-10 flex flex-col items-center"
                      >
                        {/* Icon Container */}
                        <div className="relative mb-8 group">
                          {/* Animated Glow Rings */}
                          <div className="absolute inset-0 bg-orange-400 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-pulse"></div>
                          <div className="absolute inset-[-10px] border-2 border-orange-200 rounded-full border-dashed animate-[spin_10s_linear_infinite]"></div>
                          <div className="absolute inset-[-20px] border border-orange-100 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                          
                          <div className="relative w-28 h-28 bg-gradient-to-br from-orange-50 to-amber-100 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.15)] border-4 border-white backdrop-blur-sm z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="url(#orange-gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm">
                              <defs>
                                <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#f97316" />
                                  <stop offset="100%" stopColor="#ea580c" />
                                </linearGradient>
                              </defs>
                              <motion.path 
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                d="M20 6 9 17 4 12"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Typography */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className="text-center mb-10"
                        >
                          <h3 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-4 tracking-tight drop-shadow-sm">
                            Training Completed!
                          </h3>
                          <p className="text-lg text-slate-500 font-medium max-w-md leading-relaxed mx-auto">
                            Your verification was successful. You're now ready to begin the certification exam.
                          </p>
                        </motion.div>

                        {/* Action Button */}
                        <motion.button
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setExamStarted(true)}
                          className="relative group px-12 py-5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-2xl font-bold text-xl shadow-[0_10px_40px_rgba(249,115,22,0.3)] hover:shadow-[0_15px_50px_rgba(249,115,22,0.4)] transition-all duration-300 overflow-hidden"
                        >
                          {/* Button Shine Effect */}
                          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"></div>
                          
                          <span className="relative flex items-center justify-center gap-3 drop-shadow-md">
                            Start Exam Now
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform duration-300">
                              <path d="M5 12h14"></path>
                              <path d="m12 5 7 7-7 7"></path>
                            </svg>
                          </span>
                        </motion.button>
                        
                        {/* Security Badge */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 }}
                          className="mt-8 flex items-center gap-2 text-sm text-slate-400 font-medium bg-slate-50/80 px-4 py-2 rounded-full border border-slate-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                          Secure Examination Environment
                        </motion.div>
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}


      </main>
    </div>
  );
}

export default TrainingPage;

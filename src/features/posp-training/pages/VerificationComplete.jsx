import React from 'react';
import ShapeGrid from '../components/boxgrid';
import { ArrowLeft, Check, ArrowRight } from 'lucide-react';

const VerificationComplete = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden">
            {/* Background Grid for Entire Page */}
            <div className="fixed inset-0 z-0 opacity-100">
                <ShapeGrid 
                    shape="hexagon" 
                    speed={0.5} 
                    borderColor="rgba(0,0,0,0.06)" 
                    hoverFillColor="rgba(249,115,22,0.15)" 
                    squareSize={60} 
                    backgroundMode="transparent"
                />
            </div>

            {/* Main Content Area */}
            <main className="flex-grow flex items-center justify-center p-6 relative z-10">

                {/* Card Container */}
                <div className="relative z-10 w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col justify-center items-center py-12 px-8">
                    {/* Decorative glows inside the card */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-100/50 rounded-full blur-3xl opacity-60 z-0 pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl opacity-60 z-0 pointer-events-none"></div>

                    <div className="flex flex-col items-center p-8 text-center mt-8 relative z-10">
                        {/* Checkmark Icon */}
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-8 shadow-sm">
                            <Check size={40} className="text-green-500 stroke-[3]" />
                        </div>

                        {/* Logo placeholder */}
                        <div className="mb-6 flex flex-col items-center">
                            <h2 className="text-3xl font-extrabold text-orange-500 flex items-center">
                                Lets<span className="text-gray-800 ml-1">Insurance</span>
                                <span className="w-2 h-2 bg-orange-500 rounded-full ml-1 mb-4"></span>
                            </h2>
                            <p className="text-[10px] tracking-widest text-gray-400 mt-1 uppercase">Protecting You And Yours</p>
                        </div>

                        {/* Text Content */}
                        <h3 className="text-3xl font-bold text-[#1a2b4c] mb-4">Verification Complete!</h3>
                        
                        <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
                            All your documents have been successfully verified. You are now ready to begin your mandatory 15-hour POSP training program.
                        </p>

                        {/* Action Button */}
                        <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg flex items-center shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
                            Start Training Module 
                            <ArrowRight size={18} className="ml-2" />
                        </button>
                    </div>
                </div>
            </main>


        </div>
    );
};

export default VerificationComplete;

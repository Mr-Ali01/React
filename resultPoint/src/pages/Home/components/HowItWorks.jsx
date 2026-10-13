import React, { useState } from 'react';
import { Landmark, Calculator, FileSpreadsheet, Award, Compass } from 'lucide-react';

const steps = [
  { num: '01', title: 'Select Your University', desc: 'Choose your university and applicable regulation.', icon: Landmark },
  { num: '02', title: 'Choose a Calculator', desc: 'Pick the tool you need: SGPA, CGPA, GPA, etc.', icon: Calculator },
  { num: '03', title: 'Enter Your Results', desc: 'Add your subjects, credits, marks or grades.', icon: FileSpreadsheet },
  { num: '04', title: 'Get Your Result', desc: 'Instantly calculate your academic result.', icon: Award },
  { num: '05', title: 'Explore Next Steps', desc: 'Use other tools and resources to improve.', icon: Compass },
];

const progressMap = { 1: '0%', 2: '25%', 3: '50%', 4: '75%', 5: '100%' };

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const fillStyle = activeStep === 0 ? '0%' : progressMap[activeStep];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-bg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/25">
            HOW RESULTPOINT WORKS
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-h tracking-tight">
            Get Started in 5 Simple Steps
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-text-m max-w-xl mx-auto">
            Calculate and understand your academic performance in just a few clicks.
          </p>
        </div>

        <div
          className="relative max-w-5xl mx-auto"
          onMouseLeave={() => setActiveStep(0)}
        >
          <div className="hidden md:block absolute top-[36px] left-[10%] right-[10%] h-[3px] step-track-bg rounded-full z-0">
            <div className="h-full step-track-fill rounded-full" style={{ width: fillStyle }} />
          </div>

          <div className="md:hidden absolute left-[30px] top-[40px] bottom-[40px] w-[3px] step-track-bg rounded-full z-0">
            <div className="w-full step-track-fill rounded-full" style={{ height: fillStyle }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-3 relative z-10">
            {steps.map((step, idx) => {
              const stepNumber = idx + 1;
              const isPassed = activeStep >= stepNumber;
              const Icon = step.icon;

              return (
                <div
                  key={step.num}
                  onMouseEnter={() => setActiveStep(stepNumber)}
                  onFocus={() => setActiveStep(stepNumber)}
                  tabIndex={0}
                  className="group flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-3 focus:outline-none cursor-pointer"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-card border-2 flex items-center justify-center shadow-sm shrink-0 transition-all duration-300 group-hover:scale-110 ${
                      isPassed ? 'border-accent shadow-accent text-accent' : 'border-border text-accent'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span
                      className={`text-[11px] font-black font-mono uppercase tracking-wider block transition-colors ${
                        isPassed ? 'text-accent' : 'text-text-light'
                      }`}
                    >
                      {step.num}
                    </span>
                    <h3 className="text-sm font-bold text-text-h group-hover:text-accent transition-colors leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs text-text-m leading-relaxed max-w-[190px]">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
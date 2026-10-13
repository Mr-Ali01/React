import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Layers, Compass, ArrowRight, Award, Sparkles, TrendingUp } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export default function PerformanceSection() {
  const [metric, setMetric] = useState('cgpa');
  const { showToast } = useToast();

  const handleMetricToggle = (e) => {
    const val = e.target.value;
    setMetric(val);
    showToast(`Updated performance trend: ${val === 'sgpa' ? 'SGPA trajectory' : 'Cumulative CGPA trajectory'}`);
  };

  const chart = metric === 'sgpa'
    ? {
        polyline: '30,85 110,70 190,48 270,55 350,22',
        polygon: '30,85 110,70 190,48 270,55 350,22 350,110 30,110',
      }
    : {
        polyline: '30,92 110,80 190,62 270,44 350,32',
        polygon: '30,92 110,80 190,62 270,44 350,32 350,110 30,110',
      };

  return (
    <section id="performance" className="py-16 sm:py-20 bg-bg-sec border-y border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-5 text-left">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/25">
                UNDERSTAND MORE
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-h tracking-tight">
                More Than Just a Number
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-text-m leading-relaxed">
                ResultPoint helps you understand your academic performance, not just calculate it.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-card border border-border/80 shadow-subtle">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-brandGreen flex items-center justify-center shrink-0 border border-brandGreen/20">
                  <LineChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-text-h">Track semester performance</h3>
                  <p className="text-[11px] sm:text-xs text-text-m mt-0.5">See your progress over time with clean visual progression.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-card border border-border/80 shadow-subtle">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-brandBlue flex items-center justify-center shrink-0 border border-brandBlue/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-text-h">Understand subject-wise results</h3>
                  <p className="text-[11px] sm:text-xs text-text-m mt-0.5">Identify credit strengths and exact areas to improve.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-card border border-border/80 shadow-subtle">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-brandPurple flex items-center justify-center shrink-0 border border-brandPurple/20">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-text-h">Make better academic decisions</h3>
                  <p className="text-[11px] sm:text-xs text-text-m mt-0.5">Plan your next semester and electives with confidence.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/calculators"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-accent hover:bg-accent-hover shadow-accent transition-all text-xs active:scale-95"
              >
                <span>Explore Calculators</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-theme space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-text-h">Your Performance Trend</h3>
                  <p className="text-[10.5px] text-text-light">Continuous cumulative trajectory</p>
                </div>

                <select
                  value={metric}
                  onChange={handleMetricToggle}
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-border bg-bg-sec text-text-h cursor-pointer focus:outline-none focus:border-accent"
                >
                  <option value="cgpa">CGPA</option>
                  <option value="sgpa">SGPA</option>
                </select>
              </div>

              <div className="h-44 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF7300" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#FF7300" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line x1="10" y1="20" x2="390" y2="20" stroke="currentColor" strokeDasharray="3 3" className="text-border/60" strokeWidth="0.8" />
                  <line x1="10" y1="50" x2="390" y2="50" stroke="currentColor" strokeDasharray="3 3" className="text-border/60" strokeWidth="0.8" />
                  <line x1="10" y1="80" x2="390" y2="80" stroke="currentColor" strokeDasharray="3 3" className="text-border/60" strokeWidth="0.8" />
                  <line x1="10" y1="110" x2="390" y2="110" stroke="currentColor" className="text-border" strokeWidth="1" />

                  <polygon points={chart.polygon} fill="url(#perfGradient)" opacity="0.25" />
                  <polyline fill="none" stroke="#FF7300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={chart.polyline} />

                  <circle cx="30" cy="92" r="4" fill="#FF7300" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="110" cy="80" r="4" fill="#FF7300" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="190" cy="62" r="4" fill="#FF7300" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="270" cy="44" r="4" fill="#FF7300" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="350" cy="32" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                </svg>
              </div>

              <div className="flex justify-between text-[11px] text-text-light font-bold px-4">
                <span>S1</span>
                <span>S2</span>
                <span>S3</span>
                <span>S4</span>
                <span className="text-brandGreen">S5</span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/70 text-center">
                <div className="p-2.5 rounded-xl bg-bg-sec border border-border/60">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-text-light mb-0.5">
                    <Award className="w-3 h-3 text-accent" />
                    <span>Current CGPA</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-brandGreen font-mono">8.24</div>
                </div>

                <div className="p-2.5 rounded-xl bg-bg-sec border border-border/60">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-text-light mb-0.5">
                    <Sparkles className="w-3 h-3 text-brandBlue" />
                    <span>Best Semester</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-brandBlue font-mono">8.92</div>
                </div>

                <div className="p-2.5 rounded-xl bg-bg-sec border border-border/60">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-text-light mb-0.5">
                    <TrendingUp className="w-3 h-3 text-brandGreen" />
                    <span>Performance</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-brandGreen mt-0.5">↑ Improving</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
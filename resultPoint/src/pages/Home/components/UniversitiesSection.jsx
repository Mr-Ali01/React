import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';

const universities = [
  { name: 'JNTU Hyderabad', reg: 'R18, R19, R22', short: 'JH', color: 'bg-purple-500/10 text-brandPurple border-brandPurple/20', to: '/universities/details' },
  { name: 'JNTU Kakinada', reg: 'R16, R19, R20', short: 'JK', color: 'bg-emerald-500/10 text-brandGreen border-brandGreen/20', to: '/universities/details#jntuk' },
  { name: 'Osmania University', reg: 'CBCS Regulations', short: 'OU', color: 'bg-blue-500/10 text-brandBlue border-brandBlue/20', to: '/universities/details#osmania' },
  { name: 'Anna University', reg: 'R2021, R2017', short: 'AU', color: 'bg-rose-500/10 text-brandPink border-brandPink/20', to: '/universities/details#anna' },
  { name: 'Andhra University', reg: 'CBCS System', short: 'AN', color: 'bg-amber-500/10 text-brandAmber border-brandAmber/20', to: '/universities/details#andhra' },
];

export default function UniversitiesSection() {
  return (
    <section id="universities" className="py-16 sm:py-20 bg-bg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="text-left space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/25">
              BUILT FOR EVERY STUDENT
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-h tracking-tight">
              University-Specific Support
            </h2>
            <p className="text-xs sm:text-sm text-text-m max-w-xl">
              Academic systems vary across universities. Get the calculators, grading systems and resources relevant to you.
            </p>
          </div>

          <Link
            to="/universities"
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
          >
            <span>Explore All Universities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {universities.map((uni) => (
            <Link
              key={uni.name}
              to={uni.to}
              className="group p-4 rounded-2xl bg-card border border-border shadow-subtle hover:border-accent hover:-translate-y-1 transition-all text-center flex flex-col items-center justify-between"
            >
              <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center font-black text-xs group-hover:scale-105 transition-transform mb-2 ${uni.color}`}>
                {uni.short}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-text-h group-hover:text-accent transition-colors leading-tight">
                  {uni.name}
                </h3>
                <p className="text-[10px] text-text-light mt-1">{uni.reg}</p>
              </div>
            </Link>
          ))}

          <Link
            to="/universities"
            className="group p-4 rounded-2xl bg-accent-soft/50 border border-accent/25 hover:bg-accent-soft hover:border-accent hover:-translate-y-1 transition-all text-center flex flex-col items-center justify-center space-y-2"
          >
            <div className="w-11 h-11 rounded-2xl bg-card border border-border text-accent flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-accent">View All Universities +</div>
          </Link>
        </div>
      </div>
    </section>
  );
}
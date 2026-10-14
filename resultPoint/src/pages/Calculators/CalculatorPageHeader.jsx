import React from 'react';
import { Calculator, Info } from 'lucide-react';

export default function CalculatorPageHeader({
  title = 'GPA Calculator',
  description = 'Calculate your Grade Point Average based on subject credits and grades',
  icon: Icon = Calculator,
  methodTitle = 'CALCULATION METHOD',
  methodSubtitle = 'Weighted Average (Credit Based)',
}) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-stretch">
      {/* Left Card: Title & Subtitle */}
      <div className="sm:col-span-8 lg:col-span-9 rounded-2xl bg-card border border-border p-4 shadow-subtle flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-accent border border-accent/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold text-text-h tracking-tight">{title}</h1>
          <p className="text-xs text-text-m mt-0.5 truncate">{description}</p>
        </div>
      </div>

      {/* Right Card: Calculation Method */}
      <div className="sm:col-span-4 lg:col-span-3 rounded-2xl bg-card border border-border p-4 shadow-subtle flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div className="leading-tight">
          <span className="text-[10px] uppercase font-bold tracking-wider text-text-light block">
            {methodTitle}
          </span>
          <span className="text-xs font-bold text-text-h block mt-0.5">
            {methodSubtitle}
          </span>
        </div>
      </div>
    </section>
  );
}
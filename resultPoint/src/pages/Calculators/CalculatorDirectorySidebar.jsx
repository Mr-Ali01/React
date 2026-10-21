import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { CALCULATOR_CATEGORIES } from './calculatorNavConfig';
import MobileCalculatorDropdown from './MobileCalculatorDropdown';

export default function CalculatorDirectorySidebar({ activeTool = 'cgpa' }) {
  const getToolLinkClass = (toolKey) => {
    return activeTool === toolKey
      ? 'flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-accent-soft text-accent border border-accent/25 transition-all'
      : 'flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-m hover:text-text-h hover:bg-bg-sec transition-all';
  };

  return (
    <>
      {/* Mobile-Only Dropdown (Replaces Sidebar on Mobile Screens) */}
      <MobileCalculatorDropdown activeTool={activeTool} />

      {/* Desktop / Tablet Sidebar (Hidden on Mobile) */}
      <aside className="hidden lg:block lg:col-span-3 xl:col-span-2 space-y-3.5" aria-label="Calculators Directory">
        <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle text-left">
          <div className="pb-2.5 mb-2.5 border-b border-border">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-h">Calculators</h2>
          </div>

          {CALCULATOR_CATEGORIES.map((category) => (
            <div key={category.category} className="space-y-0.5 mb-3 last:mb-0">
              <span className="text-[10px] font-bold text-text-light uppercase tracking-wider block px-2 mb-1">
                {category.category}
              </span>
              {category.items.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link key={item.key} to={item.path} className={getToolLinkClass(item.key)}>
                    <ItemIcon className={`w-3.5 h-3.5 ${item.color || 'text-accent'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Guide Banner (Desktop / Tablet Only) */}
        <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle text-left">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-h">Not sure which to use?</h3>
              <p className="text-[11px] text-text-m mt-1 leading-snug">
                Check our guide to find the right calculator for your needs.
              </p>
              <Link to="/resources" className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline mt-2">
                <span>View Guide</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
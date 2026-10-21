import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Calculator, Sparkles } from 'lucide-react';
import { CALCULATOR_CATEGORIES, ALL_CALCULATORS, getCalculatorByKey } from './calculatorNavConfig';

export default function MobileCalculatorDropdown({ activeTool = 'cgpa' }) {
  const navigate = useNavigate();
  const currentCalc = getCalculatorByKey(activeTool);
  const CurrentIcon = currentCalc.icon || Calculator;

  const handleChange = (e) => {
    const selectedPath = e.target.value;
    if (selectedPath) {
      navigate(selectedPath);
    }
  };

  return (
    <div
      className="block lg:hidden w-full rounded-2xl bg-card border border-border p-3 sm:p-3.5 shadow-subtle mb-4 text-left transition-all"
      aria-label="Mobile Calculator Switcher"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <label
          htmlFor="mobile-calculator-selector"
          className="flex items-center gap-2 text-xs font-bold text-text-h cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-accent-soft text-accent flex items-center justify-center shrink-0">
            <CurrentIcon className="w-3.5 h-3.5" />
          </div>
          <span>Switch Calculator</span>
        </label>
        <span className="text-[10px] font-semibold text-text-light px-2 py-0.5 rounded-full bg-bg-sec border border-border">
          {currentCalc.name}
        </span>
      </div>

      <div className="relative">
        <select
          id="mobile-calculator-selector"
          value={currentCalc.path}
          onChange={handleChange}
          aria-label="Choose academic calculator"
          className="calc-input w-full py-2.5 pl-3 pr-10 rounded-xl text-xs sm:text-sm font-bold text-text-h bg-bg-sec border border-border focus:ring-2 focus:ring-accent focus:border-accent appearance-none cursor-pointer transition-colors shadow-xs"
        >
          {CALCULATOR_CATEGORIES.map((category) => (
            <optgroup key={category.category} label={category.category}>
              {category.items.map((item) => (
                <option key={item.key} value={item.path}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-text-light">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

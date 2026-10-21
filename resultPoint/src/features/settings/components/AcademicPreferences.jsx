import React from 'react';
import { Calculator, FileText, Hash, Award, Edit3 } from 'lucide-react';
import { useAppDispatch } from '../../../hooks/useAppDispatch.js';
import { useAppSelector } from '../../../hooks/useAppSelector.js';
import {
  selectCalculationAutoSave,
  selectDecimalPrecision,
  selectGradeDisplayFormat,
  selectMarksInputPreference,
  setCalculationAutoSave,
  setDecimalPrecision,
  setGradeDisplayFormat,
  setMarksInputPreference,
} from '../settingsSlice.js';
import { useToast } from '../../../context/ToastContext.jsx';

export default function AcademicPreferences() {
  const dispatch = useAppDispatch();
  const calculationAutoSave = useAppSelector(selectCalculationAutoSave);
  const decimalPrecision = useAppSelector(selectDecimalPrecision);
  const gradeDisplayFormat = useAppSelector(selectGradeDisplayFormat);
  const marksInputPreference = useAppSelector(selectMarksInputPreference);
  const { showToast } = useToast();

  const handleToggleAutoSave = () => {
    const nextVal = !calculationAutoSave;
    dispatch(setCalculationAutoSave(nextVal));
    showToast(`Calculation auto-save ${nextVal ? 'enabled' : 'disabled'}.`);
  };

  const handlePrecisionChange = (val) => {
    dispatch(setDecimalPrecision(val));
    showToast(`Decimal precision updated to ${val} decimal places.`);
  };

  const handleGradeFormatChange = (val) => {
    dispatch(setGradeDisplayFormat(val));
    showToast(`Grade display format updated.`);
  };

  const handleMarksInputPrefChange = (val) => {
    dispatch(setMarksInputPreference(val));
    showToast(`Marks input preference set to ${val === 'grade-first' ? 'Grade First' : 'Marks First'}.`);
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-subtle space-y-6">
      {/* Section Header */}
      <div className="flex items-start gap-3.5 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-text-h tracking-tight">
            Academic & Calculation Preferences
          </h2>
          <p className="text-xs text-text-light mt-0.5">
            Configure how your academic results and calculations work.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* 1. Calculation Auto-Save */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Calculation Auto-Save</div>
              <div className="text-[11px] text-text-light">
                Automatically save GPA/CGPA calculations to history.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleAutoSave}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
              calculationAutoSave ? 'bg-accent' : 'bg-bg-sec border border-border'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-xs ${
                calculationAutoSave ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 2. Decimal Precision */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-start gap-3">
            <Hash className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Decimal Precision</div>
              <div className="text-[11px] text-text-light">
                Number of decimal places for GPA/CGPA values.
              </div>
            </div>
          </div>

          <div className="relative">
            <select
              value={decimalPrecision}
              onChange={(e) => handlePrecisionChange(Number(e.target.value))}
              className="calc-input px-3.5 py-1.5 rounded-xl text-xs font-semibold pr-7 cursor-pointer"
            >
              <option value={2}>2 (e.g. 8.23)</option>
              <option value={3}>3 (e.g. 8.234)</option>
              <option value={4}>4 (e.g. 8.2345)</option>
            </select>
          </div>
        </div>

        {/* 3. Grade Display Format */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-start gap-3">
            <Award className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Grade Display Format</div>
              <div className="text-[11px] text-text-light">
                Choose how grades are displayed.
              </div>
            </div>
          </div>

          <div className="relative">
            <select
              value={gradeDisplayFormat}
              onChange={(e) => handleGradeFormatChange(e.target.value)}
              className="calc-input px-3.5 py-1.5 rounded-xl text-xs font-semibold pr-7 cursor-pointer"
            >
              <option value="letter">Letter Grade (A+, A, B, etc.)</option>
              <option value="points">Grade Points (10, 9, 8, etc.)</option>
              <option value="both">Letter Grade + Grade Points</option>
            </select>
          </div>
        </div>

        {/* 4. Marks Input Preference */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-start gap-3">
            <Edit3 className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Marks Input Preference</div>
              <div className="text-[11px] text-text-light">
                Default input type for subject results.
              </div>
            </div>
          </div>

          <div className="relative">
            <select
              value={marksInputPreference}
              onChange={(e) => handleMarksInputPrefChange(e.target.value)}
              className="calc-input px-3.5 py-1.5 rounded-xl text-xs font-semibold pr-7 cursor-pointer"
            >
              <option value="grade-first">Grade First (Recommended)</option>
              <option value="marks-first">Marks First</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

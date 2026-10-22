import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  ArrowRightLeft,
  ChevronDown,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Copy,
  Bookmark,
  Lightbulb,
  Flame,
  Percent,
  Calculator,
  GraduationCap,
  BarChart2,
  FilePen,
  Award,
  ListChecks,
  Binary,
  Divide,
  Download,
  Share2,
  Loader2
} from 'lucide-react';
import CalculatorDirectorySidebar from '../CalculatorDirectorySidebar';
import ExploreMoreTools from '../ExploreMoreTools';
import MobileResultModal from '../MobileResultModal';
import SaveModal from '../CGPA/components/SaveModal';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../hooks/useAuth';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { saveCalculationToHistory } from '../../../features/calculation/calculationSlice';
import { calculationSaveService } from '../../../services/calculationSaveService';
import { downloadCalculatorPdf } from '../../../services/calculatorPdfService';
import { shareCalculationResult } from '../../../services/calculatorShareService';
import { academicCalculationEngine } from '../../../services/academicCalculationEngine';

const CONVERSION_SPECS = {
  'percentage-to-cgpa': {
    name: 'Percentage to CGPA',
    sourceType: 'percentage',
    targetLabel: 'CGPA',
    targetScaleText: 'out of 10',
    icon: Percent,
    iconColor: 'emerald',
    inputs: [
      { id: 'input_percentage', label: 'Enter Percentage', type: 'number', step: '0.01', min: 0, max: 100, defaultValue: 78.5, unit: '%' }
    ],
    calculate(inputs, uni) {
      const pct = parseFloat(inputs.input_percentage);
      if (isNaN(pct) || pct < 0 || pct > 100) return null;
      let cgpa, formula, calc, note;
      if (uni === 'jntuh') {
        cgpa = ((pct / 10) + 0.5).toFixed(2);
        formula = 'CGPA = (Percentage / 10) + 0.5 (JNTUH R18/R22)';
        calc = `${cgpa} = (${pct.toFixed(2)} / 10) + 0.5`;
        note = 'Calculated using JNTU Hyderabad official R18/R22 conversion formula.';
      } else if (uni === 'osmania') {
        cgpa = (pct / 10).toFixed(2);
        formula = 'CGPA = Percentage / 10 (Osmania CBCS)';
        calc = `${cgpa} = ${pct.toFixed(2)} / 10`;
        note = 'Calculated using Osmania University official CBCS conversion standard.';
      } else {
        cgpa = (pct / 10).toFixed(2);
        formula = 'CGPA = Percentage / 10';
        calc = `${cgpa} = ${pct.toFixed(2)} / 10`;
        note = 'Calculated using standard AICTE/UGC academic approximation.';
      }
      return { outputNum: cgpa, outputDisplay: `${cgpa} / 10`, inputDisplay: `${pct.toFixed(2)}%`, formulaEq: formula, formulaCalc: calc, noteText: note };
    }
  },
  'cgpa-to-percentage': {
    name: 'CGPA to Percentage',
    sourceType: 'cgpa',
    targetLabel: 'Percentage',
    targetScaleText: 'out of 100%',
    icon: GraduationCap,
    iconColor: 'blue',
    inputs: [
      { id: 'input_cgpa', label: 'Enter CGPA', type: 'number', step: '0.01', min: 0, max: 10, defaultValue: 8.0, unit: '/10' }
    ],
    calculate(inputs, uni) {
      const cgpa = parseFloat(inputs.input_cgpa);
      if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) return null;
      let pct, formula, calc, note;
      if (uni === 'jntuh') {
        const res = academicCalculationEngine.convertCGPAToPercentage(cgpa, 'jntuh-r18-r22-rule');
        pct = res.percentage.toFixed(2);
        formula = 'Percentage = (CGPA - 0.5) × 10 (JNTUH R18/R22)';
        calc = `${pct}% = (${cgpa.toFixed(2)} - 0.5) × 10`;
        note = 'Official JNTU Hyderabad academic regulation formula.';
      } else if (uni === 'osmania') {
        const res = academicCalculationEngine.convertCGPAToPercentage(cgpa, 'ou-cbcs-standard-rule');
        pct = res.percentage.toFixed(2);
        formula = 'Percentage = CGPA × 10 (Osmania CBCS)';
        calc = `${pct}% = ${cgpa.toFixed(2)} × 10`;
        note = 'Verified Osmania University CBCS regulations standard.';
      } else {
        const res = academicCalculationEngine.convertCGPAToPercentage(cgpa, 'CGPA * 10');
        pct = res.percentage.toFixed(2);
        formula = 'Percentage = CGPA × 10';
        calc = `${pct}% = ${cgpa.toFixed(2)} × 10`;
        note = 'Calculated using standard 10-point linear equivalence.';
      }
      return { outputNum: `${pct}%`, outputDisplay: `${pct}%`, inputDisplay: `${cgpa.toFixed(2)} / 10`, formulaEq: formula, formulaCalc: calc, noteText: note };
    }
  },
  'gpa-to-cgpa': {
    name: 'GPA to CGPA',
    sourceType: 'gpa',
    targetLabel: 'CGPA',
    targetScaleText: 'out of 10',
    icon: Binary,
    iconColor: 'purple',
    inputs: [
      { id: 'input_gpa', label: 'Enter GPA (4.0 Scale)', type: 'number', step: '0.01', min: 0, max: 4, defaultValue: 3.5, unit: '/4.0' }
    ],
    calculate(inputs) {
      const gpa = parseFloat(inputs.input_gpa);
      if (isNaN(gpa) || gpa < 0 || gpa > 4) return null;
      const cgpa = ((gpa / 4) * 10).toFixed(2);
      return { outputNum: cgpa, outputDisplay: `${cgpa} / 10`, inputDisplay: `${gpa.toFixed(2)} / 4.0`, formulaEq: 'CGPA = (GPA / 4.0) × 10.0', formulaCalc: `${cgpa} = (${gpa.toFixed(2)} / 4.0) × 10.0`, noteText: 'Proportional equivalence between US 4.0 and 10.0 scale.' };
    }
  },
  'cgpa-to-gpa': {
    name: 'CGPA to GPA',
    sourceType: 'cgpa',
    targetLabel: 'GPA',
    targetScaleText: 'out of 4.0',
    icon: BarChart2,
    iconColor: 'indigo',
    inputs: [
      { id: 'input_cgpa', label: 'Enter CGPA (10.0 Scale)', type: 'number', step: '0.01', min: 0, max: 10, defaultValue: 8.5, unit: '/10' }
    ],
    calculate(inputs) {
      const cgpa = parseFloat(inputs.input_cgpa);
      if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) return null;
      const gpa = ((cgpa / 10) * 4).toFixed(2);
      return { outputNum: gpa, outputDisplay: `${gpa} / 4.0`, inputDisplay: `${cgpa.toFixed(2)} / 10`, formulaEq: 'GPA = (CGPA / 10.0) × 4.0', formulaCalc: `${gpa} = (${cgpa.toFixed(2)} / 10.0) × 4.0`, noteText: 'Standard proportional conversion from 10-point scale to 4.0 GPA scale.' };
    }
  },
  'marks-to-percentage': {
    name: 'Marks to Percentage',
    sourceType: 'marks',
    targetLabel: 'Percentage',
    targetScaleText: 'out of 100%',
    icon: FilePen,
    iconColor: 'amber',
    inputs: [
      { id: 'input_obtained', label: 'Obtained Marks', type: 'number', step: '1', min: 0, defaultValue: 850, unit: 'marks' },
      { id: 'input_total', label: 'Maximum Marks', type: 'number', step: '1', min: 1, defaultValue: 1000, unit: 'marks' }
    ],
    calculate(inputs) {
      const obt = parseFloat(inputs.input_obtained);
      const max = parseFloat(inputs.input_total);
      if (isNaN(obt) || isNaN(max) || max <= 0 || obt < 0 || obt > max) return null;
      const pct = ((obt / max) * 100).toFixed(2);
      return { outputNum: `${pct}%`, outputDisplay: `${pct}%`, inputDisplay: `${obt} / ${max}`, formulaEq: 'Percentage = (Obtained / Total) × 100', formulaCalc: `${pct}% = (${obt} / ${max}) × 100`, noteText: 'Exact mathematical percentage based on total marks.' };
    }
  },
  'percentage-to-marks': {
    name: 'Percentage to Marks',
    sourceType: 'percentage',
    targetLabel: 'Calculated Marks',
    targetScaleText: 'out of Total Marks',
    icon: Divide,
    iconColor: 'teal',
    inputs: [
      { id: 'input_percentage', label: 'Enter Percentage', type: 'number', step: '0.01', min: 0, max: 100, defaultValue: 85, unit: '%' },
      { id: 'input_total', label: 'Maximum Total Marks', type: 'number', step: '1', min: 1, defaultValue: 1000, unit: 'marks' }
    ],
    calculate(inputs) {
      const pct = parseFloat(inputs.input_percentage);
      const max = parseFloat(inputs.input_total);
      if (isNaN(pct) || isNaN(max) || max <= 0 || pct < 0 || pct > 100) return null;
      const marks = Math.round((pct / 100) * max);
      return { outputNum: marks.toString(), outputDisplay: `${marks} / ${max}`, inputDisplay: `${pct.toFixed(2)}%`, formulaEq: 'Marks = (Percentage / 100) × Maximum', formulaCalc: `${marks} = (${pct.toFixed(2)} / 100) × ${max}`, noteText: 'Exact proportional score calculation.' };
    }
  },
  'marks-to-grade': {
    name: 'Marks to Grade',
    sourceType: 'marks',
    targetLabel: 'Letter Grade',
    targetScaleText: 'Official Grade Band',
    icon: Award,
    iconColor: 'rose',
    inputs: [
      { id: 'input_marks', label: 'Enter Marks (out of 100)', type: 'number', step: '1', min: 0, max: 100, defaultValue: 82, unit: 'marks' }
    ],
    calculate(inputs) {
      const m = parseFloat(inputs.input_marks);
      if (isNaN(m) || m < 0 || m > 100) return null;
      let grade = 'F', pts = 0;
      if (m >= 90) { grade = 'S / O'; pts = 10; }
      else if (m >= 80) { grade = 'A+'; pts = 9; }
      else if (m >= 70) { grade = 'A'; pts = 8; }
      else if (m >= 60) { grade = 'B+'; pts = 7; }
      else if (m >= 50) { grade = 'B'; pts = 6; }
      else if (m >= 40) { grade = 'C'; pts = 5; }
      return { outputNum: grade, outputDisplay: `Grade ${grade} (${pts} Pts)`, inputDisplay: `${m} / 100 Marks`, formulaEq: 'Standard University 10-Point Grade Matrix', formulaCalc: `${m} marks falls in Grade '${grade}' bracket (${pts} pts)`, noteText: 'Corresponds to standard UGC/AICTE grade matrix.' };
    }
  },
  'grade-to-marks': {
    name: 'Grade to Marks',
    sourceType: 'grade',
    targetLabel: 'Marks Estimate',
    targetScaleText: 'out of 100 Marks',
    icon: ListChecks,
    iconColor: 'amber',
    inputs: [
      { id: 'input_grade_select', label: 'Select Grade', type: 'select', defaultValue: 'A+', options: ['O (≥ 90)', 'A+ (80 - 89)', 'A (70 - 79)', 'B+ (60 - 69)', 'B (50 - 59)', 'C (40 - 49)', 'F (< 40)'], unit: 'grade' }
    ],
    calculate(inputs) {
      const g = inputs.input_grade_select || 'A+';
      let midpoint = 75, range = '70 - 79';
      if (g.startsWith('O')) { midpoint = 95; range = '90 - 100'; }
      else if (g.startsWith('A+')) { midpoint = 85; range = '80 - 89'; }
      else if (g.startsWith('A')) { midpoint = 75; range = '70 - 79'; }
      else if (g.startsWith('B+')) { midpoint = 65; range = '60 - 69'; }
      else if (g.startsWith('B')) { midpoint = 55; range = '50 - 59'; }
      else if (g.startsWith('C')) { midpoint = 45; range = '40 - 49'; }
      else { midpoint = 30; range = '0 - 39'; }
      return { outputNum: `~${midpoint}`, outputDisplay: `~${midpoint} Marks (${range})`, inputDisplay: g, formulaEq: 'Grade Band Midpoint Estimation', formulaCalc: `Estimated marks based on median of ${range}% band`, noteText: 'Score within letter band depends on original exam evaluation.' };
    }
  }
};

export default function MarksConvert() {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [activeConvKey, setActiveConvKey] = useState('percentage-to-cgpa');
  const [university, setUniversity] = useState('osmania');
  const [gradingScale, setGradingScale] = useState('10-point');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [pendingCalc, setPendingCalc] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleConvert = () => {
    if (!conversionResult || !conversionResult.outputNum) {
      setValidationError('Please enter valid numeric values for conversion.');
      return;
    }
    setValidationError('');
    setIsResultModalOpen(true);
  };
  const [inputValues, setInputValues] = useState({
    input_percentage: 78.5,
    input_cgpa: 8.0,
    input_gpa: 3.5,
    input_obtained: 850,
    input_total: 1000,
    input_marks: 82,
    input_grade_select: 'A+'
  });

  const activeSpec = CONVERSION_SPECS[activeConvKey];

  const handleInputChange = (id, val) => {
    setInputValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleApplyPreset = (convId, presetValues) => {
    setActiveConvKey(convId);
    setInputValues((prev) => ({ ...prev, ...presetValues }));
    showToast(`Applied preset for ${CONVERSION_SPECS[convId].name}`);
  };

  const conversionResult = useMemo(() => {
    if (!activeSpec) return null;
    return activeSpec.calculate(inputValues, university);
  }, [activeSpec, inputValues, university]);

  const handleCopyResult = () => {
    if (!conversionResult) return;
    const text = `${activeSpec.targetLabel}: ${conversionResult.outputNum}\nFormula: ${conversionResult.formulaEq}\nCalculation: ${conversionResult.formulaCalc}\nConverted on ResultPoint (https://resultpoint.app)`;
    navigator.clipboard.writeText(text);
    showToast('Result and formula copied to clipboard!');
  };

  const handleSaveResult = () => {
    if (!conversionResult) return;
    const calcRecord = {
      calculatorType: 'Marks Convert',
      title: activeSpec.name,
      score: conversionResult.outputNum,
      scale: activeSpec.targetScaleText || '10.0',
      result: `${conversionResult.inputDisplay} ➔ ${conversionResult.outputDisplay}`,
      standing: 'Converted',
      summary: `${activeSpec.name}: ${conversionResult.inputDisplay} = ${conversionResult.outputDisplay} (${university.toUpperCase()})`,
      data: {
        conversionKey: activeConvKey,
        conversionName: activeSpec.name,
        inputDisplay: conversionResult.inputDisplay,
        outputDisplay: conversionResult.outputDisplay,
        outputNum: conversionResult.outputNum,
        formula: conversionResult.formulaEq,
        calculation: conversionResult.formulaCalc,
        university,
      },
    };

    if (isAuthenticated) {
      const res = calculationSaveService.saveCalculation(calcRecord, user);
      if (res.success) {
        dispatch(saveCalculationToHistory(res.record));
        showToast('Conversion saved to your history!');
      } else {
        showToast(res.error || 'Failed to save calculation');
      }
    } else {
      setPendingCalc(calcRecord);
      calculationSaveService.setPendingCalculation(calcRecord);
      setIsModalOpen(true);
    }
  };

  const handleDownloadPdf = async () => {
    if (!conversionResult || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const pdfData = {
        calculatorName: `${activeSpec.name} Conversion Card`,
        subtitle: 'Calculated using official university conversion standards',
        filename: `ResultPoint_${activeSpec.name.replace(/[^a-zA-Z0-9]/g, '_')}_Result.pdf`,
        score: conversionResult.outputNum,
        maxScale: activeSpec.targetScaleText,
        standing: 'Converted Successfully',
        metadata: {
          university: university.toUpperCase(),
          conversionType: activeSpec.name,
          sourceType: activeSpec.sourceType.toUpperCase(),
          targetLabel: activeSpec.targetLabel,
          calculationMethod: 'Equivalence Standard Formula',
          gradingSystem: gradingScale
        },
        metrics: [
          { label: 'Input Expression', value: conversionResult.inputDisplay },
          { label: 'Converted Output', value: conversionResult.outputDisplay },
          { label: 'Grading Scale', value: gradingScale },
          { label: 'University Standard', value: university.toUpperCase() }
        ],
        subjectRows: [
          { param: 'Conversion Type', value: activeSpec.name },
          { param: 'Input Expression', value: conversionResult.inputDisplay },
          { param: 'Converted Equivalent', value: conversionResult.outputDisplay },
          { param: 'Formula Applied', value: conversionResult.formulaEq },
          { param: 'Mathematical Derivation', value: conversionResult.formulaCalc },
          { param: 'Applicable University', value: university.toUpperCase() },
          { param: 'Curriculum Guidance', value: conversionResult.noteText }
        ]
      };
      downloadCalculatorPdf(pdfData);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('Failed to download PDF. Please try again.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareResult = async () => {
    if (!conversionResult || isSharing) return;
    setIsSharing(true);
    try {
      const shareData = {
        toolName: activeSpec.name,
        score: conversionResult.outputNum,
        scaleText: activeSpec.targetScaleText,
        metrics: [
          { label: 'Input', value: conversionResult.inputDisplay },
          { label: 'Converted', value: conversionResult.outputDisplay },
          { label: 'Formula', value: conversionResult.formulaEq }
        ],
        metadata: {
          university: university.toUpperCase()
        }
      };
      const res = await shareCalculationResult(shareData);
      if (res.success) {
        showToast(res.message);
      } else if (!res.cancelled) {
        showToast(res.message || 'Unable to share result.', 'error');
      }
    } catch (err) {
      console.error('Share error:', err);
      showToast('Failed to share result.', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li><Link to="/calculators" className="hover:text-accent transition-colors">Calculators</Link></li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-bold text-text-h" aria-current="page">Marks Convert</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* Hero Section */}
        <section className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 z-10">
              <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent/20 text-accent flex items-center justify-center shrink-0 shadow-subtle text-lg">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-text-h tracking-tight leading-tight">
                  Marks Convert
                </h1>
                <p className="text-xs text-text-m mt-0.5">
                  Convert between CGPA, GPA, percentage, marks and grades with ease.
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-auto flex items-center justify-end z-10 shrink-0">
              <div className="flex items-center gap-3 py-1">
                <span className="text-accent font-bold text-xs tracking-wide italic text-right block">
                  Convert • Compare • Excel!
                </span>
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center border border-accent/20">
                  <Calculator className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Column 1: Left Sidebar Conversion Switcher */}
          <aside className="lg:col-span-3 space-y-4" aria-label="Academic Converters Directory">
            <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
              <div className="pb-2.5 mb-2.5 border-b border-border">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-h">
                  Academic Converters
                </h2>
              </div>

              <nav className="space-y-1 text-xs">
                {Object.entries(CONVERSION_SPECS).map(([key, spec]) => {
                  const isActive = key === activeConvKey;
                  const Icon = spec.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveConvKey(key)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left ${
                        isActive
                          ? 'bg-accent-soft text-accent font-bold border border-accent/25 shadow-subtle'
                          : 'text-text-m hover:text-text-h hover:bg-bg-sec font-medium'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 ${
                        isActive ? 'bg-accent text-white' : 'bg-bg-sec text-text-light'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="truncate">{spec.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="rounded-2xl bg-card border border-border p-4 shadow-subtle text-left space-y-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center text-xs">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-text-h">Not sure which to use?</h3>
              <p className="text-[11px] text-text-m leading-snug">
                Check our guidelines to select the right calculation method for your university.
              </p>
              <Link to="/resources" className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline pt-1">
                <span>View Guidelines</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </aside>

          {/* Column 2: Center Converter Form & Dynamic Results */}
          <section className="lg:col-span-6 space-y-4 text-left" aria-label="Converter Form">
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center text-sm shadow-subtle shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-text-h leading-tight">Converter</h2>
                  <p className="text-[11px] text-text-light">Choose what you want to convert from and to.</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Mode Select */}
                <div>
                  <label className="block font-bold text-text-h mb-1">Select Conversion Type</label>
                  <div className="relative">
                    <select
                      value={activeConvKey}
                      onChange={(e) => setActiveConvKey(e.target.value)}
                      className="calc-input w-full pl-3 pr-8 py-2.5 rounded-xl border border-border bg-bg-sec text-text-h font-semibold appearance-none cursor-pointer"
                    >
                      {Object.entries(CONVERSION_SPECS).map(([k, s]) => (
                        <option key={k} value={k}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3.5 pointer-events-none text-text-light" />
                  </div>
                </div>

                {/* Dynamic Inputs */}
                <div className="space-y-3">
                  {activeSpec.inputs.map((inp) => (
                    <div key={inp.id}>
                      <label className="block font-semibold text-text-h mb-1">{inp.label} *</label>
                      {inp.type === 'select' ? (
                        <div className="relative">
                          <select
                            value={inputValues[inp.id] || inp.defaultValue}
                            onChange={(e) => handleInputChange(inp.id, e.target.value)}
                            className="calc-input w-full px-3 py-2.5 rounded-xl border border-border bg-bg-sec text-text-h font-semibold appearance-none cursor-pointer"
                          >
                            {inp.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3.5 pointer-events-none text-text-light" />
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type={inp.type}
                            step={inp.step || '1'}
                            min={inp.min}
                            max={inp.max}
                            value={inputValues[inp.id] ?? inp.defaultValue}
                            onChange={(e) => handleInputChange(inp.id, e.target.value)}
                            className="calc-input w-full px-3 py-2.5 rounded-xl border border-border bg-bg-sec text-text-h font-semibold text-sm"
                          />
                          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-light text-xs font-semibold pointer-events-none">
                            {inp.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* University and Scale */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-text-h mb-1">Select University (Optional)</label>
                    <div className="relative">
                      <select
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="calc-input w-full px-3 py-2 rounded-xl border border-border bg-bg-sec text-text-h appearance-none cursor-pointer text-xs"
                      >
                        <option value="osmania">Osmania University</option>
                        <option value="jntuh">JNTU Hyderabad</option>
                        <option value="jntuk">JNTU Kakinada</option>
                        <option value="anna">Anna University</option>
                        <option value="andhra">Andhra University</option>
                        <option value="other">Other / Standard (AICTE/UGC)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3 pointer-events-none text-text-light" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-text-h mb-1">Select Grading System</label>
                    <div className="relative">
                      <select
                        value={gradingScale}
                        onChange={(e) => setGradingScale(e.target.value)}
                        className="calc-input w-full px-3 py-2 rounded-xl border border-border bg-bg-sec text-text-h appearance-none cursor-pointer text-xs"
                      >
                        <option value="10-point">10 Point Scale (Default)</option>
                        <option value="4-point">4 Point Scale</option>
                        <option value="percentage">Percentage Based</option>
                        <option value="university-specific">University Specific</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3 pointer-events-none text-text-light" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleConvert}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs shadow-accent active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Convert Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInputValues({
                        input_percentage: 78.5,
                        input_cgpa: 8.0,
                        input_gpa: 3.5,
                        input_obtained: 850,
                        input_total: 1000,
                        input_marks: 82,
                        input_grade_select: 'A+'
                      });
                      setValidationError('');
                      showToast('Form reset to default parameters.');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-bg-sec text-text-m hover:text-text-h font-semibold text-xs transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
                {validationError && (
                  <p className="text-[11px] text-brandPink mt-2 text-center font-medium">{validationError}</p>
                )}
              </div>
            </div>

            {/* Live Result Card */}
            {conversionResult && (
              <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-4">
                <div className="flex items-center gap-2 text-accent font-bold text-xs pb-2 border-b border-border">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="uppercase tracking-wider">Conversion Result</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-5 text-center sm:text-left sm:border-r sm:border-border sm:pr-4">
                    <span className="text-xs font-semibold text-text-light uppercase tracking-wider block">
                      {activeSpec.targetLabel}
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-accent font-mono my-1 tracking-tight">
                      {conversionResult.outputNum}
                    </div>
                    <span className="text-[11px] font-medium text-text-m block">
                      {activeSpec.targetScaleText}
                    </span>
                  </div>

                  <div className="sm:col-span-7 space-y-1.5 text-xs">
                    <div className="text-[11px] font-bold text-text-h uppercase tracking-wider mb-1">
                      Conversion Details
                    </div>
                    <div className="flex items-center justify-between text-text-m">
                      <span>Input {activeSpec.sourceType.toUpperCase()}</span>
                      <span className="font-bold text-text-h">{conversionResult.inputDisplay}</span>
                    </div>
                    <div className="flex items-center justify-between text-text-m">
                      <span>Converted {activeSpec.targetLabel}</span>
                      <span className="font-bold text-text-h">{conversionResult.outputDisplay}</span>
                    </div>
                    <div className="flex items-center justify-between text-text-m">
                      <span>Grading System</span>
                      <span className="font-bold text-text-h">{gradingScale}</span>
                    </div>
                    <div className="flex items-center justify-between text-text-m">
                      <span>University</span>
                      <span className="font-bold text-text-h capitalize">{university}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-brandBlue text-xs flex items-center gap-2">
                  {/* <Info className="w-4 h-4 shrink-0" /> */}
                  <span className="text-[11.5px] leading-tight">{conversionResult.noteText}</span>
                </div>

                <div className="p-3 rounded-xl bg-bg-sec border border-border text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-light block">Formula Used</span>
                  <div className="font-mono text-xs font-bold text-text-h">{conversionResult.formulaEq}</div>
                  <div className="text-[11px] text-accent font-mono">{conversionResult.formulaCalc}</div>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveResult}
                      className="flex-1 py-2 px-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-accent active:scale-95 cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save Result</span>
                    </button>
                    <button
                      type="button"
                      disabled={isGeneratingPdf}
                      onClick={handleDownloadPdf}
                      className="flex-1 py-2 px-3 rounded-xl border border-border bg-card hover:bg-bg-sec text-text-h text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                      title="Download genuine conversion PDF"
                    >
                      {isGeneratingPdf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-accent" />
                      )}
                      <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSharing}
                      onClick={handleShareResult}
                      className="flex-1 py-2 px-3 rounded-xl border border-border bg-card hover:bg-bg-sec text-text-h text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                      title="Share conversion summary"
                    >
                      <Share2 className="w-3.5 h-3.5 text-accent" />
                      <span>Share Result</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyResult}
                      className="flex-1 py-2 px-3 rounded-xl border border-border bg-card hover:bg-bg-sec text-text-h text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                      title="Copy result and formula"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Summary</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Column 3: Right Sidebar with Popular Conversions & Tips (Desktop / Tablet Only) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4" aria-label="Popular Conversions">
            <div className="rounded-2xl bg-card border border-border p-4 shadow-subtle space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center text-xs">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-h">
                  Popular Conversions
                </h3>
              </div>

              <div className="space-y-1.5 text-xs">
                {[
                  { id: 'cgpa-to-percentage', name: 'CGPA to Percentage' },
                  { id: 'percentage-to-cgpa', name: 'Percentage to CGPA' },
                  { id: 'gpa-to-cgpa', name: 'GPA to CGPA' },
                  { id: 'cgpa-to-gpa', name: 'CGPA to GPA' },
                  { id: 'marks-to-percentage', name: 'Marks to Percentage' },
                  { id: 'percentage-to-marks', name: 'Percentage to Marks' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveConvKey(item.id)}
                    className="w-full p-2 rounded-xl hover:bg-bg-sec flex items-center justify-between text-left group transition-all"
                  >
                    <span className="font-semibold text-text-h group-hover:text-accent truncate">{item.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-text-light group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-4 shadow-subtle text-left space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center text-xs">
                  <Lightbulb className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-h">Conversion Tips</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-text-m">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brandGreen mt-0.5 shrink-0" />
                  <span>Choose the correct university for exact CBCS scaling factors.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brandGreen mt-0.5 shrink-0" />
                  <span>Some technical universities use direct 10 multipliers, others use subtractive curves.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brandGreen mt-0.5 shrink-0" />
                  <span>Always check your degree transcripts for university conversion formulas.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        {/* Quick Conversion Presets */}
        <section className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle text-left space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-xs sm:text-sm font-bold text-text-h uppercase tracking-wider">
              Quick Conversion Examples
            </h2>
            <Link to="/calculators" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
              <span>View All Calculators</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              onClick={() => handleApplyPreset('percentage-to-cgpa', { input_percentage: 75 })}
              className="p-3.5 rounded-xl border border-border bg-bg-sec hover:border-accent cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-text-h">
                <Percent className="w-4 h-4 text-brandGreen" />
                <span>Percentage to CGPA</span>
              </div>
              <div className="flex items-center justify-between font-mono font-bold text-sm text-text-h pt-1">
                <span>75%</span>
                <ArrowRight className="w-3.5 h-3.5 text-accent group-hover:translate-x-1 transition-transform" />
                <span className="text-accent">7.50</span>
              </div>
              <span className="text-[10px] text-text-light block text-right mt-0.5">(Approx.)</span>
            </div>

            <div
              onClick={() => handleApplyPreset('cgpa-to-percentage', { input_cgpa: 8.0 })}
              className="p-3.5 rounded-xl border border-border bg-bg-sec hover:border-accent cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-text-h">
                <GraduationCap className="w-4 h-4 text-brandBlue" />
                <span>CGPA to Percentage</span>
              </div>
              <div className="flex items-center justify-between font-mono font-bold text-sm text-text-h pt-1">
                <span>8.0</span>
                <ArrowRight className="w-3.5 h-3.5 text-accent group-hover:translate-x-1 transition-transform" />
                <span className="text-accent">80.0%</span>
              </div>
              <span className="text-[10px] text-text-light block text-right mt-0.5">(Approx.)</span>
            </div>

            <div
              onClick={() => handleApplyPreset('gpa-to-cgpa', { input_gpa: 3.5 })}
              className="p-3.5 rounded-xl border border-border bg-bg-sec hover:border-accent cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-text-h">
                <Binary className="w-4 h-4 text-brandPurple" />
                <span>GPA to CGPA</span>
              </div>
              <div className="flex items-center justify-between font-mono font-bold text-sm text-text-h pt-1">
                <span>3.5</span>
                <ArrowRight className="w-3.5 h-3.5 text-accent group-hover:translate-x-1 transition-transform" />
                <span className="text-accent">8.75</span>
              </div>
              <span className="text-[10px] text-text-light block text-right mt-0.5">(Approx.)</span>
            </div>

            <div
              onClick={() => handleApplyPreset('marks-to-percentage', { input_obtained: 850, input_total: 1000 })}
              className="p-3.5 rounded-xl border border-border bg-bg-sec hover:border-accent cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-text-h">
                <FilePen className="w-4 h-4 text-brandAmber" />
                <span>Marks to Percentage</span>
              </div>
              <div className="flex items-center justify-between font-mono font-bold text-sm text-text-h pt-1">
                <span>850 / 1000</span>
                <ArrowRight className="w-3.5 h-3.5 text-accent group-hover:translate-x-1 transition-transform" />
                <span className="text-accent">85.0%</span>
              </div>
              <span className="text-[10px] text-brandGreen block text-right mt-0.5">(Exact)</span>
            </div>
          </div>
        </section>

        {/* Formula Explanations */}
        <section className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle text-left space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center text-sm shadow-subtle shrink-0">
              <Divide className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-text-h leading-tight">Conversion Formulas</h2>
              <p className="text-[11px] text-text-light">Official calculation formulas used across Indian universities.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-bg-sec space-y-2">
              <h3 className="text-xs font-bold text-text-h">Percentage to CGPA</h3>
              <div className="p-3 rounded-lg bg-card border border-border/80 text-center font-mono text-xs font-bold text-text-h">
                CGPA = Percentage ÷ 10
              </div>
              <p className="text-[11px] text-text-m">Example: 75% = 7.50 CGPA (out of 10)</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg-sec space-y-2">
              <h3 className="text-xs font-bold text-text-h">CGPA to Percentage</h3>
              <div className="p-3 rounded-lg bg-card border border-border/80 text-center font-mono text-xs font-bold text-text-h">
                Percentage = CGPA × 10
              </div>
              <p className="text-[11px] text-text-m">Example: 8.0 CGPA = 80.00%</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg-sec space-y-2">
              <h3 className="text-xs font-bold text-text-h">GPA (4.0) to CGPA (10.0)</h3>
              <div className="p-3 rounded-lg bg-card border border-border/80 text-center font-mono text-xs font-bold text-text-h">
                CGPA = (GPA ÷ 4.0) × 10.0
              </div>
              <p className="text-[11px] text-text-m">Example: 3.5 GPA = 8.75 CGPA</p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg-sec space-y-2">
              <h3 className="text-xs font-bold text-text-h">Marks to Percentage</h3>
              <div className="p-3 rounded-lg bg-card border border-border/80 text-center font-mono text-xs font-bold text-text-h">
                Percentage = (Marks ÷ Maximum) × 100
              </div>
              <p className="text-[11px] text-text-m">Example: 850 / 1000 = 85.00%</p>
            </div>
          </div>
        </section>

        {/* Reusable Explore More Tools */}
        <ExploreMoreTools />
      </main>

      {/* Save Modal */}
      <SaveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        calculationData={pendingCalc}
        onSaveSuccess={(saved) => {
          if (saved) {
            dispatch(saveCalculationToHistory(saved));
          }
        }}
      />

      {/* Mobile Result Modal */}
      {conversionResult && (
        <MobileResultModal
          isOpen={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          title={activeSpec.name.toUpperCase()}
          score={conversionResult.outputNum}
          maxScale={activeSpec.targetScaleText}
          standing={{
            icon: '🔄',
            text: `${activeSpec.targetLabel}: ${conversionResult.outputDisplay}`,
            narrative: `Converted ${conversionResult.inputDisplay} to ${conversionResult.outputDisplay} using ${university.toUpperCase()} standard formula.`
          }}
          metrics={[
            { label: `Input ${activeSpec.sourceType.toUpperCase()}`, value: conversionResult.inputDisplay },
            { label: `Converted ${activeSpec.targetLabel}`, value: conversionResult.outputDisplay },
            { label: 'Grading System', value: gradingScale },
            { label: 'Formula Used', value: conversionResult.formulaEq },
            { label: 'University', value: university.toUpperCase() }
          ]}
          metadata={{
            university: university.toUpperCase(),
            conversionType: activeSpec.name,
            sourceType: activeSpec.sourceType.toUpperCase(),
            targetLabel: activeSpec.targetLabel,
            calculationMethod: 'Equivalence Standard Formula',
            gradingSystem: gradingScale
          }}
          calculationMethod={conversionResult.formulaEq}
          onSave={handleSaveResult}
          onDownloadPdf={handleDownloadPdf}
          onShareResult={handleShareResult}
          isGeneratingPdf={isGeneratingPdf}
          isSharing={isSharing}
        />
      )}
    </>
  );
}
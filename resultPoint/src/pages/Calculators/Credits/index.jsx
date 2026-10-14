import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  ChevronDown,
  Info,
  PlusCircle,
  RotateCcw,
  Layers,
  ArrowRight,
  Trash2,
  History,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import CalculatorDirectorySidebar from '../CalculatorDirectorySidebar';
import ExploreMoreTools from '../ExploreMoreTools';
import ResultGaugeCard from '../ResultGaugeCard';
import CalculatorPageHeader from '../CalculatorPageHeader';
import SaveModal from '../CGPA/components/SaveModal';
import { useToast } from '../../../context/ToastContext';

const DEFAULT_SUBJECTS = [
  { id: '1', name: 'Mathematics - I', credits: 4, category: 'Core' },
  { id: '2', name: 'Engineering Physics', credits: 4, category: 'Core' },
  { id: '3', name: 'Programming for Problem Solving', credits: 3, category: 'Core' },
  { id: '4', name: 'Engineering Graphics', credits: 3, category: 'Core' },
  { id: '5', name: 'Environmental Science', credits: 2, category: 'Elective' },
  { id: '6', name: 'Human Values and Ethics', credits: 1, category: 'Audit' }
];

const CATEGORIES = ['Core', 'Elective', 'Audit', 'Project', 'Seminar', 'Practical'];

const CREDIT_REFERENCE_TABLE = [
  { category: 'Core Subjects', range: '3 – 4', desc: 'Mandatory subjects for your course' },
  { category: 'Elective Subjects', range: '2 – 4', desc: 'Optional subjects based on your interest' },
  { category: 'Audit Subjects', range: '1 – 2', desc: 'Non-credit or low-credit subjects' },
  { category: 'Project / Seminar', range: '2 – 4', desc: 'Project work, seminars or internships' },
  { category: 'Total (Per Semester)', range: '16 – 24', desc: 'Typical credit range per semester', isHighlight: true }
];

export default function CreditsCalculator() {
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [university, setUniversity] = useState('jntuh');
  const [regulation, setRegulation] = useState('r18');
  const [course, setCourse] = useState('btech-cse');
  const [semester, setSemester] = useState('sem1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationError, setValidationError] = useState('');

  const { showToast } = useToast();

  const handleAddSubject = () => {
    if (subjects.length >= 20) return;
    setSubjects((prev) => [
      ...prev,
      { id: String(Date.now()), name: `Subject ${prev.length + 1}`, credits: 3, category: 'Core' }
    ]);
    showToast(`Added Subject ${subjects.length + 1}`);
  };

  const handleRemoveSubject = (id) => {
    if (subjects.length <= 1) {
      setValidationError('At least one subject is required to calculate credits.');
      setTimeout(() => setValidationError(''), 2800);
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    showToast('Subject deleted');
  };

  const handleSubjectChange = (id, field, value) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (field === 'credits') {
          const parsed = parseFloat(value);
          const num = isNaN(parsed) || parsed < 0 ? 0 : parsed;
          return { ...s, credits: num };
        }
        return { ...s, [field]: value };
      })
    );
  };

  const handleReset = () => {
    setSubjects(DEFAULT_SUBJECTS);
    setValidationError('');
    showToast('Form reset to default 6 subjects (17 Credits)');
  };

  // Calculations
  const metrics = useMemo(() => {
    let totalCredits = 0;
    let coreCredits = 0;
    let electiveCredits = 0;
    let auditCredits = 0;

    subjects.forEach((s) => {
      const cr = parseFloat(s.credits) || 0;
      totalCredits += cr;
      if (s.category === 'Core') coreCredits += cr;
      else if (s.category === 'Elective') electiveCredits += cr;
      else if (s.category === 'Audit') auditCredits += cr;
    });

    const formattedTotal = Number.isInteger(totalCredits) ? totalCredits : totalCredits.toFixed(1);
    const formattedCore = Number.isInteger(coreCredits) ? coreCredits : coreCredits.toFixed(1);
    const formattedElective = Number.isInteger(electiveCredits) ? electiveCredits : electiveCredits.toFixed(1);
    const formattedAudit = Number.isInteger(auditCredits) ? auditCredits : auditCredits.toFixed(1);

    return {
      totalSubjects: subjects.length,
      totalCredits: formattedTotal,
      numericTotal: totalCredits,
      coreCredits: formattedCore,
      electiveCredits: formattedElective,
      auditCredits: formattedAudit
    };
  }, [subjects]);

  // Standing Status
  const standing = useMemo(() => {
    const total = metrics.numericTotal;
    if (total >= 16 && total <= 24) {
      return { icon: '📈', text: 'On Track', narrative: 'You are on the right path! Keep maintaining your academic plan.', tips: 'Plan your credits according to your university guidelines.' };
    }
    if (total > 24) {
      return { icon: '⚡', text: 'Heavy Credit Load', narrative: 'You are taking an accelerated credit load this semester. Ensure balanced study time.', tips: 'Maintain a manageable weekly study schedule across high-credit subjects.' };
    }
    if (total >= 10) {
      return { icon: '⚠️', text: 'Needs Attention', narrative: 'Total credits are slightly below the typical semester range of 16–24 credits.', tips: 'Verify if elective or lab courses are pending registration.' };
    }
    return { icon: '⚠️', text: 'Low Credits', narrative: 'Your current credit count is low. Consider consulting your academic advisor.', tips: 'Check degree audit requirements to prevent semester delays.' };
  }, [metrics.numericTotal]);

  const resultCardsData = [
    { label: 'Total Subjects', value: metrics.totalSubjects },
    { label: 'Total Credits', value: metrics.totalCredits, highlight: true },
    { label: 'Core Credits', value: metrics.coreCredits },
    { label: 'Elective Credits', value: metrics.electiveCredits },
    { label: 'Audit Credits', value: metrics.auditCredits }
  ];

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
            <li className="font-bold text-text-h" aria-current="page">Credits Calculator</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full space-y-4">
        {/* Header Cards */}
        <CalculatorPageHeader
          title="Credits Calculator"
          description="Calculate your total credits based on subjects and their credit values"
          icon={Layers}
          methodTitle="CALCULATION METHOD"
          methodSubtitle="Total Credits = Sum of all Subject Credits"
        />

        {/* 3-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Reusable Left Sidebar (Highlights credits) */}
          <CalculatorDirectorySidebar activeTool="credits" />

          {/* Center Column: Form & Reference */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-3.5">
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle">
              {/* Selectors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3.5 border-b border-border/80">
                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Select University</label>
                  <div className="relative">
                    <select
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
                    >
                      <option value="jntuh">JNTU Hyderabad</option>
                      <option value="anna">Anna University</option>
                      <option value="osmania">Osmania University</option>
                      <option value="generic">Standard 10-Point Scale</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Select Regulation</label>
                  <div className="relative">
                    <select
                      value={regulation}
                      onChange={(e) => setRegulation(e.target.value)}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
                    >
                      <option value="r18">R18</option>
                      <option value="r22">R22</option>
                      <option value="r16">R16</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Select Course (Optional)</label>
                  <div className="relative">
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
                    >
                      <option value="btech-cse">B.Tech - Computer Science</option>
                      <option value="btech-ece">B.Tech - Electronics & Comm</option>
                      <option value="btech-it">B.Tech - Information Tech</option>
                      <option value="btech-mech">B.Tech - Mechanical Engg</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-h mb-1">Select Semester (Optional)</label>
                  <div className="relative">
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="calc-input w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer appearance-none pr-8"
                    >
                      <option value="sem1">Semester 1</option>
                      <option value="sem2">Semester 2</option>
                      <option value="sem3">Semester 3</option>
                      <option value="sem4">Semester 4</option>
                      <option value="sem5">Semester 5</option>
                      <option value="sem6">Semester 6</option>
                      <option value="sem7">Semester 7</option>
                      <option value="sem8">Semester 8</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-text-light" />
                  </div>
                </div>
              </div>

              {/* Information Banner */}
              <div className="my-3.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5 text-xs text-brandBlue">
                <Info className="w-4 h-4 text-brandBlue shrink-0" />
                <span>Enter your subjects and credit values to calculate your total credits.</span>
              </div>

              <div className="flex items-center justify-between pb-1">
                <h3 className="text-sm font-bold text-text-h">Enter Subject Credits</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-bg-sec border border-border text-text-m">
                  {subjects.length} Subjects
                </span>
              </div>

              {/* Subject Rows Table */}
              <div className="space-y-2 mt-2">
                <div className="hidden sm:grid sm:grid-cols-12 gap-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-text-light px-2 border-b border-border/50">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-6">SUBJECT NAME</div>
                  <div className="col-span-2 text-center">CREDITS</div>
                  <div className="col-span-2 text-center">CATEGORY</div>
                  <div className="col-span-1 text-center">ACTION</div>
                </div>

                {subjects.map((sub, idx) => (
                  <div key={sub.id} className="p-2.5 rounded-xl border border-border bg-card hover:border-accent/40 transition-colors">
                    {/* Desktop View */}
                    <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center">
                      <div className="col-span-1 text-center font-bold text-xs text-text-light">{idx + 1}</div>
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => handleSubjectChange(sub.id, 'name', e.target.value)}
                          placeholder="e.g. Subject Name"
                          className="calc-input w-full px-2.5 py-1.5 rounded-lg text-xs font-medium"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={sub.credits}
                          onChange={(e) => handleSubjectChange(sub.id, 'credits', e.target.value)}
                          className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <select
                            value={sub.category}
                            onChange={(e) => handleSubjectChange(sub.id, 'category', e.target.value)}
                            className="calc-input w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer appearance-none pr-7"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2 pointer-events-none text-text-light" />
                        </div>
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(sub.id)}
                          className="w-7 h-7 rounded-lg text-brandPink hover:bg-brandPink/10 transition-colors inline-flex items-center justify-center"
                          aria-label={`Delete subject ${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile Card */}
                    <div className="sm:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-h">#{idx + 1} Subject</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(sub.id)}
                          className="text-xs font-semibold text-brandPink flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => handleSubjectChange(sub.id, 'name', e.target.value)}
                        placeholder="Subject Name"
                        className="calc-input w-full px-2.5 py-1.5 rounded-lg text-xs"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-text-light font-semibold block mb-0.5">Credits</label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={sub.credits}
                            onChange={(e) => handleSubjectChange(sub.id, 'credits', e.target.value)}
                            className="calc-input w-full px-2 py-1.5 text-center rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-light font-semibold block mb-0.5">Category</label>
                          <select
                            value={sub.category}
                            onChange={(e) => handleSubjectChange(sub.id, 'category', e.target.value)}
                            className="calc-input w-full px-2 py-1.5 rounded-lg text-xs font-semibold"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Subject Row */}
              <div className="mt-3.5">
                <button
                  type="button"
                  onClick={handleAddSubject}
                  disabled={subjects.length >= 20}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-accent/70 bg-accent-soft/40 hover:bg-accent-soft text-xs font-bold text-accent transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Another Subject</span>
                </button>
                {validationError && (
                  <p className="text-[11px] text-brandPink mt-1.5 text-center font-medium">{validationError}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-bg-sec text-xs font-semibold text-text-m hover:text-text-h transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-accent transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Calculate & Save</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Reference Table: Credit Distribution Guidelines */}
            <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-border/70">
                <div>
                  <h3 className="text-sm font-bold text-text-h">Credit Category Reference ({regulation.toUpperCase()})</h3>
                  <p className="text-[11px] text-text-m mt-0.5">Common credit distribution for {university.toUpperCase()} ({regulation.toUpperCase()} Regulation)</p>
                </div>
                <span className="text-xs font-semibold text-text-m px-2.5 py-1 rounded-lg bg-bg-sec border border-border shrink-0 self-start sm:self-auto">
                  Guidelines
                </span>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-text-light border-b border-border/60">
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center sm:text-left">Typical Credit Range</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 font-medium">
                    {CREDIT_REFERENCE_TABLE.map((row) => (
                      <tr
                        key={row.category}
                        className={`transition-colors hover:bg-bg-sec/50 ${
                          row.isHighlight ? 'bg-orange-500/10 font-bold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold text-text-h">{row.category}</td>
                        <td className="py-2.5 px-3 text-center sm:text-left font-bold text-accent">{row.range}</td>
                        <td className="py-2.5 px-3 text-text-m">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2.5 text-[10.5px] text-text-m italic">
                Note: Credit distribution may vary based on your university curriculum and regulation.
              </p>
            </div>
          </div>

          {/* Right Column: Result Gauge & History */}
          <aside className="lg:col-span-3 xl:col-span-3 space-y-3.5 lg:sticky lg:top-20" aria-label="Credits Evaluation Results">
            <ResultGaugeCard
              score={metrics.numericTotal}
              maxScale={24}
              title="YOUR CREDITS RESULT"
              metrics={resultCardsData}
              standing={standing}
              onSave={() => setIsModalOpen(true)}
            />

            {/* Semester Credit History */}
            <div className="rounded-2xl bg-card border border-border p-3.5 shadow-subtle">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <History className="w-4 h-4 text-accent" />
                  <h4 className="text-xs font-bold text-text-h uppercase tracking-wider">RECENT CALCULATIONS</h4>
                </div>
                <button type="button" className="text-[10.5px] font-semibold text-accent hover:underline">View All</button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-h block text-xs">Semester 1</span>
                    <span className="text-[10px] text-text-m">{subjects.length} Subjects</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-accent block text-xs">{metrics.totalCredits} Credits</span>
                    <span className="text-[10px] text-text-light">Current session</span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-h block text-xs">Semester 2</span>
                    <span className="text-[10px] text-text-m">7 Subjects</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-accent block text-xs">20 Credits</span>
                    <span className="text-[10px] text-text-light">1 day ago</span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-h block text-xs">Semester 3</span>
                    <span className="text-[10px] text-text-m">6 Subjects</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-accent block text-xs">18 Credits</span>
                    <span className="text-[10px] text-text-light">3 days ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tip Card */}
            <div className="rounded-2xl bg-card border border-border p-3 shadow-subtle flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-accent flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-text-h block">Tips for Better Planning</span>
                <p className="text-[11px] text-text-m mt-0.5 leading-snug">
                  Plan your credits according to your university guidelines to stay on track.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-accent-soft/60 border border-accent/20 p-3 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center shrink-0 shadow-subtle">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-text-h block">Stay Consistent</span>
                <p className="text-[11px] text-text-m mt-0.5 leading-snug">
                  Complete your credits on time to avoid academic backlogs.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Dynamic Subject-wise Credit Distribution Chart */}
        <section className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-3" aria-label="Subject-wise Credit Distribution Chart">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-text-h">Subject-wise Credit Distribution</h3>
              <p className="text-[11px] text-text-m mt-0.5">Visual representation of credit allocation across subjects</p>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="min-w-[650px] pt-2">
              <svg className="w-full h-52 overflow-visible" viewBox="0 0 760 190">
                <line x1="35" y1="20" x2="740" y2="20" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="24" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">5</text>
                <line x1="35" y1="55" x2="740" y2="55" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="59" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">4</text>
                <line x1="35" y1="90" x2="740" y2="90" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="94" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">3</text>
                <line x1="35" y1="125" x2="740" y2="125" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="129" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">2</text>
                <line x1="35" y1="160" x2="740" y2="160" stroke="currentColor" className="text-border" strokeWidth="1.2" />
                <text x="20" y="164" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">0</text>

                <g>
                  {subjects.map((sub, i) => {
                    const cr = parseFloat(sub.credits) || 0;
                    const maxScale = 5;
                    const barHeight = (cr / maxScale) * 140;
                    const slotWidth = 690 / subjects.length;
                    const barWidth = Math.min(48, slotWidth * 0.6);
                    const x = 50 + i * slotWidth + (slotWidth - barWidth) / 2;
                    const y = 160 - Math.min(140, barHeight);

                    return (
                      <g key={sub.id}>
                        <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" className="text-text-h">
                          {cr}
                        </text>
                        <rect x={x} y={y} width={barWidth} height={Math.max(2, barHeight)} rx="5" fill="#FF7300" className="transition-all duration-300" />
                        <text x={x + barWidth / 2} y={178} textAnchor="middle" fontSize="9.5" fill="currentColor" className="text-text-m">
                          {sub.name.length > 15 ? `${sub.name.substring(0, 13)}...` : sub.name}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          </div>
        </section>

        {/* Reusable Bottom Explore Tools */}
        <ExploreMoreTools />
      </main>

      <SaveModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
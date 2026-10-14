import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight, GraduationCap } from 'lucide-react';
import CalculatorDirectorySidebar from '../CalculatorDirectorySidebar';
import ExploreMoreTools from '../ExploreMoreTools';
import ResultGaugeCard from '../ResultGaugeCard';
import CalculatorPageHeader from '../CalculatorPageHeader';
import SubjectFormTable from '../SubjectFormTable';
import SaveModal from '../CGPA/components/SaveModal';
import { useToast } from '../../../context/ToastContext';

const GRADE_POINTS_MAP = {
  S: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  D: 4,
  F: 0,
};

const DEFAULT_SUBJECTS = [
  { id: '1', name: 'Operating Systems', credits: 4, grade: 'A' },
  { id: '2', name: 'Database Management Systems', credits: 4, grade: 'A+' },
  { id: '3', name: 'Computer Networks', credits: 3, grade: 'B+' },
  { id: '4', name: 'Software Engineering', credits: 3, grade: 'A' },
  { id: '5', name: 'Web Technologies', credits: 3, grade: 'B' },
  { id: '6', name: 'Design and Analysis of Algorithms', credits: 4, grade: 'A' },
];

export default function SGPACalculator() {
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [university, setUniversity] = useState('jntuh');
  const [course, setCourse] = useState('btech-cse');
  const [regulation, setRegulation] = useState('r18');
  const [gradeSystem, setGradeSystem] = useState('10-point');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationError, setValidationError] = useState('');

  const { showToast } = useToast();

  const handleAddSubject = () => {
    if (subjects.length >= 12) return;
    setSubjects((prev) => [
      ...prev,
      { id: String(Date.now()), name: `Subject ${prev.length + 1}`, credits: 3, grade: 'A' },
    ]);
    showToast(`Subject ${subjects.length + 1} added`);
  };

  const handleRemoveSubject = (id) => {
    if (subjects.length <= 1) {
      setValidationError('At least one subject is required for SGPA calculation.');
      setTimeout(() => setValidationError(''), 2800);
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    showToast('Subject removed');
  };

  const handleSubjectChange = (id, field, value) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleReset = () => {
    setSubjects(DEFAULT_SUBJECTS);
    showToast('Form reset to default subjects');
  };

  // Live Metrics Calculation
  const metrics = useMemo(() => {
    let totalCredits = 0;
    let totalPoints = 0;

    subjects.forEach((s) => {
      const cr = parseFloat(s.credits) || 0;
      const pts = GRADE_POINTS_MAP[s.grade] ?? 0;
      totalCredits += cr;
      totalPoints += cr * pts;
    });

    const sgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    const percentage = sgpa * 10;

    let letterGrade = 'F';
    if (sgpa >= 9.0) letterGrade = 'A+';
    else if (sgpa >= 8.0) letterGrade = 'A';
    else if (sgpa >= 7.0) letterGrade = 'B+';
    else if (sgpa >= 6.0) letterGrade = 'B';
    else if (sgpa >= 5.0) letterGrade = 'C';
    else if (sgpa >= 4.0) letterGrade = 'D';

    return { totalCredits, totalPoints, sgpa, percentage, letterGrade };
  }, [subjects]);

  // Standing & Recommendations
  const standing = useMemo(() => {
    if (metrics.sgpa >= 9.0) {
      return {
        icon: '🏆',
        text: 'Excellent Performance',
        narrative: "Outstanding work! You've achieved mastery this semester.",
        tips: 'Keep up the remarkable rhythm and consider pursuing honors or advanced capstones.',
      };
    }
    if (metrics.sgpa >= 8.0) {
      return {
        icon: '📊',
        text: 'Good Performance',
        narrative: "Great! You're performing well. Keep up the good work!",
        tips: 'Focus on difficult subjects, manage your time and practice regularly.',
      };
    }
    if (metrics.sgpa >= 7.0) {
      return {
        icon: '📈',
        text: 'Good Progress',
        narrative: 'Steady progress! Pushing higher in core courses will lift your graduation honors.',
        tips: 'Dedicate extra revision sessions to practical and laboratory submissions.',
      };
    }
    if (metrics.sgpa >= 6.0) {
      return {
        icon: '⚖️',
        text: 'Average Performance',
        narrative: 'Consistent effort in upcoming semesters will bring your cumulative standing higher.',
        tips: 'Form collaborative study groups and consult professors on difficult concepts.',
      };
    }
    return {
      icon: '⚠️',
      text: 'Needs Improvement',
      narrative: 'Revisit foundational topics and clarify doubts before end-term evaluations.',
      tips: 'Prioritize high-credit subjects and address pending backlogs early.',
    };
  }, [metrics.sgpa]);

  const resultCardsData = [
    { label: 'Total Credits', value: metrics.totalCredits },
    { label: 'Total Grade Points', value: Math.round(metrics.totalPoints) },
    { label: 'SGPA', value: metrics.sgpa.toFixed(2), highlight: true },
    { label: 'Percentage Equivalent', value: `${metrics.percentage.toFixed(2)}%` },
    { label: 'Letter Grade', value: metrics.letterGrade },
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
            <li className="font-bold text-text-h" aria-current="page">SGPA Calculator</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full space-y-4">
        {/* Reusable Header */}
        <CalculatorPageHeader
          title="SGPA Calculator"
          description="Calculate your Semester Grade Point Average based on subject credits and grades"
          icon={GraduationCap}
          methodTitle="CALCULATION METHOD"
          methodSubtitle="Weighted Average (Credit Based)"
        />

        {/* 3-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Reusable Left Sidebar (Highlights SGPA) */}
          <CalculatorDirectorySidebar activeTool="sgpa" />

          {/* Reusable Subject Form Table */}
          <SubjectFormTable
            university={university}
            setUniversity={setUniversity}
            course={course}
            setCourse={setCourse}
            regulation={regulation}
            setRegulation={setRegulation}
            gradeSystem={gradeSystem}
            setGradeSystem={setGradeSystem}
            subjects={subjects}
            onAddSubject={handleAddSubject}
            onRemoveSubject={handleRemoveSubject}
            onSubjectChange={handleSubjectChange}
            onReset={handleReset}
            onSubmit={() => setIsModalOpen(true)}
            gradePointsMap={GRADE_POINTS_MAP}
            regulationName={regulation.toUpperCase()}
            validationError={validationError}
            infoBannerText="Enter your subjects, credits and grades for the selected semester to calculate your SGPA."
            actionButtonText="Calculate SGPA"
          />

          {/* Reusable Result Gauge Card */}
          <ResultGaugeCard
            score={metrics.sgpa}
            maxScale={10}
            title="YOUR SGPA RESULT"
            metrics={resultCardsData}
            standing={standing}
            onSave={() => setIsModalOpen(true)}
          />
        </div>

        {/* Dynamic Semester Bar Chart */}
        <section className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-subtle space-y-4" aria-label="Semester Performance Visualization">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-text-h">Your Semester Performance</h3>
              <p className="text-xs text-text-m mt-0.5">Track your subject-wise performance in this semester.</p>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="min-w-[650px] pt-2">
              <svg className="w-full h-52 overflow-visible" viewBox="0 0 760 190">
                <line x1="35" y1="20" x2="740" y2="20" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="24" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">10</text>
                <line x1="35" y1="50" x2="740" y2="50" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="54" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">8</text>
                <line x1="35" y1="80" x2="740" y2="80" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="84" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">6</text>
                <line x1="35" y1="110" x2="740" y2="110" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="114" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">4</text>
                <line x1="35" y1="140" x2="740" y2="140" stroke="currentColor" strokeDasharray="3,3" className="text-border" strokeWidth="0.8" />
                <text x="20" y="144" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">2</text>
                <line x1="35" y1="160" x2="740" y2="160" stroke="currentColor" className="text-border" strokeWidth="1.2" />
                <text x="20" y="164" fontSize="9.5" fill="currentColor" className="text-text-light font-medium">0</text>

                <g>
                  {subjects.map((sub, i) => {
                    const pts = GRADE_POINTS_MAP[sub.grade] ?? 0;
                    const barHeight = (pts / 10) * 140;
                    const slotWidth = 690 / subjects.length;
                    const barWidth = Math.min(50, slotWidth * 0.62);
                    const x = 50 + i * slotWidth + (slotWidth - barWidth) / 2;
                    const y = 160 - barHeight;

                    return (
                      <g key={sub.id}>
                        <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" className="text-text-h">
                          {pts}
                        </text>
                        <rect x={x} y={y} width={barWidth} height={Math.max(2, barHeight)} rx="5" fill="#FF7300" className="transition-all duration-300" />
                        <text x={x + barWidth / 2} y={178} textAnchor="middle" fontSize="9.5" fill="currentColor" className="text-text-m">
                          {sub.name.length > 14 ? `${sub.name.substring(0, 12)}...` : sub.name}
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
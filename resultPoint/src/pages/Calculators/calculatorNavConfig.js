import {
  Calculator,
  Table,
  Binary,
  Percent,
  FileCheck,
  Award,
  Layers,
  Target,
  AlertTriangle,
  PieChart,
} from 'lucide-react';

export const CALCULATOR_CATEGORIES = [
  {
    category: 'Academic Performance',
    items: [
      { key: 'cgpa', name: 'CGPA Calculator', path: '/calculators/cgpa', icon: Calculator, color: 'text-accent' },
      { key: 'sgpa', name: 'SGPA Calculator', path: '/calculators/sgpa', icon: Table, color: 'text-brandGreen' },
      { key: 'gpa', name: 'GPA Calculator', path: '/calculators/gpa', icon: Binary, color: 'text-brandBlue' },
      { key: 'percentage', name: 'Percentage Calculator', path: '/calculators/percentage', icon: Percent, color: 'text-brandPink' },
    ],
  },
  {
    category: 'Grade & Marks',
    items: [
      { key: 'grade', name: 'Grade Calculator', path: '/calculators/grade', icon: FileCheck, color: 'text-brandPurple' },
      { key: 'marks-grade', name: 'Marks Convert', path: '/calculators/marks-convert', icon: Award, color: 'text-brandCyan' },
      { key: 'credits', name: 'Credits Calculator', path: '/calculators/credit-calculate', icon: Layers, color: 'text-brandBlue' },
    ],
  },
  {
    category: 'Academic Planning',
    items: [
      { key: 'target-cgpa', name: 'Target CGPA', path: '/calculators/target-cgpa', icon: Target, color: 'text-accent' },
      { key: 'backlog', name: 'Backlog Calculator', path: '/calculators/backlog', icon: AlertTriangle, color: 'text-brandAmber' },
    ],
  },
  {
    category: 'Analysis',
    items: [
      { key: 'result-analysis', name: 'Result Analyzer', path: '/calculators/result-analysis', icon: PieChart, color: 'text-brandPink' },
    ],
  },
];

export const ALL_CALCULATORS = CALCULATOR_CATEGORIES.flatMap((c) => c.items);

export const getCalculatorByKey = (key) => {
  return ALL_CALCULATORS.find((c) => c.key === key) || ALL_CALCULATORS[0];
};

export const getCalculatorByPath = (pathname) => {
  return ALL_CALCULATORS.find((c) => pathname.startsWith(c.path)) || ALL_CALCULATORS[0];
};

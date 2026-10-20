/**
 * ResultPoint Admin Dashboard Service
 * Centralized data source for admin overview metrics, usage analytics,
 * popular tools, user activity, and system health status.
 * Structured for future Spring Boot REST API integration.
 */

export const ADMIN_STATS = {
  totalStudents: {
    value: '12,486',
    growth: '+12%',
    subtitle: '+1,340 this month',
    trend: 'up'
  },
  universities: {
    value: '28',
    growth: '+7%',
    subtitle: '+2 this month',
    trend: 'up'
  },
  courses: {
    value: '146',
    growth: '+5%',
    subtitle: '+8 this month',
    trend: 'up'
  },
  calculations: {
    value: '1,24,560',
    growth: '+28%',
    subtitle: '+27,430 this month',
    trend: 'up'
  },
  activeUsers: {
    value: '3,892',
    growth: '+18%',
    subtitle: 'in last 30 days',
    trend: 'up'
  },
  supportQueries: {
    value: '34',
    growth: '-15%',
    subtitle: 'open: 12 • resolved: 22',
    trend: 'down'
  }
};

export const POPULAR_TOOLS = [
  {
    rank: 1,
    id: 'cgpa-calc',
    name: 'CGPA Calculator',
    path: '/calculators/cgpa',
    usage: '28,430',
    numericUsage: 28430,
    growth: '+32%',
    barColor: 'from-orange-500 to-amber-400',
    barPercent: 100
  },
  {
    rank: 2,
    id: 'sgpa-calc',
    name: 'SGPA Calculator',
    path: '/calculators/sgpa',
    usage: '18,920',
    numericUsage: 18920,
    growth: '+24%',
    barColor: 'from-sky-500 to-cyan-400',
    barPercent: 66
  },
  {
    rank: 3,
    id: 'percentage-to-cgpa',
    name: 'Percentage to CGPA',
    path: '/calculators/marks-convert',
    usage: '15,640',
    numericUsage: 15640,
    growth: '+18%',
    barColor: 'from-emerald-500 to-teal-400',
    barPercent: 55
  },
  {
    rank: 4,
    id: 'cgpa-to-percentage',
    name: 'CGPA to Percentage',
    path: '/calculators/percentage',
    usage: '12,380',
    numericUsage: 12380,
    growth: '+20%',
    barColor: 'from-purple-500 to-indigo-400',
    barPercent: 43
  },
  {
    rank: 5,
    id: 'target-cgpa',
    name: 'Target CGPA Calculator',
    path: '/calculators/target-cgpa',
    usage: '9,420',
    numericUsage: 9420,
    growth: '+28%',
    barColor: 'from-pink-500 to-rose-400',
    barPercent: 33
  }
];

export const RECENT_USERS = [
  {
    id: 1,
    name: 'Ayesha Khan',
    email: 'ayesha@example.com',
    university: 'Osmania University',
    joinDate: '06 Oct 2026',
    status: 'Active',
    avatarBg: 'bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400'
  },
  {
    id: 2,
    name: 'Rahul Verma',
    email: 'rahul@example.com',
    university: 'JNTU Hyderabad',
    joinDate: '05 Oct 2026',
    status: 'Active',
    avatarBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
  },
  {
    id: 3,
    name: 'Sana Fatima',
    email: 'sana@example.com',
    university: 'Anna University',
    joinDate: '05 Oct 2026',
    status: 'Active',
    avatarBg: 'bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400'
  },
  {
    id: 4,
    name: 'Kiran Reddy',
    email: 'kiran@example.com',
    university: 'Andhra University',
    joinDate: '04 Oct 2026',
    status: 'Inactive',
    avatarBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
  },
  {
    id: 5,
    name: 'Mohd Arman',
    email: 'arman@example.com',
    university: 'JNTU Kakinada',
    joinDate: '04 Oct 2026',
    status: 'Active',
    avatarBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
  }
];

export const RECENT_ACTIVITIES = [
  {
    id: 1,
    type: 'registration',
    title: 'New student registered',
    detail: 'Ayesha Khan joined the platform.',
    time: '10 min ago',
    iconColor: 'bg-emerald-500'
  },
  {
    id: 2,
    type: 'calculation',
    title: 'New calculation performed',
    detail: 'CGPA calculation from Osmania University.',
    time: '25 min ago',
    iconColor: 'bg-orange-500'
  },
  {
    id: 3,
    type: 'university',
    title: 'University added',
    detail: 'New university "Kakatiya University" added.',
    time: '1 hour ago',
    iconColor: 'bg-blue-500'
  },
  {
    id: 4,
    type: 'rule',
    title: 'Grade rule updated',
    detail: 'AP Grading System updated.',
    time: '3 hours ago',
    iconColor: 'bg-purple-500'
  },
  {
    id: 5,
    type: 'support',
    title: 'New support query',
    detail: 'Subject calculation issue reported.',
    time: '4 hours ago',
    iconColor: 'bg-indigo-500'
  },
  {
    id: 6,
    type: 'blog',
    title: 'New blog post published',
    detail: '"How to Improve Your CGPA" published.',
    time: '6 hours ago',
    iconColor: 'bg-amber-500'
  }
];

export const SYSTEM_METRICS = {
  activeTools: {
    current: 12,
    total: 15,
    percentage: 80,
    label: 'Active Tools'
  },
  universitiesData: {
    percentage: 100,
    label: 'Universities Data'
  },
  uptime: {
    value: '99.9%',
    label: 'Uptime',
    percentage: 99.9
  },
  totalStorage: {
    used: '2.4 GB',
    total: '10 GB',
    percentage: 24,
    label: 'Total Storage'
  }
};

export const USAGE_CHART_SERIES = {
  'Last 30 Days': {
    labels: ['Sep 06', 'Sep 10', 'Sep 14', 'Sep 18', 'Sep 22', 'Sep 26', 'Sep 30', 'Oct 04', 'Oct 06'],
    calculations: [1.0, 1.3, 1.8, 2.2, 2.8, 3.4, 3.8, 4.4, 4.3], // in thousands (K)
    activeUsers: [0.7, 0.9, 1.1, 1.4, 1.6, 1.9, 2.1, 2.4, 2.6],
    newRegistrations: [0.5, 0.6, 0.7, 0.9, 0.9, 1.1, 1.3, 1.4, 1.4]
  },
  'Last 7 Days': {
    labels: ['Sep 30', 'Oct 01', 'Oct 02', 'Oct 03', 'Oct 04', 'Oct 05', 'Oct 06'],
    calculations: [3.2, 3.5, 3.8, 4.1, 4.4, 4.5, 4.3],
    activeUsers: [1.8, 2.0, 2.1, 2.3, 2.4, 2.5, 2.6],
    newRegistrations: [1.0, 1.1, 1.2, 1.3, 1.4, 1.3, 1.4]
  },
  'Last 3 Months': {
    labels: ['Aug 01', 'Aug 15', 'Sep 01', 'Sep 15', 'Oct 01', 'Oct 06'],
    calculations: [0.8, 1.5, 2.3, 3.2, 4.0, 4.3],
    activeUsers: [0.5, 0.9, 1.3, 1.8, 2.3, 2.6],
    newRegistrations: [0.3, 0.6, 0.8, 1.1, 1.3, 1.4]
  },
  'Last 1 Year': {
    labels: ['Nov', 'Jan', 'Mar', 'May', 'Jul', 'Sep', 'Oct'],
    calculations: [0.4, 0.9, 1.6, 2.4, 3.1, 3.9, 4.3],
    activeUsers: [0.3, 0.6, 1.0, 1.5, 1.9, 2.3, 2.6],
    newRegistrations: [0.2, 0.4, 0.7, 0.9, 1.1, 1.3, 1.4]
  }
};

export const adminDashboardService = {
  getStats() {
    return ADMIN_STATS;
  },
  getPopularTools() {
    return POPULAR_TOOLS;
  },
  getRecentUsers() {
    return RECENT_USERS;
  },
  getRecentActivities() {
    return RECENT_ACTIVITIES;
  },
  getSystemMetrics() {
    return SYSTEM_METRICS;
  },
  getUsageChartData(range = 'Last 30 Days') {
    return USAGE_CHART_SERIES[range] || USAGE_CHART_SERIES['Last 30 Days'];
  }
};

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { useAppDispatch } from './hooks/useAppDispatch';
import { checkAuthSession } from './features/auth/authSlice';

// Public Layout Components
import Header from './components/layout/Header';
import MobileDrawer from './components/layout/MobileDrawer';
import Footer from './components/layout/Footer';
import Toast from './components/ui/Toast';

// Public Pages
import Home from './pages/Home/index';
import CGPACalculators from './pages/Calculators/CGPA';
import ToolsDirectory from './pages/Calculators/Directory';
import GPACalculator from './pages/Calculators/GPA';
import SGPACalculator from './pages/Calculators/SGPA';
import PercentageCalculator from './pages/Calculators/Percentage';
import GradeCalculator from './pages/Calculators/Grade';
import CreditsCalculator from './pages/Calculators/Credits';
import MarksConvert from './pages/Calculators/MarksConvert';
import TargetCGPACalculator from './pages/Calculators/TargetCGPA';
import BacklogCalculator from './pages/Calculators/Backlog';
import ResultAnalysis from './pages/Calculators/ResultAnalysis';
import PlaceholderToolPage from './pages/tools/PlaceholderToolPage';
import SGPAToCGPACalculator from './pages/tools/SGPAToCGPACalculator';
import GPAScaleConverter from './pages/tools/GPAScaleConverter';
import GradePredictor from './pages/tools/GradePredictor';
import AttendanceCalculator from './pages/tools/AttendanceCalculator';
import ResultPdfGenerator from './pages/tools/ResultPdfGenerator';
import CGPAInfoFinder from './pages/tools/CGPAInfoFinder';
import CGPAImprovementGuide from './pages/tools/CGPAImprovementGuide';
import Universities from './pages/Universities';
import UniversityDetails from './pages/Universities/UniversityDetails';
import ResourcesDirectory from './pages/Resources';
import ResourceDetail from './pages/Resources/ResourceDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import LoginSignup from './pages/Auth/LoginSignup';

// Student Dashboard Components & Guard
import ProtectedRoute from './routes/ProtectedRoute';
import StudentLayout from './components/student/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import MyResults from './pages/student/MyResults';
import ResultDetail from './pages/student/ResultDetail';
import AddResult from './pages/student/AddResult';
import AcademicHistory from './pages/student/AcademicHistory';
import AcademicGoals from './pages/student/AcademicGoals';
import PerformanceAnalytics from './pages/student/PerformanceAnalytics';
import BacklogTracker from './pages/student/BacklogTracker';
import CalculationHistory from './pages/student/CalculationHistory';
import AcademicProfile from './pages/student/AcademicProfile';
import AcademicProfileSetup from './pages/student/AcademicProfileSetup';
import EducationRecords from './pages/student/EducationRecords';
import NotificationsPage from './pages/student/NotificationsPage';
import SettingsPage from './pages/student/SettingsPage';

// Admin Academic Configuration & Guards
import AdminRoute from './routes/AdminRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AcademicCatalogManager from './pages/admin/AcademicCatalogManager';
import AdminManagementPage from './pages/admin/AdminManagementPage';
import UsersManager from './pages/admin/UsersManager';
import SupportQueriesManager from './pages/admin/SupportQueriesManager';
import AnnouncementsManager from './pages/admin/AnnouncementsManager';
import ReportsAnalyticsManager from './pages/admin/ReportsAnalyticsManager';
import ToolsManager from './pages/admin/ToolsManager';
import ResourcesManager from './pages/admin/ResourcesManager';
import BlogsManager from './pages/admin/BlogsManager';
import SettingsManager from './pages/admin/SettingsManager';
import BlogPage from './pages/Blog';
import ActiveAnnouncementBanner from './components/common/ActiveAnnouncementBanner';
import CalculatorRouteGuard from './components/common/CalculatorRouteGuard';
import {
  Users,
  Wrench,
  FolderOpen,
  Newspaper,
  Bell,
  BarChart2,
  MessageSquare,
  Settings
} from 'lucide-react';

import PendingCalculationBanner from './components/common/PendingCalculationBanner';

// Public Shell Layout (Includes Public Header, Drawer & Footer)
function PublicLayout({ mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <div className="selection:bg-accent selection:text-white flex flex-col min-h-screen antialiased relative">
      <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <PendingCalculationBanner />
      <div className="max-w-7xl mx-auto w-full px-4 pt-2">
        <ActiveAnnouncementBanner isPublicOnly={true} />
      </div>
      <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="flex-grow">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  const dispatch = useAppDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 1. Deterministic session validation on app startup
    dispatch(checkAuthSession());

    // 2. React to auth session changes (login, logout, expiration, or tab storage events)
    const handleAuthChange = () => {
      dispatch(checkAuthSession());
    };

    window.addEventListener('auth_session_changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth_session_changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [dispatch]);

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Student Dashboard Application Routes (Protected & Dedicated SaaS Layout) */}
            <Route
              path="/student"
              element={
                <ProtectedRoute>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="results" element={<MyResults />} />
              <Route path="my-results" element={<Navigate to="/student/results" replace />} />
              <Route path="results/:resultId" element={<ResultDetail />} />
              <Route path="add-result" element={<AddResult />} />
              <Route path="edit-result/:resultId" element={<AddResult />} />
              <Route path="academic-history" element={<AcademicHistory />} />
              <Route path="analytics" element={<PerformanceAnalytics />} />
              <Route path="goals" element={<AcademicGoals />} />
              <Route path="backlogs" element={<BacklogTracker />} />
              <Route path="calculation-history" element={<CalculationHistory />} />
              <Route path="profile" element={<AcademicProfile />} />
              <Route path="profile-setup" element={<AcademicProfileSetup />} />
              <Route path="education-records" element={<EducationRecords />} />
              <Route path="education" element={<Navigate to="/student/education-records" replace />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Admin Academic Configuration Routes (Role-Aware Protected) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<UsersManager />} />
              <Route path="universities" element={<AcademicCatalogManager initialTab="universities" />} />
              <Route path="courses" element={<AcademicCatalogManager initialTab="courses" />} />
              <Route path="regulations" element={<AcademicCatalogManager initialTab="regulations" />} />
              <Route path="subjects" element={<AcademicCatalogManager initialTab="subjects" />} />
              <Route path="grading-rules" element={<AcademicCatalogManager initialTab="grading" />} />
              <Route path="calculation-rules" element={<AcademicCatalogManager initialTab="calculations" />} />
              <Route path="tools" element={<ToolsManager />} />
              <Route path="resources" element={<ResourcesManager />} />
              <Route path="blogs" element={<BlogsManager />} />
              <Route path="announcements" element={<AnnouncementsManager />} />
              <Route path="reports" element={<ReportsAnalyticsManager />} />
              <Route path="support" element={<SupportQueriesManager />} />
              <Route path="settings" element={<SettingsManager />} />
              <Route path="catalog" element={<AcademicCatalogManager />} />
              <Route path="curriculum" element={<AcademicCatalogManager initialTab="subjects" />} />
            </Route>

            {/* Convenience Aliases */}
            <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />

            {/* Public Website Routes */}
            <Route
              element={
                <PublicLayout
                  mobileMenuOpen={mobileMenuOpen}
                  setMobileMenuOpen={setMobileMenuOpen}
                />
              }
            >
              <Route path="/" element={<Home />} />
              <Route path="/calculators" element={<ToolsDirectory />} />
              <Route path="/calculators/cgpa" element={<CalculatorRouteGuard toolId="cgpa-calculator"><CGPACalculators /></CalculatorRouteGuard>} />
              <Route path="/calculators/sgpa" element={<CalculatorRouteGuard toolId="sgpa-calculator"><SGPACalculator /></CalculatorRouteGuard>} />
              <Route path="/calculators/gpa" element={<CalculatorRouteGuard toolId="cgpa-converter"><GPACalculator /></CalculatorRouteGuard>} />
              <Route path="/calculators/percentage" element={<CalculatorRouteGuard toolId="percentage-calculator"><PercentageCalculator /></CalculatorRouteGuard>} />
              <Route path="/calculators/grade" element={<CalculatorRouteGuard toolId="grade-calculator"><GradeCalculator /></CalculatorRouteGuard>} />
              <Route path="/calculators/credit-calculate" element={<CalculatorRouteGuard toolId="credits-calculator"><CreditsCalculator /></CalculatorRouteGuard>} />
              <Route path="/calculators/credite-calculate" element={<Navigate to="/calculators/credit-calculate" replace />} />
              <Route path="/calculators/marks-convert" element={<CalculatorRouteGuard toolId="cgpa-converter"><MarksConvert /></CalculatorRouteGuard>} />
              <Route path="/calculators/target-cgpa" element={<CalculatorRouteGuard toolId="target-cgpa"><TargetCGPACalculator /></CalculatorRouteGuard>} />
              <Route path="/calculators/backlog" element={<CalculatorRouteGuard toolId="backlog-calculator"><BacklogCalculator /></CalculatorRouteGuard>} />
              <Route path="/calculators/result-analysis" element={<CalculatorRouteGuard toolId="result-analyzer"><ResultAnalysis /></CalculatorRouteGuard>} />

              {/* Academic Tools & Utilities (Functional Standalone Tools & Future Placeholders) */}
              <Route path="/tools" element={<Navigate to="/calculators" replace />} />
              <Route path="/tools/predictor" element={<CalculatorRouteGuard toolId="cgpa-predictor"><PlaceholderToolPage toolId="cgpa-predictor" /></CalculatorRouteGuard>} />
              <Route path="/tools/sgpa-to-cgpa" element={<CalculatorRouteGuard toolId="sgpa-to-cgpa"><SGPAToCGPACalculator /></CalculatorRouteGuard>} />
              <Route path="/tools/study-planner" element={<CalculatorRouteGuard toolId="study-planner"><PlaceholderToolPage toolId="study-planner" /></CalculatorRouteGuard>} />
              <Route path="/tools/performance-trend" element={<CalculatorRouteGuard toolId="performance-trend"><PlaceholderToolPage toolId="performance-trend" /></CalculatorRouteGuard>} />
              <Route path="/tools/scale-converter" element={<CalculatorRouteGuard toolId="gpa-scale-converter"><GPAScaleConverter /></CalculatorRouteGuard>} />
              <Route path="/tools/grade-predictor" element={<CalculatorRouteGuard toolId="grade-predictor"><GradePredictor /></CalculatorRouteGuard>} />
              <Route path="/tools/attendance" element={<CalculatorRouteGuard toolId="attendance-calculator"><AttendanceCalculator /></CalculatorRouteGuard>} />
              <Route path="/tools/semester-planner" element={<CalculatorRouteGuard toolId="semester-planner"><PlaceholderToolPage toolId="semester-planner" /></CalculatorRouteGuard>} />
              <Route path="/tools/cgpa-info" element={<CalculatorRouteGuard toolId="cgpa-info-finder"><CGPAInfoFinder /></CalculatorRouteGuard>} />
              <Route path="/tools/pdf-gen" element={<CalculatorRouteGuard toolId="result-pdf-generator"><ResultPdfGenerator /></CalculatorRouteGuard>} />
              <Route path="/tools/improvement" element={<CalculatorRouteGuard toolId="cgpa-improvement"><CGPAImprovementGuide /></CalculatorRouteGuard>} />

              <Route path="/universities" element={<Universities />} />
              <Route path="/universities/details" element={<UniversityDetails />} />
              <Route path="/universities/:id" element={<UniversityDetails />} />
              <Route path="/resources" element={<ResourcesDirectory />} />
              <Route path="/resources/details" element={<ResourceDetail />} />
              <Route path="/resources/resource-details" element={<ResourceDetail />} />
              <Route path="/resources/jntuh-r18-guide" element={<ResourceDetail />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blogs" element={<BlogPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* Dedicated Authentication Routes (Minimal Auth Header: Logo + Branding + ThemeToggle, No Footer) */}
            <Route path="/login" element={<LoginSignup />} />
            <Route path="/signup" element={<LoginSignup />} />
            <Route path="/pages/auth/login-signup.html" element={<LoginSignup />} />

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global Toast Notifications */}
          <Toast />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
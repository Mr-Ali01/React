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
              <Route path="users" element={<AdminManagementPage title="Users Management" icon={Users} description="View and manage student accounts, verification statuses, and credentials." />} />
              <Route path="universities" element={<AcademicCatalogManager initialTab="universities" />} />
              <Route path="courses" element={<AcademicCatalogManager initialTab="courses" />} />
              <Route path="regulations" element={<AcademicCatalogManager initialTab="regulations" />} />
              <Route path="subjects" element={<AcademicCatalogManager initialTab="subjects" />} />
              <Route path="grading-rules" element={<AcademicCatalogManager initialTab="grading" />} />
              <Route path="calculation-rules" element={<AcademicCatalogManager initialTab="calculations" />} />
              <Route path="tools" element={<AdminManagementPage title="Tools Management" icon={Wrench} description="Configure platform calculators, conversion algorithms, and tool availability." />} />
              <Route path="resources" element={<AdminManagementPage title="Resources Management" icon={FolderOpen} description="Manage academic guides, syllabus PDFs, and study materials." />} />
              <Route path="blogs" element={<AdminManagementPage title="Blog Management" icon={Newspaper} description="Publish articles, student advice, and academic performance strategies." />} />
              <Route path="announcements" element={<AdminManagementPage title="Announcements" icon={Bell} description="Broadcast platform notices and institutional schedule changes." />} />
              <Route path="reports" element={<AdminManagementPage title="Reports & Analytics" icon={BarChart2} description="View deep dive calculation analytics, conversion frequency, and university rankings." />} />
              <Route path="support" element={<AdminManagementPage title="Support Queries" icon={MessageSquare} description="Respond to student calculation questions, grade discrepancies, and feedback." badge="12 Open" />} />
              <Route path="settings" element={<AdminManagementPage title="Settings & Activity Logs" icon={Settings} description="Configure platform permissions, institutional security, and audit trails." />} />
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
              <Route path="/calculators/cgpa" element={<CGPACalculators />} />
              <Route path="/calculators/sgpa" element={<SGPACalculator />} />
              <Route path="/calculators/gpa" element={<GPACalculator />} />
              <Route path="/calculators/percentage" element={<PercentageCalculator />} />
              <Route path="/calculators/grade" element={<GradeCalculator />} />
              <Route path="/calculators/credite-calculate" element={<CreditsCalculator />} />
              <Route path="/calculators/marks-convert" element={<MarksConvert />} />
              <Route path="/calculators/target-cgpa" element={<TargetCGPACalculator />} />
              <Route path="/calculators/backlog" element={<BacklogCalculator />} />
              <Route path="/calculators/result-analysis" element={<ResultAnalysis />} />
              <Route path="/universities" element={<Universities />} />
              <Route path="/universities/details" element={<UniversityDetails />} />
              <Route path="/universities/:id" element={<UniversityDetails />} />
              <Route path="/resources" element={<ResourcesDirectory />} />
              <Route path="/resources/details" element={<ResourceDetail />} />
              <Route path="/resources/resource-details" element={<ResourceDetail />} />
              <Route path="/resources/jntuh-r18-guide" element={<ResourceDetail />} />
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
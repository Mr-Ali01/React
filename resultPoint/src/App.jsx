import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/layout/Header';
import MobileDrawer from './components/layout/MobileDrawer';
import Footer from './components/layout/Footer';
import Toast from './components/ui/Toast';
import Home from './pages/Home/index';
import CGPACalculators from './pages/Calculators/CGPA'
import ToolsDirectory from './pages/Calculators/Directory'
import GPACalculator from './pages/Calculators/GPA'
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
import LoginSignup from './pages/Auth/LoginSignup';


export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="selection:bg-accent selection:text-white flex flex-col min-h-screen antialiased relative ">
            <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
            <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/calculators/cgpa" element={<CGPACalculators />} />
                <Route path="/calculators" element={<ToolsDirectory />} />
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
                <Route path="/resources/details" element={<ResourceDetail />} />
<Route path="/resources/resource-details" element={<ResourceDetail />} />
<Route path="/resources/jntuh-r18-guide" element={<ResourceDetail />} />
<Route path="/login" element={<LoginSignup />} />
<Route path="/signup" element={<LoginSignup />} />
<Route path="/pages/auth/login-signup.html" element={<LoginSignup />} />
              </Routes>
            </main>

            <Footer />
            <Toast />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
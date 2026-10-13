import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/layout/Header';
import MobileDrawer from './components/layout/MobileDrawer';
import Footer from './components/layout/Footer';
import Toast from './components/ui/Toast';
import Home from './pages/Home/index';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="selection:bg-accent selection:text-white flex flex-col min-h-screen antialiased relative overflow-x-hidden">
            <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
            <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
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
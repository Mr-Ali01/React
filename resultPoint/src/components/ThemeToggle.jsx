import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle Theme"
      className={`w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-text-m hover:text-accent hover:border-accent/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-accent" />
      ) : (
        <Moon className="w-4 h-4 text-accent" />
      )}
    </button>
  );
}

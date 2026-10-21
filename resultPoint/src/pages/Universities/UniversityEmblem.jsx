import React, { useState } from 'react';
import { Landmark, GraduationCap } from 'lucide-react';

/**
 * UniversityEmblem
 * Renders an official vector emblem or configured logo image with elegant fallback.
 */
export default function UniversityEmblem({ university, className = 'w-16 h-16', lightBg = true }) {
  const [imageError, setImageError] = useState(false);

  if (university?.logo && !imageError) {
    return (
      <img
        src={university.logo}
        alt={`${university.name} Logo`}
        onError={() => setImageError(true)}
        className={`${className} object-contain rounded-2xl bg-white p-1 border border-border`}
        loading="lazy"
      />
    );
  }

  const uniId = (university?.id || '').toLowerCase();
  const abbreviation = university?.abbreviation || university?.shortName || '';

  // Osmania University Historic Arts College Emblem (Matches exact screenshot reference)
  if (uniId === 'osmania-university' || abbreviation === 'OU' || uniId === 'osmania') {
    return (
      <div className={`${className} rounded-2xl ${lightBg ? 'bg-[#FCFAF7]' : 'bg-bg-sec'} border border-amber-900/20 p-2.5 flex flex-col items-center justify-center shrink-0 shadow-sm relative overflow-hidden select-none`}>
        <svg className="w-full h-full" viewBox="0 0 120 120" fill="none" aria-label="Osmania University Emblem">
          {/* Outer Crest Oval */}
          <path d="M60 12 C35 12 24 28 24 60 C24 92 38 108 60 108 C82 108 96 92 96 60 C96 28 85 12 60 12 Z" stroke="#2B2620" strokeWidth="2.5" fill="none" />
          <path d="M60 16 C38 16 28 31 28 60 C28 89 40 104 60 104 C80 104 92 89 92 60 C92 31 82 16 60 16 Z" stroke="#8A6E3B" strokeWidth="1" strokeDasharray="2 2" fill="none" />
          
          {/* Sunburst Crest at Top */}
          <circle cx="60" cy="23" r="4.5" fill="#D97706" />
          <path d="M60 14 L60 17 M53 16 L55 18 M67 16 L65 18 M50 23 L53 23 M70 23 L67 23" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />

          {/* Arts College Iconic Central Arch & Calligraphic Monogram */}
          <path d="M42 74 L42 45 Q60 33 78 45 L78 74 Z" stroke="#2B2620" strokeWidth="2" fill="#FDFBF7" />
          <path d="M48 74 L48 48 Q60 39 72 48 L72 74" stroke="#8A6E3B" strokeWidth="1.5" />
          <circle cx="60" cy="46" r="2.5" fill="#8A6E3B" />
          
          {/* Historic Calligraphy / Monogram */}
          <text x="60" y="65" textAnchor="middle" fontSize="18" fontWeight="bold" fontFamily="serif" fill="#2B2620">ع</text>
          
          {/* Bottom Banner Ribbon */}
          <path d="M30 84 Q60 92 90 84 L88 94 Q60 101 32 94 Z" fill="#2B2620" />
          <text x="60" y="90" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#FFFBEB" letterSpacing="0.5">OSMANIA UNIVERSITY</text>
        </svg>
      </div>
    );
  }

  // JNTUH Official Emblem
  if (uniId === 'jntuh' || abbreviation === 'JNTUH') {
    return (
      <div className={`${className} rounded-2xl ${lightBg ? 'bg-[#FCFAF7]' : 'bg-bg-sec'} border border-orange-900/20 p-2.5 flex flex-col items-center justify-center shrink-0 shadow-sm relative overflow-hidden select-none`}>
        <svg className="w-full h-full" viewBox="0 0 120 120" fill="none" aria-label="JNTU Hyderabad Emblem">
          <circle cx="60" cy="60" r="52" stroke="#EA580C" strokeWidth="2.5" strokeDasharray="3 3" />
          <circle cx="60" cy="60" r="46" stroke="#FF7300" strokeWidth="2" />
          <circle cx="60" cy="60" r="40" fill="#FFF7ED" />
          {/* Shield Flame */}
          <path d="M60 26 C52 38 42 50 42 62 C42 74 52 82 60 82 C68 82 78 74 78 62 C78 50 68 38 60 26 Z" fill="#DC2626" opacity="0.9" />
          <path d="M60 38 C56 46 50 56 50 64 C50 70 54 74 60 74 C66 74 70 70 70 64 C70 56 64 46 60 38 Z" fill="#991B1B" />
          <path d="M60 48 L60 70 M54 58 L66 58" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="60" cy="30" r="4" fill="#F59E0B" />
          {/* Banner */}
          <path d="M26 88 Q60 98 94 88 L90 98 Q60 106 30 98 Z" fill="#1E293B" />
          <text x="60" y="95" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#F8FAFC">योगः कर्मसु कौशलम्</text>
          <text x="60" y="112" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#64748B">JNTU HYDERABAD</text>
        </svg>
      </div>
    );
  }

  // Graceful Fallback for Future Universities
  return (
    <div className={`${className} rounded-2xl bg-bg-sec border border-border p-2 flex flex-col items-center justify-center shrink-0 shadow-subtle text-accent`}>
      <Landmark className="w-6 h-6 mb-1 text-accent" />
      <span className="text-[11px] font-black uppercase tracking-wider text-text-h">{abbreviation || 'UNI'}</span>
    </div>
  );
}

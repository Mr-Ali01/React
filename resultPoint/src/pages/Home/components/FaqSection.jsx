import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const faqs = [
  {
    q: '1. What is ResultPoint?',
    a: 'ResultPoint is an academic performance platform designed for university students. It simplifies calculating SGPAs, CGPAs, percentages, analyzing results, and tracking academic growth based on official regulations.',
  },
  {
    q: '4. Are the calculators really free to use?',
    a: 'Yes, all calculators, grading charts, and converters on ResultPoint are 100% free with no registration or payment required.',
  },
  {
    q: '2. How is CGPA calculated?',
    a: 'CGPA is calculated using the standard credit-weighted formula: Σ(Credits × SGPA) divided by Σ(Credits) across all completed semesters.',
  },
  {
    q: '5. Can I calculate my percentage?',
    a: 'Yes! Our Percentage Calculator converts marks directly or applies official university conversion formulas (e.g. (CGPA − 0.5) × 10).',
  },
  {
    q: '3. Does ResultPoint support different universities?',
    a: 'Yes, ResultPoint provides tailor-made grading matrices for major universities including JNTUH, JNTUK, Anna University, Osmania University, and autonomous colleges.',
  },
  {
    q: '6. Is my data safe and private?',
    a: 'Calculations occur locally in your browser session. We never sell, monetize, or disclose student transcripts or academic data.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-20 bg-bg transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="text-left space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/25">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-h tracking-tight">
              Got Questions? We've Got Answers.
            </h2>
            <p className="text-xs sm:text-sm text-text-m">
              Real answers to some of the most common questions about ResultPoint.
            </p>
          </div>

          <Link
            to="/contact#faq"
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
          >
            <span>View All FAQs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-left">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-[13px] text-text-h hover:text-accent transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span className="text-accent font-extrabold text-sm shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-text-m leading-relaxed border-t border-border/60 pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
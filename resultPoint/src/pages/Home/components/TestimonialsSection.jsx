import React from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

const testimonials = [
  {
    quote: '"ResultPoint made it so easy to calculate my SGPA. The university-specific feature is super helpful!"',
    initial: 'S',
    name: 'Srinivas K.',
    uni: 'JNTU Hyderabad',
    color: 'bg-accent-soft text-accent border-accent/20',
  },
  {
    quote: '"Clean, simple and very accurate. I use it every semester."',
    initial: 'P',
    name: 'Priya M.',
    uni: 'Osmania University',
    color: 'bg-blue-500/10 text-brandBlue border-brandBlue/20',
  },
  {
    quote: '"The tools and resources are really useful. Great platform for students!"',
    initial: 'A',
    name: 'Arjun R.',
    uni: 'Anna University',
    color: 'bg-purple-500/10 text-brandPurple border-brandPurple/20',
  },
];

export default function TestimonialsSection() {
  const { showToast } = useToast();

  return (
    <section id="testimonials" className="py-16 sm:py-20 bg-bg-sec border-y border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="text-left space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/25">
              WHAT STUDENTS SAY
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-h tracking-tight">
              Trusted by Students
            </h2>
            <p className="text-xs sm:text-sm text-text-m">
              Real students. Simple tools. Better understanding.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => showToast('Previous student review')}
              type="button"
              className="w-8 h-8 rounded-xl border border-border bg-card flex items-center justify-center text-text-m hover:text-accent hover:border-accent transition-colors"
              aria-label="Previous Testimonials"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => showToast('Next student review')}
              type="button"
              className="w-8 h-8 rounded-xl border border-border bg-card flex items-center justify-center text-text-m hover:text-accent hover:border-accent transition-colors"
              aria-label="Next Testimonials"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-6 rounded-2xl bg-card border border-border shadow-subtle flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-[13px] text-text-m leading-relaxed italic">
                  {t.quote}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-border/70">
                <div className={`w-9 h-9 rounded-full font-extrabold text-xs flex items-center justify-center border ${t.color}`}>
                  {t.initial}
                </div>
                <div>
                  <div className="text-xs font-bold text-text-h">{t.name}</div>
                  <div className="text-[10.5px] text-text-light">{t.uni}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
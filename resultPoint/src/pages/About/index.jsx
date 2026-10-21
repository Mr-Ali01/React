import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  Check,
  ArrowRight,
  GraduationCap,
  Quote,
  Users,
  Building2,
  Calculator,
  Heart,
  Target,
  Eye,
  Send
} from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-bg-dark text-text-h flex flex-col selection:bg-accent selection:text-white">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-2 text-xs text-text-m">
            <li className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-text-light" />
              <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            </li>
            <li><ChevronRight className="w-3 h-3 text-text-light" /></li>
            <li className="font-bold text-text-h" aria-current="page">About Us</li>
          </ol>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-16 sm:space-y-20">
        {/* Section 1: What is ResultPoint? */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column: Content & Checklist */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              <span>ABOUT RESULTPONT</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-text-primary tracking-tight leading-[1.18]">
              What is <span className="text-accent">ResultPoint?</span>
            </h1>

            <p className="text-sm sm:text-[15px] text-text-secondary leading-relaxed max-w-xl">
              ResultPoint is a student-focused academic performance platform designed to make result calculation and tracking simple, accurate, and stress-free. Whether it’s SGPA, CGPA, percentage, or grades — ResultPoint gives you the right tools, tailored to your university’s official regulations.
            </p>

            {/* 2-Column Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs font-semibold text-text-primary">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent shrink-0 stroke-[2.5]" />
                <span>Instant Regulation Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent shrink-0 stroke-[2.5]" />
                <span>Credit-Weighted Accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent shrink-0 stroke-[2.5]" />
                <span>Semester History Vault</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent shrink-0 stroke-[2.5]" />
                <span>Visual Progress Insights</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-3">
              <Link
                to="/#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-accent hover:bg-accent-hover shadow-sm active:scale-95 transition-all"
              >
                <span>Discover Full Platform Vision</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Center Column: Founder Portrait & Floating Badges */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative py-4">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Outer circular sky blue glow ring */}
              <div className="absolute inset-0 rounded-full border-[10px] border-blue-100 dark:border-blue-950/50 -z-10"></div>

              {/* Top Floating Badge: 100% Regulation Match */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-card border border-border shadow-md px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-text-primary whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>100% Regulation Match</span>
              </div>

              {/* Founder Circular Portrait */}
              <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-card bg-surface relative">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
                  alt="ResultPoint Founder"
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                />
              </div>

              {/* Bottom Right Floating Badge: Verified Scales */}
              <div className="absolute bottom-2 -right-2 sm:-right-4 z-20 bg-accent text-white px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-xs font-bold whitespace-nowrap">
                <GraduationCap className="w-4 h-4" />
                <span>Verified Scales</span>
              </div>
            </div>

            {/* Handwritten Inspiration Script */}
            <p className="handwriting-note text-accent text-base sm:text-lg font-bold mt-4 tracking-wide text-center">
              “Know Your Progress, Create a Better Tomorrow”
            </p>
          </div>

          {/* Right Column: Quote Card */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-card border border-border p-6 shadow-subtle relative flex flex-col justify-between h-full min-h-[290px] text-left">
              {/* Top quotation icon container */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
                  <Quote className="w-4 h-4" />
                </div>
                <span className="text-2xl font-serif text-blue-300 dark:text-blue-900 leading-none">“</span>
              </div>

              {/* Quote content */}
              <blockquote className="text-xs sm:text-[13px] text-text-secondary italic leading-relaxed">
                “Education is not just about marks, but about continuous improvement. ResultPoint gives students clarity on where they stand and what to target next.”
              </blockquote>

              {/* Divider & Author */}
              <div className="mt-6 pt-4 border-t border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-text-primary text-xs font-bold flex items-center justify-center border border-border shrink-0">
                  AC
                </div>
                <div>
                  <div className="text-xs font-bold text-text-primary">Academic Philosophy</div>
                  <div className="text-[10px] text-text-secondary">Core ResultPoint Mission</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Why We Built ResultPoint? */}
        <section className="pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
            {/* Left Side: Story Copy */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/20">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                <span>OUR STORY</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-text-primary tracking-tight leading-[1.2]">
                Why We Built <span className="text-accent">ResultPoint?</span>
              </h2>

              <p className="text-xs sm:text-[13.5px] text-text-secondary leading-relaxed">
                As students, we know how confusing and time-consuming it can be to calculate SGPA, CGPA, percentage or grades manually. Different universities have different rules, and finding the right information is often difficult.
              </p>

              <p className="text-xs sm:text-[13.5px] text-text-secondary leading-relaxed">
                ResultPoint was built to solve this problem — to provide a single, reliable platform where students can easily calculate, track, analyze and improve their academic performance, based on their university's rules.
              </p>

              <div className="pt-2">
                <a
                  href="#mission"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-accent hover:bg-accent-hover shadow-sm active:scale-95 transition-all"
                >
                  <span>Our Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Center: Student Collaboration Image with Overlay */}
            <div className="lg:col-span-4">
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-card bg-surface">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
                  alt="Students collaborating and studying"
                  className="w-full h-64 sm:h-72 object-cover object-center"
                  loading="lazy"
                />

                {/* Floating handwritten label */}
                <div className="absolute bottom-3.5 right-3.5 bg-card/95 backdrop-blur-sm border border-border px-3.5 py-1.5 rounded-xl shadow-md">
                  <span className="handwriting-note text-accent text-xs sm:text-sm font-bold">
                    Together for a Brighter Future
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Secondary Team Quote Card */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl bg-card border border-border p-6 shadow-subtle flex flex-col justify-between h-full min-h-[260px]">
                <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-3">
                  <Quote className="w-4 h-4" />
                </div>

                <blockquote className="text-xs sm:text-[13px] text-text-secondary italic leading-relaxed">
                  “Our goal is to empower students with the right tools, information and insights to take control of their academic journey and achieve their goals.”
                </blockquote>

                <div className="mt-6 pt-4 border-t border-border">
                  <span className="text-xs font-bold text-text-primary block">— Team ResultPoint</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Stat Badges Bar */}
        <section className="w-full text-left" aria-label="Platform Statistics">
          <div className="rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-subtle grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
            {/* Stat 1 */}
            <div className="flex items-center gap-3.5 lg:pr-6">
              <div className="w-12 h-12 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">100K+</div>
                <div className="text-xs font-bold text-text-primary">Students Helped</div>
                <div className="text-[11px] text-text-secondary">Across India and beyond</div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-3.5 lg:px-6 lg:border-l lg:border-border">
              <div className="w-12 h-12 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">50+</div>
                <div className="text-xs font-bold text-text-primary">Universities Supported</div>
                <div className="text-[11px] text-text-secondary">With updated regulations</div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-3.5 lg:px-6 lg:border-l lg:border-border">
              <div className="w-12 h-12 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">10+</div>
                <div className="text-xs font-bold text-text-primary">Academic Tools</div>
                <div className="text-[11px] text-text-secondary">For every student need</div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-3.5 lg:pl-6 lg:border-l lg:border-border">
              <div className="w-12 h-12 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">98%</div>
                <div className="text-xs font-bold text-text-primary">User Satisfaction</div>
                <div className="text-[11px] text-text-secondary">Trusted by students</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Mission, Vision, and Values */}
        <section id="mission" className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch text-left">
          {/* Card 1: Our Mission */}
          <div className="rounded-2xl bg-card border border-border p-6 sm:p-7 shadow-subtle flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-4 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-2">Our Mission</h3>
            <p className="text-xs sm:text-[13px] text-text-secondary leading-relaxed">
              To simplify academic calculations and provide reliable tools that help students make informed decisions about their education and future.
            </p>
          </div>

          {/* Card 2: Our Vision */}
          <div className="rounded-2xl bg-card border border-border p-6 sm:p-7 shadow-subtle flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-4 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-2">Our Vision</h3>
            <p className="text-xs sm:text-[13px] text-text-secondary leading-relaxed">
              To become the most trusted platform for academic planning, empowering every student to achieve their full potential.
            </p>
          </div>

          {/* Card 3: Our Values */}
          <div className="rounded-2xl bg-card border border-border p-6 sm:p-7 shadow-subtle flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center mb-4 shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-2">Our Values</h3>
            <ul className="space-y-1.5 text-xs sm:text-[13px] text-text-secondary font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-accent stroke-[2.5]" />
                <span>Student First</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-accent stroke-[2.5]" />
                <span>Accuracy & Reliability</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-accent stroke-[2.5]" />
                <span>Continuous Improvement</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-accent stroke-[2.5]" />
                <span>Accessibility for All</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-accent stroke-[2.5]" />
                <span>Trust & Transparency</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 5: Meet the Team */}
        <section className="space-y-6 text-left" aria-label="Team Members">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              <span>MEET THE TEAM</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Built by a Team That Cares
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed">
              We are a passionate group of developers, designers, and education enthusiasts working together to create tools that make a real difference in students’ lives.
            </p>
          </div>

          {/* 4 Team Members Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-2">
            {/* Member 1 */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle text-center flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-border shadow-sm mb-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
                  alt="Arjun Mehta"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary">Arjun Mehta</h4>
              <span className="text-[11px] text-text-secondary mt-0.5">Founder & CEO</span>
            </div>

            {/* Member 2 */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle text-center flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-border shadow-sm mb-3">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
                  alt="Priya Sharma"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary">Priya Sharma</h4>
              <span className="text-[11px] text-text-secondary mt-0.5">Product Designer</span>
            </div>

            {/* Member 3 */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle text-center flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-border shadow-sm mb-3">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
                  alt="Rahul Verma"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary">Rahul Verma</h4>
              <span className="text-[11px] text-text-secondary mt-0.5">Lead Developer</span>
            </div>

            {/* Member 4 */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle text-center flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-border shadow-sm mb-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                  alt="Sneha Reddy"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary">Sneha Reddy</h4>
              <span className="text-[11px] text-text-secondary mt-0.5">Content & Research</span>
            </div>
          </div>
        </section>

        {/* Section 6: High-Impact Orange CTA Banner */}
        <section
          className="rounded-3xl bg-gradient-to-r from-[#FF6B00] via-[#FF7A18] to-[#EA580C] text-white p-6 sm:p-10 shadow-orange relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6"
          aria-label="Join Students CTA"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Join Thousands of Students Today
              </h3>
              <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                Start using ResultPoint and take the next step towards your academic success.
              </p>
            </div>
          </div>

          <Link
            to="/calculators/cgpa"
            className="shrink-0 px-6 py-3 rounded-xl bg-white text-text-primary hover:bg-white/95 text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}

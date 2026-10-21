import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  HelpCircle,
  Calculator,
  Landmark,
  BookOpen,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Home,
  Plus,
  Minus,
  ExternalLink,
  GraduationCap,
  Headphones,
  RotateCcw
} from 'lucide-react';
import { contactService, SUBJECT_OPTIONS, MAX_MESSAGE_LENGTH } from '../../services/contactService';

// Frequently Asked Questions
const FAQ_ITEMS = [
  {
    q: 'How can I request a new university to be added?',
    a: 'You can request a new university by selecting "University Information" in the contact form above. Please include the university name, course programs (e.g. B.Tech, MCA), and links to official academic regulations or syllabus handbooks. Our academic catalog team evaluates and adds institutions that have verified grading circulars.'
  },
  {
    q: 'Is ResultPoint free to use?',
    a: 'Yes, ResultPoint\'s core academic calculators, grade-to-marks converters, regulation guidebooks, and community study resources are completely free for students. Our mission is to make semester grade analysis transparent and effortless for everyone.'
  },
  {
    q: 'How accurate are the result calculations?',
    a: 'Our calculations adhere strictly to official university grading formulas (such as Osmania University CBCS and JNTUH R22/R18/R16 regulations). Calculation accuracy depends on selecting your correct regulation and entering the precise subject credits and letter grades as published in your university notification.'
  },
  {
    q: 'Where do you get the grading system and regulations from?',
    a: 'All grading rules, credit allocations, SGPA/CGPA formulas, and promotion thresholds are extracted directly from official university examination controller circulars, academic senate notifications, and published curriculum handbooks.'
  }
];

export default function Contact() {
  // Page Title & Meta
  useEffect(() => {
    document.title = 'Contact Us - ResultPoint | Student Support & Feedback';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // { success: boolean, message: string, ticketId?: string, mode?: string }

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Map Zoom State
  const [mapZoom, setMapZoom] = useState(1);

  // Form Ref for auto-scrolling
  const formSectionRef = useRef(null);
  const messageInputRef = useRef(null);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'message' && value.length > MAX_MESSAGE_LENGTH) return;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear inline error if field becomes valid
    if (errors[name]) {
      const updated = { ...formData, [name]: value };
      const validation = contactService.validate(updated);
      if (!validation.errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validation = contactService.validate(formData);
    if (validation.errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validation.errors[field] }));
    }
  };

  // Pre-select subject from Common Topics
  const handleSelectTopic = (subjectName) => {
    setFormData((prev) => ({ ...prev, subject: subjectName }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.subject;
      return next;
    });

    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 450);
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      subject: true,
      message: true
    });

    const validation = contactService.validate(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
      const res = await contactService.submitMessage(formData);
      if (res.success) {
        setSubmissionStatus({
          success: true,
          mode: res.mode,
          ticketId: res.ticketId,
          message: res.message
        });
        // Clear form
        setFormData({
          fullName: '',
          email: '',
          subject: '',
          message: ''
        });
        setTouched({});
        setErrors({});
      } else {
        setSubmissionStatus({
          success: false,
          error: res.error || 'Failed to submit your message. Please try again.'
        });
      }
    } catch (err) {
      console.error('Contact submission error:', err);
      setSubmissionStatus({
        success: false,
        error: 'An unexpected error occurred while sending your message. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-h transition-colors pb-20">
      
      {/* 1. Breadcrumb Bar */}
      <div className="border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center space-x-2 text-xs font-medium text-text-m" aria-label="Breadcrumb">
            <Link to="/" className="flex items-center gap-1.5 hover:text-accent transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-text-m/50" />
            <span className="text-accent font-semibold" aria-current="page">Contact</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-12 sm:space-y-16">
        
        {/* 2. Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Heading & Description */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-soft border border-accent/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>Contact Us</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-text-h tracking-tight leading-[1.18]">
              We're Here to <span className="text-accent">Help</span>
            </h1>

            <p className="text-sm sm:text-base text-text-m leading-relaxed max-w-xl">
              Have a question, suggestion or need support? Reach out to us — we'd love to hear from you. 
              Our team is here to make your academic journey easier and better.
            </p>
          </div>

          {/* Right Column: Hero Graphic Illustration (matches screenshot) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[380px] aspect-[4/3] rounded-2xl bg-gradient-to-b from-[#171A21] to-[#0E1116] border border-[#272B35] p-5 shadow-2xl flex items-center justify-center overflow-hidden">
              
              {/* Radial background glow */}
              <div className="absolute inset-0 bg-radial from-accent/15 via-transparent to-transparent pointer-events-none" />
              
              {/* Laptop Screen Mockup */}
              <div className="relative z-10 w-[78%] bg-[#0B0D12] border border-[#2B303C] rounded-lg p-3 shadow-2xl">
                {/* Top status bar */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1E222D]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500/80" />
                    <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-bold text-white tracking-wide">Result<span className="text-accent">Point</span></span>
                  </div>
                </div>

                {/* Laptop content */}
                <div className="text-center py-2 space-y-1">
                  <div className="text-xs font-extrabold text-white">Your Questions</div>
                  <div className="text-[11px] font-bold text-accent">Our Support</div>
                </div>
              </div>

              {/* Glowing Orange Envelope with Flying Airplane */}
              <div className="absolute -left-2 top-8 z-20 w-16 h-12 rounded-lg bg-gradient-to-tr from-[#EA580C] to-[#FF7A1A] p-2 shadow-lg shadow-orange-500/30 flex items-center justify-center transform -rotate-6 transition-transform hover:scale-105">
                <Mail className="w-6 h-6 text-white" />
                {/* Airplane soaring out */}
                <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-[#FF8C2B] flex items-center justify-center shadow-md animate-bounce">
                  <Send className="w-3.5 h-3.5 text-white transform -rotate-12" />
                </div>
              </div>

              {/* Support Headset Avatar Badge */}
              <div className="absolute -right-2 top-5 z-20 w-14 h-14 rounded-full bg-[#141A26] border-2 border-accent/40 shadow-xl shadow-cyan-500/10 flex items-center justify-center">
                <Headphones className="w-7 h-7 text-accent" />
                <span className="absolute bottom-0 right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#141A26]" />
              </div>

              {/* Chat bubble on top */}
              <div className="absolute top-3 left-1/3 z-20 px-2.5 py-1 rounded-full bg-[#1F2430] border border-border/40 shadow-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                <span className="text-[10px] text-text-h font-medium">Online Help</span>
              </div>

              {/* Chat bubble on bottom right */}
              <div className="absolute -bottom-1 right-6 z-20 px-3 py-1.5 rounded-xl bg-[#171B24] border border-border/60 shadow-lg flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-accent" />
                <span className="text-[10px] text-text-m font-medium">Quick Answers</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Main Row: Contact Form + Get in Touch & Find Us */}
        <section id="contact-form" ref={formSectionRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Contact Form (lg:col-span-7) */}
          <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card">
            
            {/* Header */}
            <div className="flex items-center gap-3.5 pb-6 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-h">Send Us a Message</h2>
                <p className="text-xs sm:text-sm text-text-m">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>
            </div>

            {/* Submission Status Alerts */}
            {submissionStatus && (
              <div className="mt-6">
                {submissionStatus.success ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{submissionStatus.mode === 'api' ? 'Message Delivered' : 'Inquiry Logged Successfully'}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-text-m">
                      {submissionStatus.message}
                    </p>
                    {submissionStatus.ticketId && (
                      <div className="inline-block mt-1 px-2.5 py-1 rounded-md bg-card border border-border text-[11px] font-mono text-text-h">
                        Reference: <span className="font-bold text-accent">{submissionStatus.ticketId}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setSubmissionStatus(null)}
                        className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Send Another Message</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <span>Submission Error</span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      {submissionStatus.error}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
              
              {/* Row 1: Full Name & Email Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="fullName" className="block text-xs font-bold text-text-h">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('fullName')}
                    placeholder="Enter your name"
                    disabled={isSubmitting}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-bg-sec border text-text-h placeholder-text-m/60 focus:outline-none transition-colors ${
                      touched.fullName && errors.fullName
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-border focus:border-accent'
                    }`}
                  />
                  {touched.fullName && errors.fullName && (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="email" className="block text-xs font-bold text-text-h">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    placeholder="Enter your email"
                    disabled={isSubmitting}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-bg-sec border text-text-h placeholder-text-m/60 focus:outline-none transition-colors ${
                      touched.email && errors.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-border focus:border-accent'
                    }`}
                  />
                  {touched.email && errors.email && (
                    <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Subject Dropdown */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="subject" className="block text-xs font-bold text-text-h">
                  Subject <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    onBlur={() => handleBlur('subject')}
                    disabled={isSubmitting}
                    className={`w-full appearance-none px-3.5 py-2.5 pr-10 rounded-xl text-sm bg-bg-sec border text-text-h focus:outline-none transition-colors ${
                      touched.subject && errors.subject
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-border focus:border-accent'
                    }`}
                  >
                    <option value="" disabled>Select a subject</option>
                    {SUBJECT_OPTIONS.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-text-m pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {touched.subject && errors.subject && (
                  <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.subject}</span>
                  </p>
                )}
              </div>

              {/* Row 3: Your Message Textarea with 500 max limit */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label htmlFor="message" className="block text-xs font-bold text-text-h">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      formData.message.length >= MAX_MESSAGE_LENGTH
                        ? 'text-red-500 font-bold'
                        : formData.message.length > 450
                        ? 'text-amber-500 font-semibold'
                        : 'text-text-m'
                    }`}
                  >
                    {formData.message.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
                <textarea
                  id="message"
                  name="message"
                  ref={messageInputRef}
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={() => handleBlur('message')}
                  placeholder="Tell us how we can help..."
                  disabled={isSubmitting}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-bg-sec border text-text-h placeholder-text-m/60 focus:outline-none resize-y transition-colors ${
                    touched.message && errors.message
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-border focus:border-accent'
                  }`}
                />
                {touched.message && errors.message && (
                  <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.message}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl text-white text-sm font-bold bg-accent hover:bg-accent-hover shadow-accent transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Get in Touch & Find Us (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Get in Touch Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-card text-left">
              <div className="flex items-center gap-3 pb-5 border-b border-border">
                <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-h">Get in Touch</h3>
                  <p className="text-xs text-text-m">
                    You can also reach us through the following channels.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                
                {/* Email Channel */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-text-m uppercase tracking-wider">Email</div>
                    <a
                      href="mailto:support@resultpoint.in"
                      className="text-sm font-semibold text-text-h hover:text-accent transition-colors block"
                    >
                      support@resultpoint.in
                    </a>
                    <div className="text-xs text-text-m">We usually respond within 24 hours.</div>
                  </div>
                </div>

                {/* Location Channel */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-text-m uppercase tracking-wider">Location</div>
                    <div className="text-sm font-semibold text-text-h">
                      Hyderabad, Telangana, India
                    </div>
                    <div className="text-xs text-text-m">Our core team is based in India.</div>
                  </div>
                </div>

                {/* Support Hours Channel */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-text-m uppercase tracking-wider">Support Hours</div>
                    <div className="text-sm font-semibold text-text-h">
                      Monday – Saturday
                    </div>
                    <div className="text-xs text-text-m">10:00 AM – 6:00 PM (IST)</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Find Us Card with Stylized Dark Map */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-card text-left">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shadow-sm shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-h">Find Us</h3>
                    <p className="text-xs text-text-m">Our team is based in Hyderabad, India.</p>
                  </div>
                </div>

                <a
                  href="https://maps.google.com/?q=Hyderabad,Telangana,India"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border border-border text-text-m hover:text-accent hover:border-accent transition-colors"
                  title="Open in Google Maps"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Map Frame Container */}
              <div className="mt-4 relative w-full h-48 rounded-xl overflow-hidden border border-border bg-[#0B0F19]">
                
                {/* Stylized vector map graphic */}
                <div
                  className="absolute inset-0 transition-transform duration-300 ease-out"
                  style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center center' }}
                >
                  {/* Grid lines and roads */}
                  <svg className="w-full h-full opacity-35" viewBox="0 0 400 200" preserveAspectRatio="none">
                    <defs>
                      <pattern id="roadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#253248" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#roadGrid)" />
                    {/* Main highway arteries */}
                    <path d="M -10 120 Q 150 140 220 90 T 410 80" fill="none" stroke="#374B6E" strokeWidth="3" />
                    <path d="M 80 -10 Q 140 90 220 110 T 360 210" fill="none" stroke="#374B6E" strokeWidth="2.5" />
                    <path d="M 120 190 Q 210 120 280 60" fill="none" stroke="#4B6590" strokeWidth="2" />
                    <path d="M 20 40 L 380 180" fill="none" stroke="#2A374E" strokeWidth="1.5" strokeDasharray="4 2" />
                  </svg>

                  {/* Landmarks labels */}
                  <div className="absolute top-4 left-6 text-[10px] font-bold text-text-m/70 tracking-wider">
                    HITEC CITY
                  </div>
                  <div className="absolute top-3 right-8 text-[10px] font-bold text-text-m/70 tracking-wider">
                    SECUNDERABAD
                  </div>
                  <div className="absolute bottom-4 left-8 text-[10px] font-bold text-text-m/70 tracking-wider">
                    AMEERPET
                  </div>
                  <div className="absolute bottom-4 right-10 text-[10px] font-bold text-text-m/70 tracking-wider">
                    BEGUMPET
                  </div>

                  {/* Pulsing Pin Indicator */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <span className="relative flex h-5 w-5 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-accent shadow-md shadow-accent" />
                    </span>
                    <div className="mt-1 text-center">
                      <div className="text-[11px] font-black text-white bg-black/70 px-2 py-0.5 rounded shadow backdrop-blur-xs">
                        Hyderabad
                      </div>
                      <div className="text-[9px] font-medium text-accent">
                        Telangana, India
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Map Info Overlay (Top Center) */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1 rounded-lg bg-card/90 border border-border shadow-md backdrop-blur-sm flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span className="font-semibold text-text-h">Hyderabad</span>
                  <span className="text-text-m">Telangana, India</span>
                </div>

                {/* Zoom Controls (Bottom Right) */}
                <div className="absolute bottom-2.5 right-2.5 z-10 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setMapZoom((prev) => Math.min(prev + 0.2, 1.8))}
                    className="w-7 h-7 rounded-lg bg-card/90 hover:bg-card border border-border text-text-h flex items-center justify-center shadow-md transition-colors"
                    title="Zoom in"
                    aria-label="Zoom in"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapZoom((prev) => Math.max(prev - 0.2, 0.8))}
                    className="w-7 h-7 rounded-lg bg-card/90 hover:bg-card border border-border text-text-h flex items-center justify-center shadow-md transition-colors"
                    title="Zoom out"
                    aria-label="Zoom out"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4. Common Topics Section */}
        <section className="space-y-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-accent flex items-center justify-center shadow-sm shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-h">Common Topics</h2>
              <p className="text-xs sm:text-sm text-text-m">
                Quick links to help you get the right support.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Topic 1: Calculator Support */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-card hover:border-accent/40 transition-all duration-200 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-accent flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-h group-hover:text-accent transition-colors">
                    Calculator Support
                  </h3>
                  <p className="text-xs text-text-m leading-relaxed mt-1">
                    Help with SGPA, CGPA, percentage and other calculators.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => handleSelectTopic('Calculator Support')}
                  className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 group-hover:translate-x-1 transition-all"
                >
                  <span>Get Help</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Topic 2: University Information */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-card hover:border-blue-500/40 transition-all duration-200 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-h group-hover:text-blue-500 transition-colors">
                    University Information
                  </h3>
                  <p className="text-xs text-text-m leading-relaxed mt-1">
                    Questions about supported universities, courses and regulations.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => handleSelectTopic('University Information')}
                  className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-all"
                >
                  <span>Learn More</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Topic 3: Resource Requests */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-card hover:border-purple-500/40 transition-all duration-200 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-h group-hover:text-purple-500 transition-colors">
                    Resource Requests
                  </h3>
                  <p className="text-xs text-text-m leading-relaxed mt-1">
                    Suggest study materials, previous papers or academic guides.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => handleSelectTopic('Resource Request')}
                  className="text-xs font-bold text-purple-500 hover:text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-all"
                >
                  <span>Send a Request</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Topic 4: Feedback & Suggestions */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-card hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-h group-hover:text-emerald-500 transition-colors">
                    Feedback & Suggestions
                  </h3>
                  <p className="text-xs text-text-m leading-relaxed mt-1">
                    Share your ideas to help us improve ResultPoint.
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => handleSelectTopic('Feedback & Suggestions')}
                  className="text-xs font-bold text-emerald-500 hover:text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-all"
                >
                  <span>Give Feedback</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* 5. Frequently Asked Questions Accordion */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card text-left space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-h">Frequently Asked Questions</h2>
                <p className="text-xs sm:text-sm text-text-m">
                  Find quick answers to common queries.
                </p>
              </div>
            </div>

            <Link
              to="/resources"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-accent bg-accent-soft border border-accent/20 hover:bg-accent hover:text-white transition-all self-start sm:self-auto"
            >
              <span>View All FAQs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Accordion Rows */}
          <div className="divide-y divide-border/60">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left gap-4 group focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className={`text-sm sm:text-[15px] font-bold transition-colors ${
                      isOpen ? 'text-accent' : 'text-text-h group-hover:text-accent'
                    }`}>
                      {faq.q}
                    </span>
                    <span className={`p-1 rounded-lg bg-bg-sec border border-border text-text-m transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-accent border-accent/40' : ''
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="pt-3 pr-8 text-xs sm:text-sm text-text-m leading-relaxed animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}

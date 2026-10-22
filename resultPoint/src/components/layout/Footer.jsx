import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { showToast } = useToast();

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribed(true);
    showToast('Subscribed to ResultPoint academic resources!');
    setEmail('');

    setTimeout(() => {
      setIsSubscribed(false);
    }, 3000);
  };

  return (
    <footer className="border-t border-[#272B32] bg-[#0B0D10] text-[#A1A1AA] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-[#272B32]">
          
          {/* Col 1 */}
          <div className="lg:col-span-1 text-left space-y-2.5">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-[#F4F4F5]">
                Result<span className="text-accent">Point</span>
              </span>
            </Link>
            <span className="text-[10px] font-semibold text-[#71717A] block">Calculate. Analyze. Improve.</span>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Empowering students to calculate, analyze and improve their academic performance with accuracy.
            </p>
          </div>

          {/* Col 2 */}
          <div className="text-left space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">CALCULATORS</h4>
            <ul className="space-y-1.5 text-xs text-[#A1A1AA]">
              <li><Link to="/calculators" className="hover:text-accent transition-colors">CGPA Calculator</Link></li>
              <li><Link to="/calculators/sgpa" className="hover:text-accent transition-colors">SGPA Calculator</Link></li>
              <li><Link to="/calculators/gpa" className="hover:text-accent transition-colors">GPA Calculator</Link></li>
              <li><Link to="/calculators/percentage" className="hover:text-accent transition-colors">Percentage Calculator</Link></li>
              <li><Link to="/calculators/target-cgpa" className="hover:text-accent transition-colors">Target CGPA Calculator</Link></li>
              <li><Link to="/calculators/grade" className="hover:text-accent transition-colors">Grade Calculator</Link></li>
              <li><Link to="/calculators/marks-grade" className="hover:text-accent transition-colors">Marks to Grade</Link></li>
              <li><Link to="/calculators/credit-calculate" className="hover:text-accent transition-colors">Credits Calculator</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="text-left space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">TOOLS</h4>
            <ul className="space-y-1.5 text-xs text-[#A1A1AA]">
              <li><Link to="/calculators/result-analysis" className="hover:text-accent transition-colors">Result Analyzer</Link></li>
              <li><Link to="/calculators/backlog" className="hover:text-accent transition-colors">Backlog Calculator</Link></li>
              <li><Link to="/calculators/credit-calculate" className="hover:text-accent transition-colors">Credits Calculator</Link></li>
              <li><Link to="/calculators/marks-grade" className="hover:text-accent transition-colors">Marks to Grade</Link></li>
              <li><Link to="/tools/study-planner" className="hover:text-accent transition-colors">Study Planner</Link></li>
              <li><Link to="/tools/cgpa-converter" className="hover:text-accent transition-colors">CGPA Converter</Link></li>
              <li><Link to="/tools" className="hover:text-accent transition-colors">All Tools</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="text-left space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">UNIVERSITIES</h4>
            <ul className="space-y-1.5 text-xs text-[#A1A1AA]">
              <li><Link to="/universities/jntuh" className="hover:text-accent transition-colors">JNTU Hyderabad</Link></li>
              <li><Link to="/universities/jntuk" className="hover:text-accent transition-colors">JNTU Kakinada</Link></li>
              <li><Link to="/universities/osmania" className="hover:text-accent transition-colors">Osmania University</Link></li>
              <li><Link to="/universities/anna" className="hover:text-accent transition-colors">Anna University</Link></li>
              <li><Link to="/universities/andhra" className="hover:text-accent transition-colors">Andhra University</Link></li>
              <li><Link to="/universities" className="hover:text-accent transition-colors">All Universities</Link></li>
            </ul>
          </div>

          {/* Col 5 */}
          <div className="text-left space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F4F4F5]">SUBSCRIBE TO NEWSLETTER</h4>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Get updates, tips and exclusive academic resources.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your university email"
                className="w-full px-3 py-2 rounded-xl text-xs bg-[#171A1F] border border-[#272B32] text-[#F4F4F5] placeholder-[#71717A] focus:outline-none focus:border-accent"
                required
              />
              <button
                type="submit"
                disabled={isSubscribed}
                className={`w-full py-2 px-3 rounded-xl text-white text-xs font-bold transition-all shadow-sm ${
                  isSubscribed ? 'bg-brandGreen' : 'bg-accent hover:bg-accent-hover'
                }`}
              >
                {isSubscribed ? 'Subscribed ✓' : 'Subscribe'}
              </button>
            </form>
          </div>

        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#71717A]">
          <div>© {new Date().getFullYear()} ResultPoint. All rights reserved.</div>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-[#F4F4F5] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#F4F4F5] transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-[#F4F4F5] transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
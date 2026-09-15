import { Mail, MapPin, Sparkles, ShieldCheck } from 'lucide-react';

export default function FooterAbout() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md text-slate-300 py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        
        {/* Left: Brand & KIIT Mission */}
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-600/30">
              CM
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-tight">CampusMarket</span>
              <span className="ml-2 text-[10px] uppercase font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-md">
                KIIT University
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            CampusMarket is the dedicated peer-to-peer student marketplace for KIIT University. 
            Trade second-hand books, calculators, bicycles, and hostel room essentials directly 
            with batchmates across KP &amp; QC hostels with zero broker commissions and privacy-first safety.
          </p>

          <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck size={14} />
            <span>Privacy First: No personal phone numbers are publicly displayed.</span>
          </div>
        </div>

        {/* Right: Contact & Location */}
        <div className="space-y-3 md:border-l md:border-slate-800/80 md:pl-8 flex flex-col justify-center">
          <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Contact & Support
          </p>

          <a 
            href="mailto:sks07022007@gmail.com" 
            className="flex items-center space-x-2.5 text-xs text-slate-300 hover:text-indigo-400 transition"
          >
            <Mail size={15} className="text-indigo-400 shrink-0" />
            <span className="hover:underline">sks07022007@gmail.com</span>
          </a>

          <div className="flex items-center space-x-2.5 text-xs text-slate-400">
            <MapPin size={15} className="text-emerald-400 shrink-0" />
            <span>Bhubaneswar, India</span>
          </div>
        </div>

      </div>

      <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <p>© {new Date().getFullYear()} CampusMarket KIIT. Built by students, for students.</p>
        <p className="flex items-center gap-1">
          <Sparkles size={11} className="text-amber-400" />
          Powered by Gemini AI &amp; Supabase
        </p>
      </div>
    </footer>
  );
}
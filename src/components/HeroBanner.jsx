import { Sparkles, ShieldCheck, Zap, ArrowRight, BookOpen, Bike, Wrench, Flame } from 'lucide-react';

export default function HeroBanner({ onExploreCategory, onPostItem, onAskCampus }) {
  const QUICK_SHORTCUTS = [
    { label: 'Bicycles', icon: Bike, cat: 'Bicycles & Mobility', color: 'from-emerald-500/20 to-emerald-950/40 text-emerald-400 border-emerald-800/40' },
    { label: 'Lab Coats & Drafters', icon: Wrench, cat: 'Lab Coats, Drafters & Kits', color: 'from-indigo-500/20 to-indigo-950/40 text-indigo-400 border-indigo-800/40' },
    { label: 'Handwritten Notes & PYQs', icon: BookOpen, cat: 'Textbooks & Notes', color: 'from-amber-500/20 to-amber-950/40 text-amber-400 border-amber-800/40' },
    { label: 'Moving Out Clearance', icon: Flame, cat: 'All', isClearance: true, color: 'from-rose-500/20 to-rose-950/40 text-rose-400 border-rose-800/40' },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 p-6 sm:p-8 shadow-2xl">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-600/15 blur-[100px] pointer-events-none rounded-full" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left Headline */}
        <div className="space-y-3 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-700/50 text-[11px] font-semibold text-indigo-300">
            <Sparkles size={12} className="text-indigo-400" />
            <span>Built exclusively for KIIT University</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Buy, Sell & Pass Down Gear <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
              Hostel-to-Hostel. Zero Brokers.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Verified KIIT student exchanges. Safe CCTV meetup spots, bicycle ownership tracking, and peer prices from graduating seniors.
          </p>

          {/* Call-to-actions */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <button
              onClick={onPostItem}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition active:scale-95 flex items-center gap-1.5"
            >
              <span>Sell an Item</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={onAskCampus}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Zap size={14} className="text-amber-400" />
              <span>Ask Campus for Gear</span>
            </button>
          </div>
        </div>

        {/* Right Feature Highlights: Trust & Security */}
        <div className="w-full md:w-auto flex flex-col gap-2.5 bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl sm:min-w-[260px]">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="font-bold text-white">No Public Phone Numbers</p>
              <p className="text-[10px] text-slate-400">Stay safe from WhatsApp spam</p>
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/50 text-indigo-400">
              <Zap size={16} />
            </div>
            <div>
              <p className="font-bold text-white">14-Day Fresh Guarantee</p>
              <p className="text-[10px] text-slate-400">Zero dead or already-sold listings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Freshmen Shortcuts */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Fast Campus Essentials:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {QUICK_SHORTCUTS.map((sc) => {
            const Icon = sc.icon;
            return (
              <button
                key={sc.label}
                onClick={() => onExploreCategory(sc.cat)}
                className={`flex items-center space-x-2.5 p-2.5 rounded-xl border bg-gradient-to-r ${sc.color} hover:brightness-110 transition text-left`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="text-xs font-bold leading-tight truncate">{sc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
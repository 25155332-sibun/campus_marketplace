import { Shield, MapPin, Clock, AlertTriangle, X } from 'lucide-react';

const SAFE_LOCATIONS = [
  {
    name: 'Campus 3 Central Library Entrance',
    desc: 'Covered by 24/7 CCTV and security staff at the lobby.',
    bestTime: '10:00 AM – 7:30 PM',
  },
  {
    name: 'Campus 12 Food Court / Audi Point',
    desc: 'High footfall public seating with active student crowds.',
    bestTime: '1:00 PM – 9:00 PM',
  },
  {
    name: 'KP / QC Main Entry Guard Gates',
    desc: 'Guard posts monitor all incoming and outgoing movement.',
    bestTime: 'Daytime only (Before 8:00 PM for QC)',
  },
];

export default function SafeMeetupModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-slate-200">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <Shield size={18} />
            </div>
            <h2 className="text-base font-bold text-white">KIIT Safe Exchange Hubs</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {SAFE_LOCATIONS.map((loc) => (
            <div key={loc.name} className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-1">
              <div className="flex items-center space-x-1 text-xs font-bold text-white">
                <MapPin size={13} className="text-emerald-400 shrink-0" />
                <span>{loc.name}</span>
              </div>
              <p className="text-[11px] text-slate-400">{loc.desc}</p>
              <div className="flex items-center space-x-1 text-[10px] text-amber-300 font-semibold pt-0.5">
                <Clock size={11} />
                <span>Safe Window: {loc.bestTime}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-amber-950/30 border border-amber-800/30 p-2.5 rounded-xl flex items-start space-x-2">
          <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200">
            Never transfer full UPI payment before inspecting the item in person. Inspect physical condition, test electronics, and verify bicycle serials at the meetup point.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
        >
          Got it, proceed safely
        </button>
      </div>
    </div>
  );
}
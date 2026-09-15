import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, Sparkles } from 'lucide-react';

export default function PrintableNoticeModal({ isOpen, onClose, userListings, user }) {
  const printRef = useRef(null);

  if (!isOpen) return null;

  const catalogUrl = `${window.location.origin}/?seller=${user?.id || ''}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-100">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:hidden">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-400" />
              <span>Hostel Notice & Door Poster Generator</span>
            </h2>
            <p className="text-xs text-slate-400">Print and paste on your hostel lift or floor bulletin board</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              <Printer size={14} />
              <span>Print Poster</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div
          ref={printRef}
          className="mt-4 bg-white text-black p-8 rounded-xl border border-slate-300 print:m-0 print:border-none print:p-4 print:w-full"
        >
          <div className="text-center pb-4 border-b-2 border-black">
            <h1 className="text-2xl font-black uppercase tracking-tight">ROOM CLEARANCE SALE</h1>
            <p className="text-sm font-semibold text-gray-700">CampusMarket KIIT • Peer-to-Peer Student Deals</p>
          </div>

          <div className="py-4 grid grid-cols-3 gap-4 items-center">
            <div className="col-span-2 space-y-2">
              <p className="text-xs font-bold text-gray-600 uppercase">Available Items for Pickup:</p>
              <div className="space-y-1.5">
                {userListings.slice(0, 6).map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between text-xs border-b border-dashed border-gray-300 pb-1">
                    <span className="font-bold truncate max-w-[200px]">
                      {idx + 1}. {item.title}
                    </span>
                    <span className="font-black text-sm">₹{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-2 border-2 border-black rounded-lg text-center">
              <QRCodeSVG value={catalogUrl} size={110} />
              <span className="text-[10px] font-black uppercase mt-1">Scan to View & Buy</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-300 text-center text-[11px] text-gray-600 font-medium">
            📍 Fast pickup available at your hostel gate • Verified KIIT student listing
          </div>
        </div>

      </div>
    </div>
  );
}
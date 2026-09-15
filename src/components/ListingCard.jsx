import { MapPin, Share2, FileText, Truck, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function ListingCard({ listing, onSelect }) {
  const hotspot = listing.campus_zone || 'Campus 3 (Library & KSOM)';

  const handleShareToWhatsApp = (e) => {
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/listing/${listing.id}`;
    const savingsText =
      listing.original_price && Number(listing.original_price) > Number(listing.price)
        ? ` (Orig: ₹${listing.original_price} - Save ${Math.round(
            ((listing.original_price - listing.price) / listing.original_price) * 100
          )}%)`
        : '';

    const message = `Hey! Found this on CampusMarket KIIT:\n📦 *${listing.title}*\n💰 *Price:* ₹${listing.price}${savingsText}\n📍 *Pickup:* ${hotspot}\n\nCheck details: ${shareUrl}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    toast.success('Opening WhatsApp to share with batchmates!');
  };

  return (
    <div
      onClick={() => onSelect?.(listing)}
      className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between cursor-pointer"
    >
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-semibold">
            No Photo Attached
          </div>
        )}

        {/* Dynamic Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 max-w-[80%]">
          {listing.promised_buyback && (
            <span className="flex items-center gap-1 bg-indigo-900/90 text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md border border-indigo-700/60 shadow">
              <RotateCcw size={10} /> Buy-Back Guaranteed {listing.buyback_price ? `(₹${listing.buyback_price})` : ''}
            </span>
          )}

          {listing.offers_hostel_delivery && (
            <span className="flex items-center gap-1 bg-emerald-950/90 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md border border-emerald-700/60 shadow">
              <Truck size={10} /> Hostel Gate Drop (+₹{listing.delivery_tip_amount || 30})
            </span>
          )}

          {listing.includes_pyq_notes && (
            <span className="flex items-center gap-1 bg-amber-950/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md border border-amber-700/60 shadow">
              <FileText size={10} /> Includes Solved PYQs
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleShareToWhatsApp}
          title="Share to WhatsApp"
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700/60 transition shadow-lg backdrop-blur-md active:scale-90"
        >
          <Share2 size={13} />
        </button>
      </div>

      <div className="p-3.5 flex flex-col flex-1 justify-between space-y-2">
        <div>
          <h3 className="text-white font-semibold text-sm line-clamp-1 group-hover:text-indigo-400 transition">
            {listing.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center space-x-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-md px-2 py-0.5">
              <MapPin size={10} className="shrink-0" />
              <span className="truncate max-w-[140px]">{hotspot}</span>
            </div>

            {listing.bike_tires_condition && (
              <span className="text-[10px] text-slate-300 bg-slate-800 border border-slate-700 rounded-md px-2 py-0.5">
                🚲 Tires: {listing.bike_tires_condition}
              </span>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base font-extrabold text-white">₹{listing.price}</span>
              {listing.original_price && Number(listing.original_price) > Number(listing.price) && (
                <span className="text-xs text-slate-500 line-through">
                  ₹{listing.original_price}
                </span>
              )}
            </div>
            {listing.original_price && Number(listing.original_price) > Number(listing.price) && (
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/30 px-1 rounded">
                Save {Math.round(((listing.original_price - listing.price) / listing.original_price) * 100)}%
              </span>
            )}
          </div>

          <span className="text-[10px] text-slate-500 font-medium">
            {listing.created_at
              ? new Date(listing.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : 'Today'}
          </span>
        </div>
      </div>
    </div>
  );
}
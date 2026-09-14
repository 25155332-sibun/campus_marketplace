import { MapPin } from 'lucide-react';

export default function ListingCard({ listing, onSelect }) {
  const image = listing.images?.[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80';
  const isSold = listing.status === 'sold';

  return (
    <div 
      onClick={() => onSelect?.(listing)}
      className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:border-slate-700 transition cursor-pointer flex flex-col group relative ${
        isSold ? 'opacity-70' : ''
      }`}
    >
      <div className="aspect-[4/3] w-full bg-slate-800 overflow-hidden relative">
        <img
          src={image}
          alt={listing.title}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            isSold ? 'grayscale' : ''
          }`}
        />
        <span className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm text-indigo-400 text-xs font-medium px-2 py-1 rounded-md border border-slate-700">
          {listing.category}
        </span>
        {isSold && (
          <span className="absolute bottom-2 left-2 bg-red-600/90 text-white text-xs font-bold px-2 py-0.5 rounded shadow">
            SOLD
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-white font-semibold line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {listing.title}
          </h3>
          <p className="text-slate-400 text-xs mt-1 line-clamp-2">
            {listing.description || 'No description provided.'}
          </p>
        </div>

        <div className="mt-3 space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center text-xs text-slate-400 truncate gap-1">
            <MapPin size={12} className="text-indigo-400 shrink-0" />
            <span className="truncate">{listing.location || 'Campus 3'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white">₹{listing.price}</span>
            <span className="text-xs text-slate-500">
              {new Date(listing.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
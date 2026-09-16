import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import SafeMeetupModal from '../components/SafeMeetupModal';
import PrintableNoticeModal from '../components/PrintableNoticeModal';
import { 
  ArrowLeft, 
  Share2, 
  ShieldCheck, 
  Star, 
  MessageSquare, 
  Printer, 
  Bike,
  BookOpen,
  Truck,
  RotateCcw,
  Loader2,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSafeMeetupOpen, setIsSafeMeetupOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    async function fetchListing() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setListing(data);
      } catch (err) {
        console.error('Error fetching listing:', err);
        toast.error('Failed to load listing details');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchListing();
    }
  }, [id, navigate]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title || 'CampusMarket Item',
          text: `Check out ${listing?.title} on CampusMarket!`,
          url: window.location.href,
        });
      } catch (err) {
        if (err.name !== 'AbortError') copyLinkToClipboard();
      }
    } else {
      copyLinkToClipboard();
    }
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleStartChat = async () => {
    if (!user) {
      toast.error('Please sign in to message the seller');
      return;
    }
    if (user.id === listing?.seller_id) {
      toast.error("You cannot message yourself on your own listing!");
      return;
    }
    navigate(`/chat?listing_id=${listing.id}&recipient_id=${listing.seller_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-400">Loading listing details...</p>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  const displayImage =
    listing.image_url ||
    listing.image ||
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition group py-1"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition border border-slate-700/60"
            >
              <Printer size={14} />
              <span>Print Poster</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition border border-slate-700/60"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Product Image */}
          <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="w-full aspect-square bg-slate-950/60 flex items-center justify-center relative overflow-hidden">
              <img
                src={displayImage}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000';
                }}
              />
              {listing.is_clearance && (
                <div className="absolute top-4 left-4 bg-rose-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                  Clearance Deal
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Listing Details */}
          <div className="md:col-span-6 space-y-6">
            
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-950/60 border border-indigo-800/60 text-indigo-300">
                {listing.category || 'General'}
              </span>
              {listing.location && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 border border-slate-700/80 text-slate-300">
                  📍 {listing.location}
                </span>
              )}
              {listing.target_semester && listing.target_semester !== 'General' && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-purple-950/60 border border-purple-800/60 text-purple-300">
                  🎓 {listing.target_semester}
                </span>
              )}
            </div>

            {/* Title & Price */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                {listing.title}
              </h1>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-white">
                  ₹{listing.price}
                </span>
                {listing.original_price && Number(listing.original_price) > Number(listing.price) && (
                  <span className="text-sm text-slate-500 line-through">
                    ₹{listing.original_price}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 border-t border-slate-800/80 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Description
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                {listing.description || 'No detailed description provided by the seller.'}
              </p>
            </div>

            {/* Bicycle Specs */}
            {listing.category === 'Bicycles & Mobility' && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <Bike size={16} />
                  <span>Bicycle Health &amp; Verification</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Tires</span>
                    <span className="text-slate-200 font-medium">{listing.bike_tires_condition || 'Normal'}</span>
                  </div>
                  <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Brakes</span>
                    <span className="text-slate-200 font-medium">{listing.bike_brakes_condition || 'Functional'}</span>
                  </div>
                  <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Gears</span>
                    <span className="text-slate-200 font-medium">{listing.bike_gears_condition || 'Non-Gear / Standard'}</span>
                  </div>
                  <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Lock / Bill</span>
                    <span className="text-slate-200 font-medium">{listing.bike_has_lock_or_bill ? 'Included' : 'Not Included'}</span>
                  </div>
                </div>
                {listing.frame_serial_no && (
                  <div className="text-[11px] bg-slate-950 p-2 rounded-md border border-slate-800 text-slate-400 font-mono">
                    Frame Serial: <span className="text-slate-200">{listing.frame_serial_no}</span>
                  </div>
                )}
              </div>
            )}

            {/* Extras */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {listing.includes_pyq_notes && (
                <div className="flex items-center gap-2 text-xs bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-xl text-emerald-300">
                  <BookOpen size={15} />
                  <span>Includes Solved PYQ Notes</span>
                </div>
              )}
              {listing.offers_hostel_delivery && (
                <div className="flex items-center gap-2 text-xs bg-amber-950/40 border border-amber-800/40 p-2.5 rounded-xl text-amber-300">
                  <Truck size={15} />
                  <span>Hostel Delivery (+₹{listing.delivery_tip_amount || 30})</span>
                </div>
              )}
              {listing.promised_buyback && (
                <div className="flex items-center gap-2 text-xs bg-cyan-950/40 border border-cyan-800/40 p-2.5 rounded-xl text-cyan-300">
                  <RotateCcw size={15} />
                  <span>Promised Buyback (₹{listing.buyback_price || listing.price})</span>
                </div>
              )}
              {listing.clearance_deadline && (
                <div className="flex items-center gap-2 text-xs bg-rose-950/40 border border-rose-800/40 p-2.5 rounded-xl text-rose-300">
                  <Calendar size={15} />
                  <span>Clearance deadline set</span>
                </div>
              )}
            </div>

            {/* Seller Card */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300">
                  {listing.seller_name ? listing.seller_name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-white">
                    <span>{listing.seller_name || 'Verified Student'}</span>
                    <ShieldCheck size={15} className="text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span>{listing.seller_rating ? `${listing.seller_rating} Rating` : 'New Seller (0 reviews)'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsReviewOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
              >
                Rate Seller
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleStartChat}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-600/30 transition text-sm"
              >
                <MessageSquare size={17} />
                <span>Chat with Seller</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSafeMeetupOpen(true)}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition py-1"
              >
                🛡️ View Recommended Campus Safe Meetup Hubs
              </button>
            </div>

          </div>
        </div>

      </div>

      {isReviewOpen && (
        <ReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          sellerId={listing.seller_id}
          sellerName={listing.seller_name}
        />
      )}

      {isSafeMeetupOpen && (
        <SafeMeetupModal
          isOpen={isSafeMeetupOpen}
          onClose={() => setIsSafeMeetupOpen(false)}
        />
      )}

      {isPrintModalOpen && (
        <PrintableNoticeModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          listing={listing}
        />
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Star,
  MapPin,
  Maximize2,
  X,
  Share2,
} from 'lucide-react';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!id) {
      navigate('/');
      return;
    }

    async function loadData() {
      setLoading(true);
      setErrorMsg('');

      try {
        const { data: item, error: itemErr } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (itemErr) throw itemErr;
        if (!item) throw new Error('Listing not found');

        if (isMounted) setListing(item);

        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', item.seller_id)
          .maybeSingle();

        if (profileErr) throw profileErr;
        if (isMounted) setSeller(profile);
      } catch (err) {
        if (isMounted) setErrorMsg(err.message || 'Error loading listing');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const handleStartChat = async () => {
    if (!user) {
      toast.error('Please sign in to message the seller');
      return;
    }
    if (user.id === listing.seller_id) {
      toast.error('You cannot message yourself about your own listing');
      return;
    }

    try {
      const { data: existing, error: findErr } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (findErr) throw findErr;

      if (existing) {
        navigate(`/chat/${existing.id}`);
        return;
      }

      const { data: newConvo, error: createErr } = await supabase
        .from('conversations')
        .insert([
          {
            listing_id: listing.id,
            buyer_id: user.id,
            seller_id: listing.seller_id,
          },
        ])
        .select('id')
        .single();

      if (createErr) throw createErr;
      navigate(`/chat/${newConvo.id}`);
    } catch (err) {
      toast.error(err.message || 'Could not start conversation');
    }
  };

  const handleMarkSold = async () => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', listing.id);

      if (error) throw error;

      setListing((prev) => ({ ...prev, status: 'sold' }));
      toast.success('Listing marked as sold!');
    } catch (err) {
      toast.error(err.message || 'Failed to update listing status');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Listing link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading listing details...</p>
      </div>
    );
  }

  if (errorMsg || !listing) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <p className="text-red-400 text-sm font-medium">{errorMsg || 'Listing unavailable'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  const isOwner = user?.id === listing.seller_id;
  const isSold = listing.status === 'sold';
  const displayImage =
    listing.images?.[0] ||
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&q=80';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 sm:pb-8">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
          title="Share Listing"
        >
          <Share2 size={14} />
          <span>Share</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Product Photo with Click-to-Expand */}
        <div
          onClick={() => setIsImageExpanded(true)}
          className="relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-zoom-in group"
        >
          <img
            src={displayImage}
            alt={listing.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 ${
              isSold ? 'grayscale' : ''
            }`}
          />
          {isSold && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="px-4 py-1.5 bg-red-600 text-white font-bold text-sm tracking-wide rounded-lg uppercase shadow-lg">
                Sold Out
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="p-2.5 rounded-full bg-slate-950/80 text-white backdrop-blur-sm shadow-md">
              <Maximize2 size={18} />
            </span>
          </div>
        </div>

        {/* Product Info & Actions */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/60 text-indigo-400 border border-indigo-800/80">
                <Tag size={12} />
                {listing.category}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                <MapPin size={12} className="text-indigo-400" />
                {listing.location || 'Campus 3'}
              </span>

              {isSold && (
                <span className="text-xs px-2.5 py-1 bg-red-950/60 border border-red-800 text-red-400 rounded-full font-semibold">
                  Closed
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-white leading-snug">{listing.title}</h1>
            <p className="text-3xl font-extrabold text-indigo-400 mt-2">₹{listing.price}</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-1">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Description
            </h4>
            <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
              {listing.description || 'No detailed description provided by the seller.'}
            </p>
          </div>

          {/* Left: Product Image */}
<div className="relative w-full aspect-square md:aspect-auto md:h-[420px] bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/60">
  <img
    src={listing.image_url || listing.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000'}
    alt={listing.title}
    className="w-full h-full object-cover"
    onError={(e) => {
      // Fallback if uploaded link fails or expires
      e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000';
    }}
  />
</div>

          {/* Seller Profile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">
                  {seller?.full_name || 'Campus Student'}
                </span>
                <ShieldCheck size={16} className="text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span>
                  {seller?.rating_avg ? `${seller.rating_avg.toFixed(1)} / 5.0` : 'New Seller'}
                </span>
                <span>({seller?.rating_count || 0} reviews)</span>
              </p>
            </div>

            {!isOwner && (
              <button
                onClick={() => setIsReviewOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
              >
                Rate Seller
              </button>
            )}
          </div>

          {/* Action Trigger */}
          <div className="pt-2">
            {isOwner ? (
              <button
                onClick={handleMarkSold}
                disabled={isSold}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center space-x-2 border border-slate-700"
              >
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span>{isSold ? 'Listing Marked as Sold' : 'Mark Item as Sold'}</span>
              </button>
            ) : (
              <button
                onClick={handleStartChat}
                disabled={isSold}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 active:scale-[0.99]"
              >
                <MessageSquare size={18} />
                <span>{isSold ? 'Item No Longer Available' : 'Chat with Seller'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isImageExpanded && (
        <div
          onClick={() => setIsImageExpanded(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <button
            onClick={() => setIsImageExpanded(false)}
            className="absolute top-5 right-5 text-white bg-slate-800/80 hover:bg-slate-700 p-2.5 rounded-full transition"
            title="Close Lightbox"
          >
            <X size={20} />
          </button>
          <img
            src={displayImage}
            alt={listing.title}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
          />
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        sellerId={listing.seller_id}
        sellerName={seller?.full_name || 'Seller'}
      />
    </div>
  );
}
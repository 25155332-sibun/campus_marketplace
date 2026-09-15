import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import HeroBanner from '../components/HeroBanner';
import CampusLeaderboard from '../components/CampusLeaderboard';
import ListingCard from '../components/ListingCard';
import DemandCard from '../components/DemandCard';
import CreateListingModal from '../components/CreateListingModal';
import CreateDemandModal from '../components/CreateDemandModal';
import SafeMeetupModal from '../components/SafeMeetupModal';
import PrintableNoticeModal from '../components/PrintableNoticeModal';
import FooterAbout from '../components/FooterAbout';
import { 
  Search, 
  PackageOpen, 
  Sparkles, 
  Megaphone, 
  Plus, 
  Shield, 
  Copy, 
  Printer,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  KIIT_HOTSPOTS, 
  CATEGORIES, 
  SEMESTER_BUNDLES 
} from '../constants/campus';

export default function Home() {
  const navigate = useNavigate();

  // =========================
  // STATE
  // =========================
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'requests'
  const [listings, setListings] = useState([]);
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All Spots');
  const [selectedBundle, setSelectedBundle] = useState('All Kits');
  const [onlyClearance, setOnlyClearance] = useState(false);

  // Modals
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [isSafeModalOpen, setIsSafeModalOpen] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  // =========================
  // FETCH DATA
  // =========================
  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      setLoading(true);

      if (activeTab === 'marketplace') {
        // 14-Day Stale Filter Guard
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        let query = supabase
          .from('listings')
          .select('*')
          .eq('is_sold', false)
          .gte('created_at', twoWeeksAgo.toISOString())
          .order('created_at', { ascending: false });

        if (selectedCategory !== 'All') {
          query = query.eq('category', selectedCategory);
        }

        const { data, error } = await query;

        if (!isActive) return;

        if (error) {
          console.error('Error fetching listings:', error);
          setListings([]);
        } else {
          setListings(data || []);
        }
      } else {
        // Fetch open campus requests
        let query = supabase
          .from('demands')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (!isActive) return;

        if (error) {
          console.error('Error fetching demands:', error);
          setDemands([]);
        } else {
          setDemands(data || []);
        }
      }

      setLoading(false);
    };

    loadData().catch((err) => {
      console.error('Data fetch error:', err);
      if (isActive) setLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [activeTab, selectedCategory]);

  // =========================
  // FILTERING LOGIC
  // =========================
  const searchText = search.toLowerCase().trim();

  const filteredListings = listings.filter((item) => {
    const title = item.title?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';

    const matchesSearch =
      searchText === '' ||
      title.includes(searchText) ||
      description.includes(searchText);

    const matchesZone =
      selectedZone === 'All Spots' ||
      item.campus_zone === selectedZone;

    const matchesBundle =
      selectedBundle === 'All Kits' ||
      item.target_semester === selectedBundle;

    const matchesClearance = !onlyClearance || item.is_clearance === true;

    return matchesSearch && matchesZone && matchesBundle && matchesClearance;
  });

  const filteredDemands = demands.filter((demand) => {
    const title = demand.title?.toLowerCase() || '';
    const description = demand.description?.toLowerCase() || '';

    const matchesSearch =
      searchText === '' ||
      title.includes(searchText) ||
      description.includes(searchText);

    const matchesZone =
      selectedZone === 'All Spots' ||
      demand.campus_zone === selectedZone;

    return matchesSearch && matchesZone;
  });

  // =========================
  // HANDLERS
  // =========================
  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedZone('All Spots');
    setSelectedBundle('All Kits');
    setOnlyClearance(false);
  };

  const handleExploreCategory = (cat, isClearance = false) => {
    setActiveTab('marketplace');
    setSelectedCategory(cat);
    setOnlyClearance(Boolean(isClearance));
  };

  const handleCopyBroadcast = () => {
    if (!listings.length) {
      toast.error('No listings available to broadcast');
      return;
    }

    const sampleItems = listings.slice(0, 5);
    let broadcastText = `🔥 *KIIT Hostel Clearance Broadcast:*\nCheck out these fresh student deals on CampusMarket:\n\n`;

    sampleItems.forEach((item, idx) => {
      broadcastText += `${idx + 1}. *${item.title}* — ₹${item.price} (${item.campus_zone || 'Campus 3'})\n`;
    });

    broadcastText += `\nClaim items directly before they're gone: ${window.location.origin}`;

    navigator.clipboard.writeText(broadcastText);
    toast.success('Clearance summary copied! Paste directly into your hostel WhatsApp groups.');
  };

  const handleFulfillDemand = async (demandId) => {
    try {
      const { error } = await supabase
        .from('demands')
        .update({ status: 'fulfilled' })
        .eq('id', demandId);

      if (error) throw error;

      setDemands((prev) => prev.filter((d) => d.id !== demandId));
      toast.success('Request marked as resolved!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update request');
    }
  };

  const handleDemandCreated = (newDemand) => {
    setDemands((prev) => [newDemand, ...prev]);
  };

  return (
    <div className="space-y-6 pb-4">
      {/* HERO BANNER */}
      <HeroBanner
        onExploreCategory={handleExploreCategory}
        onPostItem={() => setIsListingModalOpen(true)}
        onAskCampus={() => {
          setActiveTab('requests');
          setIsDemandModalOpen(true);
        }}
      />

      {/* CAMPUS LEADERBOARD & STATS */}
      <CampusLeaderboard />

      {/* FEED CONTROLS & UTILITY TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'marketplace'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Marketplace Feed
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'requests'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Megaphone size={13} />
            <span>Campus Requests</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsSafeModalOpen(true)}
            title="Safe Exchange Guidelines & CCTV Spots"
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <Shield size={13} className="text-emerald-400" />
            <span className="hidden sm:inline">Safe Hubs</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPosterModalOpen(true)}
            title="Generate Printable Door / Lift Notice"
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <Printer size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Door Poster</span>
          </button>

          <button
            type="button"
            onClick={handleCopyBroadcast}
            title="Copy formatted summary to paste into section WhatsApp groups"
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            <Copy size={13} className="text-indigo-400" />
            <span className="hidden sm:inline">Group Text</span>
          </button>

          {activeTab === 'requests' && (
            <button
              type="button"
              onClick={() => setIsDemandModalOpen(true)}
              className="flex items-center space-x-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <Plus size={14} />
              <span>Ask Campus</span>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH BAR & CATEGORIES */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
          <input
            type="text"
            placeholder={
              activeTab === 'marketplace'
                ? 'Search cycles, calculators, books...'
                : 'Search requested items...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {activeTab === 'marketplace' && (
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setSelectedCategory(category);
                  setOnlyClearance(false);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                  selectedCategory === category && !onlyClearance
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CLEARANCE ACTIVE FILTER PILL */}
      {onlyClearance && (
        <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-800/50 px-3 py-1.5 rounded-xl text-xs text-rose-300 w-fit">
          <Flame size={14} className="text-rose-400" />
          <span>Showing only Moving-Out Clearance listings</span>
          <button
            type="button"
            onClick={() => setOnlyClearance(false)}
            className="ml-2 underline font-bold hover:text-white"
          >
            Show All
          </button>
        </div>
      )}

      {/* SEMESTER / ACADEMIC KIT BUNDLES */}
      {activeTab === 'marketplace' && (
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider shrink-0 mr-1">
            Kits:
          </span>
          {SEMESTER_BUNDLES.map((bundle) => (
            <button
              key={bundle}
              type="button"
              onClick={() => setSelectedBundle(bundle)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition ${
                selectedBundle === bundle
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              🎓 {bundle}
            </button>
          ))}
        </div>
      )}

      {/* KIIT LANDMARKS & HOTSPOTS FILTER */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {KIIT_HOTSPOTS.map((zone) => (
          <button
            key={zone}
            type="button"
            onClick={() => setSelectedZone(zone)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedZone === zone
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {zone === 'All Spots' ? '🏫 All KIIT Spots' : `📍 ${zone}`}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-pulse flex flex-col h-64"
            >
              <div className="h-36 bg-slate-800" />
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-800/60 rounded w-full" />
                </div>
                <div className="h-5 bg-slate-800 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'marketplace' ? (
        filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center mb-3 text-indigo-400">
              <PackageOpen size={24} />
            </div>
            <h3 className="text-white font-semibold text-base">No active listings found</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm">
              {search
                ? `No items match "${search}". Try searching another keyword or resetting filters.`
                : onlyClearance
                ? 'No items currently marked for urgent moving clearance.'
                : 'Listings older than 14 days are archived automatically to ensure only fresh items on campus.'}
            </p>
            {(selectedCategory !== 'All' || selectedZone !== 'All Spots' || selectedBundle !== 'All Kits' || search || onlyClearance) && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onSelect={(item) => navigate(`/listing/${item.id}`)}
              />
            ))}
          </div>
        )
      ) : (
        filteredDemands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center mb-3 text-indigo-400">
              <Megaphone size={24} />
            </div>
            <h3 className="text-white font-semibold text-base">No open requests</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm">
              Need a drafter, lab coat, cycle, or textbook? Ask your campus peers!
            </p>
            <button
              type="button"
              onClick={() => setIsDemandModalOpen(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-md shadow-indigo-600/30"
            >
              <Plus size={14} />
              <span>Ask Campus</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDemands.map((demand) => (
              <DemandCard
                key={demand.id}
                demand={demand}
                onFulfill={handleFulfillDemand}
              />
            ))}
          </div>
        )
      )}

      {/* MODALS */}
      <CreateListingModal
        isOpen={isListingModalOpen}
        onClose={() => setIsListingModalOpen(false)}
      />

      <CreateDemandModal
        isOpen={isDemandModalOpen}
        onClose={() => setIsDemandModalOpen(false)}
        onDemandCreated={handleDemandCreated}
      />

      <SafeMeetupModal
        isOpen={isSafeModalOpen}
        onClose={() => setIsSafeModalOpen(false)}
      />

      <PrintableNoticeModal
        isOpen={isPosterModalOpen}
        onClose={() => setIsPosterModalOpen(false)}
        userListings={listings}
      />

      {/* FOOTER CONTACT & ABOUT SECTION */}
      <FooterAbout />
    </div>
  );
}
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ListingCard from '../components/ListingCard';
import { useNavigate } from 'react-router-dom';
import { Search, PackageOpen, Sparkles } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Books',
  'Cycles',
  'Electronics',
  'Others',
];

const LOCATIONS = [
  'All Locations',
  'Campus 3',
  'Campus 6',
  'Campus 12',
  'Campus 15',
  'SAC (Student Activity Centre)',
  'KP Boys Hostels',
  'QC Girls Hostels',
  'King Palace / Central Library',
];

export default function Home() {
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] =
    useState('All Locations');

  useEffect(() => {
    let isActive = true;

    const loadListings = async () => {
      setLoading(true);

      let query = supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }

      if (selectedLocation !== 'All Locations') {
        query = query.eq('location', selectedLocation);
      }

      const { data, error } = await query;

      if (!isActive) return;

      if (error) {
        console.error('Error fetching listings:', error);
        setListings([]);
      } else {
        setListings(data || []);
      }

      setLoading(false);
    };

    loadListings().catch((error) => {
      console.error('Failed to fetch listings:', error);
      if (isActive) {
        setListings([]);
        setLoading(false);
      }
    });

    return () => {
      isActive = false;
    };
  }, [selectedCategory, selectedLocation]);

  const searchText = search.toLowerCase().trim();

  const filteredListings = listings.filter((item) => {
    const title = item.title?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';

    return (
      title.includes(searchText) ||
      description.includes(searchText)
    );
  });


  // Reset all filters
  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedLocation('All Locations');
  };

  return (
    <div className="space-y-6 pb-16 sm:pb-8">

      {/* =========================
          SEARCH & FILTER TOOLBAR
      ========================== */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">

        {/* Search + Location */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-2.5 text-slate-500"
              size={18}
            />

            <input
              type="text"
              placeholder="Search books, cycles, calc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            {LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* Category Buttons */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* =========================
          LISTINGS DISPLAY
      ========================== */}

      {loading ? (

        /* Loading Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">

          {[1, 2, 3, 4, 5, 6, 7, 8].map((number) => (
            <div
              key={number}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-pulse flex flex-col"
            >
              <div className="aspect-[4/3] bg-slate-800" />

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

      ) : filteredListings.length === 0 ? (

        /* No Listings */
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 text-center px-4">

          <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center mb-3 text-indigo-400">
            <PackageOpen size={24} />
          </div>

          <h3 className="text-white font-semibold text-base">
            No listings found
          </h3>

          <p className="text-slate-400 text-xs mt-1 max-w-sm">
            {search
              ? `No items match "${search}". Try searching another keyword or resetting filters.`
              : 'Be the first student to post an item in this category or meetup zone!'}
          </p>

          {(selectedCategory !== 'All' ||
            selectedLocation !== 'All Locations' ||
            search) && (
            <button
              onClick={resetFilters}
              className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              Reset All Filters
            </button>
          )}

        </div>

      ) : (

        /* Listings Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">

          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onSelect={(item) =>
                navigate(`/listing/${item.id}`)
              }
            />
          ))}

        </div>
      )}

    </div>
  )}


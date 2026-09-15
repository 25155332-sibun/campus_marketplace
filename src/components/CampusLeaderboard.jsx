import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, TrendingUp, Flame, MapPin } from 'lucide-react';

export default function CampusLeaderboard() {
  const [stats, setStats] = useState({
    totalExchanged: 0,
    totalSaved: 0,
    topHotspots: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        // Fetch listings to compute counts & savings
        const { data: listings, error } = await supabase
          .from('listings')
          .select('campus_zone, price, original_price, is_sold');

        if (error) throw error;

        if (listings && listings.length > 0) {
          let savedRupees = 0;
          let exchangedCount = 0;
          const zoneCounts = {};

          listings.forEach((item) => {
            if (item.is_sold) exchangedCount += 1;

            if (item.original_price && item.original_price > item.price) {
              savedRupees += Number(item.original_price) - Number(item.price);
            }

            const zone = item.campus_zone || 'Central Library';
            zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
          });

          // Sort zones descending
          const rankedZones = Object.entries(zoneCounts)
            .map(([zone, count]) => ({ zone, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

          setStats({
            totalExchanged: exchangedCount || listings.length,
            totalSaved: Math.round(savedRupees),
            topHotspots: rankedZones,
          });
        }
      } catch (err) {
        console.error('Failed to load leaderboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 animate-pulse flex justify-between h-20 items-center">
        <div className="h-6 bg-slate-800 rounded w-1/3" />
        <div className="h-6 bg-slate-800 rounded w-1/4" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 rounded-2xl p-4 shadow-xl mb-4">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Left: Collective Campus Counters */}
        <div className="flex items-center gap-6 w-full lg:w-auto justify-around sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Campus Items</p>
              <p className="text-base font-extrabold text-white">{stats.totalExchanged}+ Traded</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Flame size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Peer Savings</p>
              <p className="text-base font-extrabold text-emerald-400">₹{stats.totalSaved.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Right: Hotspot Leaderboard Podium */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold shrink-0 mr-1">
            <Trophy size={14} />
            <span>Top Hotspots:</span>
          </div>

          {stats.topHotspots.map((h, index) => (
            <div
              key={h.zone}
              className="flex items-center space-x-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 shrink-0"
            >
              <span className="font-bold text-indigo-400">#{index + 1}</span>
              <MapPin size={11} className="text-emerald-400" />
              <span className="font-medium text-slate-200">{h.zone}</span>
              <span className="text-[10px] text-slate-500 font-semibold">({h.count})</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
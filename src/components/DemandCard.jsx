import { useState } from 'react';
import { MapPin, MessageSquare, AlertCircle, CheckCircle, Users, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function DemandCard({ demand, onFulfill }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [poolCount, setPoolCount] = useState(demand.upvote_count || 1);
  const [hasPooled, setHasPooled] = useState(false);
  const [pooling, setPooling] = useState(false);

  const handlePoolToggle = async () => {
    if (!user) {
      toast.error('Please sign in to join this request pool');
      return;
    }

    if (user.id === demand.user_id) {
      toast.info('You started this request pool!');
      return;
    }

    if (pooling) return;
    setPooling(true);

    try {
      if (hasPooled) {
        await supabase
          .from('demand_supporters')
          .delete()
          .match({ demand_id: demand.id, user_id: user.id });

        await supabase
          .from('demands')
          .update({ upvote_count: Math.max(1, poolCount - 1) })
          .eq('id', demand.id);

        setPoolCount((prev) => Math.max(1, prev - 1));
        setHasPooled(false);
      } else {
        const { error } = await supabase
          .from('demand_supporters')
          .insert([{ demand_id: demand.id, user_id: user.id }]);

        if (error && error.code !== '23505') throw error;

        await supabase
          .from('demands')
          .update({ upvote_count: poolCount + 1 })
          .eq('id', demand.id);

        setPoolCount((prev) => prev + 1);
        setHasPooled(true);
        toast.success('Added you to this request pool!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not update request pool');
    } finally {
      setPooling(false);
    }
  };

  const handleShareDemand = (e) => {
    e.stopPropagation();
    const shareUrl = window.location.origin;
    const message = `🚨 *KIIT Campus Request:*\nLooking for: *${demand.title}*\n📍 *Meetup Hotspot:* ${demand.campus_zone || 'Campus'}\n💰 *Target Budget:* ${demand.target_budget ? `₹${demand.target_budget}` : 'Negotiable'}\n\nGot this item? Claim it on CampusMarket: ${shareUrl}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    toast.success('Opening WhatsApp to share with hostel group!');
  };

  const handleRespond = () => {
    if (!user) {
      toast.error('Please sign in to contact this student');
      return;
    }
    if (user.id === demand.user_id) {
      toast.info('This is your own request');
      return;
    }
    navigate(`/inbox?recipient=${demand.user_id}&subject=Re: ${encodeURIComponent(demand.title)}`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded-md">
            {demand.category}
          </span>
          {demand.urgency === 'urgent' && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-md">
              <AlertCircle size={11} /> Urgent
            </span>
          )}
        </div>

        <h3 className="text-white font-semibold text-sm line-clamp-1">{demand.title}</h3>
        {demand.description && (
          <p className="text-slate-400 text-xs mt-1 line-clamp-2">{demand.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-2.5 py-0.5">
            <MapPin size={11} className="shrink-0" />
            <span>{demand.campus_zone || 'Campus'}</span>
          </div>

          <button
            onClick={handlePoolToggle}
            disabled={pooling}
            title="Click to join request pool"
            className={`flex items-center space-x-1 text-[11px] font-semibold rounded-lg px-2.5 py-0.5 transition border ${
              hasPooled
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40 hover:bg-indigo-900/60'
            }`}
          >
            <Users size={11} />
            <span>{poolCount} {poolCount === 1 ? 'wants this' : 'want this'}</span>
            {!hasPooled && user?.id !== demand.user_id && (
              <span className="text-[10px] text-indigo-300 font-bold ml-1">+1</span>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase">Target Budget</p>
          <span className="text-sm font-bold text-white">
            {demand.target_budget ? `₹${demand.target_budget}` : 'Negotiable'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleShareDemand}
            title="Share to WhatsApp"
            className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg transition"
          >
            <Share2 size={13} />
          </button>

          {user?.id === demand.user_id ? (
            <button
              onClick={() => onFulfill?.(demand.id)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
            >
              <CheckCircle size={13} />
              <span>Mark Found</span>
            </button>
          ) : (
            <button
              onClick={handleRespond}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-95"
            >
              <MessageSquare size={13} />
              <span>I Have This</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
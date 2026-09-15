import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { X, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const CAMPUS_HOTSPOTS = [
  'Central Library',
  'Student Union / Canteen',
  'Hostel Block A',
  'Hostel Block B',
  'Sports Complex',
  'Main Gate',
];

const CATEGORIES = [
  'Textbooks & Notes',
  'Electronics & Gadgets',
  'Hostel & Room Essentials',
  'Bicycles & Mobility',
  'Fashion & Lab Coats',
  'Other',
];

export default function CreateDemandModal({ isOpen, onClose, onDemandCreated }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [campusZone, setCampusZone] = useState(CAMPUS_HOTSPOTS[0]);
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to post a request');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.from('demands').insert([
        {
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          target_budget: budget ? parseFloat(budget) : null,
          category,
          campus_zone: campusZone,
          urgency: isUrgent ? 'urgent' : 'normal',
          status: 'open',
        },
      ]).select();

      if (error) throw error;

      toast.success('Request posted to Campus Hotspot!');
      onDemandCreated?.(data[0]);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to post request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Post an Item Request</h2>
            <p className="text-xs text-slate-400">Ask peers in your campus zone if they have this</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Looking For *</label>
            <input
              type="text"
              required
              placeholder="e.g. Casio fx-991EX Scientific Calc"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Max Budget (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center space-x-1">
              <MapPin size={13} className="text-emerald-400" />
              <span>Preferred Meetup Hotspot</span>
            </label>
            <select
              value={campusZone}
              onChange={(e) => setCampusZone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {CAMPUS_HOTSPOTS.map((zone) => (
                <option key={zone} value={zone}>📍 {zone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Note / Requirement</label>
            <textarea
              rows={2}
              placeholder="e.g. Needed urgently before midterms on Friday..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
            />
            <span className="flex items-center gap-1 font-medium text-amber-400">
              <AlertCircle size={14} /> Mark as Urgent Request
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              <span>{loading ? 'Posting...' : 'Post Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
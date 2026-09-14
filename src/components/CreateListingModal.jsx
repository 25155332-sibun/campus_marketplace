import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { generateListingDetails } from '../lib/gemini';
import { X, UploadCloud, Sparkles, Loader2 } from 'lucide-react';

const CATEGORIES = ['Books', 'Cycles', 'Electronics', 'Others'];
const LOCATIONS = [
  'Campus 3',
  'Campus 6',
  'Campus 12',
  'Campus 15',
  'SAC (Student Activity Centre)',
  'KP Boys Hostels',
  'QC Girls Hostels',
  'King Palace / Central Library',
];

export default function CreateListingModal({ isOpen, onClose, onListingCreated }) {
  const { user } = useAuth();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AI Assistant states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAiAutoFill = async () => {
    if (!aiPrompt.trim()) {
      setError('Please provide a short description or rough notes for the AI.');
      return;
    }

    setError('');
    setAiGenerating(true);
    setAiSuccess(false);

    try {
      const generated = await generateListingDetails(aiPrompt);
      if (generated.title) setTitle(generated.title);
      if (generated.suggestedPrice) setPrice(generated.suggestedPrice.toString());
      if (generated.category && CATEGORIES.includes(generated.category)) {
        setCategory(generated.category);
      }
      if (generated.description) setDescription(generated.description);
      setAiSuccess(true);
    } catch (err) {
      setError(err.message || 'AI generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to post an item.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase.from('listings').insert([
        {
          seller_id: user.id,
          title,
          description,
          price: parseFloat(price),
          category,
          location,
          images: imageUrl ? [imageUrl] : [],
          status: 'active',
        },
      ]);

      if (insertError) throw insertError;

      setTitle('');
      setDescription('');
      setPrice('');
      setAiPrompt('');
      setAiSuccess(false);
      setCategory(CATEGORIES[0]);
      setLocation(LOCATIONS[0]);
      setImageFile(null);
      setImagePreview(null);

      if (onListingCreated) onListingCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold text-white">Sell an Item</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-800 text-indigo-400 font-medium">
            Campus Marketplace
          </span>
        </div>

        {/* AI Listing Copilot Box */}
        <div className="mb-5 p-3.5 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-800/50 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-400" />
              AI Listing Assistant
            </span>
            {aiSuccess && (
              <span className="text-[11px] text-emerald-400 font-medium">Form filled! ✨</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., 2nd year cse btech books semester 3 barely read"
              className="flex-1 bg-slate-950/80 border border-indigo-900/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              disabled={aiGenerating || !aiPrompt.trim()}
              onClick={handleAiAutoFill}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shrink-0"
            >
              {aiGenerating ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  Auto-fill
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Item Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Hero Sprint Cycle, 7 Gear"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Price (₹)</label>
            <input
              type="number"
              required
              min="0"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="2500"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Meetup Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Condition, hostel block, pickup details..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Item Photo</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-4 cursor-pointer bg-slate-800/50 transition">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-28 object-contain rounded-lg" />
              ) : (
                <div className="flex flex-col items-center space-y-1 text-slate-400">
                  <UploadCloud size={22} />
                  <span className="text-xs">Click to upload photo</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Upload,
  Loader2,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';

const CAMPUS_HOTSPOTS = [
  'Campus 3',
  'Campus 6',
  'Campus 12',
  'Campus 15',
  'SAC (Student Activity Centre)',
  'KP Boys Hostels',
  'QC Girls Hostels',
  'King Palace / Central Library',
];

const CATEGORIES = [
  'Books',
  'Cycles',
  'Electronics',
  'Others',
];

export default function CreateListingModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [campusZone, setCampusZone] = useState(CAMPUS_HOTSPOTS[0]);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Clean up image preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!isOpen) {
    return null;
  }

  // =========================
  // IMAGE SELECTION
  // =========================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Only allow images
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Maximum 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    // Remove old preview URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // =========================
  // AI OPTIMIZATION
  // =========================

  const handleAiOptimize = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      toast.error('Gemini API key is not configured');
      return;
    }

    if (!title.trim()) {
      toast.error('Enter a title first so AI can polish it');
      return;
    }

    setAiAnalyzing(true);

    try {
      const prompt = `
You are an AI assistant for a student campus marketplace.

Rewrite the following item listing to make it:
- appealing
- clear
- concise
- trustworthy
- suitable for university students

Title: "${title}"

Description: "${description || 'None provided'}"

Category: "${category}"

Respond ONLY with valid JSON.
Do not include markdown or code fences.

Use exactly this structure:
{
  "suggestedTitle": "...",
  "suggestedDescription": "..."
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      const rawText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('No response received from Gemini');
      }

      const cleanedJson = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleanedJson);

      if (parsed.suggestedTitle) {
        setTitle(parsed.suggestedTitle);
      }

      if (parsed.suggestedDescription) {
        setDescription(parsed.suggestedDescription);
      }

      toast.success('Listing polished with Gemini AI!');
    } catch (error) {
      console.error('Gemini optimization error:', error);
      toast.error('Could not optimize the listing with AI');
    } finally {
      setAiAnalyzing(false);
    }
  };

  // =========================
  // CREATE LISTING
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please log in before creating a listing');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (!price || Number(price) < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // =========================
      // UPLOAD IMAGE
      // =========================

      if (imageFile) {
        const fileExtension =
          imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';

        const fileName = `${user.id}-${Date.now()}.${fileExtension}`;

        const filePath = `listings/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          throw new Error('Failed to upload image');
        }

        const { data: publicUrlData } = supabase.storage
          .from('listing-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrlData?.publicUrl || null;
      }

      // =========================
      // INSERT LISTING
      // =========================

      const { data, error } = await supabase
        .from('listings')
        .insert([
          {
            user_id: user.id,
            title: title.trim(),
            description: description.trim(),
            price: Number(price),
            category,
            location: campusZone,
            image_url: imageUrl,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Create listing error:', error);
        throw error;
      }

      console.log('Listing created:', data);

      toast.success('Listing created successfully!');

      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory(CATEGORIES[0]);
      setCampusZone(CAMPUS_HOTSPOTS[0]);
      setImageFile(null);

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setImagePreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onClose();
    } catch (error) {
      console.error('Error creating listing:', error);

      toast.error(
        error?.message || 'Failed to create listing. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">

      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800">

          <div>
            <h2 className="text-lg font-semibold text-white">
              Create Listing
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Sell or exchange something with fellow students
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>

        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Item Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Engineering Mathematics Book"
              maxLength={100}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Description
              </label>

              <button
                type="button"
                onClick={handleAiOptimize}
                disabled={aiAnalyzing || !title.trim()}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {aiAnalyzing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Optimize with AI
                  </>
                )}
              </button>
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item's condition, brand, age, reason for selling, etc."
              rows={4}
              maxLength={1000}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />

            <p className="text-[11px] text-slate-500 mt-1 text-right">
              {description.length}/1000
            </p>
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Price (₹)
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((itemCategory) => (
                  <option
                    key={itemCategory}
                    value={itemCategory}
                  >
                    {itemCategory}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Meetup Location
            </label>

            <div className="relative">
              <MapPin
                size={17}
                className="absolute left-3 top-3 text-slate-500"
              />

              <select
                value={campusZone}
                onChange={(e) => setCampusZone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                {CAMPUS_HOTSPOTS.map((location) => (
                  <option
                    key={location}
                    value={location}
                  >
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Item Image
            </label>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800">

                <img
                  src={imagePreview}
                  alt="Listing preview"
                  className="w-full h-64 object-cover"
                />

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-xl bg-black/70 text-white hover:bg-black/90 transition"
                >
                  <X size={18} />
                </button>

              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 flex flex-col items-center justify-center text-center transition"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <Upload size={22} />
                </div>

                <p className="text-sm font-medium text-slate-300">
                  Upload an image
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  PNG, JPG or WEBP • Maximum 5MB
                </p>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Creating...
                </>
              ) : (
                'Create Listing'
              )}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}
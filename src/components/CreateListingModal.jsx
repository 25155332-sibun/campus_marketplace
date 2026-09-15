import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Upload,
  Loader2,
  Sparkles,
  MapPin,
  Clock,
  Flame,
  FileText,
  Truck,
  RotateCcw,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  KIIT_HOTSPOTS,
  CATEGORIES,
  SEMESTER_BUNDLES,
  MEETUP_WINDOWS,
} from '../constants/campus';

const PICKUP_HOTSPOTS = (KIIT_HOTSPOTS || []).filter(
  (spot) => spot !== 'All Spots'
);

const LISTING_CATEGORIES = (CATEGORIES || []).filter(
  (cat) => cat !== 'All'
);

export default function CreateListingModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // -----------------------------
  // BASIC LISTING
  // -----------------------------
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');

  const [category, setCategory] = useState(
    LISTING_CATEGORIES[0] || 'Textbooks & Notes'
  );

  const [campusZone, setCampusZone] = useState(
    PICKUP_HOTSPOTS[0] || 'Campus 3 (Library & KSOM)'
  );

  const [meetupWindow, setMeetupWindow] = useState(
    MEETUP_WINDOWS?.[0] || 'Flexible / Anytime'
  );

  const [targetSemester, setTargetSemester] = useState(
    SEMESTER_BUNDLES?.[0] || 'All Kits'
  );

  // -----------------------------
  // FEATURE 1: FLASH CLEARANCE
  // -----------------------------
  const [isClearance, setIsClearance] = useState(false);
  const [clearanceHours, setClearanceHours] = useState('48');

  // -----------------------------
  // FEATURE 2: HOSTEL DELIVERY
  // -----------------------------
  const [offersDelivery, setOffersDelivery] = useState(false);
  const [deliveryTip, setDeliveryTip] = useState('30');

  // -----------------------------
  // FEATURE 3: BICYCLE HEALTH
  // -----------------------------
  const [frameSerialNo, setFrameSerialNo] = useState('');
  const [bikeTires, setBikeTires] = useState('Good / Inflated');
  const [bikeBrakes, setBikeBrakes] = useState('Fully Functional');
  const [bikeGears, setBikeGears] = useState(
    'Smooth Shifting / Non-Gear'
  );
  const [bikeLock, setBikeLock] = useState(true);

  // -----------------------------
  // FEATURE 4: BUYBACK
  // -----------------------------
  const [hasBuyback, setHasBuyback] = useState(false);
  const [buybackPrice, setBuybackPrice] = useState('');

  // -----------------------------
  // FEATURE 5: PYQ
  // -----------------------------
  const [includesPyq, setIncludesPyq] = useState(false);
  const [syllabusYear, setSyllabusYear] = useState(
    '2024-2025 Revised Autonomous Scheme'
  );

  // -----------------------------
  // IMAGE / UI
  // -----------------------------
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // -----------------------------
  // CLEAN IMAGE PREVIEW
  // -----------------------------
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // -----------------------------
  // RESET FORM
  // -----------------------------
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setOriginalPrice('');

    setCategory(
      LISTING_CATEGORIES[0] || 'Textbooks & Notes'
    );

    setCampusZone(
      PICKUP_HOTSPOTS[0] || 'Campus 3 (Library & KSOM)'
    );

    setMeetupWindow(
      MEETUP_WINDOWS?.[0] || 'Flexible / Anytime'
    );

    setTargetSemester(
      SEMESTER_BUNDLES?.[0] || 'All Kits'
    );

    setIsClearance(false);
    setClearanceHours('48');

    setOffersDelivery(false);
    setDeliveryTip('30');

    setFrameSerialNo('');
    setBikeTires('Good / Inflated');
    setBikeBrakes('Fully Functional');
    setBikeGears('Smooth Shifting / Non-Gear');
    setBikeLock(true);

    setHasBuyback(false);
    setBuybackPrice('');

    setIncludesPyq(false);
    setSyllabusYear('2024-2025 Revised Autonomous Scheme');

    setImageFile(null);
    setImagePreview(null);

    setLoading(false);
    setAiAnalyzing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // -----------------------------
  // CLOSE
  // -----------------------------
  const handleClose = () => {
    if (loading || aiAnalyzing) return;

    resetForm();
    onClose();
  };

  // -----------------------------
  // IMAGE
  // -----------------------------
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // -----------------------------
  // AI OPTIMIZATION
  // -----------------------------
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

    if (aiAnalyzing || loading) return;

    setAiAnalyzing(true);

    try {
      const prompt = `
Rewrite the student's existing KIIT campus marketplace listing.

This is an editing task, not a content-generation task:
- Improve the wording, grammar, clarity, and readability of the title and description.
- Preserve the student's meaning and every factual detail they provided.
- Do not invent a brand, model, condition, price, feature, quantity, location, or availability.
- Do not add generic claims or details that are not in the input.
- The selected category is authoritative: make the rewritten title clearly relevant to that category, but never change the category or make the item sound like another category.
- Keep the title concise and the description easy to scan.
- If the description is empty, return an empty suggestedDescription instead of inventing one.

Selected category: ${category}

Existing title:
${title}

Existing description:
${description}

Return ONLY valid JSON in this exact format:
{
  "suggestedTitle": "rewritten title",
  "suggestedDescription": "rewritten description"
}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let response;
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }],
              }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
                maxOutputTokens: 256,
                thinkingConfig: {
                  thinkingLevel: 'minimal',
                },
              },
            }),
          }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.message || 'Gemini API request failed'
        );
      }

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
        setTitle(parsed.suggestedTitle.trim());
      }

      if (parsed.suggestedDescription) {
        setDescription(parsed.suggestedDescription.trim());
      }

      toast.success('Listing enhanced with Gemini AI!');
    } catch (error) {
      console.error('AI optimization error:', error);
      toast.error(
        error.name === 'AbortError'
          ? 'AI optimization timed out. Please try again.'
          : error.message || 'AI optimization failed'
      );
    } finally {
      setAiAnalyzing(false);
    }
  };

  // -----------------------------
  // SUBMIT
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Sign in required');
      return;
    }

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!price || Number(price) < 0) {
      toast.error('Enter a valid selling price');
      return;
    }

    if (originalPrice && Number(originalPrice) < 0) {
      toast.error('Enter a valid original price');
      return;
    }

    if (
      originalPrice &&
      Number(originalPrice) < Number(price)
    ) {
      toast.error(
        'Retail MRP should normally be greater than the selling price'
      );
      return;
    }

    if (isClearance) {
      const hours = Number(clearanceHours);

      if (!hours || hours <= 0) {
        toast.error('Enter valid clearance hours');
        return;
      }
    }

    if (offersDelivery) {
      const tip = Number(deliveryTip);

      if (!tip || tip < 0) {
        toast.error('Enter a valid delivery tip');
        return;
      }
    }

    if (hasBuyback) {
      const buyback = Number(buybackPrice);

      if (!buyback || buyback < 0) {
        toast.error('Enter a valid buyback price');
        return;
      }
    }

    setLoading(true);

    let uploadedFilePath = null;

    try {
      // -----------------------------
      // IMAGE UPLOAD
      // -----------------------------
      let imageUrl = null;

      if (imageFile) {
        const extension =
          imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';

        const fileName = `${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
            .from('listing-images')
            .upload(fileName, imageFile, {
              cacheControl: '3600',
              upsert: false,
              contentType: imageFile.type,
            });

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        uploadedFilePath = fileName;
        const { data: publicData } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName);

        imageUrl = publicData?.publicUrl || null;
      }

      // -----------------------------
      // CLEARANCE DEADLINE
      // -----------------------------
      let clearanceDeadline = null;

      if (isClearance) {
        const deadline = new Date();

        deadline.setHours(
          deadline.getHours() + Number(clearanceHours)
        );

        clearanceDeadline = deadline.toISOString();
      }

      // -----------------------------
      // LISTING DATA
      // -----------------------------
      const listingData = {
        seller_id: user.id,

        title: title.trim(),
        description: description.trim(),

        price: Number(price),

        original_price: originalPrice
          ? Number(originalPrice)
          : null,

        category,

        campus_zone: campusZone,

        meetup_window: meetupWindow,

        target_semester: targetSemester,

        image_url: imageUrl,

        status: 'active',

        // Flash clearance
        is_clearance: isClearance,
        clearance_deadline: clearanceDeadline,

        // Hostel delivery
        offers_hostel_delivery: offersDelivery,
        delivery_tip_amount: offersDelivery
          ? Number(deliveryTip)
          : null,

        // Bicycle information
        frame_serial_no:
          category === 'Bicycles & Mobility'
            ? frameSerialNo.trim() || null
            : null,

        bike_tires_condition:
          category === 'Bicycles & Mobility'
            ? bikeTires
            : null,

        bike_brakes_condition:
          category === 'Bicycles & Mobility'
            ? bikeBrakes
            : null,

        bike_gears_condition:
          category === 'Bicycles & Mobility'
            ? bikeGears
            : null,

        bike_has_lock_or_bill:
          category === 'Bicycles & Mobility'
            ? bikeLock
            : false,

        // Buyback
        promised_buyback: hasBuyback,

        buyback_price:
          hasBuyback && buybackPrice
            ? Number(buybackPrice)
            : null,

        // Academic material
        includes_pyq_notes:
          category === 'Textbooks & Notes'
            ? includesPyq
            : false,

        syllabus_year:
          category === 'Textbooks & Notes'
            ? syllabusYear
            : null,
      };

      // -----------------------------
      // INSERT
      // -----------------------------
      let { error: insertError } = await supabase
        .from('listings')
        .insert([listingData]);

      // Older databases may not have the optional image column yet.
      if (insertError?.message?.includes("'image_url'")) {
        if (uploadedFilePath) {
          await supabase.storage
            .from('listing-images')
            .remove([uploadedFilePath]);
          uploadedFilePath = null;
        }

        const listingWithoutImage = { ...listingData };
        delete listingWithoutImage.image_url;

        ({ error: insertError } = await supabase
          .from('listings')
          .insert([listingWithoutImage]));
      }

      if (insertError) {
        throw new Error(insertError.message);
      }

      toast.success('Listing published successfully!');

      resetForm();
      onClose();
    } catch (error) {
      console.error('Listing creation error:', error);

      if (uploadedFilePath) {
        await supabase.storage
          .from('listing-images')
          .remove([uploadedFilePath]);
      }

      toast.error(
        error?.message || 'Listing creation failed'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">

          <div>
            <h2 className="text-lg font-bold text-white">
              List an Item
            </h2>

            <p className="text-xs text-slate-400">
              KIIT student-to-student marketplace
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading || aiAnalyzing}
            className="rounded-lg p-1 text-slate-400 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4"
        >

          {/* TITLE */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">

              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Title *
              </label>

              <button
                type="button"
                onClick={handleAiOptimize}
                disabled={aiAnalyzing || loading}
                className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 transition hover:text-indigo-300 disabled:opacity-50"
              >
                {aiAnalyzing ? (
                  <Loader2
                    size={12}
                    className="animate-spin"
                  />
                ) : (
                  <Sparkles size={12} />
                )}

                <span>
                  {aiAnalyzing
                    ? 'Polishing...'
                    : 'AI Polish'}
                </span>
              </button>
            </div>

            <input
              type="text"
              required
              maxLength={120}
              placeholder="e.g., Hercules Gear Cycle / Casio fx-991EX"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* PRICE + MRP + CATEGORY */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Campus Price (₹) *
              </label>

              <input
                type="number"
                min="0"
                required
                placeholder="250"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Retail MRP (₹)
                <span className="ml-1 lowercase font-normal text-slate-500">
                  (opt)
                </span>
              </label>

              <input
                type="number"
                min="0"
                placeholder="800"
                value={originalPrice}
                onChange={(e) =>
                  setOriginalPrice(e.target.value)
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Category *
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {LISTING_CATEGORIES.map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                  >
                    {cat}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* FLASH CLEARANCE */}
          <div className="rounded-xl border border-orange-800/40 bg-orange-950/20 p-3.5">

            <div className="flex items-center justify-between">

              <div>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-orange-400">
                  <Flame size={14} />
                  Flash Clearance
                </label>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Mark this listing as a limited-time deal.
                </p>
              </div>

              <input
                type="checkbox"
                checked={isClearance}
                onChange={(e) =>
                  setIsClearance(e.target.checked)
                }
                className="h-4 w-4 cursor-pointer rounded border-slate-700 bg-slate-950 text-orange-500"
              />
            </div>

            {isClearance && (
              <div className="mt-3">

                <label className="mb-1 block text-[11px] text-slate-400">
                  Clearance duration
                </label>

                <select
                  value={clearanceHours}
                  onChange={(e) =>
                    setClearanceHours(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="6">6 hours</option>
                  <option value="12">12 hours</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                </select>

              </div>
            )}

          </div>

          {/* BICYCLE */}
          {category === 'Bicycles & Mobility' && (
            <div className="space-y-3 rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-3.5">

              <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Wrench size={14} />
                Bicycle Health Card
              </label>

              <input
                type="text"
                placeholder="Frame Serial No. (optional)"
                value={frameSerialNo}
                onChange={(e) =>
                  setFrameSerialNo(e.target.value)
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2">

                <div>
                  <span className="mb-1 block text-[10px] text-slate-400">
                    Tires
                  </span>

                  <select
                    value={bikeTires}
                    onChange={(e) =>
                      setBikeTires(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  >
                    <option>Brand New</option>
                    <option>Good / Inflated</option>
                    <option>Worn / Needs Air</option>
                  </select>
                </div>

                <div>
                  <span className="mb-1 block text-[10px] text-slate-400">
                    Brakes
                  </span>

                  <select
                    value={bikeBrakes}
                    onChange={(e) =>
                      setBikeBrakes(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                  >
                    <option>Fully Functional</option>
                    <option>Soft / Needs Pad Change</option>
                  </select>
                </div>

              </div>

              <div>
                <span className="mb-1 block text-[10px] text-slate-400">
                  Gears
                </span>

                <select
                  value={bikeGears}
                  onChange={(e) =>
                    setBikeGears(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white"
                >
                  <option>
                    Smooth Shifting / Non-Gear
                  </option>
                  <option>
                    Needs Adjustment
                  </option>
                  <option>
                    Not Functional
                  </option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={bikeLock}
                  onChange={(e) =>
                    setBikeLock(e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                />

                <span>
                  Includes original bill and/or cycle lock
                </span>
              </label>

            </div>
          )}

          {/* TEXTBOOK */}
          {category === 'Textbooks & Notes' && (
            <div className="space-y-2 rounded-xl border border-indigo-800/40 bg-indigo-950/20 p-3.5">

              <label className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <FileText size={14} />
                Academic Perks
              </label>

              <select
                value={syllabusYear}
                onChange={(e) =>
                  setSyllabusYear(e.target.value)
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-white"
              >
                <option value="2024-2025 Revised Autonomous Scheme">
                  2024-2025 Revised Autonomous Scheme
                </option>

                <option value="2022-2023 Scheme">
                  2022-2023 Scheme
                </option>
              </select>

              <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-indigo-200">

                <input
                  type="checkbox"
                  checked={includesPyq}
                  onChange={(e) =>
                    setIncludesPyq(e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                />

                <span>
                  Includes solved Mid-Sem/End-Sem papers or formula sheet
                </span>

              </label>

            </div>
          )}

          {/* DELIVERY */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">

            <div className="flex items-center justify-between">

              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                  <Truck size={14} />
                  Hostel Gate Delivery
                </label>

                <p className="text-[11px] text-slate-400">
                  Offer delivery to the buyer's hostel gate.
                </p>
              </div>

              <input
                type="checkbox"
                checked={offersDelivery}
                onChange={(e) =>
                  setOffersDelivery(e.target.checked)
                }
                className="h-4 w-4 cursor-pointer rounded border-slate-700 bg-slate-900"
              />

            </div>

            {offersDelivery && (
              <div className="mt-3">

                <label className="mb-1 block text-[11px] text-slate-400">
                  Delivery tip (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  value={deliveryTip}
                  onChange={(e) =>
                    setDeliveryTip(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                />

              </div>
            )}

          </div>

          {/* BUYBACK */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">

            <div className="flex items-center justify-between">

              <div>
                <label className="flex items-center gap-1 text-xs font-bold text-indigo-400">
                  <RotateCcw size={14} />
                  Promised Buy-Back
                </label>

                <p className="text-[11px] text-slate-400">
                  Agree to buy the item back later.
                </p>
              </div>

              <input
                type="checkbox"
                checked={hasBuyback}
                onChange={(e) =>
                  setHasBuyback(e.target.checked)
                }
                className="h-4 w-4 cursor-pointer rounded border-slate-700 bg-slate-900"
              />

            </div>

            {hasBuyback && (
              <div className="mt-3">

                <label className="mb-1 block text-[11px] text-slate-400">
                  Buyback Price (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder="300"
                  value={buybackPrice}
                  onChange={(e) =>
                    setBuybackPrice(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                />

              </div>
            )}

          </div>

          {/* LOCATION */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            <div>

              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <MapPin
                  size={14}
                  className="text-emerald-400"
                />
                KIIT Pickup Hotspot
              </label>

              <select
                value={campusZone}
                onChange={(e) =>
                  setCampusZone(e.target.value)
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {PICKUP_HOTSPOTS.map((zone) => (
                  <option
                    key={zone}
                    value={zone}
                  >
                    {zone}
                  </option>
                ))}
              </select>

            </div>

            <div>

              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Clock
                  size={14}
                  className="text-amber-400"
                />
                Meetup Window
              </label>

              <select
                value={meetupWindow}
                onChange={(e) =>
                  setMeetupWindow(e.target.value)
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {MEETUP_WINDOWS.map((window) => (
                  <option
                    key={window}
                    value={window}
                  >
                    {window}
                  </option>
                ))}
              </select>

            </div>

          </div>

          {/* TARGET STUDENTS */}
          <div>

            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Target Students
            </label>

            <select
              value={targetSemester}
              onChange={(e) =>
                setTargetSemester(e.target.value)
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              {SEMESTER_BUNDLES?.map((bundle) => (
                <option
                  key={bundle}
                  value={bundle}
                >
                  {bundle}
                </option>
              ))}
            </select>

          </div>

          {/* DESCRIPTION */}
          <div>

            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Description
            </label>

            <textarea
              rows={3}
              maxLength={1000}
              placeholder="Condition details, bundle inclusions, pickup notes..."
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />

            <div className="mt-1 text-right text-[10px] text-slate-600">
              {description.length}/1000
            </div>

          </div>

          {/* PHOTO */}
          <div>

            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Item Photo
            </label>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950">

                <img
                  src={imagePreview}
                  alt="Listing preview"
                  className="h-full w-full object-contain"
                />

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute right-2 top-2 rounded-lg bg-black/70 p-1.5 text-white hover:bg-black"
                >
                  <X size={16} />
                </button>

              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/40 p-5 text-slate-400 hover:border-slate-700"
              >
                <Upload
                  size={22}
                  className="mb-1 text-slate-500"
                />

                <span className="text-xs font-medium">
                  Upload photo
                </span>

                <span className="mt-1 text-[10px] text-slate-600">
                  JPG, PNG, WEBP • Max 5MB
                </span>
              </button>
            )}

          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end space-x-3 border-t border-slate-800 pt-3">

            <button
              type="button"
              onClick={handleClose}
              disabled={loading || aiAnalyzing}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || aiAnalyzing}
              className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              <span>
                {loading
                  ? 'Publishing...'
                  : 'Publish Listing'}
              </span>

            </button>

          </div>

        </form>
      </div>
    </div>
  );
}
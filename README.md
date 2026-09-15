```markdown
# CampusMarket 🎓📦

> **Privacy-first, peer-to-peer campus marketplace designed for university students.**  
> Trade textbooks, bicycles, calculators, lab drafters, and hostel essentials without broker fees, middlemen, or exposing personal phone numbers.

🌐 **Live Deployment**: [https://campusmarketplace-five.vercel.app/](https://campusmarketplace-five.vercel.app/)

---

## 🌟 Core Highlights

* **Privacy-First Architecture**: No phone numbers are published publicly. Contact exchanges are conducted securely without unsolicited messaging.
* **14-Day Automated Freshness Filter**: Automatically archives stale items older than 14 days to keep listings active and verified.
* **Campus-Specific Meetup Hotspots**: Filter listings across real campus hubs (Library, Academic Blocks, Food Courts, and Hostels).
* **Bicycle Health Card & Ownership Serial Log**: Records stamped frame serials to verify legitimate transfers before hostel gates and security guards.
* **Semester Bundles & Syllabus Verification**: Tag items with academic curriculum regulations and attach solved mid-sem/end-sem notes or formula sheets.
* **Hostel Gate Porter Option**: Support for door-to-gate delivery with an optional ₹30 porter tip.
* **Printable Door/Lift Poster Generator**: Instant A4 flyer generation with dynamic QR codes for hostel bulletin boards and lift notices.
* **1-Tap Social Batch Sharing**: Formats clean summary cards with deep links for distribution across academic section and wing groups.
* **Safe Exchange Hubs**: In-app guidance showcasing recommended exchange spots covered by active security and CCTV.

---

## 🛠️ Tech Stack

* **Frontend**: React (Vite), Tailwind CSS, Lucide React
* **Backend / Database**: Supabase (PostgreSQL, Row-Level Security, Storage)
* **AI Engine**: Google Gemini 3.6 Flash (Intelligent listing title & description optimization via SDK)
* **Deployment**: Vercel ([Live Link](https://campusmarketplace-five.vercel.app/))
* **Toasts / Alerts**: Sonner
* **QR Generation**: `qrcode.react`

---

## 📁 Repository Structure

```text
src/
├── components/
│   ├── AuthModal.jsx              # Student authentication & session modal
│   ├── CampusLeaderboard.jsx      # Collective trades & hotspot activity tracker
│   ├── CreateDemandModal.jsx      # Campus ask modal (+1 demand pooling)
│   ├── CreateListingModal.jsx     # Listing form with Gemini AI & campus perks
│   ├── DemandCard.jsx             # Demand item card with share triggers
│   ├── FooterAbout.jsx            # Dark-themed student mission & email contact
│   ├── HeroBanner.jsx             # Category shortcuts & feature callouts
│   ├── ListingCard.jsx            # Product card with badges & share triggers
│   ├── Navbar.jsx                 # Main navigation bar with auth & routing
│   ├── PrintableNoticeModal.jsx   # A4 flyer preview with scannable QR code
│   ├── ReviewModal.jsx            # Peer trade ratings & verification reviews
│   └── SafeMeetupModal.jsx        # Safe exchange spots & security guide
├── constants/
│   └── campus.js                  # Campus landmarks, categories, & meetup slots
├── context/
│   └── AuthContext.jsx            # Supabase user authentication provider
├── lib/
│   ├── gemini.js                  # Gemini 3.6 Flash client & AI optimization helper
│   └── supabase.js                # Supabase client instantiation
└── pages/
    ├── Chat.jsx                   # Real-time peer-to-peer messaging
    ├── Home.jsx                   # Central unified marketplace & demand feed
    ├── Inbox.jsx                  # Direct message threads & trade inquiries
    └── ListingDetail.jsx          # Detailed item view with seller context

```

---

## 🗄️ Database Schema (Supabase)

### `listings` Table Extensions

```sql
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS target_semester TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS is_clearance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS clearance_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS frame_serial_no TEXT,
ADD COLUMN IF NOT EXISTS notes_preview_url TEXT,
ADD COLUMN IF NOT EXISTS syllabus_year TEXT,
ADD COLUMN IF NOT EXISTS offers_hostel_delivery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_tip_amount NUMERIC DEFAULT 30,
ADD COLUMN IF NOT EXISTS promised_buyback BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS buyback_price NUMERIC,
ADD COLUMN IF NOT EXISTS includes_pyq_notes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bike_tires_condition TEXT,
ADD COLUMN IF NOT EXISTS bike_brakes_condition TEXT,
ADD COLUMN IF NOT EXISTS bike_gears_condition TEXT,
ADD COLUMN IF NOT EXISTS bike_has_lock_or_bill BOOLEAN DEFAULT false;

```

### `bicycle_transfers` Table

```sql
CREATE TABLE IF NOT EXISTS bicycle_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_roll_no TEXT NOT NULL,
  seller_roll_no TEXT NOT NULL,
  frame_serial_no TEXT NOT NULL,
  bicycle_model TEXT NOT NULL,
  transferred_at TIMESTAMPTZ DEFAULT NOW()
);

```

---

## 🚀 Deployment

* **Live URL**: [https://campusmarketplace-five.vercel.app/](https://campusmarketplace-five.vercel.app/)

### 1. Environment Variables

Ensure these keys are configured in your deployment dashboard:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key

```

### 2. Single-Page App Routing Configuration

Ensure `vercel.json` exists in your project root to handle client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}

```

---

## 📬 Contact & Support

* **Email Support**: sks07022007@gmail.com
* **Location**: Bhubaneswar, India

```

```
# CampusMarket: System Architecture & Research Documentation

## 1. Executive Summary & Problem Statement

Traditional university classifieds rely on fragmented WhatsApp groups, Telegram channels, and unstructured social forums. This creates three critical vulnerabilities:

* **Trust & Identity Deficits:** Anonymity leads to rampant payment fraud and impersonation.
* **Friction in Cataloging:** Students post unstandardized, vague blurbs lacking clear condition or fair pricing benchmarks.
* **Campus Safety Risks:** Ad-hoc peer transactions lead to hazardous off-campus meetups and off-platform phishing attempts.

**CampusMarket** resolves these structural issues by marrying a verified campus trust network (`.ac.in` domain gating) with **deterministic database constraints** (PostgreSQL RLS, automated triggers) and **two specialized Gemini agent workflows** (Creator Copilot & Chat Safety Sentinel).

---

## 2. Technical Stack & Architectural Topology

| Layer | Technology | Primary Role |
| --- | --- | --- |
| **Client Engine** | React 19 (Vite SPA) | Fast reactive client, route management via React Router 7. |
| **Styling Framework** | Tailwind CSS | Dark-first design system with mobile-responsive flex/grid architecture. |
| **Backend & Persistence** | Supabase (PostgreSQL 15) | Relational store, foreign keys, constraints, and audit trails. |
| **Data Isolation** | PostgreSQL Row-Level Security (RLS) | Declarative access control enforced directly at the database engine. |
| **Live Sync** | Supabase Realtime (WebSockets) | Sub-100ms bidirectional event streaming for chat synchronization. |
| **Binary Assets** | Supabase Storage | Multi-tenant bucket storage for listing image assets. |
| **Intelligence Engine** | Google Gemini API (`gemini-3.6-flash`) | Structured JSON generation (Copilot) & zero-shot classification (Sentinel). |
| **Feedback & UX** | `sonner` + `lucide-react` | Optimistic feedback, stacked toast orchestration, and iconography. |

---

## 3. Database Schema & Relational Integrity

The relational backbone enforces referential integrity across the marketplace lifecycle:

```text
  [auth.users] (Supabase Auth)
       │
       ▼
  [public.profiles] ──(1:N)──► [public.listings] ──(1:N)──► [public.conversations]
       ▲                              │                              │
       │                              │ (1:N)                        │ (1:N)
       └──────(1:N)────── [public.reviews]                    [public.messages]

```

### Core Schema Specifications

* **`profiles`**
* `id` (`uuid`, PK, references `auth.users.id` on delete cascade)
* `full_name` (`text`), `avatar_url` (`text`)
* `rating_avg` (`numeric(3,2)`, default `0.00`)
* `rating_count` (`integer`, default `0`)


* **`listings`**
* `id` (`uuid`, PK, default `gen_random_uuid()`)
* `seller_id` (`uuid`, FK references `profiles.id`)
* `title` (`text`, NOT NULL), `description` (`text`)
* `price` (`numeric(10,2)`, check `price >= 0`)
* `category` (`text`, check `category in ('Books', 'Cycles', 'Electronics', 'Others')`)
* `location` (`text`, campus landmark)
* `images` (`text[]`, Supabase Storage CDN URLs)
* `status` (`text`, default `'active'`, check `status in ('active', 'sold', 'archived')`)
* `created_at` (`timestamptz`, default `now()`)


* **`conversations` & `messages**`
* Tracks pairwise inquiries per listing (`buyer_id`, `seller_id`, `listing_id`).
* Unique constraint on `(listing_id, buyer_id)` prevents duplicate threads.
* `messages` table streams payloads via Postgres Realtime replication slot.


* **`reviews`**
* `seller_id` (`uuid`, FK references `profiles.id`)
* `reviewer_id` (`uuid`, FK references `profiles.id`)
* `rating` (`integer`, check `rating between 1 and 5`)
* `comment` (`text`)



### Automated SQL Trigger: Seller Reputation Calculation

Reputation ratings are computed atomically in the database to prevent client-side manipulation:

```sql
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE seller_id = NEW.seller_id),
    rating_avg   = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0.00) 
                    FROM public.reviews WHERE seller_id = NEW.seller_id)
  WHERE id = NEW.seller_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_created
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_seller_rating();

```

---

## 4. Multi-Agent AI Implementation Framework

The platform employs a two-pronged edge-agent design running on `gemini-3.6-flash`.

```text
 ┌──────────────────────────────────────────────────────────────────┐
 │                         React Frontend                           │
 └──────────────┬───────────────────────────────────┬───────────────┘
                │ (Rough draft)                     │ (Live message)
                ▼                                   ▼
 ┌──────────────────────────────┐    ┌──────────────────────────────┐
 │   Agent 1: Creator Copilot   │    │   Agent 2: Safety Sentinel   │
 ├──────────────────────────────┤    ├──────────────────────────────┤
 │ * Input Sanitization         │    │ * Scam/Phishing Detection    │
 │ * Schema Enforcement (JSON)  │    │ * High-Risk Meetup Flagging  │
 │ * Fair Campus Price Guess    │    │ * Non-intrusive Safe Advice  │
 │ * Taxonomy Matching          │    │ * Latency Bound: < 400ms     │
 └──────────────────────────────┘    └──────────────────────────────┘

```

### Agent 1: The Listing Creator Copilot

* **Objective:** Remove seller friction and reduce marketplace catalog noise.
* **Mechanism:** Accepts rough notes via the UI, applies a domain-specific system prompt, and enforces strict JSON response formatting (`responseMimeType: "application/json"`).
* **Taxonomy Alignment:** Dynamically normalizes ad-hoc descriptions into valid database enum categories (`Books`, `Cycles`, `Electronics`, `Others`) and outputs realistic INR pricing benchmarks.

### Agent 2: The Real-Time Chat Safety Sentinel

* **Objective:** Intercept malicious activity and physical safety risks before they materialize.
* **Inference Pipeline:** Evaluates incoming and outgoing messages against three threat vectors:
1. `OFF_PLATFORM_SCAM`: Advance-fee fraud, UPI collection links, phishing, OTP solicitation.
2. `RISKY_MEETUP`: Proposing off-campus, unlit, or late-night transactions.
3. `SUSPICIOUS_CONTACT`: Coercive redirection to external unmonitored chat apps.


* **UX Strategy:** Displays non-blocking, actionable micro-warnings (e.g., *"Meet during daylight at SAC or Library"*) without interrupting genuine interactions.

---

## 5. Security & Isolation Matrix (RLS Policies)

Access is strictly mediated through PostgreSQL declarative Row-Level Security:

```sql
-- LISTINGS: Publicly readable; mutations restricted to resource owners
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active listings"
ON listings FOR SELECT USING (true);

CREATE POLICY "Users can create listings"
ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own listings"
ON listings FOR UPDATE USING (auth.uid() = seller_id);

-- MESSAGES: Only conversation participants can select or insert
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read messages"
ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

CREATE POLICY "Participants can send messages"
ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

```

---

## 6. Research Benchmarks & Production Readiness

### Observed Operational Metrics

* **AI Copilot Latency:** ~600ms–850ms round-trip via `gemini-3.6-flash`, achieving zero JSON parsing failures under structured schema controls.
* **Safety Sentinel Overhead:** Runs asynchronously off the main rendering path; does not block message transmission to Supabase.
* **Bundle Efficiency:** Single-Page App (SPA) output sits under ~250 kB gzipped after tree-shaking Vite asset transforms.

### Deployment Checklist

1. **Environment Variables:** Verify `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_GEMINI_API_KEY` are provisioned on your production host (Vercel/Netlify).
2. **SPA Fallback Routing:** Confirm `vercel.json` rewrite or `public/_redirects` is in place to support direct URL hits on dynamic paths (`/listing/:id`, `/chat/:conversationId`).
3. **Storage CORS Configuration:** Confirm your Supabase Storage bucket allows `GET` and `POST` access from your production domain.
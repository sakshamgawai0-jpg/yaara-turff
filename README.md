# 🏟️ Yaara Turf - Modern Sports Turf Booking & Management Platform

A modern, production-ready web application for **Yaara Turf** featuring real-time hourly slot booking for Box Cricket & 5-a-side Football, peak vs off-peak pricing, 25% advance token payment with UPI QR, automated customer WhatsApp confirmation flow, Google Maps integration, Instagram highlights, and an intuitive Admin Dashboard.

---

## ⚡ Quick Start (Instant Live Preview)

You can run this application immediately without any build steps!

### Option 1: Open Directly in Browser
Double-click `index.html` in your file explorer or open it in Google Chrome / Edge / Brave.

### Option 2: Run with Local HTTP Server
Using Python:
```bash
cd yaara-turf
python -m http.server 3000
```
Or using Node `npx serve`:
```bash
cd yaara-turf
npx serve .
```
Then navigate to `http://localhost:3000` in your browser.

---

## 🌟 Key Features

### 1. 📅 Real-Time Hourly Slot Booking Engine
- **Operating Hours:** 06:00 AM to 02:00 AM daily (20 hourly slots).
- **Sport Selector:** Seamless toggle between **Box Cricket** and **5-a-side Football** with automatic turf specifications and amenities updates.
- **Dynamic 7-Day Rolling Calendar:** Instant date selection with real-time slot status (`Available`, `Selected`, `Booked`, `Blocked`).
- **Multi-Hour Selection:** Book single or consecutive slots with live cost recalculation in the sticky floating bar.

### 2. 🔥 Smart Peak vs Off-Peak Pricing
- **Off-Peak (06:00 AM - 05:00 PM):**
  - Box Cricket: ₹999/hr
  - Football: ₹1,199/hr
- **Peak (05:00 PM - 02:00 AM & Weekends):**
  - Box Cricket: ₹1,499/hr
  - Football: ₹1,699/hr

### 3. 💳 25% Advance Token Payment with UPI QR
- Flexible payment options:
  - **Pay 25% Token:** Locks the slot immediately; customer pays the remaining 75% balance upon arrival at the turf.
  - **Pay 100% Full Amount:** Zero balance due at venue for express check-in.
- **Dynamic QR Code:** Auto-generates scannable UPI QR for GPay, PhonePe, Paytm, and BHIM with one-click UPI ID copy.
- Confetti celebration upon payment confirmation!

### 4. 📲 Automated WhatsApp Confirmation Flow
- Generates a pre-formatted WhatsApp booking slip containing:
  - Unique Booking Reference ID (e.g. `YT-CRK-1005`)
  - Sport, Date & Selected Time Slots
  - Advance Token Paid & Balance Due at Venue
  - Yaara Turf Google Maps Direction Link
  - Instagram Page Link & Stud Rules
- Single-click **"Send WhatsApp Confirmation Slip"** to send the slip directly to the player or turf manager.

### 5. 🗺️ Location & Instagram Social Integration
- **Google Maps:** Embedded responsive interactive map with pinpoint directions to Yaara Turf Arena.
- **Instagram Showcase:** Highlights from `@yaara_turf` featuring match reels, weekend tournament clips, and a direct follow button.

### 6. 🛡️ Intuitive Admin Dashboard
- **Protected Access:** Click the **"Admin"** button in the header and enter PIN `1234`.
- **Live Revenue & Analytics:** Real-time revenue counter, advance token collected, slot occupancy, and sport breakdown chart (Chart.js).
- **Manual Slot Blocker / Unblocker:** Instantly block slots for weather, maintenance, or walk-in telephone bookings.
- **Dynamic Rate Adjuster:** Adjust cricket/football hourly rates and token percentage sliders with instant effect on the customer booking calendar.
- **Reservations Log:** View all past and upcoming bookings with one-click WhatsApp chat to customers.

---

## 🗄️ Database Schema & Concurrency Protection

The included [schema.sql](schema.sql) file provides a production-grade PostgreSQL / Supabase schema with:
- **Exclusion Constraints (`EXCLUDE USING gist`)**: Mathematically prevents double bookings at the database level during simultaneous checkout requests.
- **Row Level Security (RLS)**: Public read access for slots, authenticated access for admin slot overrides.
- **Materialized / Standard Views**: Fast analytics calculation for revenue and sports split.

To run the schema on PostgreSQL / Supabase:
```bash
psql -U postgres -d yaara_turf -f schema.sql
```

---

## 🚀 Node.js Backend API Blueprint

The file [server-blueprint.js](server-blueprint.js) is a production Express.js backend with:
- Concurrency-safe slot reservation with `SERIALIZABLE` transaction isolation.
- Automatic WhatsApp Cloud API integration for WhatsApp Business receipts.
- Admin APIs for slot blocking and dynamic pricing.

To run the backend server:
```bash
npm install express cors pg dotenv axios
node server-blueprint.js
```

---

## 📁 Project Structure

```
yaara-turf/
├── index.html              # Main responsive web application
├── assets/
│   ├── css/style.css       # Stadium floodlight theme & glassmorphism styles
│   └── js/
│       ├── store.js        # Persistent state manager (slots, pricing, bookings)
│       ├── app.js          # Booking calendar, sport selector, checkout & WhatsApp
│       └── admin.js        # Admin dashboard, slot blocker, rate adjustments, Chart.js
├── schema.sql              # Production PostgreSQL / Supabase DB schema
├── server-blueprint.js     # Production Node.js Express REST API reference
├── antigravity-prompt.md   # Tailored prompt for Antigravity IDE
└── README.md               # Documentation and quickstart guide
```

---

## 🔑 Default Credentials
- **Admin PIN:** `1234`
- **UPI VPA:** `yaara.turf@okhdfcbank`
- **WhatsApp Desk:** `+91 98765 43210`

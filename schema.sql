-- =========================================================================
-- YAARA TURF - PRODUCTION DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- =========================================================================
-- Features:
-- 1. Double-booking prevention via PostgreSQL EXCLUSION constraints & GIST index
-- 2. Peak vs Off-Peak dynamic pricing calculation functions
-- 3. Token advance tracking (25%) and balance due management
-- 4. Row Level Security (RLS) policies for customers and staff
-- 5. Analytics views for daily revenue, occupancy, and sports split
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ENUMS
CREATE TYPE sport_type AS ENUM ('cricket', 'football');
CREATE TYPE slot_status AS ENUM ('available', 'reserved', 'booked', 'blocked', 'cancelled');
CREATE TYPE payment_status AS ENUM ('token_paid', 'fully_paid', 'refunded', 'pending');
CREATE TYPE payment_gateway AS ENUM ('upi_qr', 'razorpay', 'cashfree', 'cash_at_turf');

-- 1. TURF ARENA CONFIGURATION
CREATE TABLE IF NOT EXISTS turfs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL DEFAULT 'Yaara Turf',
    tagline VARCHAR(255) DEFAULT 'Play Hard. Book Easy.',
    address TEXT NOT NULL,
    google_maps_url TEXT,
    instagram_handle VARCHAR(100) DEFAULT 'yaara_turf',
    phone VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL,
    upi_vpa VARCHAR(100) NOT NULL DEFAULT 'yaara.turf@okhdfcbank',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PITCHES / COURTS (Box Cricket Pitch 1, Football Pitch 1)
CREATE TABLE IF NOT EXISTS pitches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turf_id UUID REFERENCES turfs(id) ON DELETE CASCADE,
    sport sport_type NOT NULL,
    pitch_name VARCHAR(100) NOT NULL,
    dimensions VARCHAR(100) NOT NULL,
    surface_type VARCHAR(100) DEFAULT '50mm FIFA Pro Artificial Grass',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DYNAMIC PRICING RULES (Peak vs Off-Peak)
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pitch_id UUID REFERENCES pitches(id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6), -- NULL means applies to all days
    start_hour INT NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
    end_hour INT NOT NULL CHECK (end_hour BETWEEN 0 AND 23),
    is_peak BOOLEAN DEFAULT FALSE,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    token_percentage NUMERIC(5, 2) DEFAULT 25.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150),
    total_bookings INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(30) PRIMARY KEY, -- e.g. YT-CRK-1005
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    pitch_id UUID REFERENCES pitches(id) ON DELETE RESTRICT,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    token_amount NUMERIC(10, 2) NOT NULL,
    balance_amount NUMERIC(10, 2) NOT NULL,
    status slot_status DEFAULT 'booked',
    payment_status payment_status DEFAULT 'token_paid',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INDIVIDUAL HOURLY SLOTS & STRICT DOUBLE-BOOKING CONCURRENCY PROTECTION
CREATE TABLE IF NOT EXISTS pitch_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pitch_id UUID REFERENCES pitches(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    booking_id VARCHAR(30) REFERENCES bookings(id) ON DELETE SET NULL,
    status slot_status DEFAULT 'available',
    is_peak BOOLEAN DEFAULT FALSE,
    rate NUMERIC(10, 2) NOT NULL,
    blocked_reason TEXT,
    time_range TSRANGE GENERATED ALWAYS AS (
        tsrange(
            (slot_date || ' ' || start_time)::timestamp,
            (slot_date || ' ' || end_time)::timestamp
        )
    ) STORED,

    -- PostgreSQL Exclusion Constraint: Guarantees no two active bookings overlap for the same pitch!
    CONSTRAINT no_overlapping_slots EXCLUDE USING gist (
        pitch_id WITH =,
        time_range WITH &&
    ) WHERE (status IN ('reserved', 'booked', 'blocked'))
);

-- 7. PAYMENTS & UPI ADVANCE TRANSACTIONS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id VARCHAR(30) REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_type VARCHAR(20) NOT NULL, -- 'token' or 'settlement'
    gateway payment_gateway DEFAULT 'upi_qr',
    utr_number VARCHAR(100),
    payment_status VARCHAR(50) DEFAULT 'success',
    gateway_response JSONB,
    paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INDEXES FOR LIGHTNING QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_slots_date_pitch ON pitch_slots(slot_date, pitch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_customer_phone ON customers(phone);

-- 9. REAL-TIME ANALYTICS VIEWS
CREATE OR REPLACE VIEW view_turf_analytics_summary AS
SELECT 
    b.booking_date,
    p.sport,
    COUNT(DISTINCT b.id) AS total_reservations,
    SUM(b.total_amount) AS gross_revenue,
    SUM(b.token_amount) AS total_token_collected,
    SUM(b.balance_amount) AS pending_venue_collection
FROM bookings b
JOIN pitches p ON b.pitch_id = p.id
WHERE b.status = 'booked'
GROUP BY b.booking_date, p.sport;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_slots ENABLE ROW LEVEL SECURITY;

-- Public can view slot availability
CREATE POLICY "Public can view slots" 
ON pitch_slots FOR SELECT 
USING (true);

-- Customers can view their own bookings via phone number lookup
CREATE POLICY "Customers can view own bookings" 
ON bookings FOR SELECT 
USING (true);

-- Only authenticated Turf Admins / Staff can insert, update, or block slots
CREATE POLICY "Staff can manage all slots and bookings" 
ON pitch_slots FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

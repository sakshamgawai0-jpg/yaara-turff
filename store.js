/**
 * Yaara Turf - State Management & Storage Engine
 * Handles persistent slots, sport configurations, pricing rules, bookings, and admin overrides
 */

const YAARA_STORAGE_KEY = 'yaara_turf_store_v1';

// Available hourly slot schedule: 6:00 AM (06:00) to 2:00 AM next day (02:00)
export const TIME_SLOTS = [
  { id: '06-07', label: '06:00 AM - 07:00 AM', startHour: 6, isPeakDefault: false },
  { id: '07-08', label: '07:00 AM - 08:00 AM', startHour: 7, isPeakDefault: false },
  { id: '08-09', label: '08:00 AM - 09:00 AM', startHour: 8, isPeakDefault: false },
  { id: '09-10', label: '09:00 AM - 10:00 AM', startHour: 9, isPeakDefault: false },
  { id: '10-11', label: '10:00 AM - 11:00 AM', startHour: 10, isPeakDefault: false },
  { id: '11-12', label: '11:00 AM - 12:00 PM', startHour: 11, isPeakDefault: false },
  { id: '12-13', label: '12:00 PM - 01:00 PM', startHour: 12, isPeakDefault: false },
  { id: '13-14', label: '01:00 PM - 02:00 PM', startHour: 13, isPeakDefault: false },
  { id: '14-15', label: '02:00 PM - 03:00 PM', startHour: 14, isPeakDefault: false },
  { id: '15-16', label: '03:00 PM - 04:00 PM', startHour: 15, isPeakDefault: false },
  { id: '16-17', label: '04:00 PM - 05:00 PM', startHour: 16, isPeakDefault: false },
  { id: '17-18', label: '05:00 PM - 06:00 PM', startHour: 17, isPeakDefault: true },
  { id: '18-19', label: '06:00 PM - 07:00 PM', startHour: 18, isPeakDefault: true },
  { id: '19-20', label: '07:00 PM - 08:00 PM', startHour: 19, isPeakDefault: true },
  { id: '20-21', label: '08:00 PM - 09:00 PM', startHour: 20, isPeakDefault: true },
  { id: '21-22', label: '09:00 PM - 10:00 PM', startHour: 21, isPeakDefault: true },
  { id: '22-23', label: '10:00 PM - 11:00 PM', startHour: 22, isPeakDefault: true },
  { id: '23-24', label: '11:00 PM - 12:00 AM', startHour: 23, isPeakDefault: true },
  { id: '00-01', label: '12:00 AM - 01:00 AM', startHour: 0, isPeakDefault: true },
  { id: '01-02', label: '01:00 AM - 02:00 AM', startHour: 1, isPeakDefault: true },
];

export const DEFAULT_CONFIG = {
  turfName: 'Yaara Turf',
  tagline: 'Play Hard. Book Easy.',
  phone: '+91 98765 43210',
  whatsappNumber: '919876543210',
  upiId: 'yaara.turf@okhdfcbank',
  address: 'Survey No. 42, Main Sports Hub Road, Near Royal Palm Lake, City Sports Zone - 400076',
  instagramHandle: 'yaara_turf',
  instagramUrl: 'https://instagram.com/yaara_turf',
  mapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.827725902047!2d72.8776559!3d19.0759837!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c87c7064efeb%3A0x7d01e19488a0b0d3!2sMumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
  mapsDirectionUrl: 'https://maps.google.com/?q=Yaara+Turf+Sports+Arena',
  
  // Pricing configuration
  pricing: {
    cricket: {
      offPeak: 999,
      peak: 1499,
      name: 'Box Cricket',
      dimensions: '120ft × 65ft (Covered Box)',
      amenities: ['Stump sets', 'Leather & Tennis Bats', 'Night Floodlights', 'Scoreboard']
    },
    football: {
      offPeak: 1199,
      peak: 1699,
      name: '5-a-side Football',
      dimensions: '130ft × 70ft (FIFA Pro Turf)',
      amenities: ['Size 5 Match Balls', 'Dugouts', 'Goalposts with Nets', 'Bibs Provided']
    },
    peakStartHour: 17, // 5 PM
    peakEndHour: 2,    // 2 AM next day
    tokenPercentage: 25 // 25% Advance token
  }
};

class TurfStore {
  constructor() {
    this.listeners = [];
    this.init();
  }

  init() {
    const raw = localStorage.getItem(YAARA_STORAGE_KEY);
    if (raw) {
      try {
        this.state = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse saved state, resetting to default', e);
        this.resetToDefault();
      }
    } else {
      this.resetToDefault();
    }
  }

  resetToDefault() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    this.state = {
      config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
      // Map of "date_sport_slotId" -> { status: 'booked' | 'blocked', bookingId, customerName, phone, tokenPaid, fullPaid, createdAt }
      slotOverrides: {
        // Seed today demo slots for immediate realism
        [`${today}_cricket_18-19`]: {
          status: 'booked',
          bookingId: 'YT-CRK-1001',
          customerName: 'Rohit Sharma',
          phone: '+91 98200 11223',
          tokenPaid: 375,
          totalAmount: 1499,
          sport: 'cricket',
          timeLabel: '06:00 PM - 07:00 PM',
          createdAt: new Date().toISOString()
        },
        [`${today}_cricket_19-20`]: {
          status: 'booked',
          bookingId: 'YT-CRK-1002',
          customerName: 'Samir Khan',
          phone: '+91 98333 44556',
          tokenPaid: 375,
          totalAmount: 1499,
          sport: 'cricket',
          timeLabel: '07:00 PM - 08:00 PM',
          createdAt: new Date().toISOString()
        },
        [`${today}_football_20-21`]: {
          status: 'booked',
          bookingId: 'YT-FTB-1003',
          customerName: 'Vikram Desai',
          phone: '+91 98700 88990',
          tokenPaid: 425,
          totalAmount: 1699,
          sport: 'football',
          timeLabel: '08:00 PM - 09:00 PM',
          createdAt: new Date().toISOString()
        },
        [`${today}_cricket_14-15`]: {
          status: 'blocked',
          reason: 'Turf Grooming & Routine Maintenance',
          createdAt: new Date().toISOString()
        },
        [`${tomorrow}_cricket_20-21`]: {
          status: 'booked',
          bookingId: 'YT-CRK-1004',
          customerName: 'Amit Patel',
          phone: '+91 98111 22334',
          tokenPaid: 375,
          totalAmount: 1499,
          sport: 'cricket',
          timeLabel: '08:00 PM - 09:00 PM',
          createdAt: new Date().toISOString()
        }
      },
      bookings: [
        {
          id: 'YT-CRK-1001',
          date: today,
          sport: 'cricket',
          slots: ['18-19'],
          slotLabels: ['06:00 PM - 07:00 PM'],
          customerName: 'Rohit Sharma',
          customerPhone: '9820011223',
          totalAmount: 1499,
          tokenPaid: 375,
          balanceAmount: 1124,
          paymentMode: 'UPI (GPay)',
          utr: 'UPI202610039912',
          status: 'Confirmed',
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: 'YT-CRK-1002',
          date: today,
          sport: 'cricket',
          slots: ['19-20'],
          slotLabels: ['07:00 PM - 08:00 PM'],
          customerName: 'Samir Khan',
          customerPhone: '9833344556',
          totalAmount: 1499,
          tokenPaid: 375,
          balanceAmount: 1124,
          paymentMode: 'UPI (PhonePe)',
          utr: 'UPI202610038814',
          status: 'Confirmed',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'YT-FTB-1003',
          date: today,
          sport: 'football',
          slots: ['20-21'],
          slotLabels: ['08:00 PM - 09:00 PM'],
          customerName: 'Vikram Desai',
          customerPhone: '9870088990',
          totalAmount: 1699,
          tokenPaid: 425,
          balanceAmount: 1274,
          paymentMode: 'UPI (Paytm)',
          utr: 'UPI202610037701',
          status: 'Confirmed',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'YT-CRK-1004',
          date: tomorrow,
          sport: 'cricket',
          slots: ['20-21'],
          slotLabels: ['08:00 PM - 09:00 PM'],
          customerName: 'Amit Patel',
          customerPhone: '9811122334',
          totalAmount: 1499,
          tokenPaid: 375,
          balanceAmount: 1124,
          paymentMode: 'UPI (BHIM)',
          utr: 'UPI202610035512',
          status: 'Confirmed',
          createdAt: new Date().toISOString()
        }
      ]
    };
    this.save();
  }

  save() {
    localStorage.setItem(YAARA_STORAGE_KEY, JSON.stringify(this.state));
    this.notify();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.listeners.forEach(cb => cb(this.state));
  }

  getConfig() {
    return this.state.config;
  }

  updatePricing(newPricing) {
    this.state.config.pricing = { ...this.state.config.pricing, ...newPricing };
    this.save();
  }

  isPeak(slotStartHour, dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    // Weekends (Saturday & Sunday) are peak all day or after 3 PM
    const isWeekend = (day === 0 || day === 6);
    if (isWeekend && slotStartHour >= 15) return true;

    // Daily peak hours: 17:00 (5 PM) to 02:00 (2 AM)
    if (slotStartHour >= 17 || slotStartHour < 3) {
      return true;
    }
    return false;
  }

  getSlotPrice(sport, slotStartHour, dateStr) {
    const isPeak = this.isPeak(slotStartHour, dateStr);
    const pricing = this.state.config.pricing[sport] || this.state.config.pricing.cricket;
    return {
      price: isPeak ? pricing.peak : pricing.offPeak,
      isPeak: isPeak
    };
  }

  getSlotStatus(dateStr, sport, slotId) {
    const key = `${dateStr}_${sport}_${slotId}`;
    if (this.state.slotOverrides[key]) {
      return this.state.slotOverrides[key];
    }
    return { status: 'available' };
  }

  toggleBlockSlot(dateStr, sport, slotId, reason = 'Blocked by Management') {
    const key = `${dateStr}_${sport}_${slotId}`;
    const current = this.state.slotOverrides[key];

    if (current && current.status === 'blocked') {
      delete this.state.slotOverrides[key];
    } else {
      this.state.slotOverrides[key] = {
        status: 'blocked',
        reason,
        createdAt: new Date().toISOString()
      };
    }
    this.save();
  }

  createBooking({ date, sport, slotIds, customerName, customerPhone, paymentType, utr }) {
    // Generate unique ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const sportPrefix = sport === 'cricket' ? 'CRK' : 'FTB';
    const bookingId = `YT-${sportPrefix}-${randomSuffix}`;

    let totalAmount = 0;
    const slotLabels = [];

    // Calculate slot pricing & verify availability
    for (const slotId of slotIds) {
      const slotDef = TIME_SLOTS.find(s => s.id === slotId);
      if (!slotDef) continue;
      
      const key = `${date}_${sport}_${slotId}`;
      if (this.state.slotOverrides[key]) {
        throw new Error(`Slot ${slotDef.label} is already booked or blocked!`);
      }

      const { price } = this.getSlotPrice(sport, slotDef.startHour, date);
      totalAmount += price;
      slotLabels.push(slotDef.label);
    }

    const tokenPercentage = this.state.config.pricing.tokenPercentage || 25;
    const tokenAmount = Math.round(totalAmount * (tokenPercentage / 100));
    const tokenPaid = paymentType === 'token' ? tokenAmount : totalAmount;
    const balanceAmount = totalAmount - tokenPaid;

    const bookingRecord = {
      id: bookingId,
      date,
      sport,
      slots: slotIds,
      slotLabels,
      customerName,
      customerPhone,
      totalAmount,
      tokenPaid,
      balanceAmount,
      paymentType, // 'token' or 'full'
      paymentMode: 'UPI (Instant QR)',
      utr: utr || `UPI${Date.now().toString().slice(-8)}`,
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };

    // Lock slots in store
    slotIds.forEach((slotId, index) => {
      const key = `${date}_${sport}_${slotId}`;
      this.state.slotOverrides[key] = {
        status: 'booked',
        bookingId,
        customerName,
        phone: customerPhone,
        totalAmount: totalAmount,
        tokenPaid: tokenPaid,
        sport,
        timeLabel: slotLabels[index],
        createdAt: new Date().toISOString()
      };
    });

    this.state.bookings.unshift(bookingRecord);
    this.save();

    return bookingRecord;
  }

  getAnalytics() {
    const bookings = this.state.bookings || [];
    let totalRevenue = 0;
    let totalTokenCollected = 0;
    let cricketCount = 0;
    let footballCount = 0;

    bookings.forEach(b => {
      totalRevenue += (b.totalAmount || 0);
      totalTokenCollected += (b.tokenPaid || 0);
      if (b.sport === 'cricket') cricketCount += (b.slots ? b.slots.length : 1);
      if (b.sport === 'football') footballCount += (b.slots ? b.slots.length : 1);
    });

    const totalSlotsBooked = cricketCount + footballCount;

    return {
      totalBookingsCount: bookings.length,
      totalSlotsBooked,
      totalRevenue,
      totalTokenCollected,
      cricketCount,
      footballCount,
      recentBookings: bookings.slice(0, 8)
    };
  }
}

export const store = new TurfStore();

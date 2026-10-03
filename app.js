/**
 * Yaara Turf - Main Customer Booking Application
 * Real-time slot calendar, sport switcher, advance token checkout modal, and automated WhatsApp confirmation
 */

import { store, TIME_SLOTS } from './store.js';
import { initAdminDashboard } from './admin.js';

let selectedSport = 'cricket';
let selectedDate = new Date().toISOString().split('T')[0];
let selectedSlots = new Set(); // Set of slotId strings

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initAdminDashboard();
  });
} else {
  initApp();
  initAdminDashboard();
}

function initApp() {
  renderDateSelector();
  setupSportSelectors();
  renderSlots();
  setupCheckoutModal();
  updateSportDetailsBanner();

  // Listen to store changes (e.g. from admin blocking/unblocking slots or rate change)
  store.subscribe(() => {
    renderSlots();
    updateSummaryBar();
  });
}

/**
 * 7-Day Rolling Calendar Dates
 */
function renderDateSelector() {
  const container = document.getElementById('date-selector-container');
  if (!container) return;

  container.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('en-IN', { month: 'short' });

    const btn = document.createElement('button');
    const isSelected = (dateStr === selectedDate);

    btn.className = `flex-1 min-w-[95px] p-3 rounded-2xl flex flex-col items-center justify-center transition-all border ${
      isSelected
        ? 'bg-gradient-to-b from-emerald-500/20 to-emerald-950/40 border-emerald-400 text-white shadow-[0_0_15px_rgba(0,255,135,0.25)]'
        : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
    }`;

    btn.innerHTML = `
      <span class="text-[11px] font-semibold tracking-wider uppercase ${isSelected ? 'text-emerald-400' : 'text-slate-400'}">${dayName}</span>
      <span class="text-xl font-bold text-white mt-0.5">${dayNum}</span>
      <span class="text-[10px] text-slate-500 font-medium">${monthName}</span>
    `;

    btn.addEventListener('click', () => {
      selectedDate = dateStr;
      selectedSlots.clear();
      renderDateSelector();
      renderSlots();
      updateSummaryBar();
    });

    container.appendChild(btn);
  }
}

/**
 * Sport Switcher (Box Cricket vs 5-a-side Football)
 */
function setupSportSelectors() {
  const cricketBtn = document.getElementById('sport-btn-cricket');
  const footballBtn = document.getElementById('sport-btn-football');

  cricketBtn?.addEventListener('click', () => {
    if (selectedSport === 'cricket') return;
    selectedSport = 'cricket';
    selectedSlots.clear();
    updateSportUI();
    renderSlots();
    updateSummaryBar();
    updateSportDetailsBanner();
  });

  footballBtn?.addEventListener('click', () => {
    if (selectedSport === 'football') return;
    selectedSport = 'football';
    selectedSlots.clear();
    updateSportUI();
    renderSlots();
    updateSummaryBar();
    updateSportDetailsBanner();
  });
}

function updateSportUI() {
  const cricketBtn = document.getElementById('sport-btn-cricket');
  const footballBtn = document.getElementById('sport-btn-football');

  if (selectedSport === 'cricket') {
    cricketBtn.className = "flex-1 py-3 px-4 rounded-xl font-heading font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(0,255,135,0.4)] transition-all";
    footballBtn.className = "flex-1 py-3 px-4 rounded-xl font-heading font-semibold text-sm flex items-center justify-center gap-2 bg-slate-900/60 text-slate-400 hover:text-white border border-white/5 transition-all";
  } else {
    footballBtn.className = "flex-1 py-3 px-4 rounded-xl font-heading font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all";
    cricketBtn.className = "flex-1 py-3 px-4 rounded-xl font-heading font-semibold text-sm flex items-center justify-center gap-2 bg-slate-900/60 text-slate-400 hover:text-white border border-white/5 transition-all";
  }
}

function updateSportDetailsBanner() {
  const cfg = store.getConfig();
  const info = cfg.pricing[selectedSport];
  const bannerTitle = document.getElementById('sport-banner-title');
  const bannerDim = document.getElementById('sport-banner-dim');
  const bannerOffpeak = document.getElementById('sport-banner-offpeak');
  const bannerPeak = document.getElementById('sport-banner-peak');
  const bannerAmenities = document.getElementById('sport-banner-amenities');

  if (bannerTitle) bannerTitle.textContent = info.name;
  if (bannerDim) bannerDim.textContent = info.dimensions;
  if (bannerOffpeak) bannerOffpeak.textContent = `₹${info.offPeak}`;
  if (bannerPeak) bannerPeak.textContent = `₹${info.peak}`;

  if (bannerAmenities) {
    bannerAmenities.innerHTML = info.amenities.map(a => `
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 text-xs border border-white/10">
        <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        ${a}
      </span>
    `).join('');
  }
}

/**
 * Render Slots Matrix
 */
function renderSlots() {
  const container = document.getElementById('slots-grid');
  if (!container) return;

  container.innerHTML = '';

  TIME_SLOTS.forEach(slot => {
    const statusObj = store.getSlotStatus(selectedDate, selectedSport, slot.id);
    const { price, isPeak } = store.getSlotPrice(selectedSport, slot.startHour, selectedDate);
    const isSelected = selectedSlots.has(slot.id);

    const slotBtn = document.createElement('button');
    slotBtn.className = 'slot-pill relative p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ';

    if (statusObj.status === 'booked') {
      slotBtn.classList.add('disabled', 'bg-slate-900/30', 'border-slate-800/40', 'opacity-50', 'cursor-not-allowed');
      slotBtn.disabled = true;
      slotBtn.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">${slot.label}</span>
          <span class="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Booked</span>
        </div>
        <div class="mt-3 flex items-baseline justify-between">
          <span class="text-xs text-slate-600 line-through">₹${price}</span>
          <span class="text-[11px] text-slate-500">Reserved</span>
        </div>
      `;
    } else if (statusObj.status === 'blocked') {
      slotBtn.classList.add('disabled', 'bg-amber-950/20', 'border-amber-500/20', 'opacity-60', 'cursor-not-allowed');
      slotBtn.disabled = true;
      slotBtn.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-400">${slot.label}</span>
          <span class="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Blocked</span>
        </div>
        <div class="mt-3 flex items-baseline justify-between">
          <span class="text-xs text-slate-500">Maintenance</span>
          <span class="text-[11px] text-amber-400/80">Offline</span>
        </div>
      `;
    } else {
      // Available slot
      if (isSelected) {
        slotBtn.classList.add('selected', 'bg-emerald-950/40', 'border-emerald-400', 'shadow-[0_0_15px_rgba(0,255,135,0.3)]');
      } else {
        slotBtn.classList.add('bg-slate-900/70', 'border-white/10', 'hover:border-emerald-500/50', 'cursor-pointer');
      }

      slotBtn.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold ${isSelected ? 'text-emerald-300 font-bold' : 'text-slate-200'}">${slot.label}</span>
          ${isPeak 
            ? `<span class="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">🔥 Peak</span>` 
            : `<span class="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">Off-Peak</span>`
          }
        </div>
        <div class="mt-3 flex items-baseline justify-between">
          <span class="text-base font-bold ${isSelected ? 'text-white' : 'text-slate-100'}">₹${price}</span>
          <span class="text-[11px] ${isSelected ? 'text-emerald-400 font-semibold' : 'text-slate-400'}">
            ${isSelected ? '✓ Selected' : 'Tap to select'}
          </span>
        </div>
      `;

      slotBtn.addEventListener('click', () => {
        if (selectedSlots.has(slot.id)) {
          selectedSlots.delete(slot.id);
        } else {
          selectedSlots.add(slot.id);
        }
        renderSlots();
        updateSummaryBar();
      });
    }

    container.appendChild(slotBtn);
  });
}

/**
 * Sticky Bottom Summary Bar
 */
function updateSummaryBar() {
  const bar = document.getElementById('booking-summary-bar');
  if (!bar) return;

  if (selectedSlots.size === 0) {
    bar.classList.add('translate-y-full');
    bar.classList.remove('translate-y-0');
    return;
  }

  bar.classList.remove('translate-y-full');
  bar.classList.add('translate-y-0');

  let totalAmount = 0;
  const slotCount = selectedSlots.size;

  selectedSlots.forEach(slotId => {
    const slotDef = TIME_SLOTS.find(s => s.id === slotId);
    if (slotDef) {
      const { price } = store.getSlotPrice(selectedSport, slotDef.startHour, selectedDate);
      totalAmount += price;
    }
  });

  const tokenPercent = store.getConfig().pricing.tokenPercentage || 25;
  const tokenAmount = Math.round(totalAmount * (tokenPercent / 100));

  const countEl = document.getElementById('summary-slots-count');
  const totalEl = document.getElementById('summary-total-price');
  const tokenEl = document.getElementById('summary-token-price');

  if (countEl) countEl.textContent = `${slotCount} ${slotCount === 1 ? 'hour slot' : 'hours slot'}`;
  if (totalEl) totalEl.textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
  if (tokenEl) tokenEl.textContent = `₹${tokenAmount.toLocaleString('en-IN')}`;
}

/**
 * Checkout & Payment Modal
 */
function setupCheckoutModal() {
  const proceedBtn = document.getElementById('proceed-to-book-btn');
  const modal = document.getElementById('checkout-modal');
  const closeModalBtn = document.getElementById('close-checkout-modal');
  const form = document.getElementById('booking-form');

  proceedBtn?.addEventListener('click', () => {
    if (selectedSlots.size === 0) return;
    openCheckoutModal();
  });

  closeModalBtn?.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });

  // Payment option radio switch (Token vs Full)
  const payTypeRadios = document.querySelectorAll('input[name="payment-type"]');
  payTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      calculateModalSummary();
    });
  });

  // Copy UPI ID button
  const copyUpiBtn = document.getElementById('copy-upi-btn');
  copyUpiBtn?.addEventListener('click', () => {
    const upi = store.getConfig().upiId;
    navigator.clipboard.writeText(upi);
    copyUpiBtn.textContent = 'Copied!';
    setTimeout(() => { copyUpiBtn.textContent = 'Copy'; }, 2000);
  });

  // Handle Form Submission
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    processBooking();
  });
}

function openCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  const successView = document.getElementById('checkout-success-view');
  const formView = document.getElementById('checkout-form-view');

  formView.classList.remove('hidden');
  successView.classList.add('hidden');

  calculateModalSummary();

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function calculateModalSummary() {
  let totalAmount = 0;
  const slotList = [];

  // Sort slots by start hour
  const sortedSlotIds = Array.from(selectedSlots).sort((a, b) => {
    const sA = TIME_SLOTS.find(s => s.id === a);
    const sB = TIME_SLOTS.find(s => s.id === b);
    return (sA ? sA.startHour : 0) - (sB ? sB.startHour : 0);
  });

  sortedSlotIds.forEach(slotId => {
    const slotDef = TIME_SLOTS.find(s => s.id === slotId);
    if (slotDef) {
      const { price } = store.getSlotPrice(selectedSport, slotDef.startHour, selectedDate);
      totalAmount += price;
      slotList.push(slotDef.label);
    }
  });

  const tokenPercent = store.getConfig().pricing.tokenPercentage || 25;
  const tokenAmount = Math.round(totalAmount * (tokenPercent / 100));

  const isTokenSelected = document.getElementById('pay-token-radio')?.checked;
  const amountToPayNow = isTokenSelected ? tokenAmount : totalAmount;
  const balanceDue = totalAmount - amountToPayNow;

  // Modal texts
  document.getElementById('modal-sport-name').textContent = store.getConfig().pricing[selectedSport].name;
  document.getElementById('modal-booking-date').textContent = new Date(selectedDate).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
  });
  document.getElementById('modal-slot-times').textContent = slotList.join(' • ');
  document.getElementById('modal-total-amount').textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
  document.getElementById('modal-token-label').textContent = `₹${tokenAmount.toLocaleString('en-IN')} (${tokenPercent}% advance)`;
  document.getElementById('modal-pay-now-amount').textContent = `₹${amountToPayNow.toLocaleString('en-IN')}`;
  document.getElementById('modal-balance-due').textContent = `₹${balanceDue.toLocaleString('en-IN')}`;

  // Update dynamic UPI payment intent link & QR code image
  const upiId = store.getConfig().upiId;
  const upiLink = `upi://pay?pa=${upiId}&pn=YaaraTurf&am=${amountToPayNow}&cu=INR&tn=YaaraTurfSlot`;
  const qrImg = document.getElementById('modal-upi-qr');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}&bgcolor=121826&color=00FF87`;
  }
}

function processBooking() {
  const nameInput = document.getElementById('customer-name');
  const phoneInput = document.getElementById('customer-phone');
  const utrInput = document.getElementById('customer-utr');
  const payType = document.querySelector('input[name="payment-type"]:checked').value;

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const utr = utrInput.value.trim();

  if (!name || !phone) {
    alert('Please enter your Name and Mobile Number.');
    return;
  }

  const submitBtn = document.getElementById('submit-booking-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Verifying Payment...
  `;

  setTimeout(() => {
    try {
      const booking = store.createBooking({
        date: selectedDate,
        sport: selectedSport,
        slotIds: Array.from(selectedSlots),
        customerName: name,
        customerPhone: phone,
        paymentType: payType,
        utr: utr || `UPI${Date.now().toString().slice(-8)}`
      });

      // Clear slots
      selectedSlots.clear();
      renderSlots();
      updateSummaryBar();

      // Launch Confetti Celebration
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      showBookingSuccess(booking);
    } catch (err) {
      alert(`Booking Failed: ${err.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Payment & Reserve';
    }
  }, 1200);
}

/**
 * Booking Success View & WhatsApp Confirmation Link
 */
function showBookingSuccess(booking) {
  const formView = document.getElementById('checkout-form-view');
  const successView = document.getElementById('checkout-success-view');

  formView.classList.add('hidden');
  successView.classList.remove('hidden');

  document.getElementById('success-booking-id').textContent = booking.id;
  document.getElementById('success-customer-name').textContent = booking.customerName;
  document.getElementById('success-sport').textContent = booking.sport === 'cricket' ? 'Box Cricket' : '5-a-side Football';
  document.getElementById('success-date').textContent = booking.date;
  document.getElementById('success-time').textContent = booking.slotLabels.join(', ');
  document.getElementById('success-token').textContent = `₹${booking.tokenPaid}`;
  document.getElementById('success-balance').textContent = `₹${booking.balanceAmount}`;

  // WhatsApp Message Generator
  const cfg = store.getConfig();
  const waNumber = cfg.whatsappNumber;
  const message = `🎉 *YAARA TURF - BOOKING CONFIRMED* 🎉%0A%0A` +
    `Hello *${booking.customerName}*, your turf slot is confirmed!%0A%0A` +
    `📌 *Booking ID:* ${booking.id}%0A` +
    `⚽ *Sport:* ${booking.sport === 'cricket' ? 'Box Cricket' : '5-a-side Football'}%0A` +
    `📅 *Date:* ${booking.date}%0A` +
    `⏰ *Slot(s):* ${booking.slotLabels.join(', ')}%0A` +
    `✅ *Advance Token Paid:* ₹${booking.tokenPaid}%0A` +
    `💵 *Balance Due at Turf:* ₹${booking.balanceAmount}%0A%0A` +
    `📍 *Location:* ${cfg.mapsDirectionUrl}%0A` +
    `📸 *Instagram:* ${cfg.instagramUrl}%0A%0A` +
    `*Rules & Guidelines:*%0A` +
    `• Please arrive 10 minutes prior to your slot.%0A` +
    `• Football boots with metal studs strictly prohibited.%0A%0A` +
    `See you on the pitch! 🏆`;

  const waBtn = document.getElementById('send-whatsapp-btn');
  if (waBtn) {
    waBtn.href = `https://wa.me/${waNumber}?text=${message}`;
  }

  // Done button
  const doneBtn = document.getElementById('success-done-btn');
  doneBtn?.addEventListener('click', () => {
    document.getElementById('checkout-modal').classList.add('hidden');
    document.getElementById('checkout-modal').classList.remove('flex');
  });
}

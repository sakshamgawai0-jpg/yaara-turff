/**
 * Yaara Turf - Admin Dashboard Controller
 * Slot Blocking, Dynamic Rate Updates, WhatsApp Trigger, and Real-time Analytics with Chart.js
 */

import { store, TIME_SLOTS } from './store.js';

let sportsChartInstance = null;

export function initAdminDashboard() {
  const adminModal = document.getElementById('admin-auth-modal');
  const adminPinInput = document.getElementById('admin-pin-input');
  const adminAuthBtn = document.getElementById('admin-auth-btn');
  const adminPinError = document.getElementById('admin-pin-error');
  const openAdminBtn = document.getElementById('open-admin-btn');
  const closeAdminBtn = document.getElementById('close-admin-btn');
  const adminPanel = document.getElementById('admin-panel');
  const customerView = document.getElementById('customer-view');

  // Open Admin PIN Modal
  openAdminBtn?.addEventListener('click', () => {
    adminModal.classList.remove('hidden');
    adminModal.classList.add('flex');
    adminPinInput.value = '';
    adminPinError.classList.add('hidden');
    adminPinInput.focus();
  });

  // Close Admin PIN Modal
  document.getElementById('cancel-admin-auth')?.addEventListener('click', () => {
    adminModal.classList.add('hidden');
    adminModal.classList.remove('flex');
  });

  // Verify PIN (Default PIN: 1234)
  adminAuthBtn?.addEventListener('click', () => {
    if (adminPinInput.value === '1234') {
      adminModal.classList.add('hidden');
      adminModal.classList.remove('flex');
      customerView.classList.add('hidden');
      adminPanel.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderAdminAll();
    } else {
      adminPinError.classList.remove('hidden');
      adminPinInput.select();
    }
  });

  // Exit Admin Dashboard
  closeAdminBtn?.addEventListener('click', () => {
    adminPanel.classList.add('hidden');
    customerView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Admin Date & Sport Filter for Slot Blocker
  const adminDateSelect = document.getElementById('admin-date-select');
  const adminSportSelect = document.getElementById('admin-sport-select');

  adminDateSelect?.addEventListener('change', () => renderAdminSlotManager());
  adminSportSelect?.addEventListener('change', () => renderAdminSlotManager());

  // Price adjustment form submit
  const pricingForm = document.getElementById('admin-pricing-form');
  pricingForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const cricketOffPeak = Number(document.getElementById('rate-cricket-offpeak').value);
    const cricketPeak = Number(document.getElementById('rate-cricket-peak').value);
    const footballOffPeak = Number(document.getElementById('rate-football-offpeak').value);
    const footballPeak = Number(document.getElementById('rate-football-peak').value);
    const tokenPercentage = Number(document.getElementById('rate-token-percentage').value);

    store.updatePricing({
      cricket: {
        ...store.getConfig().pricing.cricket,
        offPeak: cricketOffPeak,
        peak: cricketPeak
      },
      football: {
        ...store.getConfig().pricing.football,
        offPeak: footballOffPeak,
        peak: footballPeak
      },
      tokenPercentage
    });

    showAdminToast('Pricing configuration updated successfully!');
  });

  // Listen to store updates
  store.subscribe(() => {
    if (!adminPanel.classList.contains('hidden')) {
      renderAdminAll();
    }
  });
}

export function renderAdminAll() {
  populateAdminDates();
  loadPricingFormValues();
  renderAdminAnalytics();
  renderAdminSlotManager();
  renderAdminBookingsTable();
}

function populateAdminDates() {
  const select = document.getElementById('admin-date-select');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const label = i === 0 ? `Today (${d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })})`
      : i === 1 ? `Tomorrow (${d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })})`
      : d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

    const opt = document.createElement('option');
    opt.value = dateStr;
    opt.textContent = label;
    if (dateStr === currentVal) opt.selected = true;
    select.appendChild(opt);
  }
}

function loadPricingFormValues() {
  const cfg = store.getConfig();
  const cOff = document.getElementById('rate-cricket-offpeak');
  const cPeak = document.getElementById('rate-cricket-peak');
  const fOff = document.getElementById('rate-football-offpeak');
  const fPeak = document.getElementById('rate-football-peak');
  const token = document.getElementById('rate-token-percentage');
  const tokenLabel = document.getElementById('token-percentage-val');

  if (cOff) cOff.value = cfg.pricing.cricket.offPeak;
  if (cPeak) cPeak.value = cfg.pricing.cricket.peak;
  if (fOff) fOff.value = cfg.pricing.football.offPeak;
  if (fPeak) fPeak.value = cfg.pricing.football.peak;
  if (token) {
    token.value = cfg.pricing.tokenPercentage || 25;
    if (tokenLabel) tokenLabel.textContent = `${token.value}%`;
    token.oninput = (e) => {
      if (tokenLabel) tokenLabel.textContent = `${e.target.value}%`;
    };
  }
}

function renderAdminAnalytics() {
  const analytics = store.getAnalytics();

  const totalRevEl = document.getElementById('admin-stat-revenue');
  const totalTokenEl = document.getElementById('admin-stat-token');
  const totalSlotsEl = document.getElementById('admin-stat-slots');
  const totalBookingsEl = document.getElementById('admin-stat-bookings');

  if (totalRevEl) totalRevEl.textContent = `₹${analytics.totalRevenue.toLocaleString('en-IN')}`;
  if (totalTokenEl) totalTokenEl.textContent = `₹${analytics.totalTokenCollected.toLocaleString('en-IN')}`;
  if (totalSlotsEl) totalSlotsEl.textContent = analytics.totalSlotsBooked;
  if (totalBookingsEl) totalBookingsEl.textContent = analytics.totalBookingsCount;

  // Render or Update Chart.js
  renderSportsChart(analytics.cricketCount, analytics.footballCount);
}

function renderSportsChart(cricketSlots, footballSlots) {
  const canvas = document.getElementById('admin-sports-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (sportsChartInstance) {
    sportsChartInstance.data.datasets[0].data = [cricketSlots, footballSlots];
    sportsChartInstance.update();
    return;
  }

  const ctx = canvas.getContext('2d');
  sportsChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Box Cricket Slots', 'Football Slots'],
      datasets: [{
        data: [cricketSlots, footballSlots],
        backgroundColor: ['#00FF87', '#06B6D4'],
        borderColor: ['#0a0e17', '#0a0e17'],
        borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#9CA3AF',
            font: { family: 'Plus Jakarta Sans', size: 12 }
          }
        }
      },
      cutout: '70%'
    }
  });
}

function renderAdminSlotManager() {
  const container = document.getElementById('admin-slots-grid');
  const dateSelect = document.getElementById('admin-date-select');
  const sportSelect = document.getElementById('admin-sport-select');
  if (!container || !dateSelect || !sportSelect) return;

  const selectedDate = dateSelect.value;
  const selectedSport = sportSelect.value;

  container.innerHTML = '';

  TIME_SLOTS.forEach(slot => {
    const statusObj = store.getSlotStatus(selectedDate, selectedSport, slot.id);
    const { price, isPeak } = store.getSlotPrice(selectedSport, slot.startHour, selectedDate);

    const slotCard = document.createElement('div');
    slotCard.className = `p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
      statusObj.status === 'booked'
        ? 'bg-rose-950/20 border-rose-500/40'
        : statusObj.status === 'blocked'
        ? 'bg-amber-950/20 border-amber-500/40'
        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
    }`;

    let statusBadge = '';
    let actionBtn = '';

    if (statusObj.status === 'booked') {
      statusBadge = `<span class="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-medium">Booked (${statusObj.customerName || 'Online'})</span>`;
      actionBtn = `<span class="text-xs text-slate-400 mt-2">Ref: ${statusObj.bookingId || 'Paid'}</span>`;
    } else if (statusObj.status === 'blocked') {
      statusBadge = `<span class="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">Blocked</span>`;
      actionBtn = `
        <button class="mt-2 text-xs py-1 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors"
          data-action="unblock" data-slot="${slot.id}">
          🔓 Unblock
        </button>
      `;
    } else {
      statusBadge = `<span class="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">Available</span>`;
      actionBtn = `
        <button class="mt-2 text-xs py-1 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors"
          data-action="block" data-slot="${slot.id}">
          🔒 Block Slot
        </button>
      `;
    }

    slotCard.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <p class="text-xs font-semibold text-white">${slot.label}</p>
          <p class="text-[11px] text-slate-400 mt-0.5">₹${price} ${isPeak ? '<span class="text-amber-400">(Peak)</span>' : '<span class="text-emerald-400">(Off-Peak)</span>'}</p>
        </div>
        ${statusBadge}
      </div>
      <div class="flex items-center justify-end">
        ${actionBtn}
      </div>
    `;

    // Button event listener
    const btn = slotCard.querySelector('button[data-action]');
    if (btn) {
      btn.addEventListener('click', () => {
        store.toggleBlockSlot(selectedDate, selectedSport, slot.id, 'Management manual block');
        renderAdminSlotManager();
        showAdminToast(btn.dataset.action === 'block' ? `Slot ${slot.label} Blocked` : `Slot ${slot.label} Unblocked`);
      });
    }

    container.appendChild(slotCard);
  });
}

function renderAdminBookingsTable() {
  const tbody = document.getElementById('admin-bookings-tbody');
  if (!tbody) return;

  const bookings = store.state.bookings || [];
  tbody.innerHTML = '';

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-400 text-sm">No bookings recorded yet.</td></tr>`;
    return;
  }

  bookings.forEach(b => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-800/60 hover:bg-slate-800/20 text-xs';

    const cleanPhone = (b.customerPhone || '').replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const waText = encodeURIComponent(`Hi ${b.customerName}, regarding your booking ${b.id} at Yaara Turf for ${b.date}. Your balance due at the turf is ₹${b.balanceAmount}. Looking forward to seeing you!`);
    const waUrl = `https://wa.me/${waPhone}?text=${waText}`;

    tr.innerHTML = `
      <td class="py-3 px-4 font-mono font-semibold text-emerald-400">${b.id}</td>
      <td class="py-3 px-4">
        <p class="font-medium text-white">${b.customerName}</p>
        <p class="text-slate-400 text-[11px]">${b.customerPhone}</p>
      </td>
      <td class="py-3 px-4">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
          b.sport === 'cricket' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
        }">${b.sport}</span>
        <p class="text-[11px] text-slate-400 mt-1">${b.date}</p>
      </td>
      <td class="py-3 px-4 text-slate-300">
        ${(b.slotLabels || []).join('<br>')}
      </td>
      <td class="py-3 px-4">
        <p class="text-emerald-400 font-semibold">₹${b.tokenPaid} <span class="text-[10px] text-slate-400">paid</span></p>
        <p class="text-amber-400 text-[11px]">Due: ₹${b.balanceAmount}</p>
      </td>
      <td class="py-3 px-4 font-mono text-[11px] text-slate-400">${b.utr || 'N/A'}</td>
      <td class="py-3 px-4">
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" 
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-medium text-[11px] transition-colors">
          <span>WhatsApp</span>
        </a>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function showAdminToast(msg) {
  const toast = document.getElementById('admin-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('opacity-100');
  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
    toast.classList.remove('opacity-100');
  }, 3000);
}

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { gsap } from 'gsap';
import { fetchSellerOrders, updateOrderStatus } from '../services/order.api.js';

/* ── Google Fonts ── */
function useFonts() {
  useEffect(() => {
    if (document.getElementById('snitch-gfonts')) return;
    const link = document.createElement('link');
    link.id = 'snitch-gfonts'; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Saira:wght@300;400;600;700;900&family=Exo:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

const saira = { fontFamily: "'Saira', sans-serif" };
const exo   = { fontFamily: "'Exo', sans-serif" };
const sym   = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' };

/* ── Tracking pipeline ── */
const PIPELINE = [
  { key: 'confirmed',        label: 'Confirmed',        icon: '✅' },
  { key: 'processing',       label: 'Processing',        icon: '🏭' },
  { key: 'shipped',          label: 'Shipped',           icon: '🚚' },
  { key: 'out_for_delivery', label: 'Out for Delivery',  icon: '🛵' },
  { key: 'delivered',        label: 'Delivered',         icon: '🎉' },
];
const ALL_STATUSES = [
  ...PIPELINE,
  { key: 'cancelled', label: 'Cancelled', icon: '❌' },
  { key: 'returned',  label: 'Returned',  icon: '↩️' },
];
const STATUS_META = {
  confirmed:        { color: '#16a34a', bg: 'rgba(22,163,74,0.10)',   border: 'rgba(22,163,74,0.25)' },
  processing:       { color: '#2563eb', bg: 'rgba(37,99,235,0.10)',   border: 'rgba(37,99,235,0.25)' },
  shipped:          { color: '#7c3aed', bg: 'rgba(124,58,237,0.10)',  border: 'rgba(124,58,237,0.25)' },
  out_for_delivery: { color: '#d97706', bg: 'rgba(217,119,6,0.10)',   border: 'rgba(217,119,6,0.25)' },
  delivered:        { color: '#059669', bg: 'rgba(5,150,105,0.10)',   border: 'rgba(5,150,105,0.25)' },
  cancelled:        { color: '#dc2626', bg: 'rgba(220,38,38,0.10)',   border: 'rgba(220,38,38,0.25)' },
  returned:         { color: '#6b7280', bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.25)' },
  pending:          { color: '#d97706', bg: 'rgba(217,119,6,0.10)',   border: 'rgba(217,119,6,0.25)' },
  paid:             { color: '#16a34a', bg: 'rgba(22,163,74,0.10)',   border: 'rgba(22,163,74,0.25)' },
};

/* ── Icons ── */
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ArrowLeftIcon = () => <Icon d="M15 19l-7-7 7-7" />;
const PackageIcon   = () => <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" size={18} />;
const SpinnerIcon   = () => (
  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);
const RefreshIcon = () => <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={13} />;
const ChevronDown = () => <Icon d="M19 9l-7 7-7-7" size={13} />;

/* ── Helpers ── */
const fmtDate  = (iso) => !iso ? '—' : new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtShort = (iso) => !iso ? '—' : new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/* ══════════════════════════════════════
   STATUS MANAGER — inside expanded card
══════════════════════════════════════ */
function StatusManager({ order, onUpdated }) {
  const [newStatus, setNewStatus]       = useState(order.status);
  const [note, setNote]                 = useState('');
  const [trackingNum, setTrackingNum]   = useState(order.trackingNumber || '');
  const [courier, setCourier]           = useState(order.courierPartner || '');
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [err, setErr]                   = useState('');

  const handleSave = async () => {
    if (newStatus === order.status && !note && trackingNum === order.trackingNumber && courier === order.courierPartner) return;
    setSaving(true); setErr('');
    try {
      const payload = { status: newStatus };
      if (note) payload.note = note;
      if (trackingNum) payload.trackingNumber = trackingNum;
      if (courier) payload.courierPartner = courier;
      const data = await updateOrderStatus(order._id, payload);
      onUpdated(data.order);
      setSaved(true);
      setNote('');
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErr(e.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: 'rgba(13,43,41,0.04)', border: '1px solid rgba(255,255,255,0.55)' }}
    >
      <p className="text-[9px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#b8860b' }}>
        📦 Manage Order Status
      </p>

      {/* Status selector */}
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map(s => {
          const meta = STATUS_META[s.key] || STATUS_META.pending;
          const active = newStatus === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setNewStatus(s.key)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                ...exo,
                background: active ? meta.bg : 'rgba(255,255,255,0.45)',
                border: active ? `1.5px solid ${meta.border}` : '1px solid rgba(255,255,255,0.70)',
                color: active ? meta.color : '#6aaca8',
                boxShadow: active ? `0 2px 8px ${meta.bg}` : 'none',
              }}
            >
              {s.icon} {s.label}
            </button>
          );
        })}
      </div>

      {/* Extra fields (tracking + courier) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Tracking number (optional)"
          value={trackingNum}
          onChange={e => setTrackingNum(e.target.value)}
          className="px-3 py-2 rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-400/30"
          style={{ ...exo, background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.72)', color: '#0d2b29' }}
        />
        <input
          type="text"
          placeholder="Courier partner (e.g. Delhivery)"
          value={courier}
          onChange={e => setCourier(e.target.value)}
          className="px-3 py-2 rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-400/30"
          style={{ ...exo, background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.72)', color: '#0d2b29' }}
        />
      </div>

      {/* Note */}
      <input
        type="text"
        placeholder="Add a note for this update (visible to buyer)…"
        value={note}
        onChange={e => setNote(e.target.value)}
        className="px-3 py-2 rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-400/30"
        style={{ ...exo, background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.72)', color: '#0d2b29' }}
      />

      {err && <p className="text-[10px]" style={{ color: '#dc2626', ...exo }}>{err}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="self-start flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        style={{ ...saira, background: saved ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#1e5c58,#0d2b29)', color: '#fff', boxShadow: '0 2px 10px rgba(13,43,41,0.20)' }}
      >
        {saving ? <SpinnerIcon /> : saved ? '✓ Saved!' : '💾 Update Status'}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════
   TRACKING HISTORY (mini)
══════════════════════════════════════ */
function TrackingHistory({ events }) {
  if (!events || events.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[9px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#b8860b' }}>Activity Log</p>
      {[...events].reverse().map((ev, i) => {
        const meta = STATUS_META[ev.status] || STATUS_META.pending;
        const step = ALL_STATUSES.find(s => s.key === ev.status);
        return (
          <div key={i} className="flex items-start gap-2">
            <div
              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
              style={{ background: meta.color }}
            />
            <div>
              <span
                className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-full"
                style={{ ...exo, background: meta.bg, color: meta.color }}
              >
                {step?.icon} {step?.label || ev.status}
              </span>
              <span className="text-[9px] ml-1.5" style={{ ...exo, color: '#6aaca8' }}>{fmtDate(ev.timestamp)}</span>
              {ev.note && <p className="text-[10px] mt-0.5" style={{ ...exo, color: '#3d7e7a' }}>{ev.note}</p>}
              {ev.updatedBy?.fullname && <p className="text-[9px]" style={{ ...exo, color: '#6aaca8' }}>by {ev.updatedBy.fullname}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════
   ORDER CARD — seller view
══════════════════════════════════════ */
function OrderCard({ order: initialOrder, index }) {
  const cardRef = useRef(null);
  const [order, setOrder]       = useState(initialOrder);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, delay: index * 0.06, ease: 'power3.out' }
    );
  }, [index]);

  const buyer    = order.buyer || {};
  const addr     = order.shippingAddress || {};
  const currency = order.currency || 'INR';
  const currSym  = sym[currency] || '₹';
  const meta     = STATUS_META[order.status] || STATUS_META.pending;
  const step     = ALL_STATUSES.find(s => s.key === order.status);

  return (
    <div
      ref={cardRef}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.45)',
        border: '1px solid rgba(255,255,255,0.72)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 12px rgba(13,43,41,0.06)',
      }}
    >
      {/* Header row */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(p => !p)}
      >
        {/* Buyer info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(13,43,41,0.06)', color: '#1e5c58' }}
          >
            <PackageIcon />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black tracking-wide truncate" style={{ ...saira, color: '#0d2b29' }}>
              {buyer.fullname || buyer.email || 'Unknown Buyer'}
            </p>
            <p className="text-[10px] truncate mt-0.5" style={{ ...exo, color: '#3d7e7a' }}>
              {buyer.email}{buyer.contact ? ` · ${buyer.contact}` : ''}
            </p>
          </div>
        </div>

        {/* Amount + status + date + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-black" style={{ ...saira, color: '#b8860b' }}>
            {currSym}{Number(order.totalAmount).toLocaleString()}
          </span>
          <span
            className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
            style={{ ...exo, background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
          >
            {step?.icon} {step?.label || order.status}
          </span>
          <span className="text-[9px] hidden sm:block" style={{ ...exo, color: '#6aaca8' }}>{fmtDate(order.createdAt)}</span>
          <span
            style={{ color: '#6aaca8', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <ChevronDown />
          </span>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.55)' }}>

          {/* Status manager */}
          <StatusManager order={order} onUpdated={setOrder} />

          {/* Buyer credentials grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {[
              { label: 'Buyer',      value: buyer.fullname || '—' },
              { label: 'Email',      value: buyer.email    || '—' },
              { label: 'Phone',      value: buyer.contact || addr.phone || '—' },
              { label: 'Order ID',   value: order.razorpay_order_id   || '—', mono: true },
              { label: 'Payment ID', value: order.razorpay_payment_id || '—', mono: true },
              { label: 'Placed',     value: fmtDate(order.createdAt) },
            ].map(({ label, value, mono }) => (
              <div
                key={label}
                className="rounded-xl px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.75)' }}
              >
                <p className="text-[8px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>{label}</p>
                <p className="text-[10px] break-all mt-0.5 font-semibold"
                  style={{ ...(mono ? { fontFamily: 'monospace' } : exo), color: '#0d2b29' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Signature */}
          {order.razorpay_signature && (
            <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.75)' }}>
              <p className="text-[8px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>Razorpay Signature</p>
              <p className="text-[10px] font-mono break-all mt-0.5" style={{ color: '#3d7e7a' }}>{order.razorpay_signature}</p>
            </div>
          )}

          {/* Shipping address */}
          {addr.fullName && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.75)' }}>
              <p className="text-[9px] font-bold tracking-widest uppercase mb-1.5" style={{ ...exo, color: '#b8860b' }}>Shipping Address</p>
              <p className="text-xs leading-relaxed" style={{ ...exo, color: '#0d2b29' }}>
                {addr.fullName}<br />
                {addr.address}{addr.city ? `, ${addr.city}` : ''}{addr.state ? `, ${addr.state}` : ''}{addr.pincode ? ` — ${addr.pincode}` : ''}
                {addr.phone && <><br />📞 {addr.phone}</>}
              </p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-[9px] font-bold tracking-widest uppercase mb-2" style={{ ...exo, color: '#b8860b' }}>Items Ordered</p>
            <div className="flex flex-col gap-2">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.72)' }}>
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#d5ecea', color: '#6aaca8' }}>
                      <PackageIcon />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ ...saira, color: '#0d2b29' }}>{item.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ ...exo, color: '#3d7e7a' }}>
                      {[item.color, item.size].filter(Boolean).join(' · ')} × {item.quantity}
                    </p>
                  </div>
                  <span className="flex-shrink-0 font-bold text-sm" style={{ ...saira, color: '#b8860b' }}>
                    {currSym}{Number((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking history */}
          <TrackingHistory events={order.trackingEvents || []} />

          {/* Total */}
          <div className="flex justify-end pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.55)' }}>
            <span className="text-[11px] font-bold mr-1" style={{ ...exo, color: '#6aaca8' }}>Total Paid:</span>
            <span className="text-base font-black" style={{ ...saira, color: '#0d2b29' }}>
              {currSym}{Number(order.totalAmount).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════ */
function EmptyOrders() {
  const ref = useRef(null);
  useEffect(() => {
    gsap.fromTo(ref.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.4)' });
  }, []);
  return (
    <div ref={ref} className="flex flex-col items-center justify-center py-24 gap-5">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
        style={{ background: 'rgba(245,197,24,0.08)', border: '1px dashed rgba(245,197,24,0.30)' }}
      >
        📦
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold mb-1" style={{ ...saira, color: '#0d2b29' }}>No orders yet</p>
        <p className="text-xs max-w-xs" style={{ ...exo, color: '#3d7e7a' }}>
          Orders placed by buyers for your products will appear here with full credentials.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN SELLER ORDERS PAGE
══════════════════════════════════════ */
export default function OrderSuccessPage() {
  useFonts();
  const navigate   = useNavigate();
  const user       = useSelector(state => state.auth.user);
  const sellerName = user?.fullname || user?.email?.split('@')[0] || 'Seller';

  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');

  const pageRef   = useRef(null);
  const headerRef = useRef(null);
  const bodyRef   = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
      gsap.fromTo(bodyRef.current,   { y: 20,  opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, delay: 0.12, ease: 'power3.out' });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchSellerOrders();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filtered = orders.filter(o => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const buyer = o.buyer || {};
    return (
      (buyer.fullname || '').toLowerCase().includes(q) ||
      (buyer.email    || '').toLowerCase().includes(q) ||
      (o.razorpay_order_id   || '').toLowerCase().includes(q) ||
      (o.razorpay_payment_id || '').toLowerCase().includes(q) ||
      (o.status || '').toLowerCase().includes(q) ||
      (o.items || []).some(i => (i.title || '').toLowerCase().includes(q))
    );
  });

  const totalRevenue = orders.filter(o => !['failed','cancelled'].includes(o.status))
    .reduce((s, o) => s + (o.totalAmount || 0), 0);
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const pending   = orders.filter(o => !['delivered','cancelled','returned','failed'].includes(o.status)).length;

  return (
    <div ref={pageRef} className="min-h-screen w-screen flex flex-col" style={{ background: '#E3F1F0' }}>
      {/* Grid texture */}
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none z-0"
        style={{ backgroundImage: 'linear-gradient(#2a8a85 1px,transparent 1px),linear-gradient(90deg,#2a8a85 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

      {/* HEADER */}
      <header ref={headerRef} className="relative z-40 flex-shrink-0 border-b backdrop-blur-md"
        style={{ background: 'rgba(227,241,240,0.88)', borderColor: 'rgba(255,255,255,0.60)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/seller/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all hover:scale-105"
              style={{ ...exo, background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#0d2b29' }}>
              <ArrowLeftIcon /> Dashboard
            </button>
            <span className="text-base font-black tracking-[0.35em] uppercase" style={{ ...saira, color: '#b8860b' }}>SNITCH</span>
            <span className="hidden sm:block text-[10px] font-semibold tracking-widest uppercase" style={{ ...exo, color: '#3d7e7a' }}>· Seller Orders</span>
          </div>
          <div className="flex items-center gap-3">
            {sellerName && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)' }}>
                <span className="text-[9px] tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>Hello,</span>
                <span className="text-[11px] font-bold" style={{ ...saira, color: '#0d2b29' }}>{sellerName}</span>
              </div>
            )}
            <button onClick={loadOrders} title="Refresh"
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#3d7e7a' }}>
              <RefreshIcon />
            </button>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div ref={bodyRef} className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-6 flex flex-col gap-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Orders', value: orders.length },
            { label: 'Pending',      value: pending },
            { label: 'Delivered',    value: delivered },
            { label: 'Revenue',      value: `₹${totalRevenue.toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl px-5 py-3.5 backdrop-blur-md"
              style={{ background: 'rgba(255,255,255,0.42)', border: '1px solid rgba(255,255,255,0.68)', boxShadow: '0 1px 4px rgba(42,138,133,0.07)' }}>
              <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ ...exo, color: '#3d7e7a' }}>{label}</p>
              <p className="text-xl font-black mt-1" style={{ ...saira, color: '#0d2b29' }}>
                {loading ? <span style={{ color: '#6aaca8' }}>—</span> : value}
              </p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold tracking-[0.28em] uppercase" style={{ ...exo, color: '#b8860b' }}>SELLER DASHBOARD</p>
            <h1 className="text-2xl font-black leading-tight" style={{ ...saira, color: '#0d2b29' }}>
              Incoming <span style={{ color: '#b8860b' }}>Orders</span>
            </h1>
          </div>
          {!loading && orders.length > 0 && (
            <div className="relative flex items-center w-56 sm:w-72">
              <span className="absolute left-3 text-[10px]" style={{ color: '#6aaca8' }}>🔍</span>
              <input type="text" placeholder="Search buyer, product, order ID…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-7 pr-6 py-1.5 rounded-xl text-[11px] focus:outline-none transition-all"
                style={{ ...exo, background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#0d2b29' }} />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 text-[10px] font-bold" style={{ color: '#6aaca8' }}>✕</button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-xs"
            style={{ ...exo, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div style={{ color: '#6aaca8' }}><SpinnerIcon /></div>
            <p className="text-xs tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>Loading orders…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyOrders />
        ) : (
          <div className="flex flex-col gap-3 pb-8">
            <p className="text-[10px]" style={{ ...exo, color: '#6aaca8' }}>
              {filtered.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
            </p>
            {filtered.map((order, i) => (
              <OrderCard key={order._id || i} order={order} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

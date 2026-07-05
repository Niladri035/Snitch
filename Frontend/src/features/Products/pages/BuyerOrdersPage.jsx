import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { gsap } from 'gsap';
import { fetchBuyerOrders } from '../services/order.api.js';

/* ── Google Fonts ── */
function useFonts() {
  useEffect(() => {
    if (document.getElementById('snitch-gfonts-buyer')) return;
    const link = document.createElement('link');
    link.id = 'snitch-gfonts-buyer';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Saira:wght@300;400;600;700;900&family=Exo:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

const saira = { fontFamily: "'Saira', sans-serif" };
const exo   = { fontFamily: "'Exo', sans-serif" };
const sym   = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' };

/* ── Tracking pipeline ── */
const PIPELINE = [
  { key: 'confirmed',        label: 'Order Confirmed',     icon: '✅', desc: 'Payment received and order confirmed' },
  { key: 'processing',       label: 'Processing',          icon: '🏭', desc: 'Being packed and prepared for dispatch' },
  { key: 'shipped',          label: 'Shipped',             icon: '🚚', desc: 'Handed to courier partner' },
  { key: 'out_for_delivery', label: 'Out for Delivery',    icon: '🛵', desc: 'On the way to your address' },
  { key: 'delivered',        label: 'Delivered',           icon: '🎉', desc: 'Successfully delivered' },
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

/* ── Helpers ── */
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};
const fmtShort = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const getPipelineIndex = (status) => PIPELINE.findIndex(s => s.key === status);

/* ── Icons ── */
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ArrowLeftIcon  = () => <Icon d="M15 19l-7-7 7-7" size={16} />;
const PackageIcon    = () => <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" size={18} />;
const ChevronDown    = () => <Icon d="M19 9l-7 7-7-7" size={14} />;
const SpinnerIcon    = () => (
  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);
const RefreshIcon    = () => <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={14} />;

/* ══════════════════════════════════════════
   TRACKING TIMELINE (inside expanded card)
══════════════════════════════════════════ */
function TrackingTimeline({ status, trackingEvents }) {
  const pipeIdx = getPipelineIndex(status);
  const isTerminal = ['cancelled', 'returned', 'failed'].includes(status);

  return (
    <div className="py-2">
      {/* Pipeline steps */}
      {!isTerminal && (
        <div className="relative flex items-start gap-0 mb-6">
          {/* Connector line */}
          <div
            className="absolute top-4 left-4 right-4 h-0.5 z-0"
            style={{ background: 'rgba(255,255,255,0.40)' }}
          />
          {/* Filled connector */}
          <div
            className="absolute top-4 left-4 h-0.5 z-0 transition-all duration-700"
            style={{
              background: 'linear-gradient(90deg,#1e5c58,#b8860b)',
              width: pipeIdx === -1 ? '0%' : `${(pipeIdx / (PIPELINE.length - 1)) * 100}%`,
              maxWidth: 'calc(100% - 2rem)',
            }}
          />
          {PIPELINE.map((step, i) => {
            const done    = pipeIdx >= i;
            const current = pipeIdx === i;
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center flex-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                  style={
                    done
                      ? { background: current ? 'linear-gradient(135deg,#1e5c58,#0d2b29)' : 'linear-gradient(135deg,#b8860b,#d4a800)', color: '#fff', boxShadow: current ? '0 0 0 4px rgba(30,92,88,0.20)' : 'none' }
                      : { background: 'rgba(255,255,255,0.45)', border: '1.5px solid rgba(255,255,255,0.70)', color: '#6aaca8' }
                  }
                >
                  {done ? (current ? step.icon : '✓') : <span style={{ fontSize: 10, ...exo, fontWeight: 600 }}>{i + 1}</span>}
                </div>
                <p className="text-[9px] font-bold tracking-wide mt-1.5 text-center leading-tight max-w-[60px]"
                  style={{ ...exo, color: done ? '#0d2b29' : '#6aaca8' }}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancelled / returned banner */}
      {isTerminal && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.20)' }}
        >
          <span className="text-xl">{status === 'cancelled' ? '❌' : '↩️'}</span>
          <div>
            <p className="text-xs font-bold" style={{ ...saira, color: '#dc2626' }}>
              Order {status.charAt(0).toUpperCase() + status.slice(1)}
            </p>
            <p className="text-[10px]" style={{ ...exo, color: '#6b7280' }}>
              {status === 'cancelled' ? 'This order was cancelled.' : 'This order was returned.'}
            </p>
          </div>
        </div>
      )}

      {/* Event history */}
      {trackingEvents && trackingEvents.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ ...exo, color: '#b8860b' }}>
            Activity History
          </p>
          {[...trackingEvents].reverse().map((ev, i) => {
            const meta = STATUS_META[ev.status] || STATUS_META.pending;
            const step = PIPELINE.find(p => p.key === ev.status);
            return (
              <div key={i} className="flex items-start gap-3">
                {/* Dot */}
                <div className="flex flex-col items-center mt-1 flex-shrink-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: meta.color }}
                  />
                  {i < trackingEvents.length - 1 && (
                    <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.40)', minHeight: 16 }} />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
                      style={{ ...exo, background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
                    >
                      {step?.label || ev.status}
                    </span>
                    <span className="text-[9px]" style={{ ...exo, color: '#6aaca8' }}>
                      {fmtDate(ev.timestamp)}
                    </span>
                  </div>
                  {ev.note && (
                    <p className="text-[10px] mt-0.5" style={{ ...exo, color: '#3d7e7a' }}>{ev.note}</p>
                  )}
                  {ev.updatedBy?.fullname && (
                    <p className="text-[9px] mt-0.5" style={{ ...exo, color: '#6aaca8' }}>
                      by {ev.updatedBy.fullname}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   ORDER CARD — collapsible
══════════════════════════════════════════ */
function OrderCard({ order, index }) {
  const cardRef  = useRef(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, delay: index * 0.07, ease: 'power3.out' }
    );
  }, [index]);

  const currency = order.currency || 'INR';
  const currSym  = sym[currency] || '₹';
  const meta     = STATUS_META[order.status] || STATUS_META.pending;
  const step     = PIPELINE.find(p => p.key === order.status);
  const pipeIdx  = getPipelineIndex(order.status);
  const hero     = order.items?.[0];

  return (
    <div
      ref={cardRef}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.48)',
        border: '1px solid rgba(255,255,255,0.75)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 2px 16px rgba(13,43,41,0.07)',
      }}
    >
      {/* ── Summary Row ── */}
      <div
        className="flex flex-wrap items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(p => !p)}
      >
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#d5ecea]">
          {hero?.image ? (
            <img src={hero.image} alt={hero.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: '#6aaca8' }}>
              <PackageIcon />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black truncate" style={{ ...saira, color: '#0d2b29' }}>
            {order.items?.length === 1
              ? hero?.title
              : `${order.items?.length} items`}
          </p>
          <p className="text-[10px] mt-0.5 truncate" style={{ ...exo, color: '#3d7e7a' }}>
            Order #{(order.razorpay_order_id || order._id || '').slice(-10).toUpperCase()}
          </p>
          <p className="text-[9px] mt-0.5" style={{ ...exo, color: '#6aaca8' }}>
            {fmtShort(order.createdAt)}
          </p>
        </div>

        {/* Status + amount */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-base font-black" style={{ ...saira, color: '#b8860b' }}>
            {currSym}{Number(order.totalAmount).toLocaleString()}
          </span>
          <span
            className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full"
            style={{ ...exo, background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
          >
            {step?.icon} {step?.label || order.status}
          </span>
        </div>

        {/* Chevron */}
        <span
          className="flex-shrink-0 transition-transform duration-200"
          style={{ color: '#6aaca8', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <ChevronDown />
        </span>
      </div>

      {/* ── Progress mini bar ── */}
      {pipeIdx >= 0 && (
        <div className="px-5 pb-2">
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.45)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${((pipeIdx + 1) / PIPELINE.length) * 100}%`,
                background: 'linear-gradient(90deg,#1e5c58,#b8860b)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px]" style={{ ...exo, color: '#6aaca8' }}>Order Placed</span>
            <span className="text-[8px]" style={{ ...exo, color: '#6aaca8' }}>Delivered</span>
          </div>
        </div>
      )}

      {/* ── Expanded content ── */}
      {expanded && (
        <div
          className="px-5 pb-5 pt-2 flex flex-col gap-5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.55)' }}
        >
          {/* Tracking timeline */}
          <TrackingTimeline status={order.status} trackingEvents={order.trackingEvents || []} />

          {/* Courier info */}
          {(order.trackingNumber || order.courierPartner) && (
            <div
              className="rounded-xl px-4 py-3 flex flex-wrap gap-4"
              style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.75)' }}
            >
              {order.courierPartner && (
                <div>
                  <p className="text-[8px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>Courier</p>
                  <p className="text-xs font-bold" style={{ ...saira, color: '#0d2b29' }}>{order.courierPartner}</p>
                </div>
              )}
              {order.trackingNumber && (
                <div>
                  <p className="text-[8px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>Tracking No.</p>
                  <p className="text-xs font-mono font-bold" style={{ color: '#0d2b29' }}>{order.trackingNumber}</p>
                </div>
              )}
              {order.estimatedDelivery && (
                <div>
                  <p className="text-[8px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>Est. Delivery</p>
                  <p className="text-xs font-bold" style={{ ...saira, color: '#0d2b29' }}>{fmtShort(order.estimatedDelivery)}</p>
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-[9px] font-bold tracking-widest uppercase mb-2" style={{ ...exo, color: '#b8860b' }}>Items</p>
            <div className="flex flex-col gap-2">
              {(order.items || []).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.72)' }}
                >
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

          {/* Shipping address */}
          {order.shippingAddress?.fullName && (
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.72)' }}
            >
              <p className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ ...exo, color: '#b8860b' }}>
                Shipping Address
              </p>
              <p className="text-xs leading-relaxed" style={{ ...exo, color: '#0d2b29' }}>
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.address}
                {order.shippingAddress.city ? `, ${order.shippingAddress.city}` : ''}
                {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}
                {order.shippingAddress.pincode ? ` — ${order.shippingAddress.pincode}` : ''}
                {order.shippingAddress.phone && <><br />📞 {order.shippingAddress.phone}</>}
              </p>
            </div>
          )}

          {/* Payment IDs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.72)' }}>
              <p className="text-[8px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>Order ID</p>
              <p className="text-[10px] font-mono break-all mt-0.5" style={{ color: '#0d2b29' }}>
                {order.razorpay_order_id || '—'}
              </p>
            </div>
            <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.72)' }}>
              <p className="text-[8px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>Payment ID</p>
              <p className="text-[10px] font-mono break-all mt-0.5" style={{ color: '#0d2b29' }}>
                {order.razorpay_payment_id || '—'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════ */
function EmptyOrders({ onShop }) {
  const ref = useRef(null);
  useEffect(() => {
    gsap.fromTo(ref.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.4)' });
  }, []);
  return (
    <div ref={ref} className="flex flex-col items-center justify-center py-24 gap-5">
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center"
        style={{ background: 'rgba(245,197,24,0.08)', border: '1px dashed rgba(245,197,24,0.35)', color: '#b8860b', fontSize: 36 }}
      >
        🛍️
      </div>
      <div className="text-center">
        <p className="text-base font-black mb-1" style={{ ...saira, color: '#0d2b29' }}>No orders yet</p>
        <p className="text-sm max-w-xs" style={{ ...exo, color: '#3d7e7a' }}>
          When you place an order, you can track it live right here.
        </p>
      </div>
      <button
        onClick={onShop}
        className="px-6 py-2.5 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all hover:opacity-90 active:scale-95"
        style={{ ...saira, background: 'linear-gradient(135deg,#F5C518,#d4a800)', color: '#0d2b29', boxShadow: '0 4px 20px rgba(245,197,24,0.25)' }}
      >
        Shop Now ✨
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN BUYER ORDERS PAGE
══════════════════════════════════════════ */
export default function BuyerOrdersPage() {
  useFonts();
  const navigate   = useNavigate();
  const user       = useSelector(state => state.auth.user);
  const userName   = user?.fullname || user?.email?.split('@')[0] || 'You';

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
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBuyerOrders();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load orders. Please log in.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filtered = orders.filter(o => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (o.razorpay_order_id || '').toLowerCase().includes(q) ||
      (o.razorpay_payment_id || '').toLowerCase().includes(q) ||
      (o.status || '').toLowerCase().includes(q) ||
      (o.items || []).some(i => (i.title || '').toLowerCase().includes(q))
    );
  });

  /* Summary stats */
  const delivered  = orders.filter(o => o.status === 'delivered').length;
  const inTransit  = orders.filter(o => ['shipped', 'out_for_delivery', 'processing', 'confirmed'].includes(o.status)).length;

  return (
    <div
      ref={pageRef}
      className="min-h-screen w-screen flex flex-col"
      style={{ background: '#E3F1F0' }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.035] pointer-events-none z-0"
        style={{
          backgroundImage: 'linear-gradient(#2a8a85 1px,transparent 1px),linear-gradient(90deg,#2a8a85 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── HEADER ── */}
      <header
        ref={headerRef}
        className="relative z-40 flex-shrink-0 border-b backdrop-blur-md"
        style={{ background: 'rgba(227,241,240,0.88)', borderColor: 'rgba(255,255,255,0.60)' }}
      >
        <div className="max-w-4xl mx-auto px-6 lg:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all hover:scale-105"
              style={{ ...exo, background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#0d2b29' }}
            >
              <ArrowLeftIcon /> Home
            </button>
            <span className="text-base font-black tracking-[0.35em] uppercase" style={{ ...saira, color: '#b8860b' }}>
              SNITCH
            </span>
            <span className="hidden sm:block text-[10px] font-semibold tracking-widest uppercase" style={{ ...exo, color: '#3d7e7a' }}>
              · My Orders
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)' }}
            >
              <span className="text-[9px] tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>Hello,</span>
              <span className="text-[11px] font-bold" style={{ ...saira, color: '#0d2b29' }}>{userName}</span>
            </div>
            <button
              onClick={loadOrders}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#3d7e7a' }}
            >
              <RefreshIcon />
            </button>
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div ref={bodyRef} className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 lg:px-12 py-6 flex flex-col gap-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Orders', value: orders.length },
            { label: 'In Transit',   value: inTransit },
            { label: 'Delivered',    value: delivered },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl px-4 py-3 backdrop-blur-md"
              style={{ background: 'rgba(255,255,255,0.42)', border: '1px solid rgba(255,255,255,0.68)', boxShadow: '0 1px 4px rgba(42,138,133,0.07)' }}
            >
              <p className="text-[9px] font-semibold tracking-widest uppercase" style={{ ...exo, color: '#3d7e7a' }}>{label}</p>
              <p className="text-2xl font-black mt-1" style={{ ...saira, color: '#0d2b29' }}>
                {loading ? <span style={{ color: '#6aaca8' }}>—</span> : value}
              </p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold tracking-[0.28em] uppercase" style={{ ...exo, color: '#b8860b' }}>MY PURCHASES</p>
            <h1 className="text-2xl font-black leading-tight" style={{ ...saira, color: '#0d2b29' }}>
              Track Your <span style={{ color: '#b8860b' }}>Orders</span>
            </h1>
          </div>
          {!loading && orders.length > 0 && (
            <div className="relative flex items-center w-52 sm:w-64">
              <span className="absolute left-3 text-[10px]" style={{ color: '#6aaca8' }}>🔍</span>
              <input
                type="text"
                placeholder="Search by product, ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-7 pr-6 py-1.5 rounded-xl text-[11px] focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#0d2b29', ...exo }}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 text-[10px] font-bold" style={{ color: '#6aaca8' }}>✕</button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-xs" style={{ ...exo, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div style={{ color: '#6aaca8' }}><SpinnerIcon /></div>
            <p className="text-xs tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>Loading your orders…</p>
          </div>
        ) : filtered.length === 0 && orders.length === 0 ? (
          <EmptyOrders onShop={() => navigate('/')} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm font-semibold" style={{ ...saira, color: '#0d2b29' }}>No results for "{search}"</p>
            <button onClick={() => setSearch('')} className="text-xs underline" style={{ ...exo, color: '#3d7e7a' }}>Clear search</button>
          </div>
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

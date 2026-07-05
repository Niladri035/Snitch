import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { gsap } from 'gsap';
import { clearCartThunk } from '../state/cart.slice.js';
import { useRazorpay } from "react-razorpay";
import { useCart } from '../hook/useCart.js';
import { createOrder as saveOrderToDb } from '../services/order.api.js';

/* ── Font tokens ── */
const saira = { fontFamily: "'Saira', sans-serif" };
const exo = { fontFamily: "'Exo', sans-serif" };
const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' };

/* ── Icon components ── */
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const CheckCircleIcon = () => <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" size={22} />;
const HomeIcon = () => <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
const CardIcon = () => <Icon d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />;
const TagIcon = () => <Icon d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />;
const TruckIcon = () => <Icon d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.98-1.71L21 6H6" />;
const ArrowRightIcon = () => <Icon d="M9 5l7 7-7 7" size={16} />;
const GiftIcon = () => <Icon d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4 2 2 0 010 4zm14 0a2 2 0 110-4 2 2 0 010 4z" />;

const STEPS = ['Delivery', 'Payment', 'Review'];

/* ── Promo codes (same as CartDrawer) ── */
const PROMO_MAP = { SLAY20: 20, BESTIE: 10 };

/* ═══════════════════════════════════════════════
   ADDRESS FORM
═══════════════════════════════════════════════ */
const EMPTY_ADDR = {
  fullName: '', phone: '', pincode: '', address: '', city: '', state: '', type: 'HOME'
};

function AddressStep({ savedAddress, onContinue }) {
  const [form, setForm] = useState(savedAddress || EMPTY_ADDR);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit phone number';
    if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Enter a valid 6-digit PIN code';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state.trim()) e.state = 'State is required';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) onContinue(form);
  };

  const field = (key, label, placeholder, opts = {}) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500" style={{ ...exo }}>{label}</label>
      <input
        type={opts.type || 'text'}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        maxLength={opts.maxLength}
        className="px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all duration-150"
        style={{
          background: errors[key] ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.65)',
          border: errors[key] ? '1.5px solid rgba(239,68,68,0.45)' : '1.5px solid rgba(255,255,255,0.85)',
          color: '#0d2b29',
          ...saira
        }}
      />
      {errors[key] && <p className="text-[9px] text-red-500 font-medium px-1" style={{ ...exo }}>{errors[key]}</p>}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 mb-1">
        <HomeIcon />
        <h3 className="text-base font-black text-neutral-800" style={{ ...saira }}>Delivery Address</h3>
      </div>

      {/* Address type toggle */}
      <div className="flex gap-2">
        {['HOME', 'WORK', 'OTHER'].map(t => (
          <button
            key={t}
            onClick={() => setForm(f => ({ ...f, type: t }))}
            className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-150"
            style={{
              ...exo,
              background: form.type === t ? '#0d2b29' : 'rgba(255,255,255,0.55)',
              border: form.type === t ? 'none' : '1px solid rgba(13,43,41,0.18)',
              color: form.type === t ? '#fff' : '#0d2b29'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">{field('fullName', 'Full Name', 'John Doe')}</div>
        <div className="col-span-2 sm:col-span-1">{field('phone', 'Phone Number', '9876543210', { maxLength: 10 })}</div>
        <div className="col-span-2 sm:col-span-1">{field('pincode', 'PIN Code', '400001', { maxLength: 6 })}</div>
        <div className="col-span-2">{field('address', 'House / Building / Street', '123 Main Street, Block B')}</div>
        <div>{field('city', 'City', 'Mumbai')}</div>
        <div>{field('state', 'State', 'Maharashtra')}</div>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-2 w-full py-3.5 rounded-2xl text-[11px] font-black tracking-[0.20em] uppercase text-white transition-all hover:opacity-90 active:scale-[0.97]"
        style={{ ...saira, background: 'linear-gradient(135deg,#0d2b29 0%,#1e5c58 100%)', boxShadow: '0 6px 24px rgba(13,43,41,0.22)' }}
      >
        Save &amp; Continue →
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAYMENT STEP
═══════════════════════════════════════════════ */
const PAYMENT_METHODS = [
  { id: 'upi', icon: '⚡', label: 'UPI', sub: 'PhonePe, GPay, Paytm' },
  { id: 'card', icon: '💳', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay' },
  { id: 'cod', icon: '💰', label: 'Cash on Delivery', sub: 'Pay when you receive' },
  { id: 'emi', icon: '📅', label: 'EMI', sub: 'No-cost EMI on select cards' },
  { id: 'nb', icon: '🏦', label: 'Net Banking', sub: 'All major banks supported' },
];

function PaymentStep({ onContinue }) {
  const [selected, setSelected] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <CardIcon />
        <h3 className="text-base font-black text-neutral-800" style={{ ...saira }}>Payment Method</h3>
      </div>

      {PAYMENT_METHODS.map(pm => (
        <div
          key={pm.id}
          onClick={() => setSelected(pm.id)}
          className="flex flex-col gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-200"
          style={{
            background: selected === pm.id ? 'rgba(13,43,41,0.06)' : 'rgba(255,255,255,0.55)',
            border: selected === pm.id ? '1.5px solid rgba(13,43,41,0.35)' : '1.5px solid rgba(255,255,255,0.80)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.75)' }}
            >
              {pm.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-neutral-800" style={{ ...saira }}>{pm.label}</p>
              <p className="text-[9px] text-neutral-500 mt-0.5" style={{ ...exo }}>{pm.sub}</p>
            </div>
            <div
              className="w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: selected === pm.id ? '#0d2b29' : 'rgba(200,200,200,0.6)' }}
            >
              {selected === pm.id && (
                <div className="w-2 h-2 rounded-full" style={{ background: '#0d2b29' }} />
              )}
            </div>
          </div>

          {/* Inline sub-forms */}
          {selected === 'upi' && pm.id === 'upi' && (
            <input
              type="text"
              value={upiId}
              onClick={e => e.stopPropagation()}
              onChange={e => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.80)', border: '1.5px solid rgba(255,255,255,0.95)', color: '#0d2b29', ...saira }}
            />
          )}

          {selected === 'card' && pm.id === 'card' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  value={cardNum}
                  onClick={e => e.stopPropagation()}
                  onChange={e => setCardNum(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="Card Number"
                  className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.80)', border: '1.5px solid rgba(255,255,255,0.95)', color: '#0d2b29', ...saira }}
                />
              </div>
              <input
                type="text"
                value={cardName}
                onClick={e => e.stopPropagation()}
                onChange={e => setCardName(e.target.value)}
                placeholder="Name on Card"
                className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.80)', border: '1.5px solid rgba(255,255,255,0.95)', color: '#0d2b29', ...saira }}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cardExp}
                  onClick={e => e.stopPropagation()}
                  onChange={e => setCardExp(e.target.value.slice(0, 5))}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.80)', border: '1.5px solid rgba(255,255,255,0.95)', color: '#0d2b29', ...saira }}
                />
                <input
                  type="password"
                  value={cardCvv}
                  onClick={e => e.stopPropagation()}
                  onChange={e => setCardCvv(e.target.value.slice(0, 4))}
                  placeholder="CVV"
                  className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.80)', border: '1.5px solid rgba(255,255,255,0.95)', color: '#0d2b29', ...saira }}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={() => onContinue(selected)}
        className="mt-2 w-full py-3.5 rounded-2xl text-[11px] font-black tracking-[0.20em] uppercase text-white transition-all hover:opacity-90 active:scale-[0.97]"
        style={{ ...saira, background: 'linear-gradient(135deg,#0d2b29 0%,#1e5c58 100%)', boxShadow: '0 6px 24px rgba(13,43,41,0.22)' }}
      >
        Review Order →
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   REVIEW & PLACE ORDER STEP
═══════════════════════════════════════════════ */
function ReviewStep({ address, paymentMethod, items, subtotal, discount, currency, onPlaceOrder, onEditAddress, onEditPayment }) {
  const currSym = sym[currency] || '₹';
  const shipping = subtotal > 999 ? 0 : 79;
  const grandTotal = subtotal + shipping;

  const pm = PAYMENT_METHODS.find(p => p.id === paymentMethod);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 mb-1">
        <TruckIcon />
        <h3 className="text-base font-black text-neutral-800" style={{ ...saira }}>Review Your Order</h3>
      </div>

      {/* Delivery block */}
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.55)', border: '1.5px solid rgba(255,255,255,0.80)' }}>
        <div className="flex justify-between items-start mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400" style={{ ...exo }}>Delivering To</p>
          <button onClick={onEditAddress} className="text-[10px] font-bold text-amber-600 underline underline-offset-2" style={{ ...exo }}>Change</button>
        </div>
        <p className="text-xs font-bold text-neutral-800" style={{ ...saira }}>{address.fullName} · {address.phone}</p>
        <p className="text-[10px] text-neutral-500 mt-0.5" style={{ ...exo }}>{address.address}, {address.city}, {address.state} — {address.pincode}</p>
        <span
          className="inline-block mt-1.5 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(13,43,41,0.08)', color: '#0d2b29', ...exo }}
        >
          {address.type}
        </span>
      </div>

      {/* Payment block */}
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.55)', border: '1.5px solid rgba(255,255,255,0.80)' }}>
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400" style={{ ...exo }}>Payment</p>
          <button onClick={onEditPayment} className="text-[10px] font-bold text-amber-600 underline underline-offset-2" style={{ ...exo }}>Change</button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg">{pm?.icon}</span>
          <p className="text-xs font-bold text-neutral-800" style={{ ...saira }}>{pm?.label}</p>
        </div>
      </div>

      {/* Order items */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400" style={{ ...exo }}>Your Items ({items.length})</p>
        {items.map((item, i) => {
          const product = item.product || {};
          const firstImg = product.images?.[0]?.uri;
          return (
            <div key={item._id || i} className="flex gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.75)' }}>
              <div className="w-10 h-12 rounded-lg overflow-hidden bg-neutral-200 flex-shrink-0">
                {firstImg && <img src={firstImg} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-neutral-800 truncate" style={{ ...saira }}>{product.title}</p>
                <p className="text-[9px] text-neutral-500 mt-0.5 uppercase" style={{ ...exo }}>{item.color} · {item.size} · Qty {item.quantity}</p>
              </div>
              <p className="text-xs font-black text-neutral-800 flex-shrink-0" style={{ ...saira }}>
                {currSym}{(product.price?.amount * item.quantity).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Price breakdown */}
      <div className="p-4 rounded-2xl flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.55)', border: '1.5px solid rgba(255,255,255,0.80)' }}>
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1" style={{ ...exo }}>Price Details</p>

        <div className="flex justify-between text-xs">
          <span className="text-neutral-600" style={{ ...exo }}>Items Total</span>
          <span className="font-semibold text-neutral-800" style={{ ...saira }}>{currSym}{(subtotal + discount).toLocaleString()}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-emerald-600 font-medium" style={{ ...exo }}>Promo Discount</span>
            <span className="font-semibold text-emerald-600" style={{ ...saira }}>-{currSym}{discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-neutral-600" style={{ ...exo }}>Delivery Charges</span>
          {shipping === 0 ? (
            <span className="font-semibold text-emerald-600" style={{ ...saira }}>FREE ✓</span>
          ) : (
            <span className="font-semibold text-neutral-800" style={{ ...saira }}>{currSym}{shipping}</span>
          )}
        </div>

        <div className="border-t pt-2 mt-1 flex justify-between items-end" style={{ borderColor: 'rgba(200,200,200,0.25)' }}>
          <p className="text-xs font-black tracking-wider text-neutral-800 uppercase" style={{ ...exo }}>Grand Total</p>
          <p className="text-xl font-black text-neutral-900" style={{ ...saira }}>{currSym}{grandTotal.toLocaleString()}</p>
        </div>

        {shipping === 0 && (
          <p className="text-[9px] text-emerald-600 font-medium" style={{ ...exo }}>🎉 You've unlocked FREE delivery on this order!</p>
        )}
      </div>

      {/* T&C note */}
      <p className="text-[9px] text-neutral-400 text-center" style={{ ...exo }}>
        By placing your order, you agree to Snitch's Terms of Service and Privacy Policy.
      </p>

      <button
        onClick={onPlaceOrder}
        className="w-full py-4 rounded-2xl text-sm font-black tracking-[0.18em] uppercase text-white transition-all hover:opacity-90 active:scale-[0.97]"
        style={{ ...saira, background: 'linear-gradient(135deg,#b8860b 0%,#daa520 100%)', boxShadow: '0 8px 30px rgba(184,134,11,0.35)' }}
      >
        🛍️ PLACE ORDER · {currSym}{grandTotal.toLocaleString()}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUCCESS SCREEN
═══════════════════════════════════════════════ */
function SuccessScreen({ onClose, orderId }) {
  const confRef  = useRef(null);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    gsap.fromTo(confRef.current, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' });
  }, []);

  return (
    <div ref={confRef} className="flex flex-col items-center justify-center h-full text-center px-8 gap-6">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#1e5c58 0%,#0d2b29 100%)', boxShadow: '0 12px 48px rgba(13,43,41,0.35)' }}
      >
        <CheckCircleIcon />
      </div>

      <div>
        <h2 className="text-2xl font-black text-neutral-900 mb-1" style={{ ...saira }}>Order Placed! 🎉</h2>
        <p className="text-sm text-neutral-600" style={{ ...exo }}>No cap, your fit is incoming bestie.</p>
        {orderId && (
          <p className="text-[10px] text-neutral-400 mt-2 font-mono tracking-widest">
            ORDER ID: #{orderId}
          </p>
        )}
      </div>

      <div className="w-full flex flex-col gap-3">
        <div className="p-4 rounded-2xl text-left" style={{ background: 'rgba(255,255,255,0.55)', border: '1.5px solid rgba(255,255,255,0.80)' }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">📦</span>
            <div>
              <p className="text-xs font-black text-neutral-800" style={{ ...saira }}>Estimated Delivery</p>
              <p className="text-[10px] text-neutral-500" style={{ ...exo }}>3–5 business days</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl">🛵</span>
            <div>
              <p className="text-xs font-black text-neutral-800" style={{ ...saira }}>Live Tracking</p>
              <p className="text-[10px] text-neutral-500" style={{ ...exo }}>Track your order status in real-time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2">
        <button
          onClick={() => { onClose(); navigate('/my-orders'); }}
          className="w-full py-3.5 rounded-2xl text-[11px] font-black tracking-[0.20em] uppercase text-white transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ ...saira, background: 'linear-gradient(135deg,#b8860b 0%,#d4a800 100%)', boxShadow: '0 6px 24px rgba(184,134,11,0.28)', color: '#0d2b29' }}
        >
          📦 Track My Order
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-[11px] font-black tracking-[0.20em] uppercase text-white transition-all hover:opacity-90 active:scale-[0.97]"
          style={{ ...saira, background: 'linear-gradient(135deg,#0d2b29 0%,#1e5c58 100%)', boxShadow: '0 6px 24px rgba(13,43,41,0.22)' }}
        >
          Continue Shopping ✨
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN CHECKOUT OVERLAY
═══════════════════════════════════════════════ */
export default function CheckoutOverlay({ onClose, promoCode = '', discountPercent = 0, discountAmount = 0 }) {
  const dispatch = useDispatch();
  const { items } = useSelector(state => state.cart);
  const backdropRef = useRef(null);
  const panelRef = useRef(null);

  const { handleCreateOrder, loading: orderLoading } = useCart();
  const { Razorpay } = useRazorpay();

  const [step, setStep] = useState(0); // 0 = delivery, 1 = payment, 2 = review, 3 = success
  const [address, setAddress] = useState(null);
  const [payment, setPayment] = useState('upi');
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);

  // Only selected (active, non-saved) items
  const checkoutItems = items.filter(i => !i.saved && i.selected !== false);
  const rawSubtotal = checkoutItems.reduce((s, i) => s + (i.product?.price?.amount || 0) * i.quantity, 0);
  const finalSubtotal = Math.max(0, rawSubtotal - discountAmount);
  const currency = items[0]?.product?.price?.currency || 'INR';

  // Entrance animation
  useLayoutEffect(() => {
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(panelRef.current, { y: '100%' }, { y: '0%', duration: 0.55, ease: 'power4.out' });
  }, []);

  const handleClose = useCallback(() => {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(panelRef.current, { y: '100%', duration: 0.4, ease: 'power3.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.25 }, '-=0.2');
  }, [onClose]);

  // Animate step transitions
  const animateStep = useCallback((cb) => {
    gsap.to(panelRef.current, {
      x: -20, opacity: 0, duration: 0.18, ease: 'power2.in',
      onComplete: () => {
        cb();
        gsap.fromTo(panelRef.current, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.22, ease: 'power2.out' });
      }
    });
  }, []);

  const handleAddressContinue = (addr) => {
    setAddress(addr);
    animateStep(() => setStep(1));
  };

  const handlePaymentContinue = (method) => {
    setPayment(method);
    animateStep(() => setStep(2));
  };

  const handlePlaceOrder = async () => {
    try {
      const orderData = await handleCreateOrder(finalSubtotal, currency);
      if (!orderData || !orderData.success || !orderData.order) {
        alert("Failed to create order on server. Please try again.");
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "SNITCH",
        description: "Fashion Payment",
        order_id: orderData.order.id,
        handler: async (response) => {
          /* Save order to DB — don't block the success screen */
          const orderPayload = {
            items: checkoutItems.map(item => ({
              productId: item.product?._id || item.product?.id,
              title: item.product?.title || '',
              color: item.color || '',
              size: item.size || '',
              quantity: item.quantity,
              price: item.product?.price?.amount || 0,
              currency: item.product?.price?.currency || currency,
              image: item.product?.images?.[0]?.uri || '',
            })),
            shippingAddress: address || {},
            totalAmount: finalSubtotal,
            currency,
            razorpay_order_id: response.razorpay_order_id || orderData.order.id,
            razorpay_payment_id: response.razorpay_payment_id || '',
            razorpay_signature: response.razorpay_signature || '',
          };

          /* Fire-and-forget: save order, then show success */
          saveOrderToDb(orderPayload).catch(err =>
            console.error('Order DB save failed:', err)
          );

          setConfirmedOrderId(response.razorpay_order_id || orderData.order.id);
          dispatch(clearCartThunk());
          setStep(3);
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay modal closed by user.');
          },
        },
        prefill: {
          name: address?.fullName || 'John Doe',
          email: address?.email || 'john.doe@example.com',
          contact: address?.phone || '9999999999',
        },
        theme: {
          color: '#1e5c58',
        },
      };

      const razorpayInstance = new Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Something went wrong. Please try again.');
    }
  };


  const handleEditAddress = () => animateStep(() => setStep(0));
  const handleEditPayment = () => animateStep(() => setStep(1));

  return (
    <>
      <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center">
        {/* Backdrop */}
        <div
          ref={backdropRef}
          onClick={step === 3 ? handleClose : undefined}
          className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
        />

        {/* Panel — slides up from bottom */}
        <div
          ref={panelRef}
          className="relative w-full max-w-lg mx-auto rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden"
          style={{
            background: '#E3F1F0',
            border: '1px solid rgba(255,255,255,0.60)',
            maxHeight: '92vh'
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 flex items-center justify-between flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.55)' }}
          >
            <div>
              <p className="text-[9px] font-bold tracking-[0.28em] uppercase" style={{ ...exo, color: '#b8860b' }}>
                {step === 3 ? 'ORDER CONFIRMED' : 'CHECKOUT'}
              </p>
              <h2 className="text-base font-black mt-0.5" style={{ ...saira, color: '#0d2b29' }}>
                {step === 3 ? '🎉 You Slayed It!' : STEPS[step]}
              </h2>
            </div>

            {/* Step indicators */}
            {step < 3 && (
              <div className="flex items-center gap-1.5">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black transition-all"
                      style={{
                        background: i < step ? '#0d2b29' : i === step ? 'linear-gradient(135deg,#0d2b29,#1e5c58)' : 'rgba(255,255,255,0.55)',
                        color: i <= step ? '#fff' : '#94a3b8',
                        border: i > step ? '1px solid rgba(200,200,200,0.4)' : 'none'
                      }}
                    >
                      {i < step ? '✓' : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="w-3 h-0.5 rounded" style={{ background: i < step ? '#0d2b29' : 'rgba(200,200,200,0.4)' }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.75)', color: '#0d2b29' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'none' }}>
            {step === 0 && <AddressStep savedAddress={address} onContinue={handleAddressContinue} />}
            {step === 1 && <PaymentStep onContinue={handlePaymentContinue} />}
            {step === 2 && (
              <ReviewStep
                address={address}
                paymentMethod={payment}
                items={checkoutItems}
                subtotal={finalSubtotal}
                discount={discountAmount}
                currency={currency}
                onPlaceOrder={handlePlaceOrder}
                onEditAddress={handleEditAddress}
                onEditPayment={handleEditPayment}
              />
            )}
            {step === 3 && <SuccessScreen onClose={handleClose} orderId={confirmedOrderId} />}
          </div>
        </div>
      </div>
    </>
  );
}

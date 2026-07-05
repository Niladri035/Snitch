import React, { useLayoutEffect, useRef, useCallback, useState } from 'react';
import CheckoutOverlay from './CheckoutOverlay.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { gsap } from 'gsap';
import {
  getCartThunk,
  updateQuantityThunk,
  removeFromCartThunk,
  clearCartThunk,
  toggleSelectThunk,
  toggleSaveThunk
} from '../state/cart.slice.js';
import { useRazorpay } from "react-razorpay";
import { useCart } from '../hook/useCart.js';


/* ── Fonts & symbols ── */
const saira = { fontFamily: "'Saira', sans-serif" };
const exo = { fontFamily: "'Exo', sans-serif" };
const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' };


const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function CartDrawer({ onClose }) {
  const dispatch = useDispatch();
  const { items, loading } = useSelector(state => state.cart);
  const user = useSelector(state => state.auth.user);
  const backdropRef = useRef(null);
  const panelRef = useRef(null);

  const { handleCreateOrder, loading: orderLoading } = useCart();
  const { error, isLoading, Razorpay } = useRazorpay();

  const handlePayment = async () => {
    try {
      const orderData = await handleCreateOrder(subtotal, currency);
      if (!orderData || !orderData.success || !orderData.order) {
        alert("Failed to create order on server");
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "SNITCH",
        description: "Paymen",
        order_id: orderData.order.id,
        handler: (response) => {
          dispatch(clearCartThunk());
          alert("Payment Successful!");
        },
        prefill: {
          name: user?.fullname || "John Doe",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#4b6362b3",
        },
      };

      const razorpayInstance = new Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong, bestie!");
    }
  };

  // Promo Code States
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMsg, setPromoMsg] = useState({ text: '', type: '' }); // type: 'success' | 'error'

  // Entrance animation
  useLayoutEffect(() => {
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(
      panelRef.current,
      { x: '100%' },
      { x: '0%', duration: 0.5, ease: 'power4.out' }
    );
  }, []);

  const handleClose = useCallback(() => {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(panelRef.current, { x: '100%', duration: 0.4, ease: 'power3.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.25 }, '-=0.2');
  }, [onClose]);

  const handleUpdateQty = (itemId, currentQty, amount, maxStock) => {
    const nextQty = currentQty + amount;
    if (nextQty < 1) return;
    if (maxStock !== undefined && nextQty > maxStock) return;
    dispatch(updateQuantityThunk({ itemId, quantity: nextQty }));
  };

  const handleRemove = (itemId) => {
    dispatch(removeFromCartThunk(itemId));
  };

  const handleToggleSelect = (itemId) => {
    dispatch(toggleSelectThunk(itemId));
  };

  const handleToggleSave = (itemId) => {
    dispatch(toggleSaveThunk(itemId));
  };

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'SLAY20') {
      setDiscountPercent(20);
      setPromoMsg({ text: 'Promo SLAY20 applied! 20% off locked in! 💅', type: 'success' });
    } else if (code === 'BESTIE') {
      setDiscountPercent(10);
      setPromoMsg({ text: 'Promo BESTIE applied! 10% off locked in! ✨', type: 'success' });
    }
    else if(code=='SNITCH30'){
      setDiscountPercent(3);
      setPromoMsg({ text: 'Promo SNITCH applied! 50% off locked in! ✨', type: 'success' });
    } else {
      setDiscountPercent(0);
      setPromoMsg({ text: 'Lowkey invalid code, bestie. Try SLAY20 or BESTIE 💔', type: 'error' });
    }
  };

  const [showCheckout, setShowCheckout] = useState(false);

  const handleCheckout = () => {
    // Brief scale bounce then open checkout overlay
    gsap.to(panelRef.current, { scale: 0.97, duration: 0.12, ease: 'power2.in', yoyo: true, repeat: 1,
      onComplete: () => setShowCheckout(true)
    });
  };

  // Separate active vs saved for later items
  const activeItems = items.filter(item => !item.saved);
  const savedItems = items.filter(item => item.saved);

  // Compute values based only on active & checked items
  const selectedItems = activeItems.filter(item => item.selected !== false);
  const rawSubtotal = selectedItems.reduce((sum, item) => {
    const price = item.product?.price?.amount || 0;
    return sum + price * item.quantity;
  }, 0);

  const discountAmount = Math.round((rawSubtotal * discountPercent) / 100);
  const subtotal = Math.max(0, rawSubtotal - discountAmount);
  const currency = items[0]?.product?.price?.currency || 'INR';

  return (
    <>
    <div className="fixed inset-0 z-[250] flex justify-end">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleClose}
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
      />

      {/* Drawer Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-md h-full flex flex-col shadow-2xl"
        style={{ background: '#E3F1F0', borderLeft: '1px solid rgba(255, 255, 255, 0.60)' }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.60)' }}>
          <div>
            <p className="text-[9px] font-bold tracking-[0.28em] uppercase" style={{ ...exo, color: '#b8860b' }}>YOUR BAG</p>
            <h2 className="text-lg font-black mt-0.5" style={{ ...saira, color: '#0d2b29' }}>Shopping Cart</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.75)', color: '#0d2b29' }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6" style={{ scrollbarWidth: 'none' }}>
          
          {/* Active Items */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase mb-3" style={{ ...exo }}>
              Active Items ({activeItems.length})
            </p>
            
            {activeItems.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
                <span className="text-3xl">🎒</span>
                <div>
                  <p className="text-xs font-bold text-neutral-700" style={{ ...saira }}>No active items, bestie</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5" style={{ ...exo }}>Add drops from catalog or restore saved items.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeItems.map((item) => {
                  const product = item.product || {};
                  const firstImg = product.images?.[product.images?.length > 0 ? product.images.findIndex(img => img !== undefined) : 0]?.uri || product.images?.[0]?.uri;
                  
                  // Inventory variant checks
                  const variant = (product.inventory || []).find(v => v.color.toLowerCase() === item.color.toLowerCase() && v.size.toLowerCase() === item.size.toLowerCase());
                  const maxStock = variant ? variant.stock : 99;
                  const isLowStock = maxStock > 0 && maxStock <= 5;
                  const isOutOfStock = maxStock === 0;

                  return (
                    <div
                      key={item._id}
                      className="flex gap-3 p-3 rounded-2xl transition-all duration-200"
                      style={{
                        background: 'rgba(255, 255, 255, 0.45)',
                        border: '1.5px solid rgba(255, 255, 255, 0.72)',
                        opacity: isOutOfStock ? 0.7 : 1
                      }}
                    >
                      {/* Checkbox select */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.selected !== false}
                          disabled={isOutOfStock}
                          onChange={() => handleToggleSelect(item._id)}
                          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                        />
                      </div>

                      {/* Swatch image */}
                      <div className="w-14 h-18 rounded-xl overflow-hidden bg-neutral-200 flex-shrink-0">
                        <img src={firstImg} alt="" className="w-full h-full object-cover" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-800 truncate" style={{ ...saira }}>{product.title}</h4>
                          <p className="text-[9px] font-semibold text-neutral-500 uppercase mt-0.5" style={{ ...exo }}>
                            {item.color} · {item.size}
                          </p>

                          {/* Inventory messages */}
                          {isOutOfStock ? (
                            <span className="inline-block mt-1 text-[8px] font-bold text-red-500 uppercase tracking-wider" style={{ ...exo }}>Out of stock</span>
                          ) : isLowStock ? (
                            <span className="inline-block mt-1 text-[8px] font-bold text-amber-600 uppercase tracking-wider" style={{ ...exo }}>⚠️ Only {maxStock} left</span>
                          ) : null}
                        </div>

                        {/* Quantity & Save for Later */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateQty(item._id, item.quantity, -1, maxStock)}
                              disabled={item.quantity <= 1 || isOutOfStock}
                              className="w-5.5 h-5.5 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                              style={{ background: 'rgba(13,43,41,0.06)', border: '1px solid rgba(13,43,41,0.18)', color: '#0d2b29' }}
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-5 text-center tabular-nums" style={{ color: '#0d2b29', ...exo }}>{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQty(item._id, item.quantity, 1, maxStock)}
                              disabled={item.quantity >= maxStock || isOutOfStock}
                              className="w-5.5 h-5.5 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                              style={{ background: 'rgba(13,43,41,0.06)', border: '1px solid rgba(13,43,41,0.18)', color: '#0d2b29' }}
                            >
                              +
                            </button>
                          </div>
                          
                          {/* Save link */}
                          <button
                            onClick={() => handleToggleSave(item._id)}
                            className="text-[9px] font-bold tracking-wider text-neutral-400 hover:text-amber-600 uppercase border-b border-transparent hover:border-amber-600/30 transition-all"
                            style={{ ...exo }}
                          >
                            Save for Later
                          </button>
                        </div>
                      </div>

                      {/* Price & Remove */}
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => handleRemove(item._id)}
                          className="w-5.5 h-5.5 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 transition-all"
                        >
                          <CloseIcon />
                        </button>
                        <div className="text-right">
                          <p className="text-xs font-black text-neutral-800" style={{ ...saira }}>
                            {sym[currency]}{(product.price?.amount * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save for Later Section */}
          <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.60)' }}>
            <p className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase mb-3" style={{ ...exo }}>
              Saved for Later ({savedItems.length})
            </p>
            
            {savedItems.length === 0 ? (
              <p className="text-[10px] text-neutral-400 italic px-1" style={{ ...exo }}>No items saved for later drop.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {savedItems.map((item) => {
                  const product = item.product || {};
                  const firstImg = product.images?.[product.images?.length > 0 ? product.images.findIndex(img => img !== undefined) : 0]?.uri || product.images?.[0]?.uri;
                  
                  return (
                    <div
                      key={item._id}
                      className="flex gap-3 p-3 rounded-2xl transition-all duration-200"
                      style={{
                        background: 'rgba(255, 255, 255, 0.25)',
                        border: '1.5px solid rgba(255, 255, 255, 0.50)'
                      }}
                    >
                      {/* Swatch image */}
                      <div className="w-12 h-16 rounded-xl overflow-hidden bg-neutral-200 flex-shrink-0 opacity-75">
                        <img src={firstImg} alt="" className="w-full h-full object-cover" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-600 truncate" style={{ ...saira }}>{product.title}</h4>
                          <p className="text-[9px] font-semibold text-neutral-400 uppercase mt-0.5" style={{ ...exo }}>
                            {item.color} · {item.size}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-1.5">
                          <button
                            onClick={() => handleToggleSave(item._id)}
                            className="text-[9px] font-bold tracking-wider text-amber-600 hover:text-amber-700 uppercase"
                            style={{ ...exo }}
                          >
                            Move to Bag
                          </button>
                          <button
                            onClick={() => handleRemove(item._id)}
                            className="text-[9px] font-bold tracking-wider text-red-400 hover:text-red-500 uppercase"
                            style={{ ...exo }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex flex-col items-end justify-end">
                        <p className="text-xs font-black text-neutral-500" style={{ ...saira }}>
                          {sym[currency]}{(product.price?.amount * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Summary / Checkout */}
        {activeItems.length > 0 && (
          <div className="p-6 border-t flex flex-col gap-4" style={{ borderColor: 'rgba(255,255,255,0.60)', background: 'rgba(255,255,255,0.20)' }}>
            
            {/* Promo Code Entry */}
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER PROMO CODE (SLAY20)"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400/20 uppercase"
                  style={{ background: 'rgba(0, 0, 0, 0)', border: '1.5px solid rgba(30, 15, 15, 0.32)', color: '#000000' }}
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-150 active:scale-[0.97]"
                  style={{ ...saira, background: 'rgba(42,138,133,0.12)', border: '1px solid rgba(42,138,133,0.25)', color: '#1e5c58' }}
                >
                  Apply
                </button>
              </div>
              {promoMsg.text && (
                <p className="text-[9px] font-semibold px-1 mt-0.5" style={{ color: promoMsg.type === 'success' ? '#1e5c58' : '#b91c1c' }}>
                  {promoMsg.text}
                </p>
              )}
            </div>

            {/* Price Calculations */}
            <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.40)' }}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500" style={{ ...exo }}>Bag Subtotal</span>
                <span className="font-semibold text-neutral-800" style={{ ...saira }}>{sym[currency]}{rawSubtotal.toLocaleString()}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-700 font-medium" style={{ ...exo }}>Discount ({discountPercent}%)</span>
                  <span className="font-semibold text-emerald-700" style={{ ...saira }}>-{sym[currency]}{discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-end border-t pt-2 mt-1" style={{ borderColor: 'rgba(255,255,255,0.40)' }}>
                <div>
                  <p className="text-[10px] font-black tracking-widest text-neutral-800 uppercase" style={{ ...exo }}>Total Amount</p>
                  <p className="text-[9px] text-neutral-500 mt-0.5" style={{ ...exo }}>Computed for {selectedItems.length} selected items</p>
                </div>
                <p className="text-xl font-black text-neutral-900" style={{ ...saira }}>
                  {sym[currency]}{subtotal.toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCheckout(true)}
              disabled={selectedItems.length === 0}
              className="w-full py-3.5 rounded-2xl text-[11px] font-black tracking-[0.20em] uppercase text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                ...saira,
                background: 'linear-gradient(135deg,#0d2b29 0%,#1e5c58 100%)',
                boxShadow: '0 6px 20px rgba(13,43,41,0.22)'
              }}
            >
              PROCEED TO SLAY 💳
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Checkout Overlay */}
    {showCheckout && (
      <CheckoutOverlay
        onClose={() => { setShowCheckout(false); handleClose(); }}
        promoCode={promoCode}
        discountPercent={discountPercent}
        discountAmount={discountAmount}
      />
    )}


    </>
  );
}

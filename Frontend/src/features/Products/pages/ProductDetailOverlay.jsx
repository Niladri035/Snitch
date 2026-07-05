import React, { useLayoutEffect, useRef, useCallback, useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { gsap } from 'gsap'
import { addToCartThunk } from '../state/cart.slice.js'

/* ─── font shortcuts (shared tokens) ─── */
const saira   = { fontFamily: "'Saira', sans-serif" }
const exo     = { fontFamily: "'Exo', sans-serif" }
const shadows = { fontFamily: "'Shadows Into Light', cursive" }
const sym     = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' }

/* ─── Gen-Z copy pool ─── */
const GEN_Z_TAGS = [
  'it\'s giving main character ✨',
  'lowkey obsessed rn 🔥',
  'understood the assignment 💯',
  'rent free in my head',
  'no cap this slaps hard',
  'built different fr fr',
]
const GEN_Z_BADGES = [
  'no cap, free returns',
  'fast af shipping ⚡',
  'hits different quality',
  'verified slay ✓',
]

/* ─── Star row ─── */
const Stars = ({ n = 5 }) => (
  <div className="flex gap-0.5" style={{ color: '#F5C518' }}>
    {[...Array(n)].map((_, i) => (
      <svg key={i} className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
)

/* ─── Thumb strip ─── */
function ThumbStrip({ images, active, onSelect }) {
  if (!images?.length) return null
  return (
    <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {images.map((img, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className="flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden transition-all duration-200"
          style={{
            border: active === i ? '2px solid #b8860b' : '1px solid rgba(255,255,255,0.50)',
            opacity: active === i ? 1 : 0.65,
          }}
        >
          <img src={img.uri} alt="" className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════
   ANIMATED HERO IMAGE — handles reveal on color change
══════════════════════════════════════════════ */
function HeroImage({ src, alt, imgRef, onClick, title }) {
  /* We keep track of outgoing vs incoming src to drive the wipe */
  const wrapRef      = useRef(null)
  const currentRef   = useRef(null)   // image currently visible (base layer)
  const incomingRef  = useRef(null)   // new image (top layer, clipped in)
  const revealingRef = useRef(false)

  const [displaySrc, setDisplaySrc]         = useState(src)   // base layer
  const [incomingSrc, setIncomingSrc]       = useState(null)  // top layer
  const prevSrcRef = useRef(src)

  useEffect(() => {
    if (src === prevSrcRef.current) return
    if (revealingRef.current) {
      /* If another color fires mid-animation, snap and restart */
      gsap.killTweensOf(incomingRef.current)
    }
    setIncomingSrc(src)
    prevSrcRef.current = src
  }, [src])

  /* Trigger wipe as soon as the incoming img element exists + src is set */
  useEffect(() => {
    if (!incomingSrc || !incomingRef.current) return
    revealingRef.current = true

    /* Reset clip to full-right (hidden) */
    gsap.set(incomingRef.current, { clipPath: 'inset(0 100% 0 0)' })

    /* Wipe left-to-right reveal */
    gsap.to(incomingRef.current, {
      clipPath: 'inset(0 0% 0 0)',
      duration: 0.7,
      ease: 'power3.inOut',
      onComplete: () => {
        /* Once fully visible, promote incoming → current */
        setDisplaySrc(incomingSrc)
        setIncomingSrc(null)
        revealingRef.current = false
      }
    })
  }, [incomingSrc])

  return (
    <div ref={wrapRef} className="relative w-full h-full p-12 flex items-center justify-center">
      {/* ── BASE layer: currently displayed image ── */}
      {displaySrc ? (
        <img
          ref={currentRef}
          src={displaySrc}
          alt={alt}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#C8E4E2' }}>
          <span style={{ color: '#6aaca8', fontSize: 64 }}>✦</span>
        </div>
      )}

      {/* ── INCOMING layer: clipped to reveal ── */}
      {incomingSrc && (
        <img
          ref={incomingRef}
          src={incomingSrc}
          alt={alt}
          className="absolute inset-12 w-[calc(100%-6rem)] h-[calc(100%-6rem)] object-contain"
          style={{ clipPath: 'inset(0 100% 0 0)' }}
        />
      )}

      {/* Invisible overlay ref for GSAP entrance (used by parent) */}
      <div
        ref={imgRef}
        className="absolute inset-0 cursor-pointer z-20"
        onClick={onClick}
        title={title}
      />
    </div>
  )
}

/* ══════════════════════════════════════════════
   PRODUCT DETAIL OVERLAY
   Triggered by clicking a product card (logged-in users only)
══════════════════════════════════════════════ */
export default function ProductDetailOverlay({ product: propProduct, fromRect, onClose, onOpenCart, allProducts }) {
  const dispatch = useDispatch()
  const backdropRef  = useRef(null)
  const imgRef       = useRef(null)   // transparent overlay div inside HeroImage
  const heroWrapRef  = useRef(null)   // the left 55% panel — used for GSAP entrance
  const rightRef     = useRef(null)
  const closeRef     = useRef(null)

  const [product, setProduct] = useState(propProduct)
  const [activeImg,     setActiveImg]     = useState(0)
  const [selectedColor, setSelectedColor] = useState(null)
  const [hoverColor,    setHoverColor]    = useState(null)  // live hover preview
  const [selectedSize,  setSelectedSize]  = useState(null)
  const [err,           setErr]           = useState(null)
  const [btnLoading,    setBtnLoading]    = useState(false)

  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  // Sync state if propProduct changes
  useEffect(() => {
    setProduct(propProduct)
  }, [propProduct])

  // Reset variant selections when product changes
  useEffect(() => {
    const inv = product.inventory || [];
    const firstVal = inv.find(v => v.color)?.color?.trim();
    setSelectedColor(firstVal ? firstVal.charAt(0).toUpperCase() + firstVal.slice(1).toLowerCase() : null);
    setSelectedSize(null);
    setActiveImg(0);

    // Fetch wishlist status
    fetch('/api/wishlist', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.products)) {
          const isSaved = data.products.some(p => p._id === product._id);
          setIsWishlisted(isSaved);
        }
      })
      .catch(err => console.warn('Wishlist load error:', err));
  }, [product._id])

  const images  = product.images || []
  const cur     = product.price?.currency || 'INR'
  const price   = product.price?.amount
  const seller  = product.seller?.fullname || product.seller?.email?.split('@')[0] || 'Snitch Seller'
  const genzTag = GEN_Z_TAGS[Math.floor(Math.random() * GEN_Z_TAGS.length)]

  /* ── Derive unique colors + sizes from real inventory ── */
  const inventory = product.inventory || []
  const allColors = [...new Set(inventory.map(v => {
    const c = v.color?.trim()
    return c ? c.charAt(0).toUpperCase() + c.slice(1).toLowerCase() : ''
  }).filter(Boolean))]
  const allSizes  = [...new Set(inventory.map(v => v.size).filter(Boolean))]

  /* Map each color to a product image index (use imageIndexes/imageIndex field if set, else cycle) */
  const imageIndexForColor = useCallback((color) => {
    if (!color || !images.length) return 0
    const target = color.toLowerCase();
    
    // Check if any variant for this color has an explicit imageIndexes or imageIndex
    const variant = inventory.find(v => v.color?.toLowerCase() === target && 
      ((v.imageIndexes && v.imageIndexes.length > 0) || (v.imageIndex !== undefined && v.imageIndex !== null))
    )
    if (variant) {
      if (variant.imageIndexes && variant.imageIndexes.length > 0) {
        return Math.min(variant.imageIndexes[0], images.length - 1)
      }
      return Math.min(variant.imageIndex, images.length - 1)
    }
    
    // Fallback: map by color position in allColors
    const idx = allColors.map(c => c.toLowerCase()).indexOf(target)
    return idx >= 0 ? idx % images.length : 0
  }, [allColors, images.length, inventory])

  // Get indices of images that belong to the active color (hovered or selected)
  const getFilteredImageIndices = useCallback(() => {
    const activeColorMatch = hoverColor || selectedColor;
    if (!activeColorMatch || !images.length) {
      return images.map((_, idx) => idx);
    }
    
    const target = activeColorMatch.toLowerCase();
    
    // Find all inventory variants that match the active color
    const colorVariants = inventory.filter(v => v.color?.toLowerCase() === target);
    
    // Collect all imageIndex and imageIndexes defined for this color
    const indicesSet = new Set();
    colorVariants.forEach(v => {
      if (v.imageIndexes && v.imageIndexes.length > 0) {
        v.imageIndexes.forEach(idx => {
          if (idx !== null && idx >= 0 && idx < images.length) {
            indicesSet.add(idx);
          }
        });
      }
      if (v.imageIndex !== undefined && v.imageIndex !== null && v.imageIndex >= 0 && v.imageIndex < images.length) {
        indicesSet.add(v.imageIndex);
      }
    });

    if (indicesSet.size > 0) {
      return [...indicesSet].sort((a, b) => a - b);
    }

    // Fallback: If no explicit image index is mapped, map to a single index based on color position
    const colorIdx = allColors.map(c => c.toLowerCase()).indexOf(target);
    const fallbackIdx = colorIdx >= 0 ? colorIdx % images.length : 0;
    return [fallbackIdx];
  }, [hoverColor, selectedColor, images.length, inventory, allColors]);

  const activeImageIndices = getFilteredImageIndices();

  // Reset activeImg to first item when selectedColor changes
  useEffect(() => {
    setActiveImg(0);
  }, [selectedColor]);

  /* Active display color — hoverColor takes priority over selectedColor */
  const activeColor = hoverColor || selectedColor

  /* The src that should be displayed */
  const heroSrc = images[activeImageIndices[activeImg] ?? 0]?.uri || images[0]?.uri;

  /* Check availability for a given color+size combo */
  const isAvailable = (color, size) => {
    if (!inventory.length) return true
    if (!color) return true
    const variant = inventory.find(v => v.color?.trim().toLowerCase() === color.toLowerCase() && v.size === size)
    return !variant || variant.stock > 0
  }

  /* Sizes available for the currently selected color */
  const sizesForColor = (color) => {
    if (!color) return allSizes
    return allSizes.filter(sz => {
      const v = inventory.find(iv => iv.color?.trim().toLowerCase() === color.toLowerCase() && iv.size === sz)
      return v !== undefined
    })
  }

  /* Stock left for selected combo */
  const stockForSelection = () => {
    if (!inventory.length || !selectedColor || !selectedSize) return null
    const v = inventory.find(iv => iv.color?.trim().toLowerCase() === selectedColor.toLowerCase() && iv.size === selectedSize)
    return v ? v.stock : null
  }

  /* Add item to cart and call callback to open drawer */
  const handleAddToCart = async () => {
    if (!selectedColor || !selectedSize) {
      setErr('Choose color and size first, bestie! 💅');
      // Shake variant panel using GSAP
      gsap.fromTo('.dr-variant-panel', 
        { x: -8 }, 
        { x: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.25)' }
      );
      return;
    }
    setErr(null);
    setBtnLoading(true);
    try {
      await dispatch(addToCartThunk({
        productId: product._id,
        color: selectedColor,
        size: selectedSize,
        quantity: 1
      })).unwrap();

      // Successfully added! Open Cart drawer and close overlay
      onClose();
      if (onOpenCart) onOpenCart();
    } catch (e) {
      setErr(e || 'Failed to add item');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId: product._id })
      });
      const data = await res.json();
      if (data.success) {
        setIsWishlisted(data.isWishlisted);
      }
    } catch (err) {
      console.warn('Wishlist toggle error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const similarProducts = (allProducts || [])
    .filter(p => p.category === product.category && p._id !== product._id)
    .slice(0, 4);

  /* ── GSAP Flip entrance (on the left panel wrapper) ── */
  useLayoutEffect(() => {
    if (!heroWrapRef.current) return

    const to     = heroWrapRef.current.getBoundingClientRect()
    const scaleX = fromRect ? fromRect.width  / to.width  : 0.3
    const scaleY = fromRect ? fromRect.height / to.height : 0.3
    const dx     = fromRect ? fromRect.left   - to.left   : 0
    const dy     = fromRect ? fromRect.top    - to.top    : 0

    const tl = gsap.timeline()

    tl.fromTo(backdropRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.35, ease: 'power2.out' },
      0
    )

    tl.fromTo(heroWrapRef.current,
      { x: dx, y: dy, scaleX, scaleY, borderRadius: '24px', transformOrigin: 'top left' },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: '0px', duration: 0.75, ease: 'power4.inOut', clearProps: 'all' },
      0
    )

    tl.fromTo(rightRef.current,
      { x: 90, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
      0.28
    )

    const rows = rightRef.current?.querySelectorAll('.dr')
    if (rows?.length) {
      tl.fromTo(rows,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.055, duration: 0.4, ease: 'power3.out' },
        0.4
      )
    }

    tl.fromTo(closeRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' },
      0.5
    )
  }, [])

  /* ── Close with exit animation ── */
  const handleClose = useCallback(() => {
    const tl = gsap.timeline({ onComplete: onClose })
    tl.to(rightRef.current,    { x: 70, opacity: 0, duration: 0.28, ease: 'power2.in' })
      .to(closeRef.current,    { scale: 0, opacity: 0, duration: 0.2, ease: 'power2.in' }, 0)
      .to(backdropRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' }, '-=0.1')
  }, [onClose])

  /* ── Image navigation helpers (AJIO style: cycles within selected variant's images) ── */
  const prevImg = useCallback(() => {
    setActiveImg(i => (i - 1 + activeImageIndices.length) % activeImageIndices.length)
  }, [activeImageIndices.length])

  const nextImg = useCallback(() => {
    setActiveImg(i => (i + 1) % activeImageIndices.length)
  }, [activeImageIndices.length])

  /* ── Keyboard close + arrow nav ── */
  React.useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape')      handleClose()
      if (e.key === 'ArrowRight')  nextImg()
      if (e.key === 'ArrowLeft')   prevImg()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose, nextImg, prevImg])

  const galleryImages = activeImageIndices.map(idx => images[idx]).filter(Boolean)

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[150] flex"
      style={{ background: '#E3F1F0' }}
    >
      {/* ── LEFT — Hero image (55%) ── */}
      <div
        ref={heroWrapRef}
        className="relative w-[55%] flex-shrink-0 h-screen overflow-hidden group"
      >
        {/* Animated hero — reveals on color change */}
        <HeroImage
          src={heroSrc}
          alt={product.title}
          imgRef={imgRef}
          onClick={galleryImages.length > 1 ? nextImg : undefined}
          title={galleryImages.length > 1 ? 'Click to see next image' : undefined}
        />

        {/* Gradient right edge bleed */}
        <div className="absolute inset-0 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to right, transparent 65%, #E3F1F0 100%)' }} />

        {/* Gradient bottom (for thumbstrip) */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none h-32 z-10"
          style={{ background: 'linear-gradient(to top, rgba(227,241,240,0.98), transparent)' }} />

        {/* ── Color-change flash accent ── */}
        {/* This renders a thin colored bar that sweeps in from left on color change */}

        {/* ── Prev / Next arrows (only when multiple images) ── */}
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center
                         opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.80)', backdropFilter: 'blur(8px)', color: '#0d2b29' }}
              title="Previous image"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <button
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center
                         opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.80)', backdropFilter: 'blur(8px)', color: '#0d2b29' }}
              title="Next image"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}

        {/* Thumbnail strip */}
        <div className="absolute bottom-0 inset-x-0 z-20">
          <ThumbStrip
            images={galleryImages}
            active={activeImg}
            onSelect={(i) => {
              setActiveImg(i)
            }}
          />
        </div>

        {/* Image counter pill */}
        {galleryImages.length > 1 && (
          <div className="absolute top-4 left-14 px-3 py-1 rounded-full backdrop-blur-md text-[10px] font-bold tracking-widest z-20"
            style={{ ...exo, background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.72)', color: '#1e5c58' }}>
            {activeImg + 1} / {galleryImages.length}
          </div>
        )}

        {/* Color label on image — shows currently active color (hover or selected) */}
        {activeColor && (
          <div
            className="absolute top-4 right-6 z-20 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-200"
            style={{
              ...exo,
              background: hoverColor && !selectedColor
                ? 'rgba(13,43,41,0.45)'  // dim = just previewing
                : 'rgba(13,43,41,0.65)', // bright = locked
              backdropFilter: 'blur(8px)',
              color: hoverColor && !selectedColor ? '#e0d090' : '#F5C518',
              border: hoverColor && !selectedColor
                ? '1px solid rgba(245,197,24,0.20)'
                : '1px solid rgba(245,197,24,0.35)'
            }}
          >
            {hoverColor && !selectedColor ? '👁 ' : '● '}{activeColor}
          </div>
        )}
      </div>

      {/* ── CLOSE button ── */}
      <button
        ref={closeRef}
        onClick={handleClose}
        className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.75)', color: '#0d2b29', backdropFilter: 'blur(8px)' }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* ── RIGHT — Product details (45%) ── */}
      <div
        ref={rightRef}
        className="relative flex-1 h-screen flex flex-col px-6 lg:px-10 overflow-hidden"
      >
        {/* ─ Decorative SVG background ─ */}
        <svg className="absolute bottom-4 right-4 opacity-[0.06] pointer-events-none" width="90" height="90" viewBox="0 0 140 140" fill="none" aria-hidden>
          <circle cx="70" cy="70" r="60" stroke="#2a8a85" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="70" cy="70" r="35" stroke="#b8860b" strokeWidth="1" strokeDasharray="3 5" />
          <line x1="10" y1="70" x2="130" y2="70" stroke="#2a8a85" strokeWidth="0.8" />
          <line x1="70" y1="10" x2="70" y2="130" stroke="#2a8a85" strokeWidth="0.8" />
        </svg>

        {/* ═══ SCROLLABLE BODY ═══ */}
        <div
          className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-center py-4"
          style={{ scrollbarWidth: 'none' }}
        >

          {/* ── Brand badge row ── */}
          <div className="dr flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase"
              style={{ ...exo, background: 'linear-gradient(135deg,#b8860b22,#b8860b11)', border: '1px solid #b8860b55', color: '#b8860b' }}
            >
              ✦ {product.brand ? product.brand.toUpperCase() : 'SNITCH'}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase"
              style={{ ...exo, background: 'rgba(42,138,133,0.10)', border: '1px solid rgba(42,138,133,0.22)', color: '#1e5c58' }}
            >
              ✓ VERIFIED DROP
            </span>
          </div>

          {/* ── Gen-Z vibe tag ── */}
          <div className="dr mb-2">
            <span
              className="inline-block px-2.5 py-1 rounded-full text-[9px] font-semibold"
              style={{ ...exo, background: 'rgba(42,138,133,0.10)', border: '1px solid rgba(42,138,133,0.18)', color: '#1e5c58' }}
            >
              {genzTag}
            </span>
          </div>

          {/* ── Title ── */}
          <h1 className="dr leading-[0.9] tracking-tight font-black mb-1.5"
            style={{ ...saira, color: '#0d2b29', fontSize: 'clamp(1.4rem, 3vw, 2.6rem)' }}>
            {product.title}
          </h1>

          {/* ── Seller + rating ── */}
          <div className="dr flex flex-wrap items-center gap-2 mb-2">
            <p style={{ ...shadows, color: '#1e5c58', fontSize: '0.85rem' }}>
              crafted by <strong>{seller}</strong>
            </p>
            <div className="flex items-center gap-1">
              <Stars />
              <span className="text-[10px] font-bold" style={{ ...exo, color: '#6aaca8' }}>
                lowkey 10/10
              </span>
            </div>
          </div>

          {/* ── Price block ── */}
          {(() => {
            const discPrice = product.discountPrice;
            const hasDisc = discPrice && Number(discPrice) > Number(price);
            const discPercent = hasDisc ? Math.round(((discPrice - price) / discPrice) * 100) : 0;
            return (
              <div className="dr flex flex-col mb-2.5">
                <p className="text-[8px] font-bold tracking-widest uppercase mb-1" style={{ ...exo, color: '#3d7e7a' }}>
                  steal the deal, bestie
                </p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-black leading-none" style={{ ...saira, color: '#0d2b29', fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)' }}>
                    {sym[cur]}{Number(price).toLocaleString()}
                  </span>
                  {hasDisc && (
                    <span className="text-xs line-through text-neutral-400 font-medium">
                      {sym[cur]}{Number(discPrice).toLocaleString()}
                    </span>
                  )}
                  {hasDisc && (
                    <span className="text-[10px] font-black tracking-wider uppercase text-amber-500" style={{ ...exo }}>
                      ({discPercent}% OFF)
                    </span>
                  )}
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#6aaca8]" style={{ ...exo }}>
                    {cur}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* ── Divider ── */}
          <div className="dr h-px mb-2" style={{ background: 'rgba(42,138,133,0.12)' }} />

          {/* Wrapper for shake validation feedback */}
          <div className="dr-variant-panel flex flex-col gap-2">
          
          {/* ── Color variants (from real inventory) — hover to preview, click to lock ── */}
          {allColors.length > 0 && (
            <div className="dr mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[8px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#b8860b' }}>colour</p>
                {activeColor
                  ? <span className="text-[9px] font-semibold" style={{ ...exo, color: hoverColor && !selectedColor ? '#6aaca8' : '#1e5c58' }}>
                      {hoverColor && !selectedColor ? `👁 previewing ${hoverColor}` : `✓ ${selectedColor}`}
                    </span>
                  : <span className="text-[9px]" style={{ ...exo, color: '#6aaca8' }}>hover to preview · tap to select</span>
                }
              </div>
              <div className="flex flex-wrap gap-2">
                {allColors.map((color, idx) => {
                  const anyStock  = inventory.some(v => v.color?.trim().toLowerCase() === color.toLowerCase() && v.stock > 0)
                  const isLocked  = selectedColor === color
                  const isHovered = hoverColor === color
                  const imgIdx    = imageIndexForColor(color)
                  const thumbUri  = images[imgIdx]?.uri
                  
                  // Retrieve hex code if defined
                  const variantObj = inventory.find(v => v.color?.toLowerCase() === color.toLowerCase())
                  const hexColor = variantObj?.hex

                  return (
                    <button
                      key={color}
                      /* ── Hover: preview the image immediately ── */
                      onMouseEnter={() => setHoverColor(color)}
                      onMouseLeave={() => setHoverColor(null)}
                      onTouchStart={() => setHoverColor(color)}
                      onTouchEnd={() => setHoverColor(null)}
                      /* ── Click: lock the selection and show image immediately ── */
                      onClick={() => {
                        setSelectedColor(color)
                        setHoverColor(null)
                        setSelectedSize(null)
                        setActiveImg(imageIndexForColor(color))
                      }}
                      disabled={!anyStock}
                      title={`${color}${!anyStock ? ' (out of stock)' : ''}`}
                      className="group/cb relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[9px] font-black tracking-wider uppercase transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={isLocked ? {
                        ...exo,
                        background: 'linear-gradient(135deg,#b8860b,#d4a800)',
                        color: '#fff',
                        border: '1.5px solid transparent',
                        boxShadow: '0 3px 14px rgba(184,134,11,0.40)',
                      } : isHovered ? {
                        ...exo,
                        background: 'rgba(42,138,133,0.18)',
                        color: '#0d2b29',
                        border: '1.5px solid rgba(42,138,133,0.40)',
                        boxShadow: '0 2px 10px rgba(42,138,133,0.18)',
                      } : {
                        ...exo,
                        background: 'rgba(255,255,255,0.50)',
                        border: '1.5px solid rgba(255,255,255,0.72)',
                        color: '#1e5c58',
                      }}
                    >
                      {/* Swatch indicator: show color hex circle, else fallback to image thumb */}
                      {hexColor ? (
                        <span
                          className="w-4.5 h-4.5 rounded-full flex-shrink-0 border transition-transform duration-200"
                          style={{
                            background: hexColor,
                            borderColor: isLocked ? '#fff' : 'rgba(13,43,41,0.22)',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)'
                          }}
                        />
                      ) : thumbUri ? (
                        <span
                          className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0 border"
                          style={{
                            borderColor: isLocked ? 'rgba(255,255,255,0.50)' : 'rgba(42,138,133,0.25)',
                            display: 'inline-block',
                          }}
                        >
                          <img src={thumbUri} alt="" className="w-full h-full object-cover" />
                        </span>
                      ) : null}
                      {color}
                      {isLocked && <span className="ml-0.5">✓</span>}
                      {!anyStock && <span className="ml-0.5">✕</span>}
                    </button>
                  )
                })}
              </div>

            </div>
          )}

          {/* ── Size selector (from real inventory) ── */}
          {allSizes.length > 0 && (
            <div className="dr mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[8px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#b8860b' }}>size</p>
                {selectedSize && <span className="text-[9px] font-semibold" style={{ ...exo, color: '#1e5c58' }}>Selected: {selectedSize}</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedColor ? sizesForColor(selectedColor) : allSizes).map(sz => {
                  const avail = isAvailable(selectedColor, sz)
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz === selectedSize ? null : sz)}
                      disabled={!avail}
                      className="px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={selectedSize === sz ? {
                        ...exo,
                        background: 'linear-gradient(135deg,#b8860b,#d4a800)',
                        color: '#fff',
                        border: '1.5px solid transparent',
                        boxShadow: '0 3px 10px rgba(184,134,11,0.35)',
                      } : {
                        ...exo,
                        background: avail ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.25)',
                        border: '1.5px solid rgba(255,255,255,0.72)',
                        color: avail ? '#1e5c58' : '#9db8b6',
                        textDecoration: avail ? 'none' : 'line-through',
                      }}
                    >
                      {sz}
                    </button>
                  )
                })}
              </div>
              {/* Stock left indicator */}
              {selectedColor && selectedSize && (() => {
                const stock = stockForSelection()
                if (stock === null) return null
                return (
                  <p className="mt-1.5 text-[9px] font-semibold" style={{ ...exo, color: stock <= 5 ? '#d97706' : '#6aaca8' }}>
                    {stock === 0 ? '⛔ Out of stock' : stock <= 5 ? `⚠ Only ${stock} left!` : `✓ ${stock} in stock`}
                  </p>
                )
              })()}
            </div>
          )}
          
          </div>{/* end dr-variant-panel */}

          {/* Error display */}
          {err && (
            <p className="text-[10px] text-red-500 font-bold mb-1.5" style={{ ...exo }}>
              ⚠️ {err}
            </p>
          )}

          {/* ── Description ── */}
          <div className="dr mb-2">
            <p className="text-[8px] font-bold tracking-widest uppercase mb-1" style={{ ...exo, color: '#b8860b' }}>
              no cap, here's the vibe:
            </p>
            <p className="text-[11px] leading-relaxed line-clamp-2" style={{ ...exo, color: '#3d7e7a' }}>
              {product.description || 'Pure fire. Zero compromise. This piece was built for the ones who know the assignment and show up every single time.'}
            </p>
          </div>

          {/* ── Gen-Z trust badges ── */}
          <div className="dr flex flex-wrap gap-1.5 mb-2">
            {GEN_Z_BADGES.map(b => (
              <span key={b}
                className="px-2 py-1 rounded-lg text-[9px] font-semibold tracking-wide"
                style={{ ...exo, background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.72)', color: '#1e5c58' }}>
                {b}
              </span>
            ))}
          </div>

          {/* ── Live badge ── */}
          <div className="dr flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase"
              style={{ ...exo, background: 'rgba(42,138,133,0.10)', border: '1px solid rgba(42,138,133,0.18)', color: '#1e5c58' }}
            >
              ● LIVE
            </span>
            <span className="text-[9px]" style={{ ...exo, color: '#6aaca8' }}>
              visible to everyone · in stock
            </span>
          </div>

          {/* ── Similar Products ── */}
          {similarProducts.length > 0 && (
            <div className="dr mt-6 border-t pt-4" style={{ borderColor: 'rgba(42,138,133,0.14)' }}>
              <p className="text-[8px] font-bold tracking-widest uppercase mb-2.5" style={{ ...exo, color: '#b8860b' }}>
                similar drops you might like
              </p>
              <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                {similarProducts.map(p => {
                  const heroImg = p.images?.[0]?.uri;
                  const curPrice = p.price?.amount;
                  const originalPrice = p.discountPrice;
                  const hasDisc = originalPrice && Number(originalPrice) > Number(curPrice);
                  const ratingStars = p.rating || 4.5;
                  return (
                    <button
                      key={p._id}
                      onClick={() => setProduct(p)}
                      className="flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all duration-150 active:scale-97 flex-shrink-0 w-64 hover:opacity-90"
                      style={{
                        background: 'rgba(255,255,255,0.48)',
                        border: '1px solid rgba(255,255,255,0.72)',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(42,138,133,0.02)'
                      }}
                    >
                      <div className="w-14 h-18 rounded-xl overflow-hidden flex-shrink-0 bg-[#C8E4E2]">
                        {heroImg ? (
                          <img src={heroImg} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px]">✦</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-between" style={{ height: '72px' }}>
                        <div>
                          <p className="text-[9px] font-bold text-[#6aaca8] uppercase tracking-wider" style={exo}>{p.category || 'Collection'}</p>
                          <p className="text-[11px] font-extrabold text-[#0d2b29] mt-0.5 line-clamp-1" style={{ ...saira, textTransform: 'uppercase' }}>{p.title}</p>
                          <div className="flex items-center gap-1 mt-0.5" style={{ color: '#F5C518' }}>
                            <Stars n={5} />
                            <span className="text-[9px] text-[#88a39c] font-semibold">({Math.floor(ratingStars * 20)})</span>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-[11px] font-black text-[#5B611D]" style={saira}>₹{curPrice}</span>
                          {hasDisc && (
                            <span className="text-[9px] line-through text-neutral-400 font-medium">₹{originalPrice}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

        </div>{/* end scrollable body */}

        {/* ═══ PINNED CTA FOOTER ═══ */}
        <div className="flex-shrink-0 pb-4 pt-2.5 flex gap-2">
          {/* Buy Now */}
          <button
            onClick={handleAddToCart}
            disabled={btnLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase text-white hover:opacity-90 active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
            style={{
              ...saira,
              background: 'linear-gradient(135deg,#0d2b29 0%,#1e5c58 100%)',
              boxShadow: '0 6px 22px rgba(13,43,41,0.28)',
            }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            {btnLoading ? 'PLEASE WAIT…' : 'BUY NOW'}
          </button>

          {/* Slay the Cart */}
          <button
            onClick={handleAddToCart}
            disabled={btnLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase text-[#0d2b29] hover:opacity-90 active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
            style={{
              ...saira,
              background: 'linear-gradient(135deg,#F5C518 0%,#d4a800 100%)',
              boxShadow: '0 6px 22px rgba(245,197,24,0.32)',
            }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
            {btnLoading ? 'ADDING…' : 'SLAY CART ✨'}
          </button>

          {/* Wishlist */}
          <button
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className="w-11 h-11 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0 transition-transform duration-150 active:scale-95 hover:scale-105"
            style={{
              background: 'rgba(255,255,255,0.50)',
              border: isWishlisted ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.72)',
              color: isWishlisted ? '#dc2626' : '#1e5c58'
            }}
            title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <svg
              className="w-4 h-4"
              fill={isWishlisted ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}

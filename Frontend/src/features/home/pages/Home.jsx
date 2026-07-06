import React, { useEffect, useRef, useLayoutEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useSelector, useDispatch } from 'react-redux'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useProduct } from '../../Products/hook/useProduct'
import ProductDetailOverlay from '../../Products/pages/ProductDetailOverlay'
import CartDrawer from '../../Products/pages/CartDrawer'
import { getCartThunk } from '../../Products/state/cart.slice.js'
import { useAuth } from '../../auth/hook/useAuth'

gsap.registerPlugin(ScrollTrigger)

/* ─────────── Google Fonts ─────────── */
function useFonts() {
  useEffect(() => {
    if (document.getElementById('snitch-gf')) return
    const link = document.createElement('link')
    link.id   = 'snitch-gf'
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Saira:wght@300;400;600;700;900&family=Exo:wght@300;400;500;600;700&family=Shadows+Into+Light&display=swap'
    document.head.appendChild(link)
  }, [])
}

/* ─────────── Design tokens ─────────── */
const saira = { fontFamily: "'Saira', sans-serif" }
const exo   = { fontFamily: "'Exo', sans-serif" }
const sym   = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' }

/* ─────────── Icons ─────────── */
const ArrowRight = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
)
const BagIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
  </svg>
)
const StarIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)
const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
)
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

/* ─────────── Marquee ─────────── */
const MARQUEE = ['NEW DROP', 'SUMMER 25', 'CURATED STYLES', 'SNITCH ORIGINALS', 'FREE RETURNS', 'VERIFIED SELLERS', 'FAST DELIVERY']

function MarqueeStrip() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.to(el, { x: '-50%', duration: 22, ease: 'none', repeat: -1 })
  }, [])
  const items = [...MARQUEE, ...MARQUEE]
  return (
    <div className="overflow-hidden py-2.5 border-y" style={{ borderColor: 'rgba(255,255,255,0.50)', background: 'rgba(255,255,255,0.28)' }}>
      <div ref={ref} className="flex gap-0 whitespace-nowrap" style={{ width: 'max-content' }}>
        {items.map((t, i) => (
          <span key={i} className="flex items-center gap-5 px-5 text-[10px] font-bold tracking-[0.30em] uppercase" style={{ ...exo, color: '#3d7e7a' }}>
            {t}<span style={{ color: '#b8860b' }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─────────── Login Prompt ─────────── */
function LoginPrompt({ product, onClose, onLogin }) {
  const overlayRef = useRef(null)
  const cardRef    = useRef(null)

  useLayoutEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 })
    gsap.fromTo(cardRef.current, { scale: 0.88, y: 30, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.5)' })
  }, [])

  const handleClose = () => {
    gsap.to(cardRef.current, { scale: 0.92, opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: onClose })
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: 'rgba(13,43,41,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === overlayRef.current && handleClose()}
    >
      <div ref={cardRef} className="relative w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-6"
        style={{ background: '#E3F1F0', border: '1px solid rgba(255,255,255,0.80)', boxShadow: '0 32px 64px rgba(13,43,41,0.18)' }}>
        <button onClick={handleClose} className="absolute top-4 right-4 p-1.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.45)', color: '#3d7e7a' }}>
          <CloseIcon />
        </button>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(42,138,133,0.10)', color: '#1e5c58' }}>
          <LockIcon />
        </div>
        <div className="text-center">
          <p className="text-[9px] font-bold tracking-[0.28em] uppercase mb-2" style={{ ...exo, color: '#b8860b' }}>
            besties only 🔒
          </p>
          <h3 className="text-xl font-black mb-2" style={{ ...saira, color: '#0d2b29' }}>
            Sign in to slay 💅
          </h3>
          <p className="text-sm leading-relaxed" style={{ ...exo, color: '#3d7e7a' }}>
            {product ? `"${product.title}" won't wait forever. Log in and make it yours before it's gone.` : 'Log in to access your bag and checkout.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <button onClick={onLogin}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-[#0d2b29] transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ ...saira, background: 'linear-gradient(135deg,#F5C518 0%,#d4a800 100%)', boxShadow: '0 4px 20px rgba(245,197,24,0.28)' }}>
            yep, I'm in ✨
          </button>
          <button onClick={handleClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold"
            style={{ ...exo, background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.70)', color: '#1e5c58' }}>
            maybe later, ngl
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────── Product Card ─────────── */
function ProductCard({ product, index, isLoggedIn, onProductClick, onBuyClick }) {
  const cardRef = useRef(null)
  const imgRef  = useRef(null)   // ← Flip source element

  /* scroll-in animation */
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    gsap.fromTo(el,
      { y: 48, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.65, delay: (index % 8) * 0.05,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      }
    )
  }, [index])

  const hero   = product.images?.[0]
  const price  = product.price?.amount
  const cur    = product.price?.currency || 'INR'
  const seller = product.seller?.fullname || product.seller?.email?.split('@')[0] || 'Seller'

  /* click → pass fromRect of the image for GSAP Flip */
  const handleCardClick = useCallback(() => {
    if (!isLoggedIn) {
      onBuyClick(product)
      return
    }
    const rect = imgRef.current?.getBoundingClientRect() || null
    onProductClick(product, rect)
  }, [isLoggedIn, product, onProductClick, onBuyClick])

  return (
    <article
      ref={cardRef}
      onClick={handleCardClick}
      className="group relative rounded-3xl overflow-hidden cursor-pointer flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.42)',
        border: '1px solid rgba(255,255,255,0.70)',
        boxShadow: '0 2px 16px rgba(42,138,133,0.07)',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={e => gsap.to(e.currentTarget, { y: -7, scale: 1.018, boxShadow: '0 28px 56px rgba(42,138,133,0.13)', duration: 0.35, ease: 'power3.out' })}
      onMouseLeave={e => gsap.to(e.currentTarget, { y: 0, scale: 1, boxShadow: '0 2px 16px rgba(42,138,133,0.07)', duration: 0.35, ease: 'power3.out' })}
    >
      {/* ── IMAGE ── */}
      <div className="relative aspect-[3/4] overflow-hidden flex-shrink-0" style={{ background: '#C8E4E2' }}>
        {hero?.uri ? (
          <img
            ref={imgRef}
            src={hero.uri}
            alt={hero.alt || product.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
          />
        ) : (
          <div ref={imgRef} className="w-full h-full flex items-center justify-center">
            <span style={{ color: '#6aaca8', fontSize: 32 }}>✦</span>
          </div>
        )}

        {/* Scrim */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,43,41,0.58) 0%, transparent 55%)' }} />

        {/* Seller badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full backdrop-blur-sm"
          style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)' }}>
          <p className="text-[9px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#0d2b29' }}>{seller}</p>
        </div>

        {/* "Tap to explore" hint on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'rgba(13,43,41,0.18)' }}>
          <span className="px-4 py-2 rounded-full backdrop-blur-md text-[11px] font-bold tracking-widest uppercase"
            style={{ ...exo, background: 'rgba(255,255,255,0.70)', color: '#0d2b29' }}>
            {isLoggedIn ? 'tap to explore ✦' : 'sign in to buy 🔒'}
          </span>
        </div>

        {/* Price */}
        <div className="absolute bottom-3 left-3">
          <p className="text-xl font-black leading-none" style={{ ...saira, color: '#fff' }}>
            {sym[cur]}{Number(price).toLocaleString()}
          </p>
          <p className="text-[9px] font-semibold tracking-widest uppercase mt-0.5" style={{ ...exo, color: 'rgba(255,255,255,0.70)' }}>{cur}</p>
        </div>

        {/* Stars */}
        <div className="absolute bottom-3 right-3 flex items-center gap-0.5" style={{ color: '#F5C518' }}>
          {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
        </div>
      </div>

      {/* ── DETAILS ── */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-sm font-bold leading-snug truncate" style={{ ...saira, color: '#0d2b29' }}>
            {product.title}
          </h3>
          <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed" style={{ ...exo, color: '#3d7e7a' }}>
            {product.description}
          </p>
        </div>

        {/* Action row */}
        <div className="mt-auto flex gap-2 items-center">
          {isLoggedIn ? (
            <button
              onClick={e => { e.stopPropagation(); handleCardClick() }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold tracking-widest uppercase hover:opacity-90 active:scale-[0.97] transition-all"
              style={{ ...saira, background: 'linear-gradient(135deg,#F5C518 0%,#d4a800 100%)', color: '#0d2b29', boxShadow: '0 4px 12px rgba(245,197,24,0.20)' }}>
              <BagIcon /> View Drop ✦
            </button>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onBuyClick(product) }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold tracking-widest uppercase hover:opacity-90 active:scale-[0.97] transition-all"
              style={{ ...saira, background: 'linear-gradient(135deg,#F5C518 0%,#d4a800 100%)', color: '#0d2b29', boxShadow: '0 4px 12px rgba(245,197,24,0.20)' }}>
              <BagIcon /> Buy Now
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

/* ─────────── Hero ─────────── */
function HeroSection({ isLoggedIn, isSeller, user, navigate }) {
  const headRef = useRef(null)
  const subRef  = useRef(null)
  const ctaRef  = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo('.hero-arc', { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 1.3, stagger: 0.15 }, 0)
      tl.fromTo(headRef.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.2)
      tl.fromTo(subRef.current,  { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.55)
      tl.fromTo(ctaRef.current,  { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, 0.75)
      gsap.to('.orbit-ring', { rotation: 360, duration: 14, repeat: -1, ease: 'none', transformOrigin: '50% 50%' })
      gsap.to('.float-orb-a', { y: -16, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      gsap.to('.float-orb-b', { y: 12,  duration: 4.1, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.2 })
    })
    return () => ctx.revert()
  }, [])

  return (
    <section className="relative z-10 overflow-hidden" style={{ minHeight: '92vh', display: 'flex', alignItems: 'center' }}>

      {/* BG SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden>
        <path className="hero-arc" d="M -80 600 Q 400 -100 900 400" fill="none" stroke="rgba(42,138,133,0.10)" strokeWidth="1.5"/>
        <path className="hero-arc" d="M 200 700 Q 700 100 1200 500" fill="none" stroke="rgba(42,138,133,0.07)" strokeWidth="1"/>
        <path className="hero-arc" d="M -200 300 Q 300 800 1000 200" fill="none" stroke="rgba(245,197,24,0.06)" strokeWidth="1"/>
        {[...Array(5)].map((_, r) => [...Array(8)].map((_, c) => (
          <circle key={`${r}-${c}`} cx={c * 180 + 60} cy={r * 130 + 60} r="1.5" fill="rgba(42,138,133,0.10)" />
        )))}
      </svg>

      <div className="float-orb-a absolute top-[15%] right-[8%] w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(42,138,133,0.16) 0%, transparent 70%)' }} />
      <div className="float-orb-b absolute bottom-[20%] left-[5%] w-44 h-44 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,197,24,0.11) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-20 w-full">
        <div className="grid lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-center">

          {/* LEFT */}
          <div className="flex flex-col gap-8">
            <p className="text-[10px] font-bold tracking-[0.35em] uppercase" style={{ ...exo, color: '#b8860b' }}>
              Fashion · Commerce · Culture · Gen-Z
            </p>

            <div ref={headRef}>
              <h1 className="font-black leading-[0.93] tracking-tight" style={{ ...saira, color: '#0d2b29', fontSize: 'clamp(3rem, 7vw, 6.5rem)' }}>
                Dress<br />
                <span style={{ color: '#b8860b', WebkitTextStroke: '2px #b8860b', WebkitTextFillColor: 'transparent' }}>Bold.</span>
                <br />Shop Bolder.
              </h1>
            </div>

            <div ref={subRef} className="flex flex-col gap-2">
              <p className="text-base leading-relaxed max-w-md" style={{ ...exo, color: '#3d7e7a' }}>
                India's premium fashion marketplace — no cap. Curated drops, independent sellers, and a style ecosystem that <em>understood the assignment</em> 🔥
              </p>
            </div>

            <div ref={ctaRef} className="flex flex-wrap gap-3 items-center">
              <button
                onClick={() => navigate(isSeller ? '/seller/dashboard' : isLoggedIn ? '#products' : '/register')}
                className="flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-bold text-[#0d2b29] hover:opacity-90 active:scale-[0.97] transition-all"
                style={{ ...saira, background: 'linear-gradient(135deg,#F5C518 0%,#d4a800 100%)', boxShadow: '0 6px 28px rgba(245,197,24,0.32)' }}>
                {isSeller ? 'My Dashboard' : 'Start Slaying'} <ArrowRight />
              </button>
              {!isLoggedIn && (
                <button onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-semibold backdrop-blur-md"
                  style={{ ...saira, background: 'rgba(255,255,255,0.42)', border: '1px solid rgba(255,255,255,0.70)', color: '#1e5c58' }}>
                  Sign In
                </button>
              )}
              {isSeller && (
                <button onClick={() => navigate('/products/create')}
                  className="flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-semibold backdrop-blur-md"
                  style={{ ...saira, background: 'rgba(255,255,255,0.42)', border: '1px solid rgba(255,255,255,0.70)', color: '#1e5c58' }}>
                  + Drop Product
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-1">
              {['no cap free returns ✓', 'verified sellers only', '24h support fr', 'secure checkout 🔒'].map(t => (
                <span key={t} className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide backdrop-blur-sm"
                  style={{ ...exo, background: 'rgba(255,255,255,0.42)', border: '1px solid rgba(255,255,255,0.68)', color: '#1e5c58' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-[2.5rem] overflow-hidden"
              style={{ aspectRatio: '3/4', background: '#C8E4E2', border: '1px solid rgba(255,255,255,0.60)', boxShadow: '0 32px 80px rgba(13,43,41,0.14)' }}>
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=720&auto=format&fit=crop"
                alt="Fashion showcase"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,43,41,0.50) 0%, transparent 60%)' }} />
              <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl backdrop-blur-md"
                style={{ background: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.70)' }}>
                <p className="text-[9px] font-bold tracking-[0.25em] uppercase mb-1" style={{ ...exo, color: '#6aaca8' }}>NEW DROP ✦ 2025</p>
                <p className="text-base font-black" style={{ ...saira, color: '#0d2b29' }}>Summer Edit</p>
                <p className="text-[11px] mt-0.5" style={{ ...exo, color: '#3d7e7a' }}>Starting from ₹799 · hits different</p>
              </div>
            </div>

            {/* Orbit badge */}
            <div className="orbit-ring absolute -top-5 -right-5 w-[90px] h-[90px]" style={{ display: 'grid', placeItems: 'center' }}>
              <svg viewBox="0 0 90 90" fill="none" style={{ position: 'absolute', inset: 0 }}>
                <circle cx="45" cy="45" r="40" stroke="rgba(42,138,133,0.22)" strokeWidth="1" strokeDasharray="4 5" />
              </svg>
              <div className="rounded-full w-14 h-14 flex flex-col items-center justify-center backdrop-blur-md"
                style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.80)' }}>
                <span className="text-lg font-black leading-none" style={{ ...saira, color: '#b8860b' }}>50K</span>
                <span className="text-[7px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#3d7e7a' }}>SELLERS</span>
              </div>
            </div>

            {/* Floating rating card */}
            <div className="float-orb-b absolute -bottom-4 -left-6 px-5 py-3 rounded-2xl backdrop-blur-md"
              style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.80)', boxShadow: '0 8px 24px rgba(42,138,133,0.10)' }}>
              <p className="text-[9px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>lowkey 10/10</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex" style={{ color: '#F5C518' }}>{[...Array(5)].map((_, i) => <StarIcon key={i} />)}</div>
                <span className="text-sm font-black" style={{ ...saira, color: '#0d2b29' }}>4.9</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────── Stats Band ─────────── */
function StatsBand() {
  const ref = useRef(null)
  useEffect(() => {
    gsap.fromTo('.sband-item', { y: 20, opacity: 0 }, {
      y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true }
    })
  }, [])
  const stats = [
    { val: '50K+', label: 'Active Sellers' },
    { val: '2M+',  label: 'Products Listed' },
    { val: '4.9★', label: 'Customer Rating' },
    { val: '99%',  label: 'Delivery Rate' },
  ]
  return (
    <div ref={ref} className="border-t border-b" style={{ borderColor: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(8px)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map(({ val, label }) => (
          <div key={label} className="sband-item text-center">
            <p className="text-3xl font-black" style={{ ...saira, color: '#0d2b29' }}>{val}</p>
            <p className="text-[10px] font-bold tracking-widest uppercase mt-1" style={{ ...exo, color: '#3d7e7a' }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────── Products Section ─────────── */
function ProductsSection({ products, searchQuery, setSearchQuery, isLoggedIn, onProductClick, onBuyClick, loading, feedMode, setFeedMode }) {
  const titleRef = useRef(null)
  useEffect(() => {
    if (!titleRef.current) return
    gsap.fromTo(titleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: titleRef.current, start: 'top 85%', once: true } }
    )
  }, [])

  return (
    <section id="products" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24">
      <div ref={titleRef} className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-[0.35em] uppercase mb-2" style={{ ...exo, color: '#b8860b' }}>
            CURATED CATALOG ✦ {products.length} DROPS
          </p>
          <h2 className="font-black leading-tight" style={{ ...saira, color: '#0d2b29', fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            Shop the <span style={{ color: '#b8860b' }}>Drops</span>
          </h2>
          <p className="text-sm mt-1" style={{ ...exo, color: '#6aaca8' }}>
            {isLoggedIn ? 'tap any product to open the full drop ✦' : 'sign in to unlock the full experience 🔒'}
          </p>
        </div>
        <svg width="120" height="24" fill="none" aria-hidden>
          <line x1="0" y1="12" x2="100" y2="12" stroke="rgba(42,138,133,0.25)" strokeWidth="1"/>
          <circle cx="110" cy="12" r="4" fill="rgba(184,134,11,0.40)"/>
        </svg>
      </div>

      {/* Premium Search, Feed Mode, and Category Filter Bar */}
      <div className="mb-10 flex flex-col gap-6">
        
        {/* Row 1: Search Input & Feed Mode Selector */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full lg:max-w-md flex items-center">
            <span className="absolute left-4 text-neutral-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by title, brand, category, tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-2xl text-xs backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-amber-400/25 transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.70)',
                color: '#0d2b29',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 text-neutral-400 hover:text-neutral-600 text-sm font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Feed Mode Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl backdrop-blur-sm flex-shrink-0"
               style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)' }}>
            {[
              { key: 'all', label: '✨ All Drops' },
              { key: 'high-demand', label: '⚡ High Demand' },
              { key: 'wishlist', label: '❤️ Wishlist' }
            ].map(m => {
              const active = feedMode === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    if (m.key === 'wishlist' && !isLoggedIn) {
                      onBuyClick(null);
                      return;
                    }
                    setFeedMode(m.key);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-[9px] font-bold tracking-widest uppercase transition-all duration-150 active:scale-95 cursor-pointer"
                  style={active ? {
                    ...exo,
                    background: 'linear-gradient(135deg,#0d2b29,#1e5c58)',
                    color: '#fff',
                    boxShadow: '0 2px 10px rgba(13,43,41,0.25)'
                  } : {
                    ...exo,
                    color: '#1e5c58'
                  }}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 2: Category Chips */}
        <div className="flex flex-wrap gap-2 w-full overflow-x-auto pb-1 scrollbar-hide">
          {[
            'All',
            'Summer Collection', 'Old Fashion',
            'Boys & Girls', 'Oldaged', 'Gen-Z',
            'Men', 'Women', 'Kids',
            'Gadgets', 'Grooming',
            'Trousers & Pants', 'Kurtas & Shirts', 'Jeans', 'Sari', 'Kurti & Legins', 'Lady Shirt', 'Lady pants'
          ].map(cat => {
            const isActive = cat === 'All' ? !searchQuery : searchQuery.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSearchQuery(cat === 'All' ? '' : cat)}
                className="px-3 py-1.5 rounded-xl text-[9px] font-bold tracking-widest uppercase transition-all duration-150 active:scale-95 cursor-pointer"
                style={isActive ? {
                  ...exo,
                  background: 'linear-gradient(135deg,#b8860b,#d4a800)',
                  color: '#fff',
                  boxShadow: '0 2px 10px rgba(184,134,11,0.25)',
                  border: '1px solid transparent'
                } : {
                  ...exo,
                  background: 'rgba(255,255,255,0.45)',
                  border: '1px solid rgba(255,255,255,0.70)',
                  color: '#1e5c58'
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24 gap-3">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#6aaca8" strokeWidth="4"/>
            <path className="opacity-75" fill="#6aaca8" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-sm tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>loading drops…</span>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="text-4xl">✦</div>
          <p className="text-sm" style={{ ...exo, color: '#6aaca8' }}>No drops yet — check back soon, bestie.</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((p, i) => (
            <ProductCard
              key={p._id || i}
              product={p}
              index={i}
              isLoggedIn={isLoggedIn}
              onProductClick={onProductClick}
              onBuyClick={onBuyClick}
            />
          ))}
        </div>
      )}
    </section>
  )
}

/* ══════════════════════════════════════════════
   HOME
══════════════════════════════════════════════ */
export default function Home() {
  useFonts()

  const navigate   = useNavigate()
  const dispatch   = useDispatch()
  const user       = useSelector(state => state.auth.user)
  const isSeller   = user?.role === 'seller'
  const isLoggedIn = !!user
  const { handleLogout } = useAuth()

  const { handleGetAllProduct, products: hookProducts, loading: hookLoading } = useProduct()
  const storeProducts = useSelector(state => state.product.products) || []
  const allProducts   = hookProducts?.length > 0 ? hookProducts : storeProducts

  const [loading,  setLoading]  = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(null)    // product for login nudge
  const [detailView, setDetailView]   = useState(null)    // { product, fromRect }
  const [cartOpen,   setCartOpen]     = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [feedMode, setFeedMode]       = useState('all') // 'all' | 'high-demand' | 'wishlist'
  const [wishlistItems, setWishlistItems] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const cartItems = useSelector(state => state.cart.items) || []

  const fetchUserWishlist = useCallback(() => {
    if (!isLoggedIn) return;
    fetch('/api/wishlist', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.products)) {
          setWishlistItems(data.products);
        }
      })
      .catch(err => console.warn('Wishlist load error:', err));
  }, [isLoggedIn]);

  /* fetch all products */
  useEffect(() => {
    setLoading(true)
    handleGetAllProduct().finally(() => setLoading(false))
    if (isLoggedIn) {
      dispatch(getCartThunk())
      fetchUserWishlist()
    }
    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [isLoggedIn, dispatch, fetchUserWishlist])

  /* filter products based on search queries, categories, and feed mode */
  const filteredProducts = (() => {
    let baseList = allProducts;
    if (feedMode === 'high-demand') {
      // High demand = price >= 1499 or low stock (< 30 total units remaining)
      baseList = allProducts.filter(p => {
        const totalStock = p.inventory?.reduce((s, v) => s + (v.stock || 0), 0) ?? 100;
        return p.price?.amount >= 1499 || (totalStock > 0 && totalStock <= 30);
      });
    } else if (feedMode === 'wishlist') {
      const wishlistIds = wishlistItems.map(w => w._id);
      baseList = allProducts.filter(p => wishlistIds.includes(p._id));
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter(p => (
      p.title?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    ));
  })();

  /* logged-in card click → GSAP Flip detail view */
  const handleProductClick = useCallback((product, fromRect) => {
    setDetailView({ product, fromRect })
  }, [])

  /* non-logged-in buy click → login prompt */
  const handleBuyClick = useCallback((product) => {
    setLoginPrompt(product)
  }, [])

  const handleGoLogin = useCallback(() => {
    setLoginPrompt(null)
    navigate('/login')
  }, [navigate])

  const handleSelectCollection = useCallback((query) => {
    setFeedMode('all')
    setSearchQuery(query)
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <>
      {/* ── GSAP Flip Detail Overlay (logged-in) ── */}
      {detailView && (
        <ProductDetailOverlay
          product={detailView.product}
          fromRect={detailView.fromRect}
          onClose={() => {
            setDetailView(null)
            fetchUserWishlist()
          }}
          onOpenCart={() => setCartOpen(true)}
          allProducts={allProducts}
        />
      )}

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <CartDrawer onClose={() => setCartOpen(false)} />
      )}

      {/* ── Login Prompt (guests) ── */}
      {loginPrompt && (
        <LoginPrompt
          product={loginPrompt}
          onClose={() => setLoginPrompt(null)}
          onLogin={handleGoLogin}
        />
      )}

      <div className="min-h-screen flex flex-col" style={{ background: '#E3F1F0' }}>

        {/* BG grid */}
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" style={{
          backgroundImage: 'linear-gradient(#2a8a85 1px,transparent 1px),linear-gradient(90deg,#2a8a85 1px,transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        {/* ── NAV ── */}
        <header className="sticky top-0 z-50 backdrop-blur-md"
          style={{ background: 'rgba(227,241,240,0.92)', borderBottom: '1px solid rgba(255,255,255,0.55)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-14 flex items-center justify-between">

            {/* Brand — clicking takes you home */}
            <button
              onClick={() => navigate('/')}
              className="text-lg font-black tracking-[0.35em] uppercase hover:opacity-80 transition-opacity"
              style={{ ...saira, color: '#b8860b' }}
            >
              SNITCH
            </button>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#products" className="text-[11px] font-semibold tracking-widest uppercase hover:opacity-80 transition-opacity" style={{ ...exo, color: '#3d7e7a' }}>
                Catalog
              </a>
              <button onClick={() => navigate('/collections')} className="text-[11px] font-semibold tracking-widest uppercase hover:opacity-80 transition-opacity cursor-pointer" style={{ ...exo, color: '#3d7e7a' }}>
                Collections
              </button>
              <button onClick={() => isLoggedIn ? navigate('/wishlist') : navigate('/login')} className="text-[11px] font-semibold tracking-widest uppercase hover:opacity-80 transition-opacity cursor-pointer" style={{ ...exo, color: '#3d7e7a' }}>
                Wishlist
              </button>
              {isLoggedIn && (
                <button onClick={() => navigate('/my-orders')} className="text-[11px] font-semibold tracking-widest uppercase hover:opacity-80 transition-opacity cursor-pointer" style={{ ...exo, color: '#3d7e7a' }}>
                  My Orders
                </button>
              )}
              {isSeller && (
                <button onClick={() => navigate('/seller/dashboard')}
                  className="text-[11px] font-semibold tracking-widest uppercase hover:opacity-80 transition-opacity cursor-pointer" style={{ ...exo, color: '#3d7e7a' }}>
                  Dashboard
                </button>
              )}
            </nav>

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-2.5">
              {isLoggedIn ? (
                <>
                  {!isSeller && (
                    <button
                      onClick={() => setCartOpen(true)}
                      className="relative p-2.5 rounded-xl flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#1e5c58' }}
                      title="View your bag"
                    >
                      <BagIcon />
                      {cartItems.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ background: '#b8860b' }}>
                          {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      )}
                    </button>
                  )}
                  {isSeller ? (
                    <button onClick={() => navigate('/seller/dashboard')}
                      className="px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm"
                      style={{ ...saira, background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#1e5c58' }}>
                      My Dashboard
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-semibold tracking-widest uppercase backdrop-blur-sm"
                      style={{ ...exo, background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#3d7e7a' }}>
                      👋 {user.fullname?.split(' ')[0] || 'Welcome'}
                    </span>
                  )}
                  <button onClick={handleLogout}
                    className="px-3 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm text-red-600 transition-all hover:bg-red-50"
                    style={{ ...saira, background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)' }}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/login')}
                    className="px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm"
                    style={{ ...saira, background: 'rgba(255,255,255,0.42)', border: '1px solid rgba(255,255,255,0.68)', color: '#1e5c58' }}>
                    Sign In
                  </button>
                  <button onClick={() => navigate('/register')}
                    className="px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase text-[#0d2b29] active:scale-[0.97] transition-all"
                    style={{ ...saira, background: 'linear-gradient(135deg,#F5C518 0%,#d4a800 100%)', boxShadow: '0 2px 12px rgba(245,197,24,0.28)' }}>
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile right — cart + hamburger */}
            <div className="flex md:hidden items-center gap-2">
              {isLoggedIn && !isSeller && (
                <button
                  onClick={() => setCartOpen(true)}
                  className="relative p-2.5 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#1e5c58' }}
                >
                  <BagIcon />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ background: '#b8860b' }}>
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </button>
              )}
              {/* Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(prev => !prev)}
                className="p-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#1e5c58' }}
              >
                {mobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t px-4 py-4 flex flex-col gap-3"
              style={{ background: 'rgba(227,241,240,0.97)', borderColor: 'rgba(255,255,255,0.55)' }}>
              <a href="#products" onClick={() => setMobileMenuOpen(false)}
                className="text-[12px] font-bold tracking-widest uppercase py-2 px-3 rounded-xl"
                style={{ ...exo, color: '#3d7e7a', background: 'rgba(255,255,255,0.45)' }}>
                Catalog
              </a>
              <button onClick={() => { navigate('/collections'); setMobileMenuOpen(false); }}
                className="text-left text-[12px] font-bold tracking-widest uppercase py-2 px-3 rounded-xl cursor-pointer"
                style={{ ...exo, color: '#3d7e7a', background: 'rgba(255,255,255,0.45)' }}>
                Collections
              </button>
              <button onClick={() => { isLoggedIn ? navigate('/wishlist') : navigate('/login'); setMobileMenuOpen(false); }}
                className="text-left text-[12px] font-bold tracking-widest uppercase py-2 px-3 rounded-xl cursor-pointer"
                style={{ ...exo, color: '#3d7e7a', background: 'rgba(255,255,255,0.45)' }}>
                Wishlist
              </button>
              {isLoggedIn && (
                <button onClick={() => { navigate('/my-orders'); setMobileMenuOpen(false); }}
                  className="text-left text-[12px] font-bold tracking-widest uppercase py-2 px-3 rounded-xl cursor-pointer"
                  style={{ ...exo, color: '#3d7e7a', background: 'rgba(255,255,255,0.45)' }}>
                  My Orders
                </button>
              )}
              {isSeller && (
                <button onClick={() => { navigate('/seller/dashboard'); setMobileMenuOpen(false); }}
                  className="text-left text-[12px] font-bold tracking-widest uppercase py-2 px-3 rounded-xl cursor-pointer"
                  style={{ ...exo, color: '#3d7e7a', background: 'rgba(255,255,255,0.45)' }}>
                  Dashboard
                </button>
              )}
              <div className="border-t pt-3 flex gap-2" style={{ borderColor: 'rgba(255,255,255,0.55)' }}>
                {isLoggedIn ? (
                  <>
                    <span className="flex-1 text-center py-2 rounded-xl text-[11px] font-semibold tracking-widest uppercase"
                      style={{ ...exo, background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#3d7e7a' }}>
                      👋 {user?.fullname?.split(' ')[0] || 'Welcome'}
                    </span>
                    <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="px-4 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase text-red-600 active:scale-[0.97]"
                      style={{ ...saira, background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)' }}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                      className="flex-1 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase"
                      style={{ ...saira, background: 'rgba(255,255,255,0.42)', border: '1px solid rgba(255,255,255,0.68)', color: '#1e5c58' }}>
                      Sign In
                    </button>
                    <button onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                      className="flex-1 py-2 rounded-xl text-[11px] font-bold tracking-widest uppercase text-[#0d2b29]"
                      style={{ ...saira, background: 'linear-gradient(135deg,#F5C518 0%,#d4a800 100%)' }}>
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </header>

        <MarqueeStrip />
        <HeroSection isLoggedIn={isLoggedIn} isSeller={isSeller} user={user} navigate={navigate} />
        <StatsBand />
        <CollectionsSection onSelectCollection={handleSelectCollection} />
        <ProductsSection
          products={filteredProducts}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isLoggedIn={isLoggedIn}
          onProductClick={handleProductClick}
          onBuyClick={handleBuyClick}
          loading={hookLoading || loading}
          feedMode={feedMode}
          setFeedMode={setFeedMode}
        />

        {/* ── CTA Band ── */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pb-24">
          <div className="rounded-3xl px-10 py-14 flex flex-col sm:flex-row items-center justify-between gap-8"
            style={{ background: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.68)', backdropFilter: 'blur(12px)' }}>
            <div>
              <p className="text-[9px] font-bold tracking-[0.30em] uppercase mb-2" style={{ ...exo, color: '#b8860b' }}>READY TO SELL?</p>
              <h3 className="text-2xl font-black mb-2" style={{ ...saira, color: '#0d2b29' }}>
                understood the assignment? 💅
              </h3>
              <p className="text-sm max-w-sm" style={{ ...exo, color: '#3d7e7a' }}>
                Join 50K+ sellers. Drop your fits. Start earning from day one — no cap.
              </p>
            </div>
            <button
              onClick={() => navigate(isSeller ? '/seller/dashboard' : '/register')}
              className="flex-shrink-0 flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold text-[#0d2b29] hover:opacity-90 active:scale-[0.97] transition-all"
              style={{ ...saira, background: 'linear-gradient(135deg,#F5C518 0%,#d4a800 100%)', boxShadow: '0 6px 28px rgba(245,197,24,0.28)' }}>
              {isSeller ? 'Go to Dashboard' : 'Become a Seller'} <ArrowRight />
            </button>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="relative z-10 border-t py-8"
          style={{ borderColor: 'rgba(255,255,255,0.50)', background: 'rgba(255,255,255,0.28)', backdropFilter: 'blur(8px)' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-base font-black tracking-[0.35em] uppercase" style={{ ...saira, color: '#b8860b' }}>SNITCH</span>
            <p className="text-[10px] tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>
              © 2025 Snitch · built different 🔥
            </p>
            <div className="flex gap-4">
              {['Terms', 'Privacy', 'Support'].map(l => (
                <span key={l} className="text-[10px] tracking-wide cursor-pointer hover:opacity-70 transition-opacity"
                  style={{ ...exo, color: '#3d7e7a' }}>{l}</span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

/* ─────────── Collections Section ─────────── */
function CollectionsSection({ onSelectCollection }) {
  const deckRef = useRef(null)
  useEffect(() => {
    gsap.fromTo('.coll-card', { y: 40, opacity: 0, scale: 0.96 }, {
      y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: deckRef.current, start: 'top 82%', once: true }
    })
  }, [])

  const collections = [
    {
      title: "Summer Drop",
      emoji: "☀️",
      tagline: "Main character energy fr fr",
      sub: "Limited seasonal pieces",
      query: "Summer Collection",
      gradient: "linear-gradient(145deg, #FF8C42 0%, #FF3CAC 45%, #784BA0 100%)",
      accent: "#FFD700",
      pill: "New Drop",
      pillColor: "rgba(255,215,0,0.20)",
      pillBorder: "rgba(255,215,0,0.45)",
    },
    {
      title: "Old Fashion",
      emoji: "📺",
      tagline: "Lowkey retro, highkey fire",
      sub: "Vintage fits & leather",
      query: "Old Fashion",
      gradient: "linear-gradient(145deg, #B8860B 0%, #5C3317 55%, #0D2B29 100%)",
      accent: "#F5C518",
      pill: "Trending",
      pillColor: "rgba(245,197,24,0.18)",
      pillBorder: "rgba(245,197,24,0.45)",
    },
    {
      title: "Smart Gadgets",
      emoji: "⌚",
      tagline: "Built different, no cap",
      sub: "Micro-LED & smart rings",
      query: "Gadgets",
      gradient: "linear-gradient(145deg, #667EEA 0%, #2563EB 55%, #0F172A 100%)",
      accent: "#A5F3FC",
      pill: "Hot Picks",
      pillColor: "rgba(165,243,252,0.15)",
      pillBorder: "rgba(165,243,252,0.40)",
    },
    {
      title: "Luxe Grooming",
      emoji: "🧴",
      tagline: "Understood the assignment",
      sub: "Argan oil & shaver sets",
      query: "Grooming",
      gradient: "linear-gradient(145deg, #14B8A6 0%, #0F766E 50%, #042F2E 100%)",
      accent: "#6EE7B7",
      pill: "Staff Pick",
      pillColor: "rgba(110,231,183,0.15)",
      pillBorder: "rgba(110,231,183,0.40)",
    }
  ];

  return (
    <section ref={deckRef} className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-16">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p style={{ ...exo, color: '#b8860b', fontSize: '9px', fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', marginBottom: '6px' }}>
            ✦ CURATED STYLES ✦
          </p>
          <h2 style={{ ...saira, color: '#0d2b29', fontSize: '28px', fontWeight: 900, lineHeight: 1.15, margin: 0 }}>
            Shop by{' '}
            <span style={{
              background: 'linear-gradient(90deg, #b8860b 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Collection</span>
          </h2>
        </div>
        <p style={{ ...exo, color: '#6aaca8', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', paddingBottom: '4px' }}>
          4 drops · refreshed weekly
        </p>
      </div>

      {/* Bento Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'auto auto', gap: '16px' }}>
        {collections.map((c, i) => {
          /* Hero card takes 7 cols, side cards take 5 cols on first row; bottom two split 6/6 */
          const gridStyles = [
            { gridColumn: 'span 7', gridRow: '1', minHeight: '260px' },
            { gridColumn: 'span 5', gridRow: '1', minHeight: '260px' },
            { gridColumn: 'span 6', gridRow: '2', minHeight: '200px' },
            { gridColumn: 'span 6', gridRow: '2', minHeight: '200px' },
          ][i];

          return (
            <div
              key={c.title}
              onClick={() => onSelectCollection(c.query)}
              className="coll-card group"
              style={{
                ...gridStyles,
                position: 'relative',
                borderRadius: '24px',
                cursor: 'pointer',
                overflow: 'hidden',
                background: c.gradient,
                boxShadow: '0 8px 32px rgba(13,43,41,0.14), 0 2px 8px rgba(13,43,41,0.08)',
                transition: 'transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.015)';
                e.currentTarget.style.boxShadow = `0 20px 50px rgba(13,43,41,0.22), 0 0 0 1.5px ${c.accent}55`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(13,43,41,0.14), 0 2px 8px rgba(13,43,41,0.08)';
              }}
            >
              {/* Noise texture overlay */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                backgroundSize: '150px',
              }} />

              {/* Sheen sweep on hover */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)',
                transform: 'translateX(-100%)',
                transition: 'transform 0.55s ease',
              }}
                className="group-hover:!translate-x-full"
              />

              {/* Glowing bottom edge */}
              <div style={{
                position: 'absolute', bottom: 0, left: '15%', right: '15%', height: '1px',
                background: `linear-gradient(90deg, transparent, ${c.accent}88, transparent)`,
                opacity: 0.6,
              }} />

              {/* Content */}
              <div style={{ position: 'relative', zIndex: 2, height: '100%', padding: i === 0 ? '28px 32px' : '22px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  {/* Pill badge */}
                  <span style={{
                    ...exo,
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: '999px',
                    background: c.pillColor,
                    border: `1px solid ${c.pillBorder}`,
                    color: c.accent,
                    backdropFilter: 'blur(6px)',
                  }}>
                    {c.pill}
                  </span>

                  {/* Emoji accent */}
                  <span style={{ fontSize: i === 0 ? '36px' : '28px', lineHeight: 1, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))' }}>
                    {c.emoji}
                  </span>
                </div>

                {/* Text block */}
                <div>
                  <h3 style={{
                    ...saira, color: '#fff',
                    fontSize: i === 0 ? '30px' : '20px',
                    fontWeight: 900, textTransform: 'uppercase',
                    letterSpacing: i === 0 ? '0.04em' : '0.06em',
                    lineHeight: 1.1, margin: 0, marginBottom: '6px',
                    textShadow: '0 2px 12px rgba(0,0,0,0.3)',
                  }}>
                    {c.title}
                  </h3>
                  <p style={{ ...exo, color: 'rgba(255,255,255,0.72)', fontSize: i === 0 ? '13px' : '11px', margin: 0, marginBottom: '4px', fontWeight: 500 }}>
                    {c.tagline}
                  </p>
                  <p style={{ ...exo, color: 'rgba(255,255,255,0.44)', fontSize: '10px', margin: 0 }}>
                    {c.sub}
                  </p>

                  {/* CTA row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
                    <span style={{
                      ...exo, fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em',
                      textTransform: 'uppercase', color: c.accent,
                    }}>
                      Shop Now
                    </span>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={c.accent} strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  )
}
import React, { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router'
import { useSelector, useDispatch } from 'react-redux'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'
import ProductDetailOverlay from '../../Products/pages/ProductDetailOverlay'
import CartDrawer from '../../Products/pages/CartDrawer'
import { getCartThunk } from '../../Products/state/cart.slice.js'

gsap.registerPlugin(ScrollTrigger, TextPlugin)

/* ─── Design tokens ─── */
const spaceGrotesk = { fontFamily: "'Space Grotesk', sans-serif" }
const plusJakarta = { fontFamily: "'Plus Jakarta Sans', sans-serif" }
const sym   = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' }

/* ─── Collection data ─── */
const COLLECTIONS = [
  {
    title: 'Summer Drop', query: 'Summer Collection',
    gradientHero: 'linear-gradient(135deg, #f35f5f 0%, #f65373 35%, #eb4786 70%, #d83d8a 100%)',
    tagline: 'Elevated industrialism meets sun-drenched precision.',
    sub: 'The Sage Prism collection explores transparency and weightless layering for the modern urban monitor.',
    orbColor: '#eb4786',
  },
  {
    title: 'Core Basics', query: 'Old Fashion',
    gradientHero: 'linear-gradient(135deg, #FF8C42 0%, #FF3CAC 45%, #784BA0 100%)',
    tagline: 'Lowkey retro, highkey fire',
    sub: 'Vintage distro leather & classic silhouettes built for active streets.',
    orbColor: '#FF3CAC',
  },
  {
    title: 'Tech-Noir', query: 'Boys & Girls',
    gradientHero: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #030712 100%)',
    tagline: 'Gender-neutral streetwear',
    sub: 'Cyber-functional hoodies, cargo pants & utility gear designed for the system.',
    orbColor: '#111827',
  },
  {
    title: 'Comfort Zone', query: 'Oldaged',
    gradientHero: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #064E3B 100%)',
    tagline: 'Understood the comfort',
    sub: 'Cable knit cardigans & warm everyday staples crafted for maximum leisure.',
    orbColor: '#10B981',
  },
  {
    title: "Men's Edit", query: 'Men',
    gradientHero: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e3a8a 100%)',
    tagline: 'Sharp fits, no cap',
    sub: 'Premium shirts, structural trousers & tailored pieces made to fit perfectly.',
    orbColor: '#1d4ed8',
  },
  {
    title: "Women's Styles", query: 'Women',
    gradientHero: 'linear-gradient(135deg, #EC4899 0%, #BE185D 50%, #831843 100%)',
    tagline: 'Feminine & fierce',
    sub: 'Button-downs, blouses, kurtis & premium coordinate sets.',
    orbColor: '#EC4899',
  },
  {
    title: 'Kids Corner', query: 'Kids',
    gradientHero: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 50%, #92400E 100%)',
    tagline: 'Soft & adorable',
    sub: 'Knit rompers & hypoallergenic soft wear for the next generation.',
    orbColor: '#EAB308',
  },
  {
    title: 'Smart Gadgets', query: 'Gadgets',
    gradientHero: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 55%, #155e75 100%)',
    tagline: 'Built different, no cap',
    sub: 'Micro-LED watches, smart rings & next-gen wearable accessories.',
    orbColor: '#0891b2',
  },
  {
    title: 'Luxe Grooming', query: 'Grooming',
    gradientHero: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 50%, #042F2E 100%)',
    tagline: 'Glow up, no excuses',
    sub: 'Argan beard oil, precision shavers & premium grooming serums.',
    orbColor: '#14B8A6',
  },
]

/* ─── Google Fonts ─── */
function useFonts() {
  useEffect(() => {
    if (document.getElementById('snitch-gf-coll')) return
    const link = document.createElement('link')
    link.id   = 'snitch-gf-coll'
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [])
}

/* ─── Icons ─── */
const SearchIcon = () => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)
const UserIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)
const BagIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
  </svg>
)
const HeartIcon = ({ filled = false }) => (
  <svg width="16" height="16" fill={filled ? '#f44336' : 'none'} viewBox="0 0 24 24" stroke={filled ? '#f44336' : 'currentColor'} strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)
const StarIcon = () => (
  <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)
const ChevronDown = () => (
  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)
const ArrowLeft = () => (
  <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)
const GridIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <rect x="3" y="3" width="7" height="7" rx="0.5"/><rect x="14" y="3" width="7" height="7" rx="0.5"/><rect x="3" y="14" width="7" height="7" rx="0.5"/><rect x="14" y="14" width="7" height="7" rx="0.5"/>
  </svg>
)
const ListIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)
const SoundwaveIcon = () => (
  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#5B611D" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10v4M12 8v8M15 11v2M6 13v-2" />
  </svg>
)

/* ─── Marquee strip ─── */
const MARQUEE_ITEMS = ['LIMITED EDITION PRECISION WEAR', 'SAGE PRISM SERIES', 'ANTIMICROBIAL FABRIC TECH', 'URBAN MONITORING SYSTEMS', 'LIMITED AVAILABILITY', 'GLOBAL SHIPPING', 'ELITE MEMBER ACCESS']
function MarqueeStrip() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    gsap.to(el, { x: '-50%', duration: 25, ease: 'none', repeat: -1 })
  }, [])
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div style={{ overflow: 'hidden', padding: '12px 0', background: '#D1F4EF', borderBottom: '1px solid rgba(42,138,133,0.1)' }}>
      <div ref={ref} style={{ display: 'flex', gap: 0, whiteSpace: 'nowrap', width: 'max-content' }}>
        {items.map((t, i) => (
          <span key={i} style={{ ...spaceGrotesk, display: 'inline-flex', alignItems: 'center', gap: '16px', padding: '0 32px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2B5852' }}>
            {t}<span style={{ color: '#5B611D' }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─── Floating orbs ─── */
function FloatingOrbs({ color }) {
  const orb1 = useRef(null), orb2 = useRef(null)
  useEffect(() => {
    const tls = []
    ;[orb1, orb2].forEach((r, i) => {
      if (!r.current) return
      const tl = gsap.to(r.current, {
        y: `${-30 - i * 15}px`, x: `${(i % 2 === 0 ? 1 : -1) * 20}px`,
        duration: 4.5 + i * 1.2, ease: 'sine.inOut', repeat: -1, yoyo: true,
        delay: i * 0.8,
      })
      tls.push(tl)
    })
    return () => tls.forEach(t => t.kill())
  }, [])
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div ref={orb1} style={{ position: 'absolute', top: '5%', right: '10%', width: '320px', height: '320px', borderRadius: '50%', background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`, filter: 'blur(30px)' }} />
      <div ref={orb2} style={{ position: 'absolute', bottom: '10%', left: '8%', width: '220px', height: '220px', borderRadius: '50%', background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`, filter: 'blur(20px)' }} />
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function CollectionsPage() {
  useFonts()
  const navigate   = useNavigate()
  const dispatch   = useDispatch()
  const user       = useSelector(s => s.auth.user)
  const cartItems  = useSelector(s => s.cart.items) || []
  const isLoggedIn = !!user

  const [products,      setProducts]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [selectedIdx,   setSelectedIdx]   = useState(0)
  const [cartOpen,      setCartOpen]      = useState(false)
  const [detailView,    setDetailView]    = useState(null)
  const [gridMode,      setGridMode]      = useState('grid') // 'grid' | 'list'
  const [prevIdx,       setPrevIdx]       = useState(0)
  const [searchQuery,   setSearchQuery]   = useState('')
  const [sortBy,        setSortBy]        = useState('featured')
  const [wishlistIds,   setWishlistIds]   = useState([])
  const [email,         setEmail]         = useState('')
  const [subscribed,    setSubsubscribed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const tabsRef    = useRef(null)
  const heroRef    = useRef(null)
  const gridRef    = useRef(null)
  const navRef     = useRef(null)
  const heroBgRef  = useRef(null)
  const countRef   = useRef(null)

  const activeColl = COLLECTIONS[selectedIdx]

  /* ── Fetch products ── */
  const fetchProducts = useCallback(() => {
    setLoading(true)
    fetch('/api/products')
      .then(r => r.json())
      .then(d => { if (d.success && Array.isArray(d.products)) setProducts(d.products) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  /* ── Fetch wishlist ── */
  const fetchWishlist = useCallback(() => {
    if (!isLoggedIn) return
    fetch('/api/wishlist', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.products)) {
          setWishlistIds(data.products.map(p => p._id))
        }
      })
      .catch(console.error)
  }, [isLoggedIn])

  useEffect(() => {
    fetchProducts()
    fetchWishlist()
    if (isLoggedIn) dispatch(getCartThunk())
  }, [fetchProducts, fetchWishlist, isLoggedIn, dispatch])

  /* ── Toggle wishlist ── */
  const handleToggleWishlist = (productId) => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    fetch('/api/wishlist/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (wishlistIds.includes(productId)) {
            setWishlistIds(wishlistIds.filter(id => id !== productId))
          } else {
            setWishlistIds([...wishlistIds, productId])
          }
        }
      })
      .catch(console.error)
  }

  /* ── Page entrance animation ── */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(navRef.current,
        { y: -60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }
      )
      const heroEls = heroRef.current?.querySelectorAll('.hero-el') || []
      gsap.fromTo(heroEls,
        { y: 40, opacity: 0, filter: 'blur(3px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', stagger: 0.1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      )
      const tabs = tabsRef.current?.querySelectorAll('.coll-tab') || []
      gsap.fromTo(tabs,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.03, duration: 0.5, ease: 'power3.out', delay: 0.4 }
      )
    })
    return () => ctx.revert()
  }, [])

  /* ── Collection switch animation ── */
  useEffect(() => {
    if (!heroRef.current) return
    const tl = gsap.timeline()
    tl.to(heroRef.current.querySelectorAll('.hero-dyn'), { opacity: 0, y: -10, duration: 0.2, ease: 'power2.in', stagger: 0.03 })
      .to(heroBgRef.current, { duration: 0.4, ease: 'power2.inOut' }, '<')
      .fromTo(heroRef.current.querySelectorAll('.hero-dyn'),
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out', stagger: 0.05 },
        '-=0.1'
      )
  }, [selectedIdx])

  /* ── Grid animation on collection change/loading/filter ── */
  useEffect(() => {
    if (!gridRef.current || loading) return
    const cards = gridRef.current.querySelectorAll('.prod-card')
    gsap.fromTo(cards,
      { y: 30, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, stagger: 0.04, duration: 0.5, ease: 'power3.out' }
    )
  }, [selectedIdx, loading, searchQuery, sortBy])

  /* ── Filter & Sort products ── */
  const filteredProducts = products.filter(p => {
    // 1. Collection filter
    const q = activeColl.query.toLowerCase()
    let matchesCollection = false
    if (q === 'shoes') {
      const cat = p.category?.toLowerCase() || ''
      matchesCollection = ['shoes','boots','sneakers','slippers','sandals','footwear'].some(k => cat.includes(k))
    } else {
      matchesCollection = p.category?.toLowerCase() === q || p.tags?.some(t => t.toLowerCase() === q)
    }

    if (!matchesCollection) return false

    // 2. Search filter
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase()
      return p.title?.toLowerCase().includes(s) || 
             p.description?.toLowerCase().includes(s) ||
             p.tags?.some(t => t.toLowerCase().includes(s))
    }
    return true
  }).sort((a, b) => {
    if (sortBy === 'price_asc') {
      return (a.price?.amount || 0) - (b.price?.amount || 0)
    }
    if (sortBy === 'price_desc') {
      return (b.price?.amount || 0) - (a.price?.amount || 0)
    }
    if (sortBy === 'rating') {
      return (b.rating || 4) - (a.rating || 4)
    }
    return 0 // default featured
  })

  const handleSelect = (idx) => {
    setPrevIdx(selectedIdx)
    setSelectedIdx(idx)
    const tab = tabsRef.current?.children[idx]
    tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!email) return
    setSubsubscribed(true)
    setEmail('')
    setTimeout(() => setSubsubscribed(false), 5000)
  }

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0)

  // Splitted massive title helper
  const titleParts = activeColl.title.split(' ')

  return (
    <>
      {/* Global styles */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .tab-scroll::-webkit-scrollbar { display: none; }
        .tab-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        
        .coll-tab { transition: all 0.22s cubic-bezier(0.2,0.8,0.2,1); }
        .prod-card { transition: transform 0.3s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.3s cubic-bezier(0.2,0.8,0.2,1); }
        .prod-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(42,138,133,0.12); }
        
        .nav-link-redesign {
          position: relative;
          color: #52786F;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .nav-link-redesign:hover { color: #5B611D; }
        .nav-link-redesign.active { color: #5B611D; }
        .nav-link-redesign.active::after {
          content: '';
          position: absolute;
          left: 0; bottom: -4px;
          width: 100%; height: 2px;
          background-color: #5B611D;
          border-radius: 2px;
        }

        /* Desktop nav links hidden on mobile */
        .coll-nav-desktop { display: none; }
        .coll-nav-mobile-btn { display: flex; }
        @media (min-width: 768px) {
          .coll-nav-desktop { display: flex; }
          .coll-nav-mobile-btn { display: none; }
        }

        /* Responsive product grid */
        .coll-product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) {
          .coll-product-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
        @media (min-width: 900px) {
          .coll-product-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; }
        }

        /* Newsletter form responsive */
        .coll-newsletter-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          max-width: 420px;
          align-items: stretch;
        }
        @media (min-width: 500px) {
          .coll-newsletter-form { flex-direction: row; justify-content: center; }
        }

        /* Hero banner responsive height */
        .coll-hero-banner {
          min-height: 280px;
        }
        @media (min-width: 640px) {
          .coll-hero-banner { min-height: 380px; }
        }
        @media (min-width: 1024px) {
          .coll-hero-banner { min-height: 440px; }
        }

        /* Main browser section padding */
        .coll-browser-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 16px 60px;
        }
        @media (min-width: 640px) {
          .coll-browser-section { padding: 40px 24px 80px; }
        }

        /* Mobile menu dropdown */
        .coll-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px 16px 16px;
          border-top: 1px solid rgba(255,255,255,0.5);
          background: rgba(230,245,242,0.97);
        }
        .coll-mobile-nav-btn {
          text-align: left;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(255,255,255,0.45);
          border: 1px solid rgba(255,255,255,0.6);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #52786F;
          cursor: pointer;
        }
      `}</style>

      {/* Overlays */}
      {detailView && (
        <ProductDetailOverlay
          product={detailView.product}
          fromRect={detailView.fromRect}
          onClose={() => setDetailView(null)}
          onOpenCart={() => setCartOpen(true)}
          allProducts={products}
        />
      )}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}

      <div style={{ minHeight: '100vh', background: '#E6F5F2', position: 'relative', overflowX: 'hidden' }}>

        {/* ═══ NAV ═══ */}
        <header ref={navRef} style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(230,245,242,0.92)',
          borderBottom: '1px solid rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <span style={{ ...spaceGrotesk, color: '#5B611D', fontSize: '20px', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                SNITCH
              </span>
            </div>

            {/* Desktop Nav links */}
            <nav className="coll-nav-desktop" style={{ alignItems: 'center', gap: '32px' }}>
              <button onClick={() => navigate('/')} className="nav-link-redesign" style={{ ...spaceGrotesk, border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Shop</button>
              <button onClick={() => navigate('/collections')} className="nav-link-redesign active" style={{ ...spaceGrotesk, border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Collections</button>
              {isLoggedIn && (
                <button onClick={() => navigate('/my-orders')} className="nav-link-redesign" style={{ ...spaceGrotesk, border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>My Orders</button>
              )}
              {user?.role === 'seller' && (
                <button onClick={() => navigate('/seller/dashboard')} className="nav-link-redesign" style={{ ...spaceGrotesk, border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Dashboard</button>
              )}
            </nav>

            {/* Desktop right: Search + Profile + Cart */}
            <div className="coll-nav-desktop" style={{ alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#D9EDE9', border: '1px solid #C5DDD8', borderRadius: '999px', padding: '6px 14px', gap: '8px' }}>
                <span style={{ color: '#52786F', display: 'flex', alignItems: 'center' }}><SearchIcon /></span>
                <input
                  type="text"
                  placeholder="SEARCH PIECES"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ ...spaceGrotesk, background: 'none', border: 'none', outline: 'none', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', color: '#0d2b29', width: '120px', textTransform: 'uppercase' }}
                />
              </div>
              <button onClick={() => navigate(isLoggedIn ? '/seller/dashboard' : '/login')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52786F', padding: '6px', display: 'flex', alignItems: 'center' }}>
                <UserIcon />
              </button>
              <button onClick={() => setCartOpen(true)}
                style={{ position: 'relative', padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#52786F', display: 'flex', alignItems: 'center' }}>
                <BagIcon />
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: '-1px', right: '-1px', width: '16px', height: '16px', borderRadius: '50%', background: '#5B611D', color: '#fff', fontSize: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
                )}
              </button>
            </div>

            {/* Mobile right: Cart + Hamburger */}
            <div className="coll-nav-mobile-btn" style={{ alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setCartOpen(true)}
                style={{ position: 'relative', padding: '8px', background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '10px', cursor: 'pointer', color: '#52786F', display: 'flex', alignItems: 'center' }}>
                <BagIcon />
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%', background: '#5B611D', color: '#fff', fontSize: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(prev => !prev)}
                style={{ padding: '8px', background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '10px', cursor: 'pointer', color: '#52786F', display: 'flex', alignItems: 'center' }}
              >
                {mobileMenuOpen ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="coll-mobile-menu" style={{ fontFamily: spaceGrotesk.fontFamily }}>
              {/* Mobile search */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#D9EDE9', border: '1px solid #C5DDD8', borderRadius: '999px', padding: '8px 16px', gap: '8px', marginBottom: '4px' }}>
                <span style={{ color: '#52786F', display: 'flex', alignItems: 'center' }}><SearchIcon /></span>
                <input
                  type="text"
                  placeholder="SEARCH PIECES"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ ...spaceGrotesk, background: 'none', border: 'none', outline: 'none', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: '#0d2b29', width: '100%', textTransform: 'uppercase' }}
                />
              </div>
              <button className="coll-mobile-nav-btn" onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>Shop</button>
              <button className="coll-mobile-nav-btn" style={{ color: '#5B611D', borderColor: '#C0DFD8', background: '#D5EDE9' }} onClick={() => { navigate('/collections'); setMobileMenuOpen(false); }}>Collections ✦</button>
              {isLoggedIn && (
                <button className="coll-mobile-nav-btn" onClick={() => { navigate('/my-orders'); setMobileMenuOpen(false); }}>My Orders</button>
              )}
              {user?.role === 'seller' && (
                <button className="coll-mobile-nav-btn" onClick={() => { navigate('/seller/dashboard'); setMobileMenuOpen(false); }}>Dashboard</button>
              )}
              <button className="coll-mobile-nav-btn" onClick={() => { navigate(isLoggedIn ? '/seller/dashboard' : '/login'); setMobileMenuOpen(false); }}>
                {isLoggedIn ? `👋 ${user?.fullname?.split(' ')[0] || 'Profile'}` : 'Sign In'}
              </button>
            </div>
          )}
        </header>

        {/* ═══ HERO BANNER ═══ */}
        <div style={{ maxWidth: '1280px', margin: '16px auto 0', padding: '0 12px' }}>
          <div ref={heroRef} className="coll-hero-banner" style={{
            position: 'relative', overflow: 'hidden',
            borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '32px 16px',
            boxShadow: '0 20px 40px rgba(42,138,133,0.06)'
          }}>

            {/* Animated gradient BG */}
            <div ref={heroBgRef} style={{
              position: 'absolute', inset: 0,
              background: activeColl.gradientHero,
              transition: 'background 0.8s cubic-bezier(0.2,0.8,0.2,1)',
              zIndex: 1
            }} />

            {/* Noise overlay */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '200px', zIndex: 2
            }} />

            {/* Floating orbs */}
            <FloatingOrbs color={activeColl.orbColor} />

            <div style={{ position: 'relative', zIndex: 3, maxWidth: '720px' }}>

              {/* Items Badge */}
              <div className="hero-el hero-dyn" style={{ marginBottom: '24px' }}>
                <span style={{
                  ...spaceGrotesk, display: 'inline-flex', alignItems: 'center',
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em',
                  padding: '8px 20px', borderRadius: '999px',
                  background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.35)',
                  color: '#fff', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)'
                }}>
                  {loading ? '—' : filteredProducts.length} ITEMS IN DROP
                </span>
              </div>

              {/* Title split on two lines */}
              <h1 className="hero-el hero-dyn" style={{
                ...spaceGrotesk, margin: 0,
                fontSize: 'clamp(3rem, 7.5vw, 6.5rem)',
                fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '-0.02em', lineHeight: 0.95, color: '#fff',
                textShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}>
                {titleParts[0]}
                {titleParts[1] && <><br />{titleParts[1]}</>}
              </h1>

              {/* Tagline & Subtext */}
              <p className="hero-el hero-dyn" style={{
                ...plusJakarta, color: 'rgba(255,255,255,0.92)', fontSize: '13px', marginTop: '24px',
                fontWeight: 500, lineHeight: 1.6, maxWidth: '580px', margin: '24px auto 0'
              }}>
                {activeColl.sub}
              </p>

              {/* CTA Button */}
              <div className="hero-el hero-dyn" style={{ marginTop: '32px' }}>
                <button
                  onClick={() => {
                    const el = document.getElementById('collection-browser');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    ...spaceGrotesk, background: '#5B611D', color: '#fff',
                    padding: '12px 32px', borderRadius: '999px', border: 'none',
                    fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em',
                    textTransform: 'uppercase', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  EXPLORE NOW →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MARQUEE ═══ */}
        <div style={{ marginTop: '24px' }}>
          <MarqueeStrip />
        </div>

        {/* ═══ MAIN BROWSER SECTION ═══ */}
        <div id="collection-browser" className="coll-browser-section">

          {/* ═══ COLLECTION TABS (Capsules) ═══ */}
          <div
            ref={tabsRef}
            className="tab-scroll"
            style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '32px' }}
          >
            {COLLECTIONS.map((c, i) => {
              const active = i === selectedIdx
              return (
                <button
                  key={c.query}
                  className="coll-tab"
                  onClick={() => handleSelect(i)}
                  style={{
                    ...spaceGrotesk, flexShrink: 0,
                    padding: '10px 24px',
                    borderRadius: '999px',
                    fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', cursor: 'pointer',
                    border: active ? '1px solid #C0DFD8' : '1px solid rgba(255,255,255,0.6)',
                    background: active ? '#D5EDE9' : 'rgba(255,255,255,0.45)',
                    color: active ? '#2D4841' : '#52786F',
                    whiteSpace: 'nowrap',
                    backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.7)'
                      e.currentTarget.style.borderColor = '#C0DFD8'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.45)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'
                    }
                  }}
                >
                  {c.title}
                </button>
              )
            })}
          </div>

          {/* ── Filter status & sorting row ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>

            {/* Left browsing status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#5B611D', display: 'flex', alignItems: 'center' }}><ArrowLeft /></span>
              <span style={{ ...spaceGrotesk, color: '#5B611D', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                BROWSING COLLECTION
              </span>
            </div>

            {/* Right sorting and layout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              
              {/* Sort Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                <span style={{ ...spaceGrotesk, color: '#52786F', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em' }}>SORT BY:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    ...spaceGrotesk, background: 'none', border: 'none', outline: 'none',
                    fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#2D4841',
                    cursor: 'pointer', paddingRight: '4px', textTransform: 'uppercase'
                  }}
                >
                  <option value="featured">Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
                <span style={{ color: '#2D4841', display: 'flex', alignItems: 'center' }}><ChevronDown /></span>
              </div>

              {/* Grid/List Mode */}
              <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.4)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.6)' }}>
                {[
                  { mode: 'grid', Icon: GridIcon },
                  { mode: 'list', Icon: ListIcon },
                ].map(({ mode, Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setGridMode(mode)}
                    style={{
                      padding: '5px 8px', border: 'none', cursor: 'pointer', borderRadius: '4px',
                      background: gridMode === mode ? '#D5EDE9' : 'transparent',
                      color: gridMode === mode ? '#2D4841' : '#52786F',
                      display: 'flex', alignItems: 'center'
                    }}
                  >
                    <Icon />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Products render ── */}
          {loading ? (
            <LoadingState />
          ) : filteredProducts.length === 0 ? (
            <EmptyState navigate={navigate} />
          ) : (
            <div
              ref={gridRef}
              className={gridMode === 'grid' ? 'coll-product-grid' : ''}
              style={gridMode === 'list' ? {
                display: 'flex', flexDirection: 'column', gap: '20px',
              } : {}}
            >
              {filteredProducts.map((p, i) => (
                <CollectionCard
                  key={p._id || i}
                  product={p}
                  index={i}
                  gridMode={gridMode}
                  isWishlisted={wishlistIds.includes(p._id)}
                  onToggleWishlist={handleToggleWishlist}
                  onProductClick={(prod, rect) => setDetailView({ product: prod, fromRect: rect })}
                />
              ))}
            </div>
          )}

          {/* ═══ STAY IN THE SYSTEM (Newsletter Section) ═══ */}
          <div style={{
            marginTop: '80px', borderRadius: '40px', background: '#E0F1ED', border: '1px solid #CBE0DB',
            padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: '0 16px 32px rgba(42,138,133,0.04)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <SoundwaveIcon />
            </div>
            
            <h2 style={{ ...spaceGrotesk, color: '#0d2b29', fontSize: '28px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              STAY IN THE SYSTEM.
            </h2>
            <p style={{ ...plusJakarta, color: '#52786F', fontSize: '13px', lineHeight: 1.6, maxWidth: '480px', margin: '0 0 32px' }}>
              Join the SNITCH monitoring list to get early access to drop cycles, limited archival pieces, and technical data updates.
            </p>

            <form onSubmit={handleSubscribe} className="coll-newsletter-form">
              <input
                type="email"
                required
                placeholder={subscribed ? "SYSTEM CONFIRMED" : "YOUR@EMAIL.SYSTEM"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscribed}
                style={{
                  ...spaceGrotesk, background: '#fff', border: '1px solid #CBE0DB', borderRadius: '999px',
                  padding: '12px 24px', outline: 'none', flex: 1, fontSize: '11px', fontWeight: 600,
                  letterSpacing: '0.15em', textTransform: 'uppercase', color: '#0d2b29',
                  textAlign: 'center'
                }}
              />
              <button
                type="submit"
                disabled={subscribed}
                style={{
                  ...spaceGrotesk, background: '#5B611D', color: '#fff', border: 'none', borderRadius: '999px',
                  padding: '12px 32px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em',
                  textTransform: 'uppercase', cursor: 'pointer', transition: 'background-color 0.2s',
                  boxShadow: '0 4px 12px rgba(91,97,29,0.15)'
                }}
              >
                {subscribed ? "VERIFIED" : "SIGN UP"}
              </button>
            </form>
          </div>

          {/* ═══ FOOTER ═══ */}
          <footer style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid rgba(42,138,133,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
              
              <div>
                <span style={{ ...spaceGrotesk, color: '#5B611D', fontSize: '16px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  SNITCH
                </span>
                <p style={{ ...plusJakarta, color: '#52786F', fontSize: '11px', marginTop: '12px', maxWidth: '280px', lineHeight: 1.6 }}>
                  The authority in premium surveillance fashion. We see everything.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                <a href="#" style={{ ...spaceGrotesk, textDecoration: 'none', color: '#52786F', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Privacy Policy</a>
                <a href="#" style={{ ...spaceGrotesk, textDecoration: 'none', color: '#52786F', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Terms of Service</a>
                <a href="#" style={{ ...spaceGrotesk, textDecoration: 'none', color: '#52786F', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Shipping</a>
                <a href="#" style={{ ...spaceGrotesk, textDecoration: 'none', color: '#52786F', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Contact</a>
              </div>

              <div style={{ ...spaceGrotesk, color: '#88a39c', fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em' }}>
                © 2024 SNITCH WORLDWIDE. ALL PRIVACY REVOKED.
              </div>
            </div>
          </footer>

        </div>
      </div>
    </>
  )
}

/* ─── Loading State ─── */
function LoadingState() {
  const spinRef = useRef(null)
  useEffect(() => {
    gsap.to(spinRef.current, { rotation: 360, duration: 1.2, ease: 'none', repeat: -1 })
  }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
      <div ref={spinRef} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(91,97,29,0.1)', borderTop: '3px solid #5B611D' }} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0d2b29', fontSize: '13px', fontWeight: 700 }}>LOADING DATABASE...</p>
      </div>
    </div>
  )
}

/* ─── Empty State ─── */
function EmptyState({ navigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px' }}>💅</div>
      <div>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#0d2b29', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
          NO PIECES DETECTED
        </p>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#52786F', fontSize: '12px', maxWidth: '280px', lineHeight: 1.6 }}>
          This drop is currently empty in the system. Check back soon.
        </p>
      </div>
      <button
        onClick={() => navigate('/')}
        style={{
          fontFamily: "'Space Grotesk', sans-serif", marginTop: '8px', padding: '10px 24px', borderRadius: '999px',
          background: '#5B611D', border: 'none', cursor: 'pointer',
          color: '#fff', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
          boxShadow: '0 4px 12px rgba(91,97,29,0.15)',
        }}
      >
        BACK TO MAIN SYSTEM
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════
   COLLECTION CARD
═══════════════════════════════════════════ */
function CollectionCard({ product, index, gridMode, isWishlisted, onToggleWishlist, onProductClick }) {
  const cardRef    = useRef(null)
  const imgRef     = useRef(null)
  const overlayRef = useRef(null)
  const [hovered, setHovered] = useState(false)

  const hero   = product.images?.[0]
  const price  = product.price?.amount
  const cur    = product.price?.currency || 'INR'
  const seller = product.seller?.fullname || product.seller?.email?.split('@')[0] || 'Seller'
  const rating = product.rating || 4.5

  // Scroll-triggered entrance
  useEffect(() => {
    const el = cardRef.current; if (!el) return
    const trigger = ScrollTrigger.create({
      trigger: el, start: 'top 95%', once: true,
      onEnter: () => {
        gsap.fromTo(el,
          { y: 35, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, delay: (index % 4) * 0.05, ease: 'power3.out' }
        )
      },
    })
    return () => trigger.kill()
  }, [index])

  const handleMouseEnter = () => {
    setHovered(true)
    if (imgRef.current?.tagName === 'IMG') {
      gsap.to(imgRef.current, { scale: 1.05, duration: 0.4, ease: 'power2.out' })
    }
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.25 })
  }
  const handleMouseLeave = () => {
    setHovered(false)
    if (imgRef.current?.tagName === 'IMG') {
      gsap.to(imgRef.current, { scale: 1, duration: 0.4, ease: 'power2.out' })
    }
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.25 })
  }

  const handleClick = () => {
    const rect = imgRef.current?.getBoundingClientRect() || null
    onProductClick(product, rect)
  }

  // Check if sold out or new arrival
  const isSoldOut = product.inventory === 0 || product.tags?.some(t => t.toLowerCase().includes('sold out'))
  const isNewArrival = product.tags?.some(t => t.toLowerCase().includes('new') || t.toLowerCase().includes('arrival'))

  if (gridMode === 'list') {
    return (
      <article
        ref={cardRef}
        className="prod-card"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex', gap: '0', borderRadius: '20px', overflow: 'hidden',
          background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 4px 20px rgba(42,138,133,0.04)', backdropFilter: 'blur(10px)',
          cursor: 'pointer', position: 'relative'
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', width: '150px', flexShrink: 0, background: '#D9EDE9', overflow: 'hidden' }}>
          {hero?.uri ? (
            <img ref={imgRef} src={hero.uri} alt={hero.alt || product.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }} />
          ) : (
            <div ref={imgRef} style={{ width: '100%', height: '100%', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#88a39c', fontSize: '24px' }}>✦</span>
            </div>
          )}

          {/* Availability Badges */}
          {isSoldOut && (
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#4A3E2C', borderRadius: '4px', padding: '3px 8px' }}>
              <span style={{ ...spaceGrotesk, color: '#fff', fontSize: '7px', fontWeight: 700, letterSpacing: '0.1em' }}>SOLD OUT</span>
            </div>
          )}
          {!isSoldOut && isNewArrival && (
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#5B611D', borderRadius: '4px', padding: '3px 8px' }}>
              <span style={{ ...spaceGrotesk, color: '#fff', fontSize: '7px', fontWeight: 700, letterSpacing: '0.1em' }}>NEW DROP</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ ...spaceGrotesk, color: '#0d2b29', fontSize: '15px', fontWeight: 700, textTransform: 'uppercase' }}>{product.title}</h3>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleWishlist(product._id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: isWishlisted ? '#f44336' : '#88a39c', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <HeartIcon filled={isWishlisted} />
              </button>
            </div>
            {product.description && (
              <p style={{ ...plusJakarta, color: '#52786F', fontSize: '11px', marginTop: '6px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {product.description}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '8px 0 0' }}>
              <div style={{ display: 'flex', color: '#f5c518', gap: '1px' }}>
                {[...Array(5)].map((_, k) => <StarIcon key={k} />)}
              </div>
              <span style={{ ...plusJakarta, color: '#88a39c', fontSize: '10px' }}>({Math.floor(rating * 28)})</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            <span style={{ ...spaceGrotesk, color: '#5B611D', fontWeight: 800, fontSize: '18px' }}>
              {sym[cur]}{Number(price).toLocaleString()}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {product.tags?.slice(0, 2).map(tag => (
                <span key={tag} style={{
                  ...spaceGrotesk, padding: '2px 8px', borderRadius: '4px',
                  background: '#d5ede9', color: '#2d4841', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase'
                }}>#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </article>
    )
  }

  // GRID CARD
  return (
    <article
      ref={cardRef}
      className="prod-card"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        borderRadius: '24px', overflow: 'hidden',
        background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 4px 20px rgba(42,138,133,0.04)', backdropFilter: 'blur(10px)',
        cursor: 'pointer', display: 'flex', flexDirection: 'column',
        WebkitBackdropFilter: 'blur(10px)', position: 'relative'
      }}
    >
      {/* ── Image ── */}
      <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#D9EDE9', flexShrink: 0 }}>
        {hero?.uri ? (
          <img
            ref={imgRef}
            src={hero.uri}
            alt={hero.alt || product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transformOrigin: 'center', transition: 'transform 0.4s ease' }}
          />
        ) : (
          <div ref={imgRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#88a39c', fontSize: '40px' }}>✦</span>
          </div>
        )}

        {/* Hover overlay CTA */}
        <div ref={overlayRef} style={{
          position: 'absolute', inset: 0, opacity: 0, pointerEvents: hovered ? 'auto' : 'none',
          background: 'linear-gradient(to top, rgba(45,72,65,0.7) 0%, rgba(45,72,65,0.2) 60%, transparent 100%)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '20px',
          transition: 'opacity 0.25s ease'
        }}>
          <div style={{
            ...spaceGrotesk, background: '#fff', color: '#2d4841',
            padding: '10px 24px', borderRadius: '999px',
            fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }}>
            Explore Details ↗
          </div>
        </div>

        {/* Availability Badges */}
        {isSoldOut && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#4A3E2C', borderRadius: '4px', padding: '3px 8px', zIndex: 5 }}>
            <span style={{ ...spaceGrotesk, color: '#fff', fontSize: '7px', fontWeight: 700, letterSpacing: '0.1em' }}>SOLD OUT</span>
          </div>
        )}
        {!isSoldOut && isNewArrival && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#5B611D', borderRadius: '4px', padding: '3px 8px', zIndex: 5 }}>
            <span style={{ ...spaceGrotesk, color: '#fff', fontSize: '7px', fontWeight: 700, letterSpacing: '0.1em' }}>NEW ARRIVAL</span>
          </div>
        )}

        {/* Seller Info Tag */}
        <div style={{
          position: 'absolute', bottom: '12px', left: '14px', zIndex: 4,
          padding: '2px 8px', borderRadius: '4px',
          background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.8)',
        }}>
          <p style={{ ...spaceGrotesk, color: '#2d4841', fontSize: '8px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            {seller}
          </p>
        </div>
      </div>

      {/* ── Text info ── */}
      <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ ...spaceGrotesk, color: '#0d2b29', fontSize: '14px', fontWeight: 700, margin: 0, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {product.title}
          </h3>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWishlist(product._id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isWishlisted ? '#f44336' : '#88a39c', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <HeartIcon filled={isWishlisted} />
          </button>
        </div>

        {product.description && (
          <p style={{ ...plusJakarta, color: '#52786F', fontSize: '11px', margin: '4px 0 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '33px' }}>
            {product.description}
          </p>
        )}

        {/* Rating Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '6px 0 0' }}>
          <div style={{ display: 'flex', color: '#f5c518', gap: '1px' }}>
            {[...Array(5)].map((_, k) => <StarIcon key={k} />)}
          </div>
          <span style={{ ...plusJakarta, color: '#88a39c', fontSize: '9px' }}>({Math.floor(rating * 22)})</span>
        </div>

        {/* Price & Tags Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <span style={{ ...spaceGrotesk, color: '#5B611D', fontWeight: 800, fontSize: '16px' }}>
            {sym[cur]}{Number(price).toLocaleString()}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {product.tags?.slice(0, 2).map(tag => (
              <span key={tag} style={{
                ...spaceGrotesk, padding: '2px 6px', borderRadius: '4px',
                background: '#d5ede9', color: '#2d4841', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase'
              }}>#{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}


import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useSelector, useDispatch } from 'react-redux'
import { gsap } from 'gsap'
import ProductDetailOverlay from '../../Products/pages/ProductDetailOverlay'
import CartDrawer from '../../Products/pages/CartDrawer'
import { getCartThunk } from '../../Products/state/cart.slice.js'

/* ─── Typography & Shared Tokens ─── */
const saira = { fontFamily: "'Saira', sans-serif" }
const exo = { fontFamily: "'Exo', sans-serif" }
const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' }

const BagIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
  </svg>
)

const StarIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

export default function WishlistPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(state => state.auth.user)
  const cartItems = useSelector(state => state.cart.items) || []
  const isLoggedIn = !!user

  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([]) // For similar products recommendations
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const [detailView, setDetailView] = useState(null)

  const fetchWishlist = useCallback(() => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    setLoading(true)
    fetch('/api/wishlist', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products)
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [isLoggedIn, navigate])

  // Fetch all products silently for recommendations
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.products)) {
          setAllProducts(data.products)
        }
      })
      .catch(err => console.warn(err))
  }, [])

  useEffect(() => {
    fetchWishlist()
    if (isLoggedIn) {
      dispatch(getCartThunk())
    }
  }, [fetchWishlist, isLoggedIn, dispatch])

  const handleProductClick = (product, fromRect) => {
    setDetailView({ product, fromRect })
  }

  return (
    <>
      {/* ── Detail modal overlay ── */}
      {detailView && (
        <ProductDetailOverlay
          product={detailView.product}
          fromRect={detailView.fromRect}
          onClose={() => {
            setDetailView(null)
            fetchWishlist() // refetch wishlist in case user toggled it off inside details view
          }}
          onOpenCart={() => setCartOpen(true)}
          allProducts={allProducts}
        />
      )}

      {/* ── Cart Drawer ── */}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}

      <div className="min-h-screen flex flex-col" style={{ background: '#E3F1F0' }}>
        {/* Background Grid Lines */}
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" style={{
          backgroundImage: 'linear-gradient(#2a8a85 1px,transparent 1px),linear-gradient(90deg,#2a8a85 1px,transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        {/* ── NAV ── */}
        <header className="sticky top-0 z-50 backdrop-blur-md"
          style={{ background: 'rgba(227,241,240,0.88)', borderBottom: '1px solid rgba(255,255,255,0.55)' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 h-14 flex items-center justify-between">
            <span onClick={() => navigate('/')} className="text-lg font-black tracking-[0.35em] uppercase cursor-pointer" style={{ ...saira, color: '#b8860b' }}>SNITCH</span>

            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/')} className="text-[11px] font-semibold tracking-widest uppercase hover:opacity-80 transition-opacity cursor-pointer" style={{ ...exo, color: '#3d7e7a' }}>
                Catalog
              </button>
              <button onClick={() => navigate('/collections')} className="text-[11px] font-semibold tracking-widest uppercase hover:opacity-80 transition-opacity cursor-pointer" style={{ ...exo, color: '#3d7e7a' }}>
                Collections
              </button>
              <button onClick={() => navigate('/wishlist')} className="text-[11px] font-semibold tracking-widest uppercase hover:opacity-80 transition-opacity cursor-pointer" style={{ ...exo, color: '#b8860b' }}>
                Wishlist
              </button>
              {isLoggedIn && (
                <button onClick={() => navigate('/my-orders')} className="text-[11px] font-semibold tracking-widest uppercase hover:opacity-80 transition-opacity cursor-pointer" style={{ ...exo, color: '#3d7e7a' }}>
                  My Orders
                </button>
              )}
              {user?.role === 'seller' && (
                <button onClick={() => navigate('/seller/dashboard')}
                  className="text-[11px] font-semibold tracking-widest uppercase hover:opacity-80 transition-opacity cursor-pointer" style={{ ...exo, color: '#3d7e7a' }}>
                  Dashboard
                </button>
              )}
            </nav>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2.5 rounded-xl flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#1e5c58' }}
                title="View your bag"
              >
                <BagIcon />
                {cartItems.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                    style={{ background: '#b8860b' }}
                  >
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ── BODY CONTENT ── */}
        <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-[10px] font-bold tracking-[0.35em] uppercase mb-2" style={{ ...exo, color: '#b8860b' }}>
                SAVED DROPS ✦ {products.length} ITEMS
              </p>
              <h2 className="font-black leading-tight" style={{ ...saira, color: '#0d2b29', fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
                My <span style={{ color: '#b8860b' }}>Wishlist</span>
              </h2>
              <p className="text-sm mt-1" style={{ ...exo, color: '#6aaca8' }}>
                Your private vault of absolute fire. Cop them before they run out.
              </p>
            </div>
            <svg width="120" height="24" fill="none" aria-hidden>
              <line x1="0" y1="12" x2="100" y2="12" stroke="rgba(42,138,133,0.25)" strokeWidth="1"/>
              <circle cx="110" cy="12" r="4" fill="rgba(184,134,11,0.40)"/>
            </svg>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#6aaca8" strokeWidth="4"/>
                <path className="opacity-75" fill="#6aaca8" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-sm tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>loading vault…</span>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6 text-center max-w-md mx-auto"
                 style={{ background: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.60)', borderRadius: '24px', backdropFilter: 'blur(12px)' }}>
              <div className="text-5xl">💅</div>
              <div>
                <h3 className="text-lg font-black text-[#0d2b29]" style={saira}>Lowkey empty, bestie</h3>
                <p className="text-xs text-[#3d7e7a] mt-1.5 leading-relaxed" style={exo}>
                  Your wishlist is dry. Go find some premium drops and lock them down!
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase text-white hover:opacity-90 active:scale-95 transition-all"
                style={{ ...saira, background: 'linear-gradient(135deg,#0d2b29 0%,#1e5c58 100%)' }}
              >
                Go Explore Drops
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((p, i) => (
                <WishlistCard
                  key={p._id || i}
                  product={p}
                  index={i}
                  onProductClick={handleProductClick}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  )
}

/* ─────────── Wishlist Card ─────────── */
function WishlistCard({ product, index, onProductClick }) {
  const cardRef = useRef(null)
  const imgRef = useRef(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    gsap.fromTo(el,
      { y: 35, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.55, delay: (index % 8) * 0.05,
        ease: 'power3.out'
      }
    )
  }, [index])

  const hero = product.images?.[0]
  const price = product.price?.amount
  const cur = product.price?.currency || 'INR'
  const seller = product.seller?.fullname || product.seller?.email?.split('@')[0] || 'Seller'

  const handleCardClick = () => {
    const rect = imgRef.current?.getBoundingClientRect() || null
    onProductClick(product, rect)
  }

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
      onMouseEnter={e => gsap.to(e.currentTarget, { y: -6, scale: 1.015, duration: 0.3, ease: 'power3.out' })}
      onMouseLeave={e => gsap.to(e.currentTarget, { y: 0, scale: 1, duration: 0.3, ease: 'power3.out' })}
    >
      <div className="relative aspect-[3/4] overflow-hidden flex-shrink-0 bg-[#C8E4E2]">
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

        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,43,41,0.5) 0%, transparent 55%)' }} />

        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full backdrop-blur-sm"
          style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)' }}>
          <p className="text-[9px] font-bold tracking-widest uppercase" style={{ ...exo, color: '#0d2b29' }}>{seller}</p>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'rgba(13,43,41,0.15)' }}>
          <span className="px-4 py-2 rounded-full backdrop-blur-md text-[11px] font-bold tracking-widest uppercase"
            style={{ ...exo, background: 'rgba(255,255,255,0.70)', color: '#0d2b29' }}>
            view drop ✦
          </span>
        </div>

        <div className="absolute bottom-3 left-3">
          <p className="text-xl font-black leading-none" style={{ ...saira, color: '#fff' }}>
            {sym[cur]}{Number(price).toLocaleString()}
          </p>
          <p className="text-[9px] font-semibold tracking-widest uppercase mt-0.5" style={{ ...exo, color: 'rgba(255,255,255,0.70)' }}>{cur}</p>
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-0.5" style={{ color: '#F5C518' }}>
          {[...Array(5)].map((_, i) => <StarIcon key={i} />)}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-sm font-bold leading-snug truncate" style={{ ...saira, color: '#0d2b29' }}>
            {product.title}
          </h3>
          <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed" style={{ ...exo, color: '#3d7e7a' }}>
            {product.description}
          </p>
        </div>
      </div>
    </article>
  )
}

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useSelector } from 'react-redux'
import { useProduct } from '../hook/useProduct.js'
import { gsap } from 'gsap'
import { aiDetectColor } from '../services/ai.api.js'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size']
const BLANK_SIZE = () => ({ size: 'M', stock: 0 })
const BLANK_GROUP = () => ({ color: '', imageIndex: null, sizes: [BLANK_SIZE()] })

/* ─────────────── Google Fonts injection ─────────────── */
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Saira:wght@300;400;600;700;900&family=Exo:wght@300;400;500;600;700&family=Shadows+Into+Light&display=swap'

function useFonts() {
  useEffect(() => {
    if (document.getElementById('snitch-gfonts')) return
    const link = document.createElement('link')
    link.id = 'snitch-gfonts'
    link.rel = 'stylesheet'
    link.href = FONTS_URL
    document.head.appendChild(link)
  }, [])
}

/* ─────────────── Style shortcuts ─────────────── */
const saira    = { fontFamily: "'Saira', sans-serif" }
const exo      = { fontFamily: "'Exo', sans-serif" }
const shadows  = { fontFamily: "'Shadows Into Light', cursive" }

/* ─────────────── SVG Icons ─────────────── */
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
const BoxIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)
const GridIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)
const ListIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)
const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const ImagePlaceholder = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} style={{ color: '#6aaca8' }}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 20" />
  </svg>
)
const TrendUpIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)
const RefreshIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)
const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

/* ─────────────── Currency symbols ─────────────── */
const currencySymbol = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' }

function InventoryManager({ product, onClose, onSave }) {
  const panelRef    = useRef(null)
  const backdropRef = useRef(null)
  const images      = product.images || []

  // Helper to group flat inventory to color groups
  const groupInventory = useCallback((inv) => {
    if (!inv || !inv.length) return [BLANK_GROUP()]
    const map = {}
    inv.forEach(v => {
      const col = v.color || 'Default'
      if (!map[col]) {
        map[col] = { color: col, imageIndex: v.imageIndex ?? null, sizes: [] }
      }
      map[col].sizes.push({ size: v.size || 'M', stock: v.stock || 0 })
    })
    return Object.values(map)
  }, [])

  const [colorGroups, setColorGroups] = useState(() => groupInventory(product.inventory))
  const [saving,    setSaving]    = useState(false)
  const [saveErr,   setSaveErr]   = useState(null)
  const [detecting, setDetecting] = useState({})   // { [groupIndex]: true }
  const [aiRunning, setAiRunning] = useState(false) // bulk detect in progress

  useLayoutEffect(() => {
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 })
    gsap.fromTo(panelRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' })
  }, [])

  const close = useCallback(() => {
    const tl = gsap.timeline({ onComplete: onClose })
    tl.to(panelRef.current, { y: 30, opacity: 0, duration: 0.25, ease: 'power2.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.2 }, '-=0.1')
  }, [onClose])

  const addColorGroup    = () => setColorGroups(prev => [...prev, BLANK_GROUP()])
  const removeColorGroup = (gi) => setColorGroups(prev => prev.filter((_, i) => i !== gi))
  const setGroupColor    = (gi, color) => setColorGroups(prev => prev.map((g, i) => i === gi ? { ...g, color } : g))

  const cycleGroupImage = (gi) => {
    if (!images.length) return
    setColorGroups(prev => prev.map((g, i) => {
      if (i !== gi) return g
      const next = ((g.imageIndex ?? -1) + 1) % images.length
      return { ...g, imageIndex: next }
    }))
  }

  const addSizeToGroup = (gi) =>
    setColorGroups(prev => prev.map((g, i) => i === gi ? { ...g, sizes: [...g.sizes, BLANK_SIZE()] } : g))

  const removeSizeFromGroup = (gi, si) =>
    setColorGroups(prev => prev.map((g, i) =>
      i !== gi ? g : { ...g, sizes: g.sizes.filter((_, j) => j !== si) }
    ))

  const setSizeField = (gi, si, field, value) =>
    setColorGroups(prev => prev.map((g, i) =>
      i !== gi ? g : { ...g, sizes: g.sizes.map((s, j) => j !== si ? s : { ...s, [field]: value }) }
    ))

  /* Flatten groups -> inventory array for backend */
  const flattenGroups = (groups) =>
    groups
      .filter(g => g.color.trim())
      .flatMap(g => g.sizes.map(s => ({ color: g.color, size: s.size, stock: s.stock, imageIndex: g.imageIndex })))

  /* AI detect color for a single group */
  const detectGroupColor = async (gi) => {
    const g = colorGroups[gi]
    const imgIdx = g.imageIndex ?? 0
    const uri = images[imgIdx]?.uri
    if (!uri) return
    setDetecting(d => ({ ...d, [gi]: true }))
    try {
      const { color } = await aiDetectColor(uri)
      if (color) setGroupColor(gi, color)
    } catch {}
    setDetecting(d => ({ ...d, [gi]: false }))
  }

  /* AI detect colors for ALL images - auto-build one group per image */
  const detectAllColors = async () => {
    if (!images.length) return
    setAiRunning(true)
    try {
      const results = await Promise.all(
        images.map(async (img, i) => {
          try {
            const { color } = await aiDetectColor(img.uri)
            return { color: color || `Color ${i + 1}`, imageIndex: i }
          } catch {
            return { color: `Color ${i + 1}`, imageIndex: i }
          }
        })
      )
      setColorGroups(prev => {
        return results.map(r => {
          const existing = prev.find(g => g.imageIndex === r.imageIndex)
          return existing
            ? { ...existing, color: r.color, imageIndex: r.imageIndex }
            : { color: r.color, imageIndex: r.imageIndex, sizes: [BLANK_SIZE()] }
        })
      })
    } catch {}
    setAiRunning(false)
  }

  const handleSave = async () => {
    const valid = flattenGroups(colorGroups)
    setSaving(true); setSaveErr(null)
    try {
      await onSave(product._id, valid)
      close()
    } catch (e) {
      setSaveErr(e.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const totalStock = colorGroups.reduce((acc, g) => acc + g.sizes.reduce((s, sz) => s + (Number(sz.stock) || 0), 0), 0)

  const inputStyle = {
    background: 'rgba(255,255,255,0.55)',
    border: '1px solid rgba(255,255,255,0.75)',
    color: '#0d2b29',
    borderRadius: '10px',
    padding: '6px 10px',
    fontSize: '12px',
    outline: 'none',
    width: '100%'
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0"
        style={{ background: 'rgba(13,43,41,0.55)', backdropFilter: 'blur(6px)' }}
        onClick={close}
      />
      {/* panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden z-10"
        style={{ background: '#E3F1F0', border: '1px solid rgba(255,255,255,0.60)', boxShadow: '0 24px 80px rgba(13,43,41,0.30)' }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.60)', background: 'rgba(255,255,255,0.30)' }}>
          <div>
            <p className="text-[9px] font-bold tracking-[0.28em] uppercase" style={{ ...exo, color: '#b8860b' }}>MANAGE STOCK &amp; IMAGES</p>
            <h2 className="text-base font-black mt-0.5 truncate max-w-[320px]" style={{ ...saira, color: '#0d2b29' }}>{product.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* AI Detect All */}
            {images.length > 0 && (
              <button
                onClick={detectAllColors}
                disabled={aiRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.25)', color: '#7c3aed', ...exo }}
                title="Use Mistral AI to detect color from each image"
              >
                {aiRunning
                  ? <><span className="animate-spin inline-block w-2.5 h-2.5 border border-purple-400 border-t-transparent rounded-full" />Detecting…</>
                  : <>✨ AI Detect All</>}
              </button>
            )}
            <span className="text-xs font-bold tabular-nums px-3 py-1 rounded-full" style={{ ...exo, background: totalStock === 0 ? 'rgba(239,68,68,0.12)' : 'rgba(42,138,133,0.12)', color: totalStock === 0 ? '#dc2626' : '#1e5c58', border: totalStock === 0 ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(42,138,133,0.25)' }}>
              {totalStock} total
            </span>
            <button onClick={close} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 hover:scale-110" style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.75)', color: '#0d2b29' }}>
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* Info tip */}
          {images.length > 0 && (
            <div className="mb-3 px-3 py-2 rounded-xl text-[10px] leading-relaxed" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)', color: '#7c3aed', ...exo }}>
              💡 Click an image swatch to pin it to that color card · Add sizes to each color · Click <strong>✨ AI Detect All</strong> to auto-identify colors using Mistral Vision
            </div>
          )}

          {/* Colour group cards */}
          <div className="flex flex-col gap-3">
            {colorGroups.map((g, gi) => (
              <div
                key={gi}
                className="rounded-2xl overflow-hidden"
                style={{ border: '1.5px solid rgba(255,255,255,0.72)', background: 'rgba(255,255,255,0.35)' }}
              >
                {/* ── Card header: swatch + colour name + remove ── */}
                <div
                  className="flex items-center gap-3 px-3 py-2.5 border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.20)' }}
                >
                  {/* Image swatch */}
                  {images.length > 0 && (
                    <div className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => cycleGroupImage(gi)}
                        title="Click to cycle through product images"
                        className="w-12 h-12 rounded-xl overflow-hidden border-2 transition-all duration-150 hover:scale-105 active:scale-95"
                        style={{
                          borderColor: g.imageIndex !== null ? '#b8860b' : 'rgba(180,200,200,0.50)',
                          background: '#d5ecea',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        {images[g.imageIndex ?? 0]?.uri
                          ? <img src={images[g.imageIndex ?? 0].uri} alt="" className="w-full h-full object-cover" />
                          : <span style={{ color: '#6aaca8', fontSize: 18 }}>✦</span>
                        }
                      </button>
                      {/* Per-card AI detect */}
                      <button
                        type="button"
                        onClick={() => detectGroupColor(gi)}
                        disabled={detecting[gi] || !images[g.imageIndex ?? 0]?.uri}
                        title="AI detect colour from this image"
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 disabled:opacity-40"
                        style={{ background: '#7c3aed', border: '1.5px solid white' }}
                      >
                        {detecting[gi]
                          ? <span className="animate-spin block w-2 h-2 border border-white border-t-transparent rounded-full" />
                          : <span className="text-white" style={{ fontSize: 8 }}>✨</span>
                        }
                      </button>
                    </div>
                  )}

                  {/* Colour name input */}
                  <input
                    type="text"
                    placeholder="e.g. Navy Blue, Crimson Red…"
                    value={g.color}
                    onChange={e => setGroupColor(gi, e.target.value)}
                    style={{ ...inputStyle, flex: 1, fontSize: '12px', padding: '8px 10px', fontWeight: 600 }}
                  />

                  {/* Image index badge */}
                  {g.imageIndex !== null && images.length > 0 && (
                    <span
                      className="flex-shrink-0 text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(184,134,11,0.12)', border: '1px solid rgba(184,134,11,0.28)', color: '#b8860b', ...exo }}
                    >
                      Img {g.imageIndex + 1}
                    </span>
                  )}

                  {/* Remove colour */}
                  {colorGroups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColorGroup(gi)}
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#dc2626' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>

                {/* ── Card body: size rows ── */}
                <div className="px-3 py-2.5 flex flex-col gap-2">
                  {/* Size column labels */}
                  <div className="grid grid-cols-[1fr_80px_32px] gap-2 px-1">
                    {['Size', 'Stock', ''].map(h => (
                      <span key={h} className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: '#6aaca8', ...exo }}>{h}</span>
                    ))}
                  </div>

                  {g.sizes.map((s, si) => (
                    <div key={si} className="grid grid-cols-[1fr_80px_32px] gap-2 items-center">
                      {/* Size */}
                      <select
                        value={s.size}
                        onChange={e => setSizeField(gi, si, 'size', e.target.value)}
                        style={{
                          ...inputStyle, fontSize: '12px', padding: '8px 10px',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236aaca8'%3E%3Cpath d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '12px',
                          appearance: 'none', cursor: 'pointer'
                        }}
                      >
                        {SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                      </select>
                      {/* Stock */}
                      <input
                        type="number" min="0" step="1" placeholder="0"
                        value={s.stock}
                        onChange={e => setSizeField(gi, si, 'stock', Number(e.target.value))}
                        style={{ ...inputStyle, fontSize: '12px', padding: '8px 10px', textAlign: 'center' }}
                      />
                      {/* Remove size */}
                      <button
                        type="button"
                        onClick={() => removeSizeFromGroup(gi, si)}
                        disabled={g.sizes.length === 1}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110 disabled:opacity-25"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#dc2626' }}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}

                  {/* Add size row */}
                  <button
                    type="button"
                    onClick={() => addSizeToGroup(gi)}
                    className="mt-1 self-start flex items-center gap-1 text-[9px] font-black tracking-widest uppercase px-2.5 py-1.5 rounded-lg transition-all duration-150 hover:scale-105 active:scale-95"
                    style={{ background: 'rgba(42,138,133,0.08)', border: '1px solid rgba(42,138,133,0.20)', color: '#1e5c58', ...exo }}
                  >
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Add Size
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Colour Group */}
          <button
            onClick={addColorGroup}
            className="mt-3 flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-2 rounded-xl transition-all duration-150 hover:scale-105 active:scale-95"
            style={{ background: 'rgba(42,138,133,0.10)', border: '1px solid rgba(42,138,133,0.22)', color: '#1e5c58', ...exo }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Colour Variant
          </button>
          {saveErr && <p className="mt-3 text-xs text-red-500">{saveErr}</p>}
        </div>

        {/* footer */}
        <div className="flex gap-2 px-6 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.60)', background: 'rgba(255,255,255,0.30)' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[11px] font-black tracking-widest uppercase text-[#0d2b29] transition-all duration-150 hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#F5C518 0%,#d4a800 100%)', boxShadow: '0 4px 16px rgba(245,197,24,0.22)', ...saira }}
          >
            {saving ? 'Saving…' : 'Save Inventory'}
          </button>
          <button
            onClick={close}
            className="px-5 py-2.5 rounded-xl text-[11px] font-semibold tracking-widest uppercase transition-all duration-150 hover:opacity-90"
            style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.75)', color: '#3d7e7a', ...exo }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   PRODUCT DETAIL OVERLAY — Full-screen split view
══════════════════════════════════════════════ */
function ProductDetail({ product, fromRect, onClose }) {
  const overlayRef   = useRef(null)
  const imgRef       = useRef(null)
  const rightRef     = useRef(null)
  const backdropRef  = useRef(null)

  const symbol = currencySymbol[product.price?.currency] || ''
  const hero   = product.images?.[0]
  /* Seller name comes from populated product.seller.fullname */
  const sellerName = product.seller?.fullname
                   || product.seller?.email?.split('@')[0]
                   || 'Snitch Seller'

  /* ── GSAP Flip-style entrance ── */
  useLayoutEffect(() => {
    if (!imgRef.current || !fromRect) return

    const to   = imgRef.current.getBoundingClientRect()
    const scaleX = fromRect.width  / to.width
    const scaleY = fromRect.height / to.height
    const dx     = fromRect.left   - to.left
    const dy     = fromRect.top    - to.top

    // Backdrop fade in
    gsap.fromTo(backdropRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.35, ease: 'power2.out' }
    )

    // Image: fly from card position to full panel
    gsap.fromTo(imgRef.current,
      { x: dx, y: dy, scaleX, scaleY, borderRadius: '16px', transformOrigin: 'top left' },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: '0px', duration: 0.65, ease: 'power3.inOut', clearProps: 'all' }
    )

    // Right panel slides + fades in
    gsap.fromTo(rightRef.current,
      { x: 60, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.55, delay: 0.28, ease: 'power3.out' }
    )

    // Stagger the text blocks inside right panel
    const rows = rightRef.current?.querySelectorAll('.detail-row')
    if (rows?.length) {
      gsap.fromTo(rows,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.45, delay: 0.40, ease: 'power3.out' }
      )
    }
  }, [])

  /* ── Close animation ── */
  const handleClose = useCallback(() => {
    const tl = gsap.timeline({ onComplete: onClose })
    tl.to(rightRef.current, { x: 50, opacity: 0, duration: 0.30, ease: 'power2.in' })
      .to(backdropRef.current, { opacity: 0, duration: 0.25, ease: 'power2.in' }, '-=0.15')
  }, [onClose])

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] flex">
      {/* ── Backdrop ── */}
      <div ref={backdropRef} className="absolute inset-0" style={{ background: '#E3F1F0' }} />

      {/* ── LEFT — Hero Image (55%) ── */}
      <div className="relative w-[55%] flex-shrink-0 h-full overflow-hidden z-10">
        {hero?.uri ? (
          <img
            ref={imgRef}
            src={hero.uri}
            alt={hero.alt || product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            ref={imgRef}
            className="w-full h-full flex items-center justify-center"
            style={{ background: '#C8E4E2' }}
          >
            <ImagePlaceholder />
          </div>
        )}

        {/* Image overlay gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent 70%, #E3F1F0 100%)' }}
        />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-5 left-5 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-150 hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.75)', color: '#0d2b29' }}
        >
          <CloseIcon />
        </button>

        {/* Image counter */}
        {product.images?.length > 1 && (
          <div
            className="absolute bottom-5 left-5 px-3 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm"
            style={{ ...exo, background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#1e5c58' }}
          >
            1 / {product.images.length}
          </div>
        )}
      </div>

      {/* ── RIGHT — Product Info (45%) ── */}
      <div
        ref={rightRef}
        className="relative flex-1 h-full flex flex-col justify-center px-12 lg:px-16 z-10 overflow-hidden"
      >
        {/* Section label */}
        <div className="detail-row mb-8">
          <p
            className="text-[9px] font-bold tracking-[0.30em] uppercase mb-1"
            style={{ ...exo, color: '#b8860b' }}
          >
            SELLER STUDIO · PRODUCT DETAIL
          </p>
          <div className="w-8 h-px" style={{ background: '#b8860b' }} />
        </div>

        {/* Title */}
        <h1
          className="detail-row text-4xl lg:text-5xl font-black leading-tight mb-4"
          style={{ ...saira, color: '#0d2b29' }}
        >
          {product.title}
        </h1>

        {/* Seller name — real name from auth */}
        <p className="detail-row text-sm mb-6" style={{ ...shadows, color: '#1e5c58', fontSize: '1.1rem' }}>
          by {sellerName || 'Snitch Seller'}
        </p>

        {/* Description */}
        <p
          className="detail-row text-sm leading-relaxed mb-8 max-w-sm"
          style={{ ...exo, color: '#3d7e7a' }}
        >
          {product.description || 'No description provided.'}
        </p>

        {/* Divider */}
        <div className="detail-row h-px mb-8" style={{ background: 'rgba(42,138,133,0.15)' }} />

        {/* Price */}
        <div className="detail-row flex items-end gap-3 mb-8">
          <span
            className="text-5xl font-black leading-none"
            style={{ ...saira, color: '#0d2b29' }}
          >
            {symbol}{Number(product.price?.amount).toLocaleString()}
          </span>
          <span
            className="text-sm font-semibold pb-1 tracking-widest uppercase"
            style={{ ...exo, color: '#6aaca8' }}
          >
            {product.price?.currency}
          </span>
        </div>

        {/* Images strip */}
        {product.images?.length > 1 && (
          <div className="detail-row flex gap-2 mb-8">
            {product.images.slice(0, 5).map((img, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer transition-all duration-150 hover:scale-105"
                style={{ border: i === 0 ? '2px solid #b8860b' : '1px solid rgba(42,138,133,0.20)' }}
              >
                <img src={img.uri} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* LIVE badge */}
        <div className="detail-row flex items-center gap-3">
          <span
            className="px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase"
            style={{ ...exo, background: 'rgba(42,138,133,0.12)', color: '#1e5c58', border: '1px solid rgba(42,138,133,0.20)' }}
          >
            ● LIVE
          </span>
          <span className="text-[11px]" style={{ ...exo, color: '#6aaca8' }}>
            Visible on storefront
          </span>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   PRODUCT CARD
══════════════════════════════════════════════ */
function ProductCard({ product, index, onSelect, onDelete, onManageStock }) {
  const cardRef = useRef(null)
  const imgRef  = useRef(null)

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: index * 0.07, ease: 'power3.out' }
    )
  }, [index])

  const hero   = product.images?.[0]
  const symbol = currencySymbol[product.price?.currency] || ''
  const totalStock = product.inventory?.reduce((s, v) => s + (v.stock || 0), 0) ?? null
  const hasInventory = product.inventory?.length > 0
  const isOutOfStock = hasInventory && totalStock === 0
  const isLowStock   = hasInventory && totalStock > 0 && totalStock < 10

  const handleClick = useCallback(() => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    onSelect(product, rect)
  }, [product, onSelect])

  const handleDelete = useCallback((e) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) return
    const el = cardRef.current
    gsap.to(el, {
      scale: 0.88, opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => onDelete(product._id)
    })
  }, [product, onDelete])

  return (
    <div
      ref={cardRef}
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: 'rgba(255,255,255,0.42)',
        border: `1px solid ${isOutOfStock ? 'rgba(239,68,68,0.30)' : 'rgba(255,255,255,0.68)'}`,
        boxShadow: '0 2px 12px rgba(42,138,133,0.08)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={handleClick}
    >
      {/* ── Image ── */}
      <div className="relative aspect-[4/3] bg-[#d5ecea] overflow-hidden">
        {hero ? (
          <img
            ref={imgRef}
            src={hero.uri}
            alt={hero.alt || product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div ref={imgRef} className="w-full h-full flex items-center justify-center">
            <ImagePlaceholder />
          </div>
        )}

        {/* Stock badge */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase" style={{ ...exo, background: 'rgba(239,68,68,0.85)', color: '#fff' }}>
            OUT OF STOCK
          </div>
        )}
        {isLowStock && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase" style={{ ...exo, background: 'rgba(245,158,11,0.85)', color: '#fff' }}>
            ⚠ LOW STOCK
          </div>
        )}

        {/* Image count badge */}
        {product.images?.length > 1 && (
          <span
            className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-semibold backdrop-blur-sm"
            style={{ ...exo, background: 'rgba(255,255,255,0.50)', color: '#1e5c58' }}
          >
            +{product.images.length - 1}
          </span>
        )}

        {/* Hover overlay with "View" prompt */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'rgba(13,43,41,0.35)' }}>
          <span
            className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full"
            style={{ ...exo, background: 'rgba(255,255,255,0.60)', backdropFilter: 'blur(8px)', color: '#0d2b29' }}
          >
            View <ChevronRight />
          </span>
        </div>

        {/* gradient scrim */}
        <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.30), transparent)' }} />
      </div>

      {/* ── Details ── */}
      <div className="px-4 py-3 flex flex-col gap-1.5">
        <h3
          className="text-sm font-semibold truncate leading-tight"
          style={{ ...saira, color: '#0d2b29' }}
        >
          {product.title}
        </h3>
        <p className="text-[11px] line-clamp-1 leading-relaxed" style={{ ...exo, color: '#3d7e7a' }}>
          {product.description}
        </p>

        {/* Stock count */}
        {hasInventory && (
          <p className="text-[10px] font-semibold" style={{ ...exo, color: isOutOfStock ? '#dc2626' : '#6aaca8' }}>
            {isOutOfStock ? 'No stock' : `${totalStock} in stock`} · {product.inventory.length} variant{product.inventory.length !== 1 ? 's' : ''}
          </p>
        )}

        <div className="flex items-center justify-between mt-0.5">
          <span className="text-base font-bold" style={{ ...saira, color: '#b8860b' }}>
            {symbol}{Number(product.price?.amount).toLocaleString()}
            <span className="text-[10px] font-normal ml-1" style={{ ...exo, color: '#6aaca8' }}>
              {product.price?.currency}
            </span>
          </span>
          <span
            className="text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-full"
            style={isOutOfStock
              ? { ...exo, background: 'rgba(239,68,68,0.10)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.20)' }
              : { ...exo, background: 'rgba(42,138,133,0.12)', color: '#1e5c58', border: '1px solid rgba(42,138,133,0.20)' }
            }
          >
            {isOutOfStock ? 'HIDDEN' : 'LIVE'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 mt-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={e => { e.stopPropagation(); onManageStock(product) }}
            className="flex-1 py-1.5 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all duration-150 hover:scale-105 active:scale-95"
            style={{ ...exo, background: 'rgba(42,138,133,0.10)', border: '1px solid rgba(42,138,133,0.22)', color: '#1e5c58' }}
          >
            📦 Manage Stock
          </button>
          <button
            onClick={handleDelete}
            className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold tracking-widest uppercase transition-all duration-150 hover:scale-105 active:scale-95"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#dc2626' }}
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   PRODUCT ROW (List view)
══════════════════════════════════════════════ */
function ProductRow({ product, index, onSelect, onDelete, onManageStock }) {
  const rowRef  = useRef(null)
  const imgRef  = useRef(null)

  useEffect(() => {
    gsap.fromTo(rowRef.current,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, delay: index * 0.05, ease: 'power3.out' }
    )
  }, [index])

  const hero   = product.images?.[0]
  const symbol = currencySymbol[product.price?.currency] || ''
  const totalStock = product.inventory?.reduce((s, v) => s + (v.stock || 0), 0) ?? null
  const hasInventory = product.inventory?.length > 0
  const isOutOfStock = hasInventory && totalStock === 0
  const isLowStock   = hasInventory && totalStock > 0 && totalStock < 10

  const handleClick = useCallback(() => {
    if (!imgRef.current) return
    onSelect(product, imgRef.current.getBoundingClientRect())
  }, [product, onSelect])

  const handleDelete = useCallback((e) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) return
    gsap.to(rowRef.current, {
      x: 30, opacity: 0, height: 0, marginBottom: 0, padding: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => onDelete(product._id)
    })
  }, [product, onDelete])

  return (
    <div
      ref={rowRef}
      className="flex items-center gap-4 p-4 rounded-xl group"
      style={{ background: 'rgba(255,255,255,0.42)', border: `1px solid ${isOutOfStock ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.68)'}`, backdropFilter: 'blur(8px)' }}
    >
      {/* Thumbnail */}
      <div
        className="w-14 h-14 rounded-xl overflow-hidden bg-[#d5ecea] flex-shrink-0 relative cursor-pointer"
        onClick={handleClick}
      >
        {hero ? (
          <img ref={imgRef} src={hero.uri} alt={hero.alt || product.title} className="w-full h-full object-cover" />
        ) : (
          <div ref={imgRef} className="w-full h-full flex items-center justify-center"><ImagePlaceholder /></div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={handleClick}>
        <p className="text-sm font-semibold truncate" style={{ ...saira, color: '#0d2b29' }}>{product.title}</p>
        <p className="text-[11px] truncate mt-0.5" style={{ ...exo, color: '#3d7e7a' }}>{product.description}</p>
        {hasInventory && (
          <p className="text-[10px] mt-0.5" style={{ ...exo, color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#6aaca8' }}>
            {isOutOfStock ? '⛔ Out of stock' : isLowStock ? `⚠ ${totalStock} left` : `${totalStock} in stock`}
          </p>
        )}
      </div>

      <span className="hidden sm:block text-[10px] tabular-nums w-12 text-center flex-shrink-0" style={{ ...exo, color: '#6aaca8' }}>
        {product.images?.length || 0} img{product.images?.length !== 1 ? 's' : ''}
      </span>

      <span className="font-bold text-sm flex-shrink-0" style={{ ...saira, color: '#b8860b' }}>
        {symbol}{Number(product.price?.amount).toLocaleString()}
        <span className="text-[10px] font-normal ml-1" style={{ ...exo, color: '#6aaca8' }}>{product.price?.currency}</span>
      </span>

      <span
        className="hidden md:block text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full flex-shrink-0"
        style={{ ...exo, background: 'rgba(42,138,133,0.12)', color: '#1e5c58', border: '1px solid rgba(42,138,133,0.20)' }}
      >
        LIVE
      </span>
    </div>
  )
}

/* ══════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════ */
function EmptyState({ onAdd }) {
  const ref = useRef(null)
  useEffect(() => {
    gsap.fromTo(ref.current, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.4)' })
  }, [])

  return (
    <div ref={ref} className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: 'rgba(245,197,24,0.08)', border: '1px dashed rgba(245,197,24,0.25)' }}>
        <span style={{ color: '#b8860b' }}><BoxIcon /></span>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold mb-1" style={{ ...saira, color: '#0d2b29' }}>No products yet</p>
        <p className="text-xs max-w-xs" style={{ ...exo, color: '#3d7e7a' }}>
          Your catalog is empty. Add your first product to start selling on Snitch.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold tracking-widest uppercase text-[#0d2b29] hover:opacity-90 active:scale-[0.97] transition-all duration-150"
        style={{ ...saira, background: 'linear-gradient(135deg,#F5C518 0%,#d4a800 100%)', boxShadow: '0 4px 20px rgba(245,197,24,0.22)' }}
      >
        <PlusIcon /> Add First Product
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════ */
export default function SellerDashboard() {
  useFonts()

  const navigate = useNavigate()
  const user = useSelector(state => state.auth.user)
  const { handleGetSellerProduct, handleDeleteProduct, handleUpdateInventory, sellerProduct } = useProduct()

  /* Derived seller display name from register fullname */
  const sellerName = user?.fullname || user?.email?.split('@')[0] || 'Seller'

  const [view, setView]               = useState('grid')
  const [fetchLoading, setFetchLoading] = useState(true)
  const [fetchError, setFetchError]   = useState(null)
  const [selected, setSelected]       = useState(null)   // { product, fromRect }
  const [inventoryProduct, setInventoryProduct] = useState(null) // product being inventory-managed
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = (sellerProduct || []).filter(p => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    )
  })

  /* refs */
  const pageRef     = useRef(null)
  const headerRef   = useRef(null)
  const statsRef    = useRef(null)
  const toolbarRef  = useRef(null)
  const addBtnRef   = useRef(null)

  /* ── Fetch products ── */
  useEffect(() => {
    let alive = true
    setFetchLoading(true)
    // Run the autoseed script silently to ensure user Nil and the mock products exist!
    fetch('/api/products/seed-mock-products')
      .then(res => res.json())
      .then(data => {
        console.log("Seeding result:", data.message);
        return handleGetSellerProduct();
      })
      .catch(err => {
        console.warn("Seeding error:", err);
        return handleGetSellerProduct();
      })
      .catch(err => { if (alive) setFetchError(err.response?.data?.message || 'Failed to load products') })
      .finally(() => { if (alive) setFetchLoading(false) })
    return () => { alive = false }
  }, [])

  /* ── Auto-open variant manager if redirected from create product image match ── */
  useEffect(() => {
    if (!fetchLoading && sellerProduct?.length > 0) {
      const manageId = localStorage.getItem('manage_product_id')
      if (manageId) {
        const found = sellerProduct.find(p => p._id === manageId)
        if (found) {
          setInventoryProduct(found)
        }
        localStorage.removeItem('manage_product_id')
      }
    }
  }, [fetchLoading, sellerProduct])

  /* ── Entrance animations ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo(headerRef.current, { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
        .fromTo(statsRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, '-=0.2')
        .fromTo(toolbarRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, '-=0.2')
    }, pageRef)
    return () => ctx.revert()
  }, [])

  /* ── Add button hover ── */
  useEffect(() => {
    const btn = addBtnRef.current
    if (!btn) return
    const enter = () => gsap.to(btn, { scale: 1.05, duration: 0.2, ease: 'power2.out' })
    const leave = () => gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power2.out' })
    btn.addEventListener('mouseenter', enter)
    btn.addEventListener('mouseleave', leave)
    return () => { btn.removeEventListener('mouseenter', enter); btn.removeEventListener('mouseleave', leave) }
  }, [])

  /* ── Stats ── */
  const totalValue  = sellerProduct.reduce((s, p) => s + (Number(p.price?.amount) || 0), 0)
  const totalImages = sellerProduct.reduce((s, p) => s + (p.images?.length || 0), 0)
  const totalStock  = sellerProduct.reduce((s, p) => s + (p.inventory?.reduce((sv, v) => sv + (v.stock || 0), 0) || 0), 0)
  const outOfStock  = sellerProduct.filter(p => p.inventory?.length > 0 && p.inventory.every(v => v.stock === 0)).length

  const statsData = [
    { label: 'Listings', value: sellerProduct.length,            icon: <BoxIcon />,     suffix: '' },
    { label: 'Value',    value: `₹${totalValue.toLocaleString()}`, icon: <TrendUpIcon />, suffix: '' },
    { label: 'In Stock', value: totalStock,                      icon: null,            suffix: ' units' },
    { label: 'Hidden',   value: outOfStock,                      icon: null,            suffix: ' items' },
  ]

  /* ── Select product (triggers Flip overlay) ── */
  const handleSelect = useCallback((product, fromRect) => {
    setSelected({ product, fromRect })
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelected(null)
  }, [])

  /* ── Delete product ── */
  const handleDelete = useCallback(async (id) => {
    try { await handleDeleteProduct(id) } catch {}
  }, [handleDeleteProduct])

  /* ── Manage inventory ── */
  const handleManageStock = useCallback((product) => {
    setInventoryProduct(product)
  }, [])

  const handleSaveInventory = useCallback(async (id, inventory) => {
    await handleUpdateInventory(id, inventory)
    // Also refresh the inventoryProduct so the modal shows updated data
    setInventoryProduct(null)
  }, [handleUpdateInventory])

  return (
    <>
      {/* ══ Product Detail Overlay ══ */}
      {selected && (
        <ProductDetail
          product={selected.product}
          fromRect={selected.fromRect}
          onClose={handleCloseDetail}
        />
      )}

      {/* ══ Inventory Manager Modal ══ */}
      {inventoryProduct && (
        <InventoryManager
          product={inventoryProduct}
          onClose={() => setInventoryProduct(null)}
          onSave={handleSaveInventory}
        />
      )}

      {/* ══ Dashboard (h-screen, no page scroll) ══ */}
      <div
        ref={pageRef}
        className="h-screen w-screen flex flex-col overflow-hidden"
        style={{ background: '#E3F1F0' }}
      >
        {/* Teal grid texture */}
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
          <div className="max-w-7xl mx-auto px-6 lg:px-12 h-14 flex items-center justify-between">
            {/* Left — brand */}
            <div className="flex items-center gap-4">
              <span className="text-base font-black tracking-[0.35em] uppercase" style={{ ...saira, color: '#b8860b' }}>
                SNITCH
              </span>
              <span className="hidden sm:block" style={{ color: '#b0cccb' }}>·</span>
              <span className="hidden sm:block text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ ...exo, color: '#3d7e7a' }}>
                Seller Dashboard
              </span>
            </div>
            {/* Right — greeting + add button */}
            <div className="flex items-center gap-3">
              {sellerName && (
                <div
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)' }}
                >
                  <span className="text-[9px] tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>Hello,</span>
                  <span className="text-[11px] font-bold" style={{ ...saira, color: '#0d2b29' }}>{sellerName}</span>
                </div>
              )}
              <button
                onClick={() => navigate('/order-success')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase text-white transition-all duration-150"
                style={{ ...saira, background: 'linear-gradient(135deg,#0d2b29 0%,#1e5c58 100%)', boxShadow: '0 2px 12px rgba(13,43,41,0.25)' }}
              >
                <span>📦 Orders</span>
              </button>
              <button
                ref={addBtnRef}
                id="add-product-btn"
                onClick={() => navigate('/products/create')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase text-[#0d2b29] transition-all duration-150"
                style={{ ...saira, background: 'linear-gradient(135deg,#F5C518 0%,#d4a800 100%)', boxShadow: '0 2px 12px rgba(245,197,24,0.25)' }}
              >
                <PlusIcon />
                <span className="hidden sm:block">Add Product</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── MAIN BODY (flex-1, no scroll on wrapper) ── */}
        <div className="relative z-10 flex-1 min-h-0 flex flex-col max-w-7xl mx-auto w-full px-6 lg:px-12 py-6 gap-4">

          {/* ── STATS ROW ── */}
          <div ref={statsRef} className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statsData.map(({ label, value, icon, suffix }) => (
              <div
                key={label}
                className="rounded-2xl px-5 py-3.5 flex flex-col gap-1.5 backdrop-blur-md"
                style={{ background: 'rgba(255,255,255,0.42)', border: '1px solid rgba(255,255,255,0.68)', boxShadow: '0 1px 4px rgba(42,138,133,0.07)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ ...exo, color: '#3d7e7a' }}>{label}</span>
                  {icon && <span style={{ color: '#6aaca8' }}>{icon}</span>}
                </div>
                <span className="text-xl font-black tabular-nums" style={{ ...saira, color: '#0d2b29' }}>
                  {fetchLoading ? <span style={{ color: '#6aaca8' }}>—</span> : `${value}${suffix}`}
                </span>
              </div>
            ))}
          </div>

          {/* ── HEADING + TOOLBAR ── */}
          <div ref={toolbarRef} className="flex-shrink-0 flex items-center justify-between gap-4">
            <div>
              <p className="text-[9px] font-bold tracking-[0.28em] uppercase" style={{ ...exo, color: '#b8860b' }}>
                MY CATALOG
              </p>
              <h1 className="text-2xl font-black leading-tight" style={{ ...saira, color: '#0d2b29' }}>
                Your <span style={{ color: '#b8860b' }}>Products</span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              {!fetchLoading && sellerProduct.length > 0 && (
                <div className="relative flex items-center w-48 sm:w-60">
                  <span className="absolute left-3 text-neutral-400 text-[10px]">🔍</span>
                  <input
                    type="text"
                    placeholder="Search catalog..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-7 py-1.5 rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-400/20 transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.45)',
                      border: '1px solid rgba(255,255,255,0.70)',
                      color: '#0d2b29'
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Item count */}
              <span className="text-xs tabular-nums" style={{ ...exo, color: '#3d7e7a' }}>
                {fetchLoading ? '…' : `${filteredProducts.length} of ${sellerProduct.length}`}
              </span>

              {/* Refresh */}
              {!fetchLoading && sellerProduct.length > 0 && (
                <button
                  onClick={() => { setFetchLoading(true); handleGetSellerProduct().finally(() => setFetchLoading(false)) }}
                  className="transition-colors duration-150" title="Refresh"
                  style={{ color: '#6aaca8' }}
                >
                  <RefreshIcon />
                </button>
              )}

              {/* View toggle */}
              <div
                className="flex items-center gap-1 p-1 rounded-xl backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)' }}
              >
                {[{ key: 'grid', icon: <GridIcon /> }, { key: 'list', icon: <ListIcon /> }].map(({ key, icon }) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150"
                    style={view === key
                      ? { background: '#F5C518', color: '#0d2b29' }
                      : { color: '#6aaca8' }
                    }
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── ERROR ── */}
          {fetchError && (
            <div className="flex-shrink-0 px-4 py-3 rounded-xl text-xs" style={{ ...exo, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#dc2626' }}>
              {fetchError}
            </div>
          )}

          {/* ── CONTENT (only this area scrolls internally) ── */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {fetchLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div style={{ color: '#6aaca8' }}><SpinnerIcon /></div>
                <p className="text-xs tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>Loading catalog…</p>
              </div>
            ) : sellerProduct.length === 0 ? (
              <EmptyState onAdd={() => navigate('/products/create')} />
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {filteredProducts.map((p, i) => (
                  <ProductCard
                    key={p._id || i}
                    product={p}
                    index={i}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    onManageStock={handleManageStock}
                  />
                ))}
                {/* Add more slot */}
                <div
                  onClick={() => navigate('/products/create')}
                  className="rounded-2xl aspect-[4/3] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.25)', border: '1px dashed rgba(42,138,133,0.28)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110"
                    style={{ background: 'rgba(245,197,24,0.08)' }}
                  >
                    <span style={{ color: '#b8860b' }}><PlusIcon /></span>
                  </div>
                  <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ ...exo, color: '#6aaca8' }}>
                    Add Product
                  </span>
                </div>
              </div>
            ) : (
              /* List view */
              <div className="flex flex-col gap-2 pb-4">
                <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 mb-1">
                  {['Product', 'Images', 'Price', 'Status'].map(h => (
                    <span key={h} className="text-[10px] font-semibold tracking-widest uppercase" style={{ ...exo, color: '#3d7e7a' }}>{h}</span>
                  ))}
                </div>
                {filteredProducts.map((p, i) => (
                  <ProductRow
                    key={p._id || i}
                    product={p}
                    index={i}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    onManageStock={handleManageStock}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}

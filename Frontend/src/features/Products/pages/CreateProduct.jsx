import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useProduct } from '../hook/useProduct.js'
import { gsap } from 'gsap'
import { aiGenerateTitle, aiGenerateDescription, aiPredictPrice, aiDetectColor, aiPredictMetadata } from '../services/ai.api.js'

/* ══════════════════════════════════════════════════════════
   1. WAVE DOT FIELD
   Grid of dots that ripple as a travelling sine wave.
   Driven by gsap.ticker for smooth 60fps.
══════════════════════════════════════════════════════════ */
const COLS = 11
const ROWS = 16
const DOT_GAP_X = 36
const DOT_GAP_Y = 44
const ORIGIN_X = 18
const ORIGIN_Y = 18

const dotPositions = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => ({
    id: r * COLS + c,
    bx: ORIGIN_X + c * DOT_GAP_X,
    by: ORIGIN_Y + r * DOT_GAP_Y,
  }))
).flat()

const WaveDotField = () => {
  const groupRef = useRef(null)
  const tickerRef = useRef(null)

  useEffect(() => {
    const circles = groupRef.current?.querySelectorAll('circle')
    if (!circles) return
    let t = 0

    tickerRef.current = gsap.ticker.add(() => {
      t += 0.018
      circles.forEach((c, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const wave = Math.sin(t + col * 0.55 + row * 0.3)
        const wave2 = Math.cos(t * 0.7 + col * 0.3 - row * 0.4)
        const dy = wave * 5
        const scale = 0.5 + (wave + 1) * 0.35
        const op = 0.06 + (wave2 + 1) * 0.12
        c.setAttribute('cy', dotPositions[i].by + dy)
        c.setAttribute('r', scale)
        c.style.opacity = op
      })
    })

    return () => gsap.ticker.remove(tickerRef.current)
  }, [])

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${ORIGIN_X * 2 + (COLS - 1) * DOT_GAP_X} ${ORIGIN_Y * 2 + (ROWS - 1) * DOT_GAP_Y}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <g ref={groupRef}>
        {dotPositions.map(({ id, bx, by }) => (
          <circle key={id} cx={bx} cy={by} r={0.8} fill="#F5C518" opacity={0.1} />
        ))}
      </g>
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════
   2. FLOATING ORBS
   Large blurred circles drifting slowly — layered depth.
══════════════════════════════════════════════════════════ */
const ORB_CONFIG = [
  { cx: 80,  cy: 180, r: 140, op: 0.07, dur: 7,  dx: 30, dy: -40 },
  { cx: 320, cy: 120, r: 100, op: 0.05, dur: 9,  dx: -40, dy: 30 },
  { cx: 200, cy: 420, r: 180, op: 0.06, dur: 11, dx: 25, dy: 25 },
  { cx: 50,  cy: 580, r: 90,  op: 0.04, dur: 8,  dx: 50, dy: -20 },
  { cx: 370, cy: 500, r: 120, op: 0.05, dur: 13, dx: -30, dy: -35 },
  { cx: 150, cy: 680, r: 80,  op: 0.04, dur: 6,  dx: 40, dy: 20 },
  { cx: 290, cy: 300, r: 60,  op: 0.08, dur: 10, dx: -20, dy: 40 },
]

const FloatingOrbs = () => {
  const refs = ORB_CONFIG.map(() => useRef(null))

  useEffect(() => {
    const ctx = gsap.context(() => {
      refs.forEach((ref, i) => {
        const cfg = ORB_CONFIG[i]
        gsap.to(ref.current, {
          x: cfg.dx, y: cfg.dy,
          duration: cfg.dur,
          repeat: -1, yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.9,
        })
        // Pulse opacity
        gsap.to(ref.current, {
          opacity: cfg.op * 1.8,
          duration: cfg.dur * 0.6,
          repeat: -1, yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.5,
        })
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 700"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="orb-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>
      {ORB_CONFIG.map((cfg, i) => (
        <circle
          key={i}
          ref={refs[i]}
          cx={cfg.cx} cy={cfg.cy} r={cfg.r}
          fill="#F5C518"
          opacity={cfg.op}
          filter="url(#orb-blur)"
        />
      ))}
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════
   3. FLOWING RIBBONS
   Bezier curves whose control points animate — like fabric.
══════════════════════════════════════════════════════════ */
const FlowingRibbons = () => {
  const pathRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  // Helper: build cubic bezier path string
  const makePath = (x1, y1, cx1, cy1, cx2, cy2, x2, y2) =>
    `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Ribbon 1 — gentle horizontal sweep
      const r1 = { cy1: 180, cy2: 220 }
      gsap.to(r1, {
        cy1: 240, cy2: 160,
        duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut',
        onUpdate() {
          pathRefs[0].current?.setAttribute(
            'd', makePath(0, 200, 130, r1.cy1, 270, r1.cy2, 400, 200)
          )
        }
      })

      // Ribbon 2 — slower, lower
      const r2 = { cy1: 350, cy2: 390 }
      gsap.to(r2, {
        cy1: 420, cy2: 330,
        duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.5,
        onUpdate() {
          pathRefs[1].current?.setAttribute(
            'd', makePath(0, 380, 120, r2.cy1, 280, r2.cy2, 400, 360)
          )
        }
      })

      // Ribbon 3 — faster, top area
      const r3 = { cy1: 80, cy2: 120 }
      gsap.to(r3, {
        cy1: 140, cy2: 60,
        duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.8,
        onUpdate() {
          pathRefs[2].current?.setAttribute(
            'd', makePath(0, 100, 140, r3.cy1, 260, r3.cy2, 400, 90)
          )
        }
      })

      // Ribbon 4 — bottom, wide sweep
      const r4 = { cy1: 560, cy2: 620 }
      gsap.to(r4, {
        cy1: 640, cy2: 540,
        duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 3,
        onUpdate() {
          pathRefs[3].current?.setAttribute(
            'd', makePath(0, 590, 100, r4.cy1, 300, r4.cy2, 400, 570)
          )
        }
      })

      // Draw each ribbon in on mount
      pathRefs.forEach((ref, i) => {
        const len = ref.current?.getTotalLength?.() || 400
        gsap.set(ref.current, { strokeDasharray: len, strokeDashoffset: len })
        gsap.to(ref.current, {
          strokeDashoffset: 0, duration: 1.8,
          delay: 0.4 + i * 0.25, ease: 'power2.out'
        })
      })
    })
    return () => ctx.revert()
  }, [])

  const ribbonStyle = (op, w = 0.8) => ({
    stroke: '#F5C518', strokeWidth: w, fill: 'none', strokeOpacity: op
  })

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 700"
      preserveAspectRatio="xMidYMid slice"
    >
      <path ref={pathRefs[0]} d={makePath(0, 200, 130, 180, 270, 220, 400, 200)} {...ribbonStyle(0.18)} />
      <path ref={pathRefs[1]} d={makePath(0, 380, 120, 350, 280, 390, 400, 360)} {...ribbonStyle(0.12)} />
      <path ref={pathRefs[2]} d={makePath(0, 100, 140,  80, 260, 120, 400,  90)} {...ribbonStyle(0.14)} />
      <path ref={pathRefs[3]} d={makePath(0, 590, 100, 560, 300, 620, 400, 570)} {...ribbonStyle(0.10)} />
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════
   4. ORBIT RING
   Concentric dashed rings + dots orbiting at diff. speeds.
══════════════════════════════════════════════════════════ */
const OrbitRing = () => {
  const dot1Ref = useRef(null)
  const dot2Ref = useRef(null)
  const dot3Ref = useRef(null)
  const ring1Ref = useRef(null)
  const ring2Ref = useRef(null)
  const CX = 200, CY = 350

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Draw rings in
      ;[ring1Ref, ring2Ref].forEach((r, i) => {
        const len = r.current?.getTotalLength?.() || 600
        gsap.set(r.current, { strokeDasharray: len, strokeDashoffset: len })
        gsap.to(r.current, { strokeDashoffset: 0, duration: 2, delay: 0.6 + i * 0.4, ease: 'power2.out' })
      })

      // Orbiting dots — move around circles using onUpdate
      const orbiters = [
        { ref: dot1Ref, r: 100, speed: 9,  start: 0 },
        { ref: dot2Ref, r: 155, speed: 14, start: Math.PI },
        { ref: dot3Ref, r: 155, speed: 14, start: Math.PI * 0.5 },
      ]

      orbiters.forEach(({ ref, r, speed, start }) => {
        const proxy = { angle: start }
        gsap.to(proxy, {
          angle: start + Math.PI * 2,
          duration: speed,
          repeat: -1,
          ease: 'none',
          onUpdate() {
            const x = CX + r * Math.cos(proxy.angle)
            const y = CY + r * Math.sin(proxy.angle)
            ref.current?.setAttribute('cx', x)
            ref.current?.setAttribute('cy', y)
          }
        })
      })

      // Subtle ring rotation
      gsap.to(ring1Ref.current, { rotation: 360, svgOrigin: `${CX} ${CY}`, duration: 40, repeat: -1, ease: 'none' })
      gsap.to(ring2Ref.current, { rotation: -360, svgOrigin: `${CX} ${CY}`, duration: 60, repeat: -1, ease: 'none' })
    })
    return () => ctx.revert()
  }, [])

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 700"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Inner ring */}
      <circle ref={ring1Ref} cx={CX} cy={CY} r={100}
        fill="none" stroke="#F5C518" strokeWidth="0.6" strokeOpacity="0.12"
        strokeDasharray="6 10" />
      {/* Outer ring */}
      <circle ref={ring2Ref} cx={CX} cy={CY} r={155}
        fill="none" stroke="#F5C518" strokeWidth="0.4" strokeOpacity="0.08"
        strokeDasharray="3 14" />
      {/* Orbiting dots */}
      <circle ref={dot1Ref} cx={CX + 100} cy={CY} r={2.5} fill="#F5C518" opacity={0.6} />
      <circle ref={dot2Ref} cx={CX - 155} cy={CY} r={1.8} fill="#F5C518" opacity={0.4} />
      <circle ref={dot3Ref} cx={CX}       cy={CY - 155} r={1.8} fill="#F5C518" opacity={0.4} />
      {/* Corner brackets — draw on mount via CSS animation trick */}
      <path d="M20 70 L20 20 L70 20" stroke="#F5C518" strokeWidth="1" strokeOpacity="0.3" strokeLinecap="round" />
      <path d="M380 630 L380 680 L330 680" stroke="#F5C518" strokeWidth="1" strokeOpacity="0.3" strokeLinecap="round" />
      <polyline points="350,30 380,30 380,60" stroke="#F5C518" strokeWidth="0.8" strokeOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="50,670 20,670 20,640" stroke="#F5C518" strokeWidth="0.8" strokeOpacity="0.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════
   5. SCAN LINE
   Amber horizontal line sweeping from top to bottom on loop.
══════════════════════════════════════════════════════════ */
const ScanLine = () => {
  const lineRef = useRef(null)
  const glowRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, delay: 1.5 })
      tl.fromTo(
        [lineRef.current, glowRef.current],
        { attr: { y1: -10, y2: -10 }, opacity: 0 },
        { attr: { y1: 720, y2: 720 }, opacity: 1, duration: 4.5, ease: 'none' }
      ).to(
        [lineRef.current, glowRef.current],
        { opacity: 0, duration: 0.3, ease: 'power2.in' },
        '-=0.3'
      ).set([lineRef.current, glowRef.current], { attr: { y1: -10, y2: -10 } })
      tl.timeScale(1)
    })
    return () => ctx.revert()
  }, [])

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 700"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="scan-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F5C518" stopOpacity="0" />
          <stop offset="20%" stopColor="#F5C518" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#F5C518" stopOpacity="0.9" />
          <stop offset="80%" stopColor="#F5C518" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F5C518" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="scan-glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F5C518" stopOpacity="0" />
          <stop offset="50%" stopColor="#F5C518" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#F5C518" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Glow band — 30px tall */}
      <line ref={glowRef} x1="0" y1="-25" x2="400" y2="-25"
        stroke="url(#scan-glow)" strokeWidth="30" opacity={0} />
      {/* Sharp line */}
      <line ref={lineRef} x1="0" y1="-10" x2="400" y2="-10"
        stroke="url(#scan-fade)" strokeWidth="0.8" opacity={0} />
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════
   UPLOAD AREA SVG BORDER (Animated dashed rect draw-in)
══════════════════════════════════════════════════════════ */
const AnimatedBorder = ({ active }) => {
  const rectRef = useRef(null)

  useEffect(() => {
    const el = rectRef.current
    if (!el) return
    const len = el.getTotalLength()
    gsap.set(el, { strokeDasharray: len, strokeDashoffset: len })
    gsap.to(el, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out', delay: 0.5 })
  }, [])

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 220" preserveAspectRatio="none">
      <rect
        ref={rectRef}
        x="2" y="2" width="296" height="216" rx="16"
        fill="none"
        stroke={active ? '#F5C518' : '#333'}
        strokeWidth="1.5"
        strokeDasharray="8 6"
        style={{ transition: 'stroke 0.3s' }}
      />
    </svg>
  )
}


/* ══════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════ */
const XIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
)
const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)
const UploadIcon = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)
const TagIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
)
const TextIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
  </svg>
)
const CoinsIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const ImagesIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 20m-6-6l-4-4m0 0L4 4m4 4H4" />
    <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const currencySymbol = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' }
const saira    = { fontFamily: "'Saira', sans-serif" }
const exo      = { fontFamily: "'Exo', sans-serif" }

const blobToBase64 = (blobUrl) => {
  return new Promise((resolve, reject) => {
    fetch(blobUrl)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
};

const inputCls =
  'w-full rounded-xl px-4 py-2.5 text-sm backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-amber-400/20 transition-all duration-200'

const inputStyle = {
  background: 'rgba(255,255,255,0.55)',
  border: '1px solid rgba(255,255,255,0.75)',
  color: '#0d2b29',
}

/* ══════════════════════════════════════════════
   LABEL
══════════════════════════════════════════════ */
const Label = ({ icon, children }) => (
  <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase mb-1.5" style={{ color: '#3d7e7a' }}>
    <span>{icon}</span>{children}
  </div>
)

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
const SIZES      = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size']
const CATEGORIES = [
  'Men', 'Women', 'Unisex', 'Kids', 'Accessories', 'Footwear', 'Bottoms', 'Outerwear',
  'Trousers & Pants', 'Kurtas & Shirts', 'Jeans', 'Sari', 'Kurti & Legins', 'Lady Shirt', 'Lady pants'
]
const BLANK_SIZE  = () => ({ size: 'M', stock: 0 })
const BLANK_GROUP = () => ({ color: '', hex: '#000000', imageIndex: null, sizes: [BLANK_SIZE()] })

export default function CreateProduct() {
  const { handleCreateProduct } = useProduct()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '', description: '', priceAmount: '', priceCurrency: 'INR',
    discountPrice: '', category: '', brand: 'Snitch', published: true
  })
  const [tags, setTags]       = useState([])   // array of tag strings
  const [tagInput, setTagInput] = useState('')  // current tag being typed
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [activeThumb, setActiveThumb] = useState(0)
  // Inventory — grouped by color
  const [colorGroups, setColorGroups] = useState([BLANK_GROUP()])
  // AI state
  const [aiTitleLoad,  setAiTitleLoad]  = useState(false)
  const [aiDescLoad,   setAiDescLoad]   = useState(false)
  const [aiPriceLoad,  setAiPriceLoad]  = useState(false)
  const [aiMetaLoad,   setAiMetaLoad]   = useState(false)
  const [pricePred,    setPricePred]    = useState(null)  // { min, max, suggested, confidence }
  const [aiColorLoad,  setAiColorLoad]  = useState({})   // { [idx]: true } per-row detecting
  const [aiAllColorLoad, setAiAllColorLoad] = useState(false)


  /* refs */
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const headerRef = useRef(null)
  const submitBtnRef = useRef(null)
  const formFieldsRef = useRef(null)
  const heroPreviewRef = useRef(null)

  /* ── Entrance GSAP ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
        .fromTo(leftRef.current, { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7 }, '-=0.2')
        .fromTo(rightRef.current, { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7 }, '<')
        .fromTo('.form-row', { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.45 }, '-=0.35')
    })
    return () => ctx.revert()
  }, [])

  /* ── Submit button hover ── */
  useEffect(() => {
    const btn = submitBtnRef.current
    if (!btn) return
    const enter = () => gsap.to(btn, { scale: 1.02, boxShadow: '0 8px 36px rgba(245,197,24,0.38)', duration: 0.22, ease: 'power2.out' })
    const leave = () => gsap.to(btn, { scale: 1, boxShadow: '0 4px 20px rgba(245,197,24,0.22)', duration: 0.22, ease: 'power2.out' })
    btn.addEventListener('mouseenter', enter)
    btn.addEventListener('mouseleave', leave)
    return () => { btn.removeEventListener('mouseenter', enter); btn.removeEventListener('mouseleave', leave) }
  }, [])

  /* ── Cleanup blob URLs ── */
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews])

  const [matchedProduct, setMatchedProduct] = useState(null)

  const checkExistingProduct = async (fileName) => {
    try {
      const clean = fileName
        .replace(/\.[^/.]+$/, "") // strip extension
        .replace(/[-_]/g, " ")    // replace separators with space
        .replace(/\d+/g, "")      // strip numbers (like SN1001 -> SN) to match tags or name
        .trim();
      
      if (clean.length < 3) return;

      const res = await fetch(`/api/products/seller?search=${encodeURIComponent(clean)}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setMatchedProduct(data.products[0]);
        } else {
          setMatchedProduct(null);
        }
      }
    } catch (e) {
      console.warn("Failed to check matching product:", e);
    }
  };

  /* ── Add images ── */
  const addImages = useCallback((files) => {
    const incoming = Array.from(files)
    if (incoming.length > 0) {
      const fileName = incoming[0].name
      checkExistingProduct(fileName)

      // Auto-fill Title and Description from filename using Mistral
      if (!form.title) {
        const cleanedName = fileName
          .replace(/\.[^/.]+$/, "") // strip extension
          .replace(/[-_]/g, " ")    // replace separators with space
          .replace(/\d+/g, "")      // strip numbers
          .trim();
        
        const initialTitle = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
        setForm(p => ({
          ...p,
          title: initialTitle
        }));
        
        // Trigger Mistral in the background to write a description
        setAiDescLoad(true);
        aiGenerateDescription({ model: 'mistral', title: initialTitle })
          .then(data => {
            if (data?.description) {
              setForm(p => ({ ...p, description: data.description }));
            }
          })
          .catch(e => console.warn(e))
          .finally(() => setAiDescLoad(false));
      }
    }
    setImages(prev => {
      const combined = [...prev, ...incoming].slice(0, 8)
      setPreviews(combined.map(f => URL.createObjectURL(f)))
      setActiveThumb(combined.length - 1)
      return combined
    })
    // stagger-in animation on thumbnails
    requestAnimationFrame(() => {
      gsap.fromTo('.thumb-pill', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.05, duration: 0.35, ease: 'back.out(1.5)' })
    })
    // hero preview zoom-in
    if (heroPreviewRef.current) {
      gsap.fromTo(heroPreviewRef.current, { scale: 1.06, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power2.out' })
    }
  }, [form.title])


  const removeImage = (idx) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== idx)
      setPreviews(next.map(f => URL.createObjectURL(f)))
      setActiveThumb(Math.min(activeThumb, next.length - 1))
      if (next.length === 0) setMatchedProduct(null)
      else checkExistingProduct(next[0].name)
      return next
    })
  }

  const switchThumb = (idx) => {
    if (idx === activeThumb) return
    gsap.to(heroPreviewRef.current, {
      scale: 1.04, opacity: 0.4, duration: 0.15, ease: 'power2.in',
      onComplete: () => {
        setActiveThumb(idx)
        gsap.to(heroPreviewRef.current, { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' })
      }
    })
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files.length) addImages(e.dataTransfer.files)
  }

  /* ── Color Group helpers ── */
  const addColorGroup    = () => setColorGroups(prev => [...prev, BLANK_GROUP()])
  const removeColorGroup = (gi) => setColorGroups(prev => prev.filter((_, i) => i !== gi))
  const setGroupColor    = (gi, color) => setColorGroups(prev => prev.map((g, i) => i === gi ? { ...g, color } : g))
  const setGroupHex      = (gi, hex)   => setColorGroups(prev => prev.map((g, i) => i === gi ? { ...g, hex }   : g))

  const toggleGroupImageIndex = (gi, imgIdx) => {
    setColorGroups(prev => prev.map((g, i) => {
      if (i !== gi) return g
      const currentIndices = g.imageIndexes || (g.imageIndex !== null ? [g.imageIndex] : [])
      const nextIndices = currentIndices.includes(imgIdx)
        ? currentIndices.filter(idx => idx !== imgIdx)
        : [...currentIndices, imgIdx]
      return { 
        ...g, 
        imageIndexes: nextIndices, 
        imageIndex: nextIndices[0] ?? null 
      }
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

  /* Flatten groups → inventory array for backend */
  const flattenGroups = (groups) =>
    groups
      .filter(g => g.color.trim())
      .flatMap(g => g.sizes.map(s => ({
        color: g.color,
        hex: g.hex || null,
        size: s.size,
        stock: s.stock,
        imageIndex: g.imageIndexes && g.imageIndexes.length > 0 ? g.imageIndexes[0] : null,
        imageIndexes: g.imageIndexes || []
      })))

  /* AI detect color for a single group */
  const detectGroupColor = async (gi) => {
    const g      = colorGroups[gi]
    const currentIndices = g.imageIndexes || (g.imageIndex !== null ? [g.imageIndex] : [])
    const imgIdx = currentIndices[0] ?? 0
    const blobUrl = previews[imgIdx]
    if (!blobUrl) return
    setAiColorLoad(prev => ({ ...prev, [gi]: true }))
    try {
      const dataUri   = await blobToBase64(blobUrl)
      const { color } = await aiDetectColor(dataUri)
      if (color) setGroupColor(gi, color)
    } catch (e) { setError(e.message) }
    setAiColorLoad(prev => ({ ...prev, [gi]: false }))
  }

  /* AI detect colors for ALL uploaded images → auto-build one group per image */
  const detectAllGroupColors = async () => {
    if (!previews.length) return
    setAiAllColorLoad(true)
    try {
      const results = await Promise.all(
        previews.map(async (blobUrl, i) => {
          try {
            const dataUri   = await blobToBase64(blobUrl)
            const { color } = await aiDetectColor(dataUri)
            return { color: color || `Color ${i + 1}`, imageIndex: i }
          } catch {
            return { color: `Color ${i + 1}`, imageIndex: i }
          }
        })
      )
      setColorGroups(prev => {
        return results.map(r => {
          const existing = prev.find(g => g.imageIndex === r.imageIndex || (g.imageIndexes && g.imageIndexes.includes(r.imageIndex)))
          return existing
            ? { ...existing, color: r.color, imageIndex: r.imageIndex, imageIndexes: [r.imageIndex] }
            : { color: r.color, imageIndex: r.imageIndex, imageIndexes: [r.imageIndex], sizes: [BLANK_SIZE()] }
        })
      })
    } catch (e) { setError(e.message) }
    setAiAllColorLoad(false)
  }


  /* ── Tag helpers ── */
  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const t = tagInput.trim().toLowerCase()
      if (t && !tags.includes(t)) setTags(prev => [...prev, t])
      setTagInput('')
    }
  }
  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t))

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (images.length === 0) { setError('Upload at least one product image.'); return }
    const validInv = flattenGroups(colorGroups)
    setError(null)
    const formData = new FormData()
    formData.append('title', form.title)
    formData.append('description', form.description)
    formData.append('priceAmount', form.priceAmount)
    formData.append('priceCurrency', form.priceCurrency)
    if (form.discountPrice) formData.append('discountPrice', form.discountPrice)
    if (form.category)      formData.append('category', form.category)
    if (form.brand)         formData.append('brand', form.brand)
    formData.append('tags', JSON.stringify(tags))
    formData.append('published', String(form.published))
    formData.append('inventory', JSON.stringify(validInv))
    images.forEach(img => formData.append('images', img))

    try {
      setLoading(true)
      gsap.to(submitBtnRef.current, { opacity: 0.65, duration: 0.12 })
      await handleCreateProduct(formData)
      gsap.to(submitBtnRef.current, { opacity: 1, duration: 0.12 })
      navigate('/seller/dashboard')
    } catch (err) {
      setLoading(false)
      gsap.to(submitBtnRef.current, { opacity: 1, duration: 0.12 })
      const msg = err.response?.data?.errors
        ? err.response.data.errors.map(e => `${e.path || 'Field'}: ${e.msg}`).join('\n')
        : err.response?.data?.message || err.message || 'Something went wrong'
      setError(msg)
      gsap.fromTo(rightRef.current, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
    }
  }

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  /* ── AI helpers ── */
  const handleAITitle = async () => {
    setAiTitleLoad(true)
    try {
      const { title } = await aiGenerateTitle({ model: 'mistral', hint: form.description })
      if (title) {
        setForm(p => ({ ...p, title }));
      }
    } catch (e) { setError(e.message) }
    finally { setAiTitleLoad(false) }
  }

  const handleAIDesc = async () => {
    setAiDescLoad(true)
    try {
      const { description } = await aiGenerateDescription({ model: 'mistral', title: form.title })
      if (description) {
        setForm(p => ({ ...p, description }));
      }
    } catch (e) { setError(e.message) }
    finally { setAiDescLoad(false) }
  }

  const handleAIPrice = async (overrideTitle, overrideDesc) => {
    const t = overrideTitle || form.title;
    const d = overrideDesc || form.description;
    if (!t) return;
    setAiPriceLoad(true)
    setPricePred(null)
    try {
      const pred = await aiPredictPrice({ model: 'gemini', title: t, description: d, currency: form.priceCurrency })
      setPricePred(pred)
      setForm(p => ({ ...p, priceAmount: String(pred.suggested) }))
    } catch (e) { setError(e.message) }
    finally { setAiPriceLoad(false) }
  }

  const handleAIPredictMetadata = async (overrideTitle, overrideDesc) => {
    const t = overrideTitle || form.title;
    const d = overrideDesc || form.description;
    if (!t || !d) return;
    setAiMetaLoad(true);
    try {
      const data = await aiPredictMetadata({ title: t, description: d });
      if (data) {
        setForm(p => ({
          ...p,
          category: data.category || p.category,
          brand: data.brand || p.brand
        }));
        if (data.tags && data.tags.length > 0) {
          setTags(data.tags);
        }
      }
    } catch (e) {
      console.warn("Failed to auto predict metadata via Cohere:", e);
    } finally {
      setAiMetaLoad(false);
    }
  };

  /* ── Automated background predictions (Debounced) ── */
  useEffect(() => {
    const t = form.title.trim();
    const d = form.description.trim();
    if (t.length > 3 && d.length > 8) {
      const handler = setTimeout(() => {
        // Trigger Gemini price prediction and Cohere metadata prediction in background
        handleAIPrice(t, d);
        handleAIPredictMetadata(t, d);
      }, 1000); // 1s debounce to avoid spamming rate limits

      return () => clearTimeout(handler);
    }
  }, [form.title, form.description]);


  /* ─────────────── RENDER ─────────────── */
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: '#E3F1F0' }}>

      {/* ── HEADER ── */}
      <header
        ref={headerRef}
        className="flex-shrink-0 h-13 border-b border-white/50 backdrop-blur-md flex items-center px-6 lg:px-10 justify-between z-50"
        style={{ background: 'rgba(227,241,240,0.85)' }}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-black tracking-[0.35em] uppercase" style={{ color: '#F5C518' }}>SNITCH</span>
          <span className="hidden sm:flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: '#3d7e7a' }}>
            <span className="w-px h-3" style={{ background: '#b0cccb' }} />
            New Listing
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-[10px] font-semibold tracking-widest uppercase transition-colors duration-150" style={{ color: '#3d7e7a' }}
        >
          ← Back
        </button>
      </header>

      {/* ── BODY — two panels ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ══════════ LEFT — Image Panel ══════════ */}
        <div
          ref={leftRef}
          className="relative hidden lg:flex flex-col w-[44%] flex-shrink-0 border-r border-[#b0cccb]/50 overflow-hidden"
          style={{ background: '#E3F1F0' }}
        >
          {/* ── 5-layer SVG animation system ── */}
          {/* Layer 1: Floating blurred orbs (deepest depth) */}
          <FloatingOrbs />
          {/* Layer 2: Rippling dot grid */}
          <WaveDotField />
          {/* Layer 3: Morphing bezier ribbons */}
          <FlowingRibbons />
          {/* Layer 4: Orbiting rings + corner brackets */}
          <OrbitRing />
          {/* Layer 5: Amber scan line sweeping top→bottom */}
          <ScanLine />

          {/* Ambient glow — warmer tint over light bg */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(245,197,24,0.08) 0%, transparent 65%)' }}
          />

          <div className="relative flex flex-col h-full p-6 gap-4 z-10">

            {/* Section header */}
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-neutral-500">
                <ImagesIcon />
                Product Images
              </div>
              <span
                className="text-[11px] font-bold tabular-nums transition-colors duration-300"
                style={{ color: images.length > 0 ? '#d4a800' : '#9ca3af' }}
              >
                {images.length} / 7
              </span>
            </div>

            {/* Hero preview */}
            <div
              className="relative flex-1 min-h-0 rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.5)' }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              {/* Animated SVG border */}
              <AnimatedBorder active={dragOver} />

              {previews[activeThumb] ? (
                <div className="relative w-full h-full group">
                  <img
                    ref={heroPreviewRef}
                    src={previews[activeThumb]}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                  {/* dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                    <label className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white"><UploadIcon /></span>
                      </div>
                      <span className="text-[10px] font-bold tracking-widest uppercase text-white/80">Replace</span>
                      <input
                        type="file" accept="image/*" className="hidden"
                        onChange={e => {
                          if (!e.target.files[0]) return
                          const next = [...images]
                          next[activeThumb] = e.target.files[0]
                          setImages(next)
                          setPreviews(next.map(f => URL.createObjectURL(f)))
                        }}
                      />
                    </label>
                  </div>
                  {/* remove button */}
                  <button
                    type="button"
                    onClick={() => removeImage(activeThumb)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500/80 transition-all duration-150 opacity-0 group-hover:opacity-100"
                  >
                    <XIcon />
                  </button>
                  {/* image index */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-semibold text-neutral-400">
                    {activeThumb + 1} / {images.length}
                  </div>
                </div>
              ) : (
                /* Empty drop zone */
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer gap-5 select-none">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                    style={{
                      background: dragOver ? 'rgba(245,197,24,0.1)' : 'rgba(245,197,24,0.04)',
                      border: `1px solid ${dragOver ? 'rgba(245,197,24,0.4)' : 'rgba(245,197,24,0.1)'}`,
                    }}
                  >
                    <span style={{ color: dragOver ? '#F5C518' : '#525252' }}><UploadIcon /></span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-neutral-600">
                      {dragOver ? 'Release to upload' : 'Drop images here'}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1">or click to browse · up to 8 · max 5 MB each</p>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files.length && addImages(e.target.files)} />
                </label>
              )}
            </div>

            {/* Thumbnail filmstrip */}
            <div className="flex-shrink-0 flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {/* existing thumbnails */}
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => switchThumb(i)}
                  className={`thumb-pill relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden transition-all duration-200 ${
                    i === activeThumb
                      ? 'ring-2 ring-offset-1 ring-offset-[#E3F1F0]'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                  style={i === activeThumb ? { ringColor: '#F5C518' } : {}}
                >
                  <img src={previews[i]} alt={`img ${i + 1}`} className="w-full h-full object-cover" />
                  {i === activeThumb && (
                    <div className="absolute inset-0 ring-2 ring-amber-400 ring-inset rounded-xl pointer-events-none" />
                  )}
                </button>
              ))}
              {/* Add more slot (if < 8) */}
              {images.length < 8 && (
                <label className="thumb-pill flex-shrink-0 w-14 h-14 rounded-xl border border-dashed border-[#b0cccb] hover:border-[#8ab4b3] flex items-center justify-center text-neutral-400 hover:text-neutral-600 cursor-pointer transition-all duration-150">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && addImages(e.target.files)} />
                </label>
              )}
            </div>

            {/* Caption */}
            <p className="flex-shrink-0 text-[10px] text-neutral-500 tracking-wide text-center">
              First selected image becomes the product hero card
            </p>

            {/* Similarity match warning/suggestion banner */}
            {matchedProduct && (
              <div
                className="flex-shrink-0 p-3 rounded-2xl flex flex-col gap-2.5 transition-all duration-300"
                style={{
                  background: 'rgba(184,134,11,0.08)',
                  border: '1.5px solid rgba(184,134,11,0.22)',
                  color: '#b8860b'
                }}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider">💡 Existing Product Detected</p>
                  <p className="text-[11px] font-semibold mt-0.5" style={{ ...saira }}>
                    "{matchedProduct.title}" matches your uploaded filename.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('manage_product_id', matchedProduct._id);
                    navigate('/seller/dashboard');
                  }}
                  className="self-start px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase text-white transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg,#b8860b 0%,#daa520 100%)',
                    boxShadow: '0 4px 14px rgba(184,134,11,0.22)'
                  }}
                >
                  Manage variants for this item
                </button>
              </div>
            )}

          </div>
        </div>

        {/* ══════════ RIGHT — Form Panel ══════════ */}
        <div
          ref={rightRef}
          className="flex-1 overflow-y-auto"
          style={{ background: '#E3F1F0' }}
        >
          <div className="max-w-lg mx-auto px-6 lg:px-10 py-8 flex flex-col h-full">

            {/* Page title */}
            <div className="form-row mb-4 flex-shrink-0">
              <p className="text-[10px] font-bold tracking-[0.28em] uppercase mb-1" style={{ color: '#F5C518' }}>
                SELLER STUDIO · NEW LISTING
              </p>
              <h1 className="text-2xl font-light tracking-tight" style={{ color: '#0d2b29' }}>
                Add a <span className="font-semibold" style={{ color: '#b8860b' }}>Product</span>
              </h1>
            </div>



            {/* Error */}
            {error && (
              <div className="form-row mb-4 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 whitespace-pre-line flex-shrink-0">
                {error}
              </div>
            )}

            {/* Mobile image upload (shown only on mobile) */}
            <div className="form-row lg:hidden mb-5 flex-shrink-0">
              <Label icon={<ImagesIcon />}>Product Images ({images.length}/8)</Label>
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.5)', aspectRatio: '16/9', border: `1.5px dashed ${dragOver ? '#d4a800' : '#b0cccb'}` }}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                {previews[activeThumb] ? (
                  <img src={previews[activeThumb]} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer gap-3">
                    <span className="text-neutral-400"><UploadIcon /></span>
                    <span className="text-xs text-neutral-500">Tap to upload</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files.length && addImages(e.target.files)} />
                  </label>
                )}
              </div>
              {images.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {images.map((_, i) => (
                    <button key={i} type="button" onClick={() => setActiveThumb(i)}
                      className={`flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden ${i === activeThumb ? 'ring-2 ring-amber-400' : 'opacity-50'}`}>
                      <img src={previews[i]} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {images.length < 8 && (
                    <label className="flex-shrink-0 w-10 h-10 rounded-lg border border-dashed border-[#b0cccb] flex items-center justify-center text-neutral-400 cursor-pointer">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && addImages(e.target.files)} />
                    </label>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 flex-1">

              {/* Title */}
              <div className="form-row">
                <div className="flex items-center justify-between mb-1.5">
                  <Label icon={<TagIcon />}>Title</Label>
                  <button
                    type="button"
                    onClick={handleAITitle}
                    disabled={aiTitleLoad}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#4285F422,#4285F411)', border: '1px solid #4285F455', color: '#4285F4' }}
                  >
                    {aiTitleLoad ? <SpinnerIcon /> : <span>✨</span>}
                    {aiTitleLoad ? 'Generating…' : 'AI Fill'}
                  </button>
                </div>
                <input
                  id="title" name="title" type="text" required
                  value={form.title} onChange={set('title')}
                  placeholder="Give your product a name..."
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div className="form-row">
                <div className="flex items-center justify-between mb-1.5">
                  <Label icon={<TextIcon />}>Description</Label>
                  <button
                    type="button"
                    onClick={handleAIDesc}
                    disabled={aiDescLoad}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#4285F422,#4285F411)', border: '1px solid #4285F455', color: '#4285F4' }}
                  >
                    {aiDescLoad ? <SpinnerIcon /> : <span>✨</span>}
                    {aiDescLoad ? 'Generating…' : 'AI Fill'}
                  </button>
                </div>
                <textarea
                  id="description" name="description" required rows={3}
                  value={form.description} onChange={set('description')}
                  placeholder="What makes it special — material, fit, occasion..."
                  className={`${inputCls} resize-none leading-relaxed`}
                  style={inputStyle}
                />
              </div>

              {/* Pricing */}
              <div className="form-row">
                <div className="flex items-center justify-between mb-1.5">
                  <Label icon={<CoinsIcon />}>Pricing</Label>
                  <button
                    type="button"
                    onClick={handleAIPrice}
                    disabled={aiPriceLoad || !form.title}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#b8860b22,#b8860b11)', border: '1px solid #b8860b55', color: '#b8860b' }}
                    title={!form.title ? 'Add a title first' : ''}
                  >
                    {aiPriceLoad ? <SpinnerIcon /> : <span>🔮</span>}
                    {aiPriceLoad ? 'Predicting…' : 'Predict'}
                  </button>
                </div>
                <div className="flex gap-3">
                  {/* Amount */}
                  <div className="flex-[3] relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none" style={{ color: '#6aaca8' }}>
                      {currencySymbol[form.priceCurrency] || '₹'}
                    </span>
                    <input
                      id="priceAmount" name="priceAmount"
                      type="number" min="0" step="0.01" required
                      value={form.priceAmount} onChange={set('priceAmount')}
                      placeholder="0.00"
                      className={`${inputCls} pl-7`}
                      style={inputStyle}
                    />
                  </div>
                  {/* Currency */}
                  <div className="flex-1">
                    <select
                      id="priceCurrency" name="priceCurrency"
                      value={form.priceCurrency} onChange={e => { set('priceCurrency')(e); setPricePred(null) }}
                      className={`${inputCls} appearance-none cursor-pointer`}
                      style={{
                        ...inputStyle,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236aaca8'%3E%3Cpath d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '14px',
                      }}
                    >
                      <option value="INR">INR ₹</option>
                      <option value="USD">USD $</option>
                      <option value="EUR">EUR €</option>
                      <option value="GBP">GBP £</option>
                      <option value="JPY">JPY ¥</option>
                    </select>
                  </div>
                </div>
                {/* AI price prediction chip */}
                {pricePred && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold"
                      style={{ background: 'rgba(184,134,11,0.10)', border: '1px solid rgba(184,134,11,0.25)', color: '#b8860b' }}
                    >
                      🔮 AI suggests: {currencySymbol[form.priceCurrency]}{pricePred.min.toLocaleString()} — {currencySymbol[form.priceCurrency]}{pricePred.max.toLocaleString()}
                    </span>
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-widest"
                      style={{
                        background: pricePred.confidence === 'high' ? 'rgba(42,138,133,0.12)' : 'rgba(245,197,24,0.12)',
                        border: pricePred.confidence === 'high' ? '1px solid rgba(42,138,133,0.25)' : '1px solid rgba(245,197,24,0.25)',
                        color: pricePred.confidence === 'high' ? '#1e5c58' : '#b8860b',
                      }}
                    >
                      {pricePred.confidence} confidence
                    </span>
                  </div>
                )}
              </div>

              {/* ── Category & Brand ── */}
              <div className="form-row">
                <Label icon={<span>🏷️</span>}>Category & Brand</Label>
                <div className="flex gap-3">
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className={`${inputCls} flex-1 appearance-none cursor-pointer`}
                    style={{ ...inputStyle,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236aaca8'%3E%3Cpath d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '14px'
                    }}
                  >
                    <option value="">Select category…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Brand (e.g. Snitch)"
                    value={form.brand}
                    onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                    className={`${inputCls} flex-1`}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* ── Discount / MRP Price ── */}
              <div className="form-row">
                <Label icon={<span>🏷</span>}>MRP / Original Price <span style={{ color: '#6aaca8', fontWeight: 400 }}>(optional — shown struck-through)</span></Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none" style={{ color: '#6aaca8' }}>
                    {currencySymbol[form.priceCurrency] || '₹'}
                  </span>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.discountPrice}
                    onChange={e => setForm(p => ({ ...p, discountPrice: e.target.value }))}
                    placeholder="e.g. 1499 (leave blank if no strike-through price)"
                    className={`${inputCls} pl-7`}
                    style={inputStyle}
                  />
                </div>
                {form.discountPrice && form.priceAmount && (
                  <p className="text-[10px] mt-1 px-1" style={{ color: '#6aaca8' }}>
                    Will show: <span style={{ textDecoration: 'line-through', color: '#9ca3af' }}>{currencySymbol[form.priceCurrency]}{Number(form.discountPrice).toLocaleString()}</span>
                    &nbsp;<strong style={{ color: '#1e5c58' }}>{currencySymbol[form.priceCurrency]}{Number(form.priceAmount).toLocaleString()}</strong>
                  </p>
                )}
              </div>

              {/* ── Tags ── */}
              <div className="form-row">
                <Label icon={<span>#️⃣</span>}>Tags <span style={{ color: '#6aaca8', fontWeight: 400 }}>(press Enter or , to add)</span></Label>
                <div className="rounded-xl p-2 flex flex-wrap gap-1.5 min-h-[42px]" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.75)' }}>
                  {tags.map(t => (
                    <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: 'rgba(42,138,133,0.12)', border: '1px solid rgba(42,138,133,0.22)', color: '#1e5c58' }}>
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500 transition-colors">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder={tags.length === 0 ? 'oversized, cotton, streetwear…' : ''}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-xs py-1 px-1"
                    style={{ color: '#0d2b29' }}
                  />
                </div>
              </div>

              {/* ── Published Toggle ── */}
              <div className="form-row">
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)' }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#0d2b29' }}>Publish Immediately</p>
                    <p className="text-[10px]" style={{ color: '#6aaca8' }}>Unpublished products are saved as drafts and hidden from buyers</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, published: !p.published }))}
                    className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
                    style={{ background: form.published ? 'linear-gradient(135deg,#1e5c58,#0d2b29)' : 'rgba(200,210,210,0.50)', border: '1.5px solid rgba(255,255,255,0.70)' }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                      style={{ left: form.published ? 'calc(100% - 22px)' : '2px' }}
                    />
                  </button>
                </div>
              </div>

              {/* ── Inventory / Variant Cards Section ── */}
              <div className="form-row">
                <div className="flex items-center justify-between mb-3">
                  <Label icon={<span>🎭</span>}>Colour Variants</Label>
                  <div className="flex items-center gap-2">
                    {/* AI Detect All */}
                    {previews.length > 0 && (
                      <button
                        type="button"
                        onClick={detectAllGroupColors}
                        disabled={aiAllColorLoad}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50"
                        style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.25)', color: '#7c3aed' }}
                        title="Mistral AI looks at each uploaded image and auto-fills color names"
                      >
                        {aiAllColorLoad
                          ? <><span className="animate-spin inline-block w-2.5 h-2.5 border border-purple-400 border-t-transparent rounded-full mr-1" />Detecting…</>
                          : <>✨ AI Detect All</>}
                      </button>
                    )}
                    {/* Add Colour */}
                    <button
                      type="button"
                      onClick={addColorGroup}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all duration-150 hover:scale-105 active:scale-95"
                      style={{ background: 'rgba(42,138,133,0.12)', border: '1px solid rgba(42,138,133,0.25)', color: '#1e5c58' }}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Add Colour
                    </button>
                  </div>
                </div>

                {/* AI tip */}
                {previews.length > 0 && (
                  <div className="mb-3 px-3 py-2 rounded-xl text-[10px] leading-relaxed" style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)', color: '#7c3aed' }}>
                    💡 Click a swatch to assign an image · Add multiple sizes per colour · <strong>✨ AI Detect All</strong> auto-fills names via Mistral Vision
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
                        {/* Swatch Color Preview */}
                        <div className="relative flex-shrink-0 flex items-center justify-center">
                          <div
                            className="w-8 h-8 rounded-full border-2"
                            style={{
                              background: g.hex || '#000000',
                              borderColor: 'rgba(255,255,255,0.80)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                          />
                          {/* Per-card AI detect */}
                          {previews.length > 0 && (
                            <button
                              type="button"
                              onClick={() => detectGroupColor(gi)}
                              disabled={aiColorLoad[gi]}
                              title="AI detect colour from first assigned image"
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 disabled:opacity-40"
                              style={{ background: '#7c3aed', border: '1.5px solid white' }}
                            >
                              {aiColorLoad[gi]
                                ? <span className="animate-spin block w-2 h-2 border border-white border-t-transparent rounded-full" />
                                : <span className="text-white" style={{ fontSize: 8 }}>✨</span>
                              }
                            </button>
                          )}
                        </div>

                        {/* Colour name input */}
                        <input
                          type="text"
                          placeholder="e.g. Navy Blue, Crimson Red…"
                          value={g.color}
                          onChange={e => setGroupColor(gi, e.target.value)}
                          className={inputCls}
                          style={{ ...inputStyle, flex: 1, fontSize: '12px', padding: '8px 10px', fontWeight: 600 }}
                        />

                        {/* Hex color picker */}
                        <div className="flex-shrink-0 flex items-center gap-1.5" title="Pick the hex colour for this variant">
                          <label
                            className="w-7 h-7 rounded-lg border-2 cursor-pointer overflow-hidden transition-transform hover:scale-110"
                            style={{ borderColor: 'rgba(255,255,255,0.80)', padding: 0 }}
                          >
                            <input
                              type="color"
                              value={g.hex || '#000000'}
                              onChange={e => setGroupHex(gi, e.target.value)}
                              className="w-full h-full cursor-pointer opacity-0 absolute"
                              style={{ width: 0, height: 0 }}
                            />
                            <div className="w-full h-full rounded-md" style={{ background: g.hex || '#000000' }} />
                          </label>
                        </div>

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

                      {/* ── Image Selector Panel: assign multiple images to this color (AJIO style) ── */}
                      {previews.length > 0 && (
                        <div className="px-3 py-2 border-b flex flex-col gap-1.5" style={{ borderColor: 'rgba(255,255,255,0.45)' }}>
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: '#3d7e7a' }}>
                              📸 Assign Images to this Variant ({g.imageIndexes?.length || 0} selected)
                            </p>
                            {g.imageIndexes?.length > 0 && (
                              <span className="text-[8px] font-black tracking-widest text-neutral-500 uppercase">
                                Selected: {g.imageIndexes.map(x => x + 1).join(', ')}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {previews.map((blobUrl, imgIdx) => {
                              const isSelected = (g.imageIndexes || []).includes(imgIdx);
                              return (
                                <button
                                  key={imgIdx}
                                  type="button"
                                  onClick={() => toggleGroupImageIndex(gi, imgIdx)}
                                  className="relative w-10 h-10 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-150 hover:scale-105"
                                  style={{
                                    borderColor: isSelected ? '#F5C518' : 'rgba(255,255,255,0.60)',
                                    boxShadow: isSelected ? '0 0 6px rgba(245,197,24,0.35)' : 'none',
                                    opacity: isSelected ? 1 : 0.5
                                  }}
                                >
                                  <img src={blobUrl} alt="" className="w-full h-full object-cover" />
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                                      <span className="text-white text-[12px] font-black">✓</span>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                       {/* ── Card body: size rows ── */}
                      <div className="px-3 py-2.5 flex flex-col gap-2">
                        {/* Size column labels */}
                        <div className="grid grid-cols-[1fr_80px_32px] gap-2 px-1">
                          {['Size', 'Stock', ''].map(h => (
                            <span key={h} className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: '#6aaca8' }}>{h}</span>
                          ))}
                        </div>

                        {g.sizes.map((s, si) => (
                          <div key={si} className="grid grid-cols-[1fr_80px_32px] gap-2 items-center">
                            {/* Size */}
                            <select
                              value={s.size}
                              onChange={e => setSizeField(gi, si, 'size', e.target.value)}
                              className={`${inputCls} appearance-none cursor-pointer`}
                              style={{
                                ...inputStyle, fontSize: '12px', padding: '8px 10px',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236aaca8'%3E%3Cpath d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '12px',
                              }}
                            >
                              {SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                            </select>
                            {/* Stock */}
                            <input
                              type="number" min="0" step="1" placeholder="0"
                              value={s.stock}
                              onChange={e => setSizeField(gi, si, 'stock', Number(e.target.value))}
                              className={inputCls}
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
                          style={{ background: 'rgba(42,138,133,0.08)', border: '1px solid rgba(42,138,133,0.20)', color: '#1e5c58' }}
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          Add Size
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-[10px]" style={{ color: '#6aaca8' }}>
                  Groups with empty colour are skipped on publish. Stock 0 = out of stock.
                </p>
              </div>

              {/* Divider */}
              <div className="form-row h-px my-1" style={{ background: 'rgba(255,255,255,0.60)' }} />

              {/* Submit */}
              <div className="form-row flex flex-col gap-2.5">
                <button
                  ref={submitBtnRef}
                  id="create-product-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-[11px] font-black tracking-[0.22em] uppercase text-neutral-900 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg,#F5C518 0%,#d4a800 100%)',
                    boxShadow: '0 4px 20px rgba(245,197,24,0.22)',
                  }}
                >
                  {loading ? <><SpinnerIcon /> Publishing…</> : <>Publish Product <ArrowRightIcon /></>}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full py-2.5 rounded-2xl text-[11px] font-semibold tracking-widest uppercase active:scale-[0.97] transition-all duration-150 backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.70)', color: '#1e5c58' }}
                >
                  Cancel
                </button>
              </div>

              <p className="form-row text-[10px] text-center tracking-wide pb-4" style={{ color: '#6aaca8' }}>
                By publishing you agree to Snitch's{' '}
                <a href="/terms" className="underline hover:text-neutral-600 transition-colors">Seller Guidelines</a>
              </p>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

/* ─────────────────────────────────────────────────────────────
   32 FASHION IMAGES — loaded before animation starts
───────────────────────────────────────────────────────────── */
const IMAGES = [
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1400&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1400&q=80',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1400&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1400&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1400&q=80',
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1400&q=80',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1400&q=80',
  'https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=1400&q=80',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1400&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&q=80',
  'https://images.unsplash.com/photo-1544441893-675973e31985?w=1400&q=80',
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&q=80',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1400&q=80',
  'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=1400&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400&q=80',
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1400&q=80',
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1400&q=80',
  'https://images.unsplash.com/photo-1535572290543-960a8046f5af?w=1400&q=80',
  'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1400&q=80',
  'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=1400&q=80',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1400&q=80',
  'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=1400&q=80',
  'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=1400&q=80',
  'https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=1400&q=80',
  'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=1400&q=80',
  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1400&q=80',
  'https://images.unsplash.com/photo-1434754205268-ad3b5f549b11?w=1400&q=80',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1400&q=80',
  'https://images.unsplash.com/photo-1611558709798-e009c8fd7706?w=1400&q=80',
  'https://images.unsplash.com/photo-1535572290543-960a8046f5af?w=1400&q=80',
];

const CATEGORIES = [
  'NEW DROP ✦ SUMMER 25',
  'STREET WEAR',
  'FORMAL EDIT',
  'OVERSIZED FITS',
  'PREMIUM BASICS',
  'FOOTWEAR',
  'ACCESSORIES',
  'COLLABORATIONS',
];

const FRAME_MS    = 120;   // ~8 fps
const ANIM_MS     = 4000;  // counter 0→100 duration
const MIN_SHOW_MS = 4500;  // minimum visible time

export default function SnitchLoader({ onComplete }) {
  const [count,   setCount]   = useState(0);
  const [frame,   setFrame]   = useState(0);
  const [catIdx,  setCatIdx]  = useState(0);
  const [ready,   setReady]   = useState(false); // images loaded
  const [done,    setDone]    = useState(false);

  /* ── All mutable state lives in refs so callbacks never go stale ── */
  const rootRef    = useRef(null);
  const startMs    = useRef(null);   // when animation actually began
  const rafId      = useRef(null);   // counter rAF
  const frameId    = useRef(null);   // image-sequence interval
  const catId      = useRef(null);   // category interval
  const exited     = useRef(false);

  /* ══════════════════════════════════
     PRELOAD all 32 images, then start
  ══════════════════════════════════ */
  useEffect(() => {
    let n = 0;
    const total = IMAGES.length;
    // start animation after max 3 s regardless
    const maxWait = setTimeout(begin, 3000);

    IMAGES.forEach(src => {
      const img = new Image();
      img.onload = img.onerror = () => {
        n++;
        if (n >= total) { clearTimeout(maxWait); begin(); }
      };
      img.src = src;
    });

    return () => clearTimeout(maxWait);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ══════════════════════════════════
     BEGIN — starts image seq + counter
  ══════════════════════════════════ */
  function begin() {
    // Guard: only fire once even if called multiple times
    if (startMs.current !== null) return;
    startMs.current = performance.now();
    setReady(true);

    /* Image sequence */
    frameId.current = setInterval(() => {
      setFrame(f => (f + 1) % IMAGES.length);
    }, FRAME_MS);

    /* Category cycling */
    catId.current = setInterval(() => {
      setCatIdx(c => (c + 1) % CATEGORIES.length);
    }, 900);

    /* Counter via rAF — guaranteed to update React state */
    const tick = (now) => {
      const elapsed = now - startMs.current;
      const raw     = Math.min(elapsed / ANIM_MS, 1);
      // ease: power2.inOut
      const t = raw < 0.5
        ? 2 * raw * raw
        : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      const val = Math.round(t * 100);

      setCount(val);

      if (raw < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        // counter done → wait then exit
        const remaining = MIN_SHOW_MS - (performance.now() - startMs.current);
        setTimeout(doExit, Math.max(remaining, 350));
      }
    };
    rafId.current = requestAnimationFrame(tick);
  }

  /* ══════════════════════════════════
     EXIT — fade out root div
  ══════════════════════════════════ */
  function doExit() {
    if (exited.current) return;
    exited.current = true;
    clearInterval(frameId.current);
    clearInterval(catId.current);
    cancelAnimationFrame(rafId.current);

    gsap.to(rootRef.current, {
      opacity: 0,
      duration: 0.85,
      ease: 'power2.inOut',
      onComplete() {
        setDone(true);
        onComplete?.();
      },
    });
  }

  if (done) return null;

  const progress = count / 100;

  return (
    <>
      <style>{`
        @keyframes snl-shine {
          from { background-position: -200% center }
          to   { background-position:  300% center }
        }
        @keyframes snl-rec {
          0%,49% { opacity:1 } 50%,100% { opacity:0.15 }
        }
        @keyframes snl-cat {
          0%   { opacity:0; transform:translateY(5px)  }
          15%  { opacity:1; transform:translateY(0)    }
          85%  { opacity:1; transform:translateY(0)    }
          100% { opacity:0; transform:translateY(-5px) }
        }
        @keyframes snl-in {
          from { opacity:0; transform:translateY(14px) }
          to   { opacity:1; transform:translateY(0)    }
        }
      `}</style>

      <div ref={rootRef} style={{
        position:'fixed', inset:0, zIndex:9999,
        background:'#ffffff9c',
        overflow:'hidden',
        fontFamily:"'Saira',sans-serif",
      }}>

        {/* ── Image sequence ── */}
        {ready && IMAGES.map((src, i) => (
          <img key={i} src={src} alt="" style={{
            position:'absolute', inset:0,
            width:'100%', height:'100%',
            objectFit:'cover', objectPosition:'center top',
            opacity: i === frame ? 1 : 0,
            filter:'brightness(0.36) saturate(1.1)',
            transform:'scale(1.04)',
            pointerEvents:'none',
            zIndex:1,
          }} />
        ))}

        {/* Vignette */}
        <div style={{
          position:'absolute', inset:0, zIndex:3, pointerEvents:'none',
          background:'radial-gradient(ellipse 75% 75% at 50% 42%, transparent 0%, rgba(220, 220, 220, 0.23) 100%)',
        }}/>

        {/* Bottom dark ramp */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:'50%',
          zIndex:4, pointerEvents:'none',
          background:'linear-gradient(to top, rgba(193, 193, 193, 0.52) 0%, rgba(190, 190, 190, 0.65) 55%, transparent 100%)',
        }}/>

        {/* Top dark ramp */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:'22%',
          zIndex:4, pointerEvents:'none',
          background:'linear-gradient(to bottom, rgba(217, 217, 217, 0.41) 0%, transparent 100%)',
        }}/>

        {/* Film grain */}
        <div style={{
          position:'absolute', inset:0, zIndex:5, pointerEvents:'none',
          backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize:'150px', mixBlendMode:'overlay', opacity:0.05,
        }}/>

        {/* ══ TOP BAR ══ */}
        <div style={{
          position:'absolute', top:0, left:0, right:0,
          zIndex:20, padding:'18px 28px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <span style={{ fontSize:'1rem', fontWeight:900, color:'#fff', letterSpacing:'0.35em' }}>
              SNITCH
            </span>
            <span style={{
              fontSize:'0.48rem', color:'rgba(255,255,255,0.28)',
              letterSpacing:'0.22em', fontFamily:"'Exo 2',sans-serif",
            }}>
              FASHION · COMMERCE · CULTURE
            </span>
          </div>
          <div style={{
            display:'flex', alignItems:'center', gap:'8px',
            fontFamily:'monospace', fontSize:'0.58rem',
            color:'rgba(255,255,255,0.38)', letterSpacing:'0.14em',
          }}>
            <span style={{
              width:'7px', height:'7px', borderRadius:'50%',
              background: ready ? '#fdfdfa' : 'rgba(255, 255, 255, 0)',
              boxShadow: ready ? '0 0 8px #ceccc40d' : 'none',
              animation: ready && count < 100 ? 'snl-rec 1s step-end infinite' : 'none',
            }}/>
            {!ready ? 'BUFFERING' : count >= 100 ? 'READY' : 'LIVE'}
          </div>
        </div>

        {/* ══ BIG COUNTER — centre ══ */}
        <div style={{
          position:'absolute', inset:0, zIndex:20,
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          pointerEvents:'none',
        }}>
          {/* Gold glow halo */}
          <div style={{
            position:'absolute',
            width:'500px', height:'500px', borderRadius:'50%',
            background:`radial-gradient(circle, rgba(245,197,24,${(progress * 0.25).toFixed(3)}) 0%, transparent 65%)`,
            filter:'blur(60px)',
            transform:`scale(${(0.35 + progress * 0.75).toFixed(3)})`,
            transition:'all 0.18s linear',
            pointerEvents:'none',
          }}/>

          {/* The number */}
          <div style={{
            position:'relative', zIndex:1,
            fontSize:'clamp(6rem,22vw,15rem)',
            fontWeight:900,
            lineHeight:0.88,
            letterSpacing:'-0.04em',
            fontVariantNumeric:'tabular-nums',
            color:'#ffffff',
            textShadow:`
              0 0 ${18 + progress * 65}px rgba(245,197,24,${(progress * 0.7).toFixed(2)}),
              0 6px 50px rgba(145, 145, 145, 0.29)
            `,
            transition:'text-shadow 0.18s linear',
            textAlign:'center',
          }}>
            {String(count).padStart(2, '0')}
          </div>

          <div style={{
            position:'relative', zIndex:1,
            marginTop:'0.5rem',
            fontSize:'clamp(0.55rem,1.5vw,0.85rem)',
            fontWeight:400, letterSpacing:'0.55em',
            color:'rgba(255,255,255,0.3)',
            fontFamily:"'Exo 2',sans-serif",
          }}>
            PERCENT LOADED
          </div>
        </div>

        {/* ══ BOTTOM BAR ══ */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          zIndex:20, padding:'0 28px 26px',
        }}>
          {/* Category row */}
          <div style={{
            marginBottom:'12px',
            display:'flex', alignItems:'center', gap:'14px',
          }}>
            <span style={{
              fontSize:'0.48rem', letterSpacing:'0.5em',
              color:'rgba(255,255,255,0.2)',
              fontFamily:"'Exo 2',sans-serif", textTransform:'uppercase',
            }}>
              NOW SHOWING
            </span>
            <span
              key={catIdx}
              style={{
                fontSize:'0.55rem', letterSpacing:'0.4em', fontWeight:700,
                color:'#ececea5b', textTransform:'uppercase',
                animation:'snl-cat 0.88s ease both',
              }}
            >
              {CATEGORIES[catIdx]}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            display:'flex', alignItems:'center', gap:'14px',
          }}>
            <div style={{
              flex:1, height:'2px',
              background:'rgba(255,255,255,0.07)',
              borderRadius:'2px', overflow:'visible',
              position:'relative',
            }}>
              <div style={{
                height:'100%',
                width:`${count}%`,
                background:'linear-gradient(90deg,#6b4a00,#F5C518 55%,#fff9e0 100%)',
                backgroundSize:'200% auto',
                animation:'snl-shine 2s linear infinite',
                borderRadius:'2px',
                transition:'width 0.04s linear',
                position:'relative',
              }}>
                <div style={{
                  position:'absolute', right:'-4px', top:'50%',
                  transform:'translateY(-50%)',
                  width:'8px', height:'8px', borderRadius:'50%',
                  background:'#fff',
                  boxShadow:'0 0 10px #dfdfdf88, 0 0 26px #ffffff30',
                }}/>
              </div>
            </div>
            <span style={{
              fontFamily:"'Saira',monospace",
              fontSize:'0.78rem', fontWeight:700,
              color:'rgba(255,255,255,0.5)',
              fontVariantNumeric:'tabular-nums',
              minWidth:'3.2ch',
            }}>
              {String(count).padStart(2,'0')}%
            </span>
          </div>

          {/* Frame tick strip */}
          <div style={{
            display:'flex', alignItems:'center', gap:'6px', marginTop:'9px',
          }}>
            <div style={{ display:'flex', gap:'2px', flex:1 }}>
              {IMAGES.map((_, i) => (
                <div key={i} style={{
                  flex:1, height:'2px', borderRadius:'1px',
                  background: i <= frame
                    ? `rgba(245,197,24,${i === frame ? 0.85 : 0.4})`
                    : 'rgba(255,255,255,0.07)',
                  transition:`background ${FRAME_MS}ms linear`,
                }}/>
              ))}
            </div>
            <span style={{
              fontFamily:'monospace', fontSize:'0.5rem',
              color:'rgba(255,255,255,0.18)',
              letterSpacing:'0.08em', flexShrink:0,
            }}>
              {String(frame + 1).padStart(2,'0')}/{IMAGES.length}
            </span>
          </div>
        </div>

      </div>
    </>
  );
}

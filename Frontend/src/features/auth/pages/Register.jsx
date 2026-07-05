import React, { useState } from 'react'
import {useAuth} from '../hook/useAuth'
import {useNavigate} from 'react-router'



/* ── tiny SVG icons ── */
const UserIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const PhoneIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)
const MailIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)
const LockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)
const EyeOpen = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)
const EyeClosed = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

/* ── compact input field ── */
const Field = ({ id, label, icon, type = 'text', placeholder, value, onChange, autoComplete, toggle }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#3d7e7a' }}>
      {label}
    </label>
    <div className="relative group">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-150 pointer-events-none" style={{ color: '#6aaca8' }}>
        {icon}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg pl-9 pr-9 py-2.5 text-xs backdrop-blur-sm focus:outline-none focus:ring-1 transition-all duration-150"
        style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.75)', color: '#0d2b29' }}
      />
      {toggle && (
        <button
          type="button"
          onClick={toggle.fn}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150 focus:outline-none" style={{ color: '#6aaca8' }}
        >
          {toggle.visible ? <EyeOpen /> : <EyeClosed />}
        </button>
      )}
    </div>
  </div>
)

export default function Register() {


  const {handleRegister}= useAuth()


  const navigate = useNavigate();


  const [form, setForm] = useState({
    fullName: '', contactNumber: '', email: '',
    password: '', confirmPassword: '', isSeller: false,
  })
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(prev => ({ ...prev, [field]: val }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      return alert('Passwords do not match')
    }
    try {
      setLoading(true)
      await handleRegister(
        form.email,
        form.contactNumber,
        form.password,
        form.fullName,
        form.isSeller
      )
      navigate('/')
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.errors
        ? err.response.data.errors.map(e => `${e.path || e.param || 'Error'}: ${e.msg}`).join('\n')
        : (err.response?.data?.message || err.message || 'Registration failed');
      alert(errorMsg)

    } finally {
      setLoading(false)
      
    }
  }

  return (
    /* full-screen, no overflow */
    <div className="h-screen w-screen flex overflow-hidden" style={{ background: '#E3F1F0' }}>

      {/* ── LEFT PANEL — brand ── */}
      <div
        className="relative hidden lg:flex flex-col justify-between w-[42%] flex-shrink-0 overflow-hidden"
        style={{ background: '#C8E4E2' }}
      >
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#2a8a85 1px,transparent 1px),linear-gradient(90deg,#2a8a85 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Ambient golden glow bottom-left */}
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,197,24,0.12) 0%, transparent 70%)' }}
        />

        {/* Golden right-edge separator line */}
        <div
          className="absolute inset-y-0 right-0 w-px pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(245,197,24,0.25) 40%, rgba(245,197,24,0.08) 100%)' }}
        />

        {/* ── Full-body fashion model ── */}
        <img
          src="./public/Image.png"
          alt="Snitch fashion model full body"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[85%] w-auto object-contain object-bottom pointer-events-none select-none"
          style={{
            mixBlendMode: 'luminosity',
            filter: 'contrast(1.12) brightness(0.65) saturate(0.5)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Soft golden rim-light overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(110deg, transparent 55%, rgba(245,197,24,0.05) 100%)' }}
        />

        {/* Bottom gradient scrim — text legibility */}
        <div
          className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(200,228,226,0.98) 0%, rgba(200,228,226,0.75) 50%, transparent 100%)' }}
        />

        {/* ── TOP — Logo + badge ── */}
        <div className="relative z-10 flex items-center justify-between px-7 py-6">
          <span className="text-xl font-black tracking-[0.35em]" style={{ color: '#F5C518' }}>
            SNITCH
          </span>
          <span
            className="text-[9px] font-bold tracking-[0.18em] uppercase px-3 py-1.5 rounded-full border"
            style={{
              color: '#F5C518',
              borderColor: 'rgba(245,197,24,0.45)',
              background: 'rgba(245,197,24,0.06)',
              letterSpacing: '0.18em',
            }}
          >
            New Season
          </span>
        </div>

        {/* ── BOTTOM — Editorial copy (matches Stitch design) ── */}
        <div className="relative z-10 px-7 pb-6 space-y-3.5">

          {/* Tagline + headline */}
          <div className="space-y-1">
            <p
              className="text-[9px] font-bold tracking-[0.22em] uppercase"
              style={{ color: '#F5C518' }}
            >
              Fashion · Commerce · Culture
            </p>
            <h1 className="text-[22px] font-black text-neutral-900 leading-tight">
              Dress bold.<br />
              <span style={{ color: '#d4a800' }}>Shop</span> bolder.
            </h1>
            <p className="text-[11px] text-neutral-600 leading-relaxed max-w-[230px] pt-0.5">
              Curated drops, exclusive styles, and a seller ecosystem built for the future.
            </p>
          </div>

          {/* Bullet features */}
          <div className="flex flex-col gap-1.5">
            {[
              'Free to join, zero hidden fees',
              'Seller dashboard live on day one',
              'Exclusive drops & early access',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: '#F5C518' }}
                />
                <span className="text-[11px] text-neutral-600">{f}</span>
              </div>
            ))}
          </div>

          {/* ── CTA Button (from Stitch design) ── */}
          <a
            href="#"
            className="block w-full text-center py-3 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #F5C518 0%, #e0b400 100%)',
              color: '#08080a',
              boxShadow: '0 4px 20px rgba(245,197,24,0.3)',
              letterSpacing: '0.2em',
            }}
          >
            Explore the Collection
          </a>

          {/* Copyright */}
          <p className="text-center text-[10px] text-neutral-500 pt-0.5">
            © 2025 Snitch. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        <div className="w-full max-w-[460px]">

          {/* Mobile-only logo */}
          <p className="lg:hidden text-center text-2xl font-black tracking-[0.35em] mb-4" style={{ color: '#F5C518' }}>
            SNITCH
          </p>

          {/* Card */}
          <div
            className="rounded-2xl px-7 py-6 backdrop-blur-md"
            style={{ background: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 4px 24px rgba(42,138,133,0.10)' }}
          >
            {/* Header */}
            <div className="mb-5">
              <h2 className="text-base font-semibold" style={{ color: '#0d2b29' }}>Create account</h2>
              <p className="text-[11px] mt-0.5" style={{ color: '#3d7e7a' }}>Fill in the details below to get started</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-3.5">

              {/* Row 1 — Full Name + Contact */}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  id="fullName" label="Full Name" icon={<UserIcon />}
                  placeholder="John Doe" value={form.fullName}
                  onChange={set('fullName')} autoComplete="name"
                />
                <Field
                  id="contactNumber" label="Contact Number" icon={<PhoneIcon />}
                  type="tel" placeholder="+91 98765 43210" value={form.contactNumber}
                  onChange={set('contactNumber')} autoComplete="tel"
                />
              </div>

              {/* Row 2 — Email (full width) */}
              <Field
                id="email" label="Email" icon={<MailIcon />}
                type="email" placeholder="you@example.com" value={form.email}
                onChange={set('email')} autoComplete="email"
              />

              {/* Row 3 — Password + Confirm */}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  id="password" label="Password" icon={<LockIcon />}
                  type={showPw ? 'text' : 'password'} placeholder="Create password"
                  value={form.password} onChange={set('password')} autoComplete="new-password"
                  toggle={{ visible: showPw, fn: () => setShowPw(v => !v) }}
                />
                <Field
                  id="confirmPassword" label="Confirm Password" icon={<LockIcon />}
                  type={showCpw ? 'text' : 'password'} placeholder="Repeat password"
                  value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password"
                  toggle={{ visible: showCpw, fn: () => setShowCpw(v => !v) }}
                />
              </div>

              {/* Seller checkbox */}
              <label
                htmlFor="isSeller"
                className="flex items-center gap-3 cursor-pointer group select-none py-1"
              >
                <div className="relative flex-shrink-0">
                  <input
                    id="isSeller"
                    type="checkbox"
                    checked={form.isSeller}
                    onChange={set('isSeller')}
                    className="sr-only peer"
                  />
                  <div
                    className="w-[18px] h-[18px] rounded-md flex items-center justify-center transition-all duration-150
                              peer-checked:bg-amber-400 peer-checked:border-amber-400"
                  style={{ border: '2px solid rgba(42,138,133,0.4)', background: 'rgba(255,255,255,0.55)' }}
                  >
                    {form.isSeller && (
                      <svg className="w-2.5 h-2.5 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                   <span className="text-xs transition-colors" style={{ color: '#0d2b29' }}>
                    I am a Seller
                  </span>
                  <span className="text-[10px] ml-2" style={{ color: '#6aaca8' }}>  unlock seller dashboard</span>
                </div>
              </label>

              {/* Divider */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.60)' }} />

              {/* Submit */}
              <button
                id="register-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-xs font-bold tracking-widest uppercase text-neutral-900
                           transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg,#F5C518 0%,#e0b400 100%)',
                  boxShadow: loading ? 'none' : '0 4px 18px rgba(245,197,24,0.22)',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating…
                  </span>
                ) : 'Create Account'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.60)' }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6aaca8' }}>or</span>
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.60)' }} />
              </div>

              {/* Google Auth Button */}
              <a
                href="/api/auth/google"
                className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-xs font-bold tracking-widest uppercase active:scale-[0.98] transition-all duration-150 backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.75)', color: '#1e5c58' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue With Google
              </a>

              {/* Sign in */}
              <p className="text-center text-[11px]" style={{ color: '#3d7e7a' }}>
                Already have an account?{' '}
                <a
                  href="/login"
                  className="font-semibold transition-colors duration-150"
                  style={{ color: '#F5C518' }}
                >
                  Sign In
                </a>
              </p>

              {/* Terms */}
              <p className="text-center text-[10px]" style={{ color: '#6aaca8' }}>
                By signing up you agree to our{' '}
                <a href="/terms" className="underline hover:text-neutral-500 transition-colors">Terms</a>
                {' & '}
                <a href="/privacy" className="underline hover:text-neutral-500 transition-colors">Privacy Policy</a>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
import React, { useState } from 'react'
import { useAuth } from '../hook/useAuth'
import { useNavigate } from 'react-router'
import { getBackendUrl } from '../../../services/api.js'

/* ── tiny SVG icons ── */
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

export default function Login() {
  const { handleLogin } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await handleLogin(form.email, form.password)
      navigate('/')
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.errors
        ? err.response.data.errors.map(e => `${e.path || e.param || 'Error'}: ${e.msg}`).join('\n')
        : (err.response?.data?.message || err.message || 'Login failed');
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
          style={{
            background: 'radial-gradient(circle, rgba(245,197,24,0.18) 0%, rgba(245,197,24,0) 70%)',
          }}
        />

        {/* Model photo with luminosity blend for dark integration */}
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop"
          alt="High Fashion Model"
          className="absolute inset-0 w-full h-[85%] object-cover object-center pointer-events-none select-none opacity-40 mix-blend-luminosity"
        />

        {/* Top brand header */}
        <div className="relative p-12 z-10 flex items-center justify-between">
          <span className="text-xl font-black tracking-[0.35em] uppercase" style={{ color: '#F5C518' }}>
            SNITCH
          </span>
          <span className="px-3.5 py-1 rounded-full text-[9px] font-bold tracking-[0.18em] border border-amber-400/30 bg-amber-400/5 uppercase" style={{ color: '#F5C518' }}>
            EXCLUSIVE
          </span>
        </div>

        {/* Gradient scrim overlay to fade background behind text */}
        <div
          className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
          style={{
            background: 'linear-gradient(to top, #C8E4E2 0%, rgba(200,228,226,0.95) 40%, rgba(200,228,226,0.5) 75%, rgba(200,228,226,0) 100%)',
          }}
        />

        {/* Bottom copy and action */}
        <div className="relative p-12 z-10 flex flex-col gap-6 mt-auto">
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: '#F5C518' }}>
              SIGN IN · ACCESS · EXPERIENCE
            </p>
            <h1 className="text-3xl font-light tracking-tight text-neutral-900 leading-tight">
              Define your style.<br />
              <span className="font-semibold" style={{ color: '#d4a800' }}>
                Own your look.
              </span>
            </h1>
            <p className="text-[11px] text-neutral-600 max-w-sm leading-relaxed">
              Log in to access your curated style feed, active orders, and dedicated seller management tools.
            </p>
          </div>

          {/* Bullet features */}
          <ul className="space-y-2 text-[10px] text-neutral-600 font-medium tracking-wide">
            <li className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F5C518' }} />
              Personalized style feed & recommendations
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F5C518' }} />
              Seamless checkout & real-time tracking
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F5C518' }} />
              Direct access to seller dashboards
            </li>
          </ul>

          {/* Golden brand action button */}
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
              <h2 className="text-base font-semibold" style={{ color: '#0d2b29' }}>Welcome Back</h2>
              <p className="text-[11px] mt-0.5" style={{ color: '#3d7e7a' }}>Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Email */}
              <Field
                id="email" label="Email Address" icon={<MailIcon />}
                type="email" placeholder="you@example.com" value={form.email}
                onChange={set('email')} autoComplete="email"
              />

              {/* Password */}
              <Field
                id="password" label="Password" icon={<LockIcon />}
                type={showPw ? 'text' : 'password'} placeholder="••••••••"
                value={form.password} onChange={set('password')} autoComplete="current-password"
                toggle={{ visible: showPw, fn: () => setShowPw(v => !v) }}
              />

              {/* Divider */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.60)' }} />

              {/* Submit */}
              <button
                id="login-submit"
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
                    Signing In…
                  </span>
                ) : 'Sign In'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.60)' }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6aaca8' }}>or</span>
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.60)' }} />
              </div>

              {/* Google Auth Button */}
              <a
                href={getBackendUrl('/api/auth/google')}
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

              {/* Sign up redirect */}
              <p className="text-center text-[11px]" style={{ color: '#3d7e7a' }}>
                Don't have an account?{' '}
                <a
                  href="/register"
                  className="font-semibold transition-colors duration-150"
                  style={{ color: '#F5C518' }}
                >
                  Sign Up
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
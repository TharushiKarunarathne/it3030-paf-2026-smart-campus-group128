import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const FEATURES = [
  {
    title: 'Facility Management',
    desc: 'Browse and book campus resources — labs, lecture halls, and equipment.',
    border: 'border-l-blue-500',
    dot: 'bg-blue-500',
  },
  {
    title: 'Smart Bookings',
    desc: 'Request and track room or equipment reservations with real-time approval status.',
    border: 'border-l-green-500',
    dot: 'bg-green-500',
  },
  {
    title: 'Incident Reporting',
    desc: 'Report and track maintenance issues. Technicians are notified and resolve tickets.',
    border: 'border-l-amber-500',
    dot: 'bg-amber-500',
  },
  {
    title: 'Real-time Notifications',
    desc: 'Stay updated on every campus activity with instant, role-based notifications.',
    border: 'border-l-indigo-500',
    dot: 'bg-indigo-500',
  },
]

const STEPS = [
  { num: '01', title: 'Sign In',        desc: 'Log in with your university Google account or email credentials.' },
  { num: '02', title: 'Book or Report', desc: 'Reserve facilities, book equipment, or report a maintenance issue.' },
  { num: '03', title: 'Track & Manage', desc: 'Monitor bookings and tickets in real-time with full status transparency.' },
]

// ── Animated counter ───────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref     = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        let val = 0
        const step = Math.ceil(target / 40)
        const timer = setInterval(() => {
          val += step
          if (val >= target) { setCount(target); clearInterval(timer) }
          else setCount(val)
        }, 40)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count}{suffix}</span>
}

// ── Scrolling navbar ───────────────────────────────────────
function HomeNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-sm border-b border-gray-200' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
            >
              <span className="text-white text-sm font-bold">SC</span>
            </div>
            <span className={`font-bold text-lg tracking-tight transition-colors ${
              scrolled ? 'text-gray-900' : 'text-white'
            }`}>
              Smart Campus
            </span>
          </div>
          <Link
            to="/login"
            className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-200
              ${scrolled
                ? 'text-white shadow-md'
                : 'bg-white/15 text-white border border-white/30 hover:bg-white/25'
              }`}
            style={scrolled ? { background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' } : {}}
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ── Main ───────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  if (user) return null

  return (
    <div className="min-h-screen bg-white">
      <HomeNavbar />

      {/* ── Hero ────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1f35 0%, #1e3a5f 35%, #2d5a8e 70%, #1a4a7a 100%)' }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Floating blobs — subtle */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #60a5fa, transparent 70%)',
            animation: 'floatSlow 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #93c5fd, transparent 70%)',
            animation: 'float 14s ease-in-out infinite',
          }}
        />

        {/* Hero content */}
        <div
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
          style={{ animation: 'fadeIn 0.8s ease-out' }}
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 mb-8 bg-white/10">
            <span className="w-2 h-2 rounded-full bg-green-400" style={{ animation: 'pulseRing 2s ease-out infinite' }} />
            <span className="text-white/80 text-sm font-medium">SLIIT Faculty of Computing · 2026</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Smart Campus
            <br />
            <span className="text-blue-300">Operations Hub</span>
          </h1>

          <p className="text-lg sm:text-xl text-blue-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Manage facilities, bookings, and maintenance in one unified platform.
            Built for students, staff, and administrators.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm
                         bg-white text-gray-900 shadow-xl hover:bg-gray-50
                         transition-all duration-200 hover:scale-105"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm
                         bg-white/10 text-white border border-white/25 hover:bg-white/20
                         transition-all duration-200"
            >
              Learn More
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l7 7-7 7" transform="rotate(90 12 12)" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14" />
              </svg>
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-xs mx-auto sm:max-w-md sm:gap-12">
            {[
              { val: 500, suffix: '+', label: 'Users' },
              { val: 50,  suffix: '+', label: 'Resources' },
              { val: 99,  suffix: '%', label: 'Uptime' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-white">
                  <AnimatedCounter target={s.val} suffix={s.suffix} />
                </div>
                <div className="text-blue-300 text-xs mt-0.5 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
          <div className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center p-1">
            <div
              className="w-1 h-2 rounded-full bg-white/60"
              style={{ animation: 'floatSlow 2s ease-in-out infinite' }}
            />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-700 uppercase tracking-widest mb-3">
              Platform capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Everything you need, in one place
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              One platform to manage every aspect of campus operations efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`bg-white rounded-2xl border-l-4 border border-gray-100 ${f.border}
                             p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
              >
                <div className={`w-2 h-2 rounded-full ${f.dot} mb-4`} />
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-700 uppercase tracking-widest mb-3">
              Simple process
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Up and running in 3 steps
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              From sign-in to fully operational in under a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gray-200 z-0 -translate-y-1/2" />
                )}
                <div className="relative z-10 bg-gray-50 rounded-2xl border border-gray-100 p-6">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4
                                 text-white text-lg font-extrabold shadow-md"
                    style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm
                         text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
            >
              Get started now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Banner ───────────────────────────────────────── */}
      <section
        className="py-20"
        style={{ background: 'linear-gradient(135deg, #0f1f35 0%, #1e3a5f 50%, #2d5a8e 100%)' }}
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-4">
            Trusted by SLIIT
          </p>
          <blockquote className="text-2xl sm:text-3xl font-bold text-white leading-relaxed mb-8">
            "A seamless experience for managing campus resources, tickets, and communications — all in one place."
          </blockquote>
          <div className="inline-flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center
                          text-white font-bold text-sm"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              FC
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">Faculty of Computing</p>
              <p className="text-blue-300 text-xs">SLIIT · Sri Lanka</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="bg-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
              >
                <span className="text-white text-sm font-bold">SC</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Smart Campus</p>
                <p className="text-gray-500 text-xs">Operations Hub</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
            </div>

            <p className="text-gray-500 text-sm text-center">
              Smart Campus © 2026 &nbsp;|&nbsp;
              <span className="text-blue-400">SLIIT Faculty of Computing</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

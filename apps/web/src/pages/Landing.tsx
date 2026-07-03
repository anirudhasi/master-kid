// Landing — "Dream, Focus, Achieve"
// Single-viewport (100vh, no scroll on desktop) split-screen: the left 60% is
// the emotional anchor (the child's inner vision — cinematic dual-tone neon),
// the right 40% is the action hub (glassmorphism parent/child/tutor cards).
//
// Photography hook: drop a real cinematic shoot at public/brand/hero-child.jpg
// (child with headphones over a glowing sketchpad, warm-orange key light +
// blue/violet backlight) and it renders automatically under the neon overlays.
// Until then the SVG composition below carries the scene on its own.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic, Zap, GraduationCap, ArrowRight, Flame, Star } from 'lucide-react'
import { LogoIcon } from '@/components/Logo'

const NAVY = '#0F172A'
const CYAN = '#22D3EE'
const VIOLET = '#8B5CF6'
const DISPLAY = "'Syne', 'Inter', sans-serif"
const BODY = "'Inter', sans-serif"

const TUTOR_FEED = [
  { icon: '🔬', text: 'Science session synced 1 hr ago' },
  { icon: '🏊', text: 'Coach Suresh logged swim training — 5:30 AM' },
  { icon: '📐', text: 'Maths worksheet graded: 18/20' },
  { icon: '💃', text: 'Bharatanatyam exam prep — Grade A pace' },
]

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 20,
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  boxShadow: '0 8px 32px rgba(2,6,23,0.45)',
}

const cardLabel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em',
  textTransform: 'uppercase', fontFamily: BODY,
}

// The inner-vision scene: child in headphones over a glowing sketchpad, with
// faint constellations / rocket schematics / musical notation floating around.
function VisionScene() {
  return (
    <svg viewBox="0 0 900 900" preserveAspectRatio="xMidYMax slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="padGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={CYAN} stopOpacity="0.85" />
          <stop offset="45%" stopColor={CYAN} stopOpacity="0.22" />
          <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="padFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor={VIOLET} />
        </linearGradient>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={VIOLET} stopOpacity="0.4" />
          <stop offset="60%" stopColor={VIOLET} stopOpacity="0.14" />
          <stop offset="100%" stopColor={VIOLET} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rimWarm" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F2A93B" />
          <stop offset="100%" stopColor="#F2A93B" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rimCool" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={VIOLET} />
          <stop offset="100%" stopColor={VIOLET} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* floating dream line-art (faint) */}
      <g className="lp-float" opacity="0.5">
        {/* constellation */}
        <g stroke={CYAN} strokeOpacity="0.45" strokeWidth="1.4" fill={CYAN}>
          <path d="M120 150 L205 115 L300 170 L365 105 L455 140" fill="none" />
          {[[120, 150], [205, 115], [300, 170], [365, 105], [455, 140]].map(([x, y], i) =>
            <circle key={i} cx={x} cy={y} r={i === 3 ? 5 : 3.2} fillOpacity="0.85" />)}
        </g>
        {/* orbit + planet */}
        <g transform="translate(700 210)">
          <ellipse rx="86" ry="30" fill="none" stroke={VIOLET} strokeOpacity="0.5" strokeWidth="1.4" transform="rotate(-18)" />
          <circle r="17" fill={VIOLET} fillOpacity="0.35" stroke={VIOLET} strokeOpacity="0.7" strokeWidth="1.4" />
          <circle cx="62" cy="-26" r="4" fill={CYAN} fillOpacity="0.9" />
        </g>
        {/* musical notation */}
        <g stroke="#F2A93B" strokeOpacity="0.55" strokeWidth="1.6" fill="none" transform="translate(96 330)">
          <path d="M0 40 q30 -18 60 0 q30 18 60 0" />
          <path d="M148 8 v46 m0 -46 h20 v12 h-20" />
          <circle cx="143" cy="56" r="6" fill="#F2A93B" fillOpacity="0.5" />
        </g>
        {/* rocket schematic */}
        <g transform="translate(730 430)" stroke={CYAN} strokeOpacity="0.55" strokeWidth="1.5" fill="none">
          <path d="M0 60 Q0 -8 34 -40 Q68 -8 68 60 L52 78 L16 78 Z" />
          <circle cx="34" cy="10" r="11" />
          <path d="M0 60 L-18 88 L8 78 M68 60 L86 88 L60 78" />
          <path d="M24 78 L34 104 L44 78" strokeDasharray="4 4" />
          <path d="M-30 -30 h18 m6 0 h10" strokeDasharray="3 5" strokeOpacity="0.35" />
        </g>
      </g>

      {/* glow pool under the sketchpad */}
      <ellipse cx="600" cy="780" rx="330" ry="150" fill="url(#padGlow)" />

      {/* ── the child: silhouette leaning over a glowing sketchpad ── */}
      <g transform="translate(620 645) scale(0.92)">
        {/* backlight halo */}
        <circle cx="0" cy="-130" r="200" fill="url(#halo)" />
        {/* shoulders + hoodie */}
        <path d="M-190 190 Q-185 45 -95 -5 Q-40 -35 0 -35 Q40 -35 95 -5 Q185 45 190 190 Z" fill="#141F3F" />
        {/* head */}
        <circle cx="0" cy="-115" r="72" fill="#141F3F" />
        {/* dual-tone rim light: warm left, cool right */}
        <path d="M-60 -155 A72 72 0 0 0 -72 -100" stroke="url(#rimWarm)" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M60 -155 A72 72 0 0 1 72 -100" stroke="url(#rimCool)" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M-95 -5 Q-140 25 -165 95" stroke="url(#rimWarm)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8" />
        <path d="M95 -5 Q140 25 165 95" stroke="url(#rimCool)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8" />
        {/* cozy headphones */}
        <path d="M-74 -122 Q0 -212 74 -122" stroke={CYAN} strokeWidth="11" strokeLinecap="round" fill="none" />
        <rect x="-92" y="-136" width="26" height="48" rx="13" fill={CYAN} />
        <rect x="66" y="-136" width="26" height="48" rx="13" fill={VIOLET} />
        {/* glowing sketchpad */}
        <g transform="translate(0 118)">
          <rect x="-150" y="-26" width="300" height="88" rx="12" fill="url(#padFace)" opacity="0.9" />
          <rect x="-150" y="-26" width="300" height="88" rx="12" fill="#0B1120" opacity="0.55" />
          <rect x="-150" y="-26" width="300" height="88" rx="12" fill="none" stroke={CYAN} strokeOpacity="0.8" strokeWidth="1.6" />
          {/* the dream being sketched: tiny neon rocket */}
          <g transform="translate(-6 18)" stroke="#A5F3FC" strokeWidth="2.4" fill="none" strokeLinecap="round">
            <path d="M0 12 Q0 -18 15 -30 Q30 -18 30 12 L23 20 L7 20 Z" />
            <path d="M0 12 L-9 24 M30 12 L39 24" />
            <path d="M11 20 L15 32 L19 20" strokeDasharray="3 3" />
          </g>
          <path d="M-118 8 h56 M-118 24 h40" stroke="#A5F3FC" strokeOpacity="0.5" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}

export default function Landing() {
  const [feedIdx, setFeedIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFeedIdx(i => (i + 1) % TUTOR_FEED.length), 3500)
    return () => clearInterval(id)
  }, [])
  const feed = TUTOR_FEED[feedIdx]

  return (
    <div className="lp-viewport" style={{
      height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      background: NAVY, color: '#F1F5F9', fontFamily: BODY, position: 'relative',
    }}>
      {/* ambient nebulas over the whole viewport */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `
        radial-gradient(720px 540px at 12% 108%, rgba(242,169,59,0.16), transparent 62%),
        radial-gradient(820px 620px at 46% -12%, rgba(139,92,246,0.22), transparent 60%),
        radial-gradient(560px 420px at 96% 42%, rgba(34,211,238,0.10), transparent 65%)` }} />

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px clamp(18px,3.5vw,44px)', position: 'relative', zIndex: 5, flexShrink: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <LogoIcon size={28} tile />
          <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em' }}>
            <span style={{ color: '#F1F5F9' }}>MASTER</span><span style={{ color: CYAN }}>KIDS</span>
          </span>
        </Link>
        <nav style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login" className="lp-try" style={{
            padding: '9px 18px', borderRadius: 24, fontSize: 12.5, fontWeight: 700, textDecoration: 'none',
            color: '#E2E8F0', border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.05)', whiteSpace: 'nowrap',
          }}>
            Try Child View
          </Link>
          <Link to="/login" style={{
            padding: '9px 22px', borderRadius: 24, fontSize: 12.5, fontWeight: 800, textDecoration: 'none',
            color: '#06202A', background: `linear-gradient(120deg, ${CYAN}, #67E8F9)`,
            boxShadow: '0 4px 20px rgba(34,211,238,0.35)',
          }}>
            Login
          </Link>
        </nav>
      </header>

      {/* ── Split stage ─────────────────────────────────────────── */}
      <main className="lp-split" style={{
        flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '60fr 40fr',
        gap: 'clamp(14px,2vw,28px)', padding: '0 clamp(18px,3.5vw,44px) 14px', position: 'relative', zIndex: 4,
      }}>

        {/* LEFT — the inner vision */}
        <motion.section initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', minHeight: 0, border: '1px solid rgba(255,255,255,0.09)', background: 'linear-gradient(150deg, #131C33 0%, #0B1120 55%, #150F2E 100%)' }}>

          {/* optional real photoshoot (public/brand/hero-child.jpg) */}
          <img src="/brand/hero-child.jpg" alt=""
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />

          <VisionScene />

          {/* cinematic dual-tone grade over everything */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `
            linear-gradient(105deg, rgba(242,169,59,0.16) 0%, transparent 42%),
            linear-gradient(255deg, rgba(139,92,246,0.24) 0%, transparent 48%),
            linear-gradient(0deg, rgba(6,10,25,0.88) 6%, transparent 52%)` }} />

          {/* headline block */}
          <div style={{ position: 'absolute', left: 'clamp(20px,3vw,44px)', bottom: 'clamp(18px,3vh,36px)', right: 'clamp(20px,16vw,240px)' }}>
            <motion.h1 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(28px,4vw,56px)', lineHeight: 1.02, letterSpacing: '-0.02em', margin: 0 }}>
              DARE TO <span style={{ color: '#F2A93B' }}>DREAM.</span><br />
              DESIGNED TO <span style={{ background: `linear-gradient(90deg, ${CYAN}, ${VIOLET})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>FOCUS.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
              style={{ fontSize: 'clamp(12.5px,1.15vw,15.5px)', color: '#94A3B8', maxWidth: 460, lineHeight: 1.65, margin: '14px 0 18px' }}>
              The 10-second daily routine transforming Indian kids into goal achievers.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 15px', borderRadius: 20, background: 'rgba(242,169,59,0.14)', border: '1px solid rgba(242,169,59,0.35)', fontSize: 12.5, fontWeight: 800, color: '#FBBF24' }}>
                <Flame size={13} /> Streak: 12 Days
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 15px', borderRadius: 20, background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.32)', fontSize: 12.5, fontWeight: 800, color: '#67E8F9' }}>
                <Star size={13} /> 450 XP
              </span>
            </motion.div>
          </div>
        </motion.section>

        {/* RIGHT — the action hubs */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px,1.6vh,16px)', minHeight: 0, justifyContent: 'center' }}>

          {/* PARENT — AI insights */}
          <motion.div initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ ...glass, padding: 'clamp(14px,2vh,22px) clamp(16px,1.6vw,24px)' }}>
            <div style={{ ...cardLabel, color: '#67E8F9', marginBottom: 10 }}>
              <Zap size={13} /> AI Insights at a Glance <span style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 8px', borderRadius: 9, background: 'rgba(34,211,238,0.15)', letterSpacing: '0.08em' }}>PARENT</span>
            </div>
            <div style={{ fontSize: 'clamp(14px,1.25vw,17px)', fontWeight: 700, lineHeight: 1.45, color: '#F1F5F9' }}>
              "Aarav hit a <span style={{ color: '#FBBF24' }}>5-day focus streak</span> in Math!"
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginTop: 12, height: 34 }}>
              {[38, 52, 44, 66, 58, 82, 100].map((h, i) => (
                <motion.span key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.5 + i * 0.07 }}
                  style={{ flex: 1, borderRadius: 4, background: i === 6 ? `linear-gradient(180deg, ${CYAN}, ${VIOLET})` : 'rgba(255,255,255,0.16)' }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 6 }}>Focus minutes · last 7 days</div>
          </motion.div>

          {/* CHILD — log today's journey */}
          <motion.div initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.32, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ ...glass, padding: 'clamp(14px,2vh,22px) clamp(16px,1.6vw,24px)', borderColor: 'rgba(139,92,246,0.4)' }}>
            <div style={{ ...cardLabel, color: '#C4B5FD', marginBottom: 12 }}>
              🚀 Log Today's Journey <span style={{ marginLeft: 'auto', fontSize: 9, padding: '2px 8px', borderRadius: 9, background: 'rgba(139,92,246,0.2)', letterSpacing: '0.08em' }}>CHILD</span>
            </div>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderRadius: 15, cursor: 'pointer',
                  background: `linear-gradient(120deg, ${VIOLET}, #6D28D9)`, boxShadow: '0 6px 26px rgba(139,92,246,0.4)',
                }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', flexShrink: 0 }}>
                  <Mic size={18} color="#fff" />
                </span>
                <span>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: '#fff' }}>Tap to Voice Log</span>
                  <span style={{ display: 'block', fontSize: 11, color: '#DDD6FE' }}>Quick 10-second habit check</span>
                </span>
                <ArrowRight size={16} color="#EDE9FE" style={{ marginLeft: 'auto' }} />
              </motion.div>
            </Link>
          </motion.div>

          {/* TUTOR — feedback ticker */}
          <motion.div initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.44, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ ...glass, padding: 'clamp(12px,1.6vh,18px) clamp(16px,1.6vw,24px)' }}>
            <div style={{ ...cardLabel, color: '#94A3B8', marginBottom: 8 }}>
              <GraduationCap size={13} /> Tutor Feedback
            </div>
            <motion.div key={feedIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#CBD5E1', fontWeight: 600 }}>
              <span style={{ fontSize: 17 }}>{feed.icon}</span> {feed.text}
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', marginLeft: 'auto', boxShadow: '0 0 8px #34D399' }} className="pulse-dot" />
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* ── Bottom live ticker ──────────────────────────────────── */}
      <footer style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', gap: 14, padding: '10px clamp(18px,3.5vw,44px)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, color: '#34D399', flexShrink: 0 }}>
          <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} /> LIVE
        </span>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)' }}>
          <div className="lp-ticker-track" style={{ display: 'inline-block' }}>
            {[0, 1].map(k => (
              <span key={k} style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                52 families active today&nbsp;&nbsp;•&nbsp;&nbsp;420+ habits tracked this week&nbsp;&nbsp;•&nbsp;&nbsp;10-second voice logging&nbsp;&nbsp;•&nbsp;&nbsp;AI summaries for parents every evening&nbsp;&nbsp;•&nbsp;&nbsp;Olympiad-grade worksheet library&nbsp;&nbsp;•&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>
        <Link to="/login" style={{
          flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 20,
          fontSize: 12, fontWeight: 800, textDecoration: 'none', color: '#06202A',
          background: `linear-gradient(120deg, ${CYAN}, ${VIOLET})`,
        }}>
          Get the App <ArrowRight size={13} />
        </Link>
      </footer>

      <style>{`
        @keyframes lpFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
        .lp-float { animation: lpFloat 7s ease-in-out infinite; }
        @keyframes lpTicker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .lp-ticker-track { animation: lpTicker 26s linear infinite; }
        @media (max-width: 900px) {
          .lp-viewport { height: auto !important; min-height: 100vh; overflow: auto !important; }
          .lp-split { grid-template-columns: 1fr !important; }
          .lp-split > section:first-child { min-height: 64vh !important; }
        }
        @media (max-width: 480px) {
          .lp-try { display: none !important; }
        }
      `}</style>
    </div>
  )
}

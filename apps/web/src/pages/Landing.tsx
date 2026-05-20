import { motion } from 'framer-motion'
import { ArrowRight, Zap, Brain, Trophy, Users, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
})

const features = [
  { icon: Zap,    title: 'Log in 10 seconds',    desc: 'Voice or tap-based logging. Zero friction for children.',   color: '#D97706', bg: '#FFFBEB' },
  { icon: Brain,  title: 'AI Parent Summaries',  desc: 'Daily insights powered by AI — delivered the moment a child logs.', color: '#4F46E5', bg: '#EEF2FF' },
  { icon: Trophy, title: 'Gamified Learning',    desc: 'XP, streaks, levels, and badges keep kids genuinely motivated.', color: '#059669', bg: '#ECFDF5' },
  { icon: Users,  title: 'Tutor Integration',    desc: 'Tutors log sessions in 30 seconds. Parents see it instantly.', color: '#7C3AED', bg: '#F5F3FF' },
]

const stats = [
  { value: '10s',  label: 'Average log time'    },
  { value: '40%',  label: 'Log 3× per week'     },
  { value: '50+',  label: 'Families in beta'    },
]

const phases = [
  { phase: 'Phase 1', label: 'Daily Engine',    status: 'Live now',  color: '#059669' },
  { phase: 'Phase 2', label: 'Tutor Layer',     status: 'Month 4–6', color: '#4F46E5' },
  { phase: 'Phase 3', label: 'AI Insights',     status: 'Month 6–9', color: '#7C3AED' },
  { phase: 'Phase 4', label: 'Hardware Device', status: 'Month 9+',  color: '#9CA3AF' },
]

export default function Landing() {
  return (
    <div className="page-container">

      {/* Hero */}
      <motion.div {...fade(0)} style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
        <div className="badge badge-brand" style={{ margin: '0 auto 20px', display: 'inline-flex' }}>
          ✦ Phase 1 · Daily Engine · Live Demo
        </div>

        <h1 style={{ fontSize: 46, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, color: '#111827', marginBottom: 18 }}>
          Kids log in 10 seconds.
          <br />
          <span style={{ color: '#4F46E5' }}>Parents see everything.</span>
        </h1>

        <p style={{ fontSize: 17, color: '#6B7280', lineHeight: 1.7, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
          Master-Kids is a habit-forming progress tracking platform for children aged 5–14.
          Built for Indian families with AI-powered insights and frictionless daily logging.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/child" className="btn btn-primary" style={{ fontSize: 14, padding: '12px 28px' }}>
            Try Child View <ArrowRight size={15} />
          </Link>
          <Link to="/parent" className="btn btn-ghost" style={{ fontSize: 14, padding: '12px 28px' }}>
            See Parent Dashboard
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div {...fade(0.1)} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 56 }}>
        {stats.map((s) => (
          <div key={s.label} className="card" style={{ padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', color: '#4F46E5', marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Feature grid */}
      <motion.div {...fade(0.15)} style={{ marginBottom: 56 }}>
        <p className="label" style={{ marginBottom: 20, textAlign: 'center' }}>Platform capabilities</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div key={f.title} {...fade(0.1 + i * 0.06)} className="card" style={{ padding: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={18} color={f.color} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{f.desc}</div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Who it's for */}
      <motion.div {...fade(0.2)} className="card" style={{ padding: '32px', marginBottom: 48 }}>
        <p className="label" style={{ marginBottom: 20 }}>Who uses Master-Kids</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {[
            { emoji: '🧒', role: 'Children (5–14)', points: ['Log in one tap or voice', 'Earn XP and badges', 'Build daily habit'] },
            { emoji: '👨‍👩‍👦', role: 'Parents', points: ['AI daily summary at 6 PM', 'Subject & mood breakdown', 'Streak and level tracking'] },
            { emoji: '🎓', role: 'Tutors', points: ['Log sessions in 30 seconds', 'Auto-generated session notes', 'Visible to parent instantly'] },
          ].map(({ emoji, role, points }) => (
            <div key={role}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 10 }}>{role}</div>
              {points.map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6 }}>
                  <CheckCircle size={13} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Roadmap */}
      <motion.div {...fade(0.25)} className="card" style={{ padding: '28px 32px', marginBottom: 48 }}>
        <p className="label" style={{ marginBottom: 20 }}>Product roadmap</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {phases.map((p, i) => (
            <div key={p.phase} style={{ borderLeft: `3px solid ${p.color}`, paddingLeft: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 4 }}>{p.phase}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{p.label}</div>
              <div className="badge badge-gray" style={{ fontSize: 11 }}>{p.status}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div {...fade(0.3)} style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        borderRadius: 20, padding: '40px 32px', textAlign: 'center',
      }}>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 10 }}>
          Ready to transform learning habits?
        </h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>
          Join 50+ families already building consistent daily habits.
        </p>
        <Link to="/child" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#fff', color: '#4F46E5', padding: '12px 28px',
          borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'transform 0.15s',
        }}>
          Start Today <ArrowRight size={15} />
        </Link>
      </motion.div>
    </div>
  )
}

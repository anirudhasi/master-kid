import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, Crown, Gift, ShieldCheck, ChevronLeft, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/modules/identity'
import { subscriptionService, PLAN_PRICING, TRIAL_DAYS } from '@/services/subscriptionService'
import { PAYMENTS_TEST_SKIP } from '@/lib/env'

const P = '#6C63FF'
const PL = '#EEECFF'
const FONT = "'Nunito', 'Inter', sans-serif"

type Choice = 'trial' | 'monthly' | 'yearly' | 'skip'

// Per-child subscription gate. Rendered by AppShell for any child without an
// active subscription/trial. On success the subscriptionStore updates and the
// shell re-renders straight through to the child's app.
export default function Subscription() {
  const navigate = useNavigate()
  const { activeKidId, kids, goToProfiles } = useAuthStore()
  const kid = kids.find(k => k.id === activeKidId)
  const [busy, setBusy] = useState<Choice | null>(null)

  if (!kid) {
    // Defensive: no child in context — bounce back to profile picker.
    return null
  }

  const run = async (choice: Choice, fn: () => Promise<unknown>) => {
    setBusy(choice)
    try {
      await fn()
      // Store now reports active → AppShell falls through past the gate on re-render.
    } finally {
      setBusy(null)
    }
  }

  const startTrial = () => run('trial', () => subscriptionService.startFreeTrial(kid.id))
  const buy = (plan: 'monthly' | 'yearly') => run(plan, () => subscriptionService.subscribe(kid.id, plan))
  const skip = () => run('skip', () => subscriptionService.skipForTest(kid.id))

  const yearlySaving = Math.round((1 - PLAN_PRICING.yearly.inr / (PLAN_PRICING.monthly.inr * 12)) * 100)

  return (
    <div style={{ minHeight: '100vh', width: '100%', overflowY: 'auto', background: `linear-gradient(135deg,${PL} 0%,#E8E3FF 50%,#EDE9FE 100%)`, fontFamily: FONT }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 56px' }}>

        <button onClick={() => { goToProfiles(); navigate('/login') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 18, fontSize: 13, fontWeight: 700, fontFamily: FONT }}>
          <ChevronLeft size={15} /> Back to profiles
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 14px', background: `linear-gradient(135deg,${P},#9B59FF)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
            {kid.photoUrl ? <img src={kid.photoUrl} alt={kid.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 20 }} /> : kid.avatar}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 6 }}>
            Unlock {kid.name}'s journey
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
            Each child gets <strong style={{ color: '#0F172A' }}>{TRIAL_DAYS} days free</strong>. After that, keep everything for just ₹{PLAN_PRICING.monthly.inr}/month or ₹{PLAN_PRICING.yearly.inr}/year.
          </p>
        </div>

        {/* Free trial — primary */}
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={startTrial} disabled={busy !== null}
          style={{
            width: '100%', marginBottom: 16, padding: '20px 22px', borderRadius: 18, cursor: 'pointer',
            background: `linear-gradient(135deg,${P},#9B59FF)`, border: 'none', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 16, boxShadow: `0 8px 28px ${P}40`,
          }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Gift size={24} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>Start 1-month free trial</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Full access · no card needed · cancel anytime</div>
          </div>
          {busy === 'trial'
            ? <Loader2 size={20} color="#fff" className="mk-spin" />
            : <Sparkles size={20} color="#fff" />}
        </motion.button>

        {/* Paid plans */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <PlanCard
            title={PLAN_PRICING.monthly.label} price={PLAN_PRICING.monthly.inr} period="per month"
            icon={<Check size={20} color={P} />} busy={busy === 'monthly'} disabled={busy !== null}
            onClick={() => buy('monthly')} />
          <PlanCard
            title={PLAN_PRICING.yearly.label} price={PLAN_PRICING.yearly.inr} period="per year"
            badge={yearlySaving > 0 ? `Save ${yearlySaving}%` : undefined}
            icon={<Crown size={20} color="#D97706" />} highlight busy={busy === 'yearly'} disabled={busy !== null}
            onClick={() => buy('yearly')} />
        </div>

        {/* What's included */}
        <div style={{ padding: '16px 18px', borderRadius: 14, background: '#fff', border: '1px solid #E2E8F0', marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Every plan includes</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {['Class storyboard & achievements', 'Full subject repository & books', 'Olympiad practice sets', 'Knowledge games & daily feed', 'Coach & progress tracking', 'Parent dashboard & summaries'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#374151' }}>
                <ShieldCheck size={14} color={P} style={{ flexShrink: 0 }} /> {f}
              </div>
            ))}
          </div>
        </div>

        {/* UPI note (real settlement deferred) */}
        <p style={{ fontSize: 11.5, color: '#94A3B8', textAlign: 'center', marginBottom: 18, lineHeight: 1.6 }}>
          🔒 Payments are simulated in this build. Real UPI checkout (opens your UPI app) is coming soon.
        </p>

        {/* Test-only skip — gated by env flag */}
        {PAYMENTS_TEST_SKIP && (
          <div style={{ textAlign: 'center' }}>
            <button onClick={skip} disabled={busy !== null}
              style={{ background: 'none', border: '1px dashed #CBD5E1', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: '#94A3B8', fontSize: 12, fontWeight: 700, fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {busy === 'skip' && <Loader2 size={13} className="mk-spin" />}
              Skip for now (testing) →
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes mk-spin{to{transform:rotate(360deg)}}.mk-spin{animation:mk-spin 0.8s linear infinite}`}</style>
    </div>
  )
}

function PlanCard({ title, price, period, icon, badge, highlight, busy, disabled, onClick }: {
  title: string; price: number; period: string; icon: React.ReactNode
  badge?: string; highlight?: boolean; busy: boolean; disabled: boolean; onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
      onClick={onClick} disabled={disabled}
      style={{
        position: 'relative', padding: '20px 18px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
        background: '#fff', border: `2px solid ${highlight ? '#FCD34D' : '#E2E8F0'}`,
        boxShadow: highlight ? '0 6px 22px rgba(217,119,6,0.15)' : '0 2px 12px rgba(15,23,42,0.05)',
      }}>
      {badge && (
        <span style={{ position: 'absolute', top: -10, right: 14, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 8, background: '#FCD34D', color: '#78350F' }}>{badge}</span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {icon}<span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: '#0F172A' }}>₹{price}</span>
        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{period}</span>
      </div>
      <div style={{ marginTop: 12, height: 38, borderRadius: 10, background: highlight ? '#FEF3C7' : PL, color: highlight ? '#92400E' : P, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 800 }}>
        {busy ? <Loader2 size={15} className="mk-spin" /> : `Choose ${title}`}
      </div>
    </motion.button>
  )
}

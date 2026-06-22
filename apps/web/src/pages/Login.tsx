import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Shield, Users, Star, Sparkles, ChevronLeft, Plus, Trash2, Eye, Camera, LogOut } from 'lucide-react'
import { useAuthStore, type UserRole, type KidProfile } from '@/store/authStore'
import { useSubscriptionStore, isSubscriptionActive, daysRemaining, type Subscription } from '@/store/subscriptionStore'
import { isAdminPhone, verifyAdmin } from '@/lib/adminAuth'

// ── Design tokens (matches MasterKids_Login_Module_Spec) ───────────────────────
const P  = '#6C63FF'
const PS = 'rgba(108,99,255,0.35)'
const PL = '#EEECFF'
const FONT = "'Nunito', 'Inter', sans-serif"

const slide = (dir: 1 | -1 = 1) => ({
  initial:    { opacity: 0, x: 40 * dir },
  animate:    { opacity: 1, x: 0 },
  exit:       { opacity: 0, x: -40 * dir },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
})

// ── Countdown hook ─────────────────────────────────────────────────────────────
function useCountdown(until: number) {
  const [remaining, setRemaining] = useState(Math.max(0, until - Date.now()))
  useEffect(() => {
    if (until <= Date.now()) { setRemaining(0); return }
    const id = setInterval(() => {
      const left = Math.max(0, until - Date.now())
      setRemaining(left)
      if (left <= 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [until])
  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return { remaining, mins, secs, done: remaining <= 0 }
}

// ── Step 1 — Phone entry ───────────────────────────────────────────────────────
function PhoneStep() {
  const navigate = useNavigate()
  const { submitPhone, adminLogin } = useAuthStore()
  const [raw, setRaw]   = useState('')
  const [err, setErr]   = useState('')
  const [otp, setOtp]   = useState('')
  const [sent, setSent] = useState(false)
  const [pw, setPw]       = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  const digits  = raw.replace(/\D/g, '').slice(0, 10)
  const display = digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits
  const valid   = digits.length === 10
  const adminMode = isAdminPhone(digits)

  const handleAdmin = async () => {
    setPwBusy(true)
    const ok = await verifyAdmin(digits, pw)
    setPwBusy(false)
    if (ok) { adminLogin(); navigate('/admin') }
    else setPwErr('Incorrect admin password.')
  }

  const handleSend = async () => {
    if (!valid) { setErr('Please enter a valid 10-digit mobile number.'); return }
    const result = await submitPhone(`+91 ${display}`)
    if (result.error) { setErr(result.error); return }
    if (result.locked) {
      const mins = Math.ceil((result.lockedUntil - Date.now()) / 60000)
      setErr(`Too many resend attempts. Try again in ${mins} min.`)
      return
    }
    setOtp(result.otp)
    setSent(true)
    setErr('')
    // submitPhone sets step → 'otp', component transitions out via AnimatePresence
  }

  return (
    <motion.div {...slide(1)} style={{ fontFamily: FONT }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 24, margin: '0 auto 16px',
          background: `linear-gradient(135deg,${P},#9B59FF)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, boxShadow: `0 8px 32px ${PS}`,
        }}>📱</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 6, fontFamily: FONT }}>
          Welcome to Master-Kids
        </h2>
        <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6 }}>
          Enter your mobile number to sign in or create a new account
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
          Mobile Number
        </label>
        <div style={{
          display: 'flex', borderRadius: 10, overflow: 'hidden',
          border: `1.5px solid ${err ? '#FECACA' : valid && digits.length > 0 ? P + '80' : '#DCE8F5'}`,
          transition: 'border-color 0.2s', height: 54,
        }}>
          <div style={{ padding: '0 14px', background: '#F8FAFC', borderRight: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>🇮🇳</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#374151', fontFamily: FONT }}>+91</span>
          </div>
          <input
            value={display}
            onChange={e => { setRaw(e.target.value); setErr(''); setSent(false) }}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="98765 43210"
            inputMode="numeric"
            style={{
              flex: 1, border: 'none', outline: 'none', padding: '0 16px',
              fontSize: 17, fontWeight: 700, color: '#0F172A',
              letterSpacing: '0.06em', background: '#fff', fontFamily: FONT,
            }}
          />
          {valid && (
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
            </div>
          )}
        </div>
        {err && <p style={{ fontSize: 11.5, color: '#DC2626', marginTop: 5, fontWeight: 600 }}>{err}</p>}
      </div>

      {adminMode ? (
        <div>
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#EEF2FF', border: '1px solid #C7D2FE', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color={P} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#3730A3', fontFamily: FONT }}>Admin account — enter your password</span>
          </div>
          <input type="password" value={pw} onChange={e => { setPw(e.target.value); setPwErr('') }} onKeyDown={e => e.key === 'Enter' && handleAdmin()} placeholder="Admin password" autoFocus
            style={{ width: '100%', height: 54, borderRadius: 12, border: `1.5px solid ${pwErr ? '#FECACA' : '#DCE8F5'}`, padding: '0 16px', fontSize: 15, fontWeight: 600, color: '#0F172A', outline: 'none', fontFamily: FONT, boxSizing: 'border-box', marginBottom: pwErr ? 6 : 12 }} />
          {pwErr && <p style={{ fontSize: 11.5, color: '#DC2626', marginBottom: 10, fontWeight: 600 }}>{pwErr}</p>}
          <button onClick={handleAdmin} disabled={!pw || pwBusy}
            style={{ width: '100%', height: 54, borderRadius: 12, border: 'none', background: pw ? 'linear-gradient(135deg,#0F172A,#312E81)' : '#E2E8F0', color: pw ? '#fff' : '#94A3B8', fontSize: 15, fontWeight: 800, cursor: pw && !pwBusy ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: FONT }}>
            <Shield size={15} /> {pwBusy ? 'Verifying…' : 'Sign in as Admin'}
          </button>
        </div>
      ) : (
        <>
          {sent && otp && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '12px 16px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>🔑</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', fontFamily: FONT }}>Beta OTP for +91 {display}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#D97706', letterSpacing: '0.2em', fontFamily: FONT }}>{otp}</div>
                <div style={{ fontSize: 10, color: '#B45309' }}>SMS is disabled in beta · or type 000000</div>
              </div>
            </motion.div>
          )}

          <button
            onClick={handleSend}
            disabled={!valid}
            style={{
              width: '100%', height: 54, borderRadius: 12, border: 'none',
              background: valid ? `linear-gradient(135deg,${P},#9B59FF)` : '#E2E8F0',
              color: valid ? '#fff' : '#94A3B8', fontSize: 15, fontWeight: 800,
              cursor: valid ? 'pointer' : 'not-allowed',
              boxShadow: valid ? `0 4px 20px ${PS}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s', fontFamily: FONT,
            }}>
            <Phone size={15} />
            {sent ? 'Resend OTP' : 'Send OTP'}
          </button>
        </>
      )}

      <p style={{ fontSize: 11.5, color: '#94A3B8', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
        By continuing, you agree to our{' '}
        <span style={{ color: P, fontWeight: 700, cursor: 'pointer' }}>Terms of Service</span>
        {' '}and{' '}
        <span style={{ color: P, fontWeight: 700, cursor: 'pointer' }}>Privacy Policy</span>
      </p>
    </motion.div>
  )
}

// ── Step 2 — OTP verification ──────────────────────────────────────────────────
function OtpStep({ onBack }: { onBack: () => void }) {
  const { phone, demoOtp, verifyOtp, pendingPhone, phoneAttempts } = useAuthStore()
  const ref0 = useRef<HTMLInputElement>(null)
  const ref1 = useRef<HTMLInputElement>(null)
  const ref2 = useRef<HTMLInputElement>(null)
  const ref3 = useRef<HTMLInputElement>(null)
  const ref4 = useRef<HTMLInputElement>(null)
  const ref5 = useRef<HTMLInputElement>(null)
  const boxRefs = [ref0, ref1, ref2, ref3, ref4, ref5]

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [err, setErr]       = useState('')
  const [shake, setShake]   = useState(false)
  const [resendTimer, setResendTimer] = useState(30)

  const attempts = phoneAttempts[pendingPhone] ?? { failedOtpCount: 0, otpLockedUntil: 0, resendCount: 0, resendLockedUntil: 0 }
  const lockCountdown = useCountdown(attempts.otpLockedUntil)
  const isOtpLocked   = !lockCountdown.done
  const attemptsLeft  = Math.max(0, 5 - attempts.failedOtpCount)

  useEffect(() => { if (!isOtpLocked) ref0.current?.focus() }, [isOtpLocked])
  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) boxRefs[i - 1].current?.focus()
  }

  const handleChange = (i: number, val: string) => {
    const v    = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i]    = v
    setDigits(next)
    setErr('')
    if (v && i < 5) boxRefs[i + 1].current?.focus()
    if (next.every(d => d !== '') && next.join('').length === 6) handleVerify(next.join(''))
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next   = Array.from({ length: 6 }, (_, i) => pasted[i] ?? '')
    setDigits(next)
    if (pasted.length === 6) handleVerify(pasted)
    else boxRefs[Math.min(pasted.length, 5)].current?.focus()
  }

  const handleVerify = async (code: string) => {
    const result = await verifyOtp(code)
    if (result.success) return  // step changes → component transitions out
    if (result.locked) {
      setErr('Account locked. Too many wrong attempts.')
      setDigits(['', '', '', '', '', ''])
      return
    }
    setErr(`Incorrect OTP. ${result.attemptsLeft} attempt${result.attemptsLeft !== 1 ? 's' : ''} left.`)
    setShake(true)
    setTimeout(() => setShake(false), 500)
    setDigits(['', '', '', '', '', ''])
    ref0.current?.focus()
  }

  // Locked state — show countdown instead of OTP boxes
  if (isOtpLocked) {
    return (
      <motion.div {...slide(1)} style={{ fontFamily: FONT, textAlign: 'center' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
          <ChevronLeft size={14} /> Back
        </button>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: '#FEF2F2', border: '2px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>
          🔒
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 8, fontFamily: FONT }}>Account Temporarily Locked</h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
          Too many incorrect OTP attempts. Your account is locked for security.
        </p>
        <div style={{ padding: '20px', borderRadius: 16, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Try again in</div>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#DC2626', letterSpacing: '0.08em', fontFamily: FONT }}>
            {String(lockCountdown.mins).padStart(2, '0')}:{String(lockCountdown.secs).padStart(2, '0')}
          </div>
        </div>
        <p style={{ fontSize: 11.5, color: '#94A3B8' }}>
          Need help?{' '}
          <span style={{ color: P, fontWeight: 700, cursor: 'pointer' }}>Contact Support</span>
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div {...slide(1)} style={{ fontFamily: FONT }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, fontSize: 12, fontWeight: 700, fontFamily: FONT }}>
        <ChevronLeft size={14} /> Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🔐</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 6, fontFamily: FONT }}>
          Enter Verification Code
        </h2>
        <p style={{ fontSize: 13, color: '#64748B' }}>
          Sent to <strong style={{ color: '#0F172A' }}>{phone}</strong>
        </p>
        {attemptsLeft < 5 && attemptsLeft > 0 && (
          <p style={{ fontSize: 12, color: '#DC2626', marginTop: 8, fontWeight: 700 }}>
            ⚠️ {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before lockout
          </p>
        )}
      </div>

      {demoOtp && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#92400E', fontWeight: 700, fontFamily: FONT }}>Beta OTP</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#D97706', letterSpacing: '0.2em', fontFamily: FONT }}>{demoOtp}</div>
          <div style={{ fontSize: 10, color: '#B45309' }}>SMS disabled in beta · or type 000000</div>
        </div>
      )}

      <motion.div
        animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={boxRefs[i]}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            inputMode="numeric"
            maxLength={1}
            style={{
              width: 48, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 900,
              border: `2px solid ${d ? P : err ? '#FECACA' : '#E2E8F0'}`,
              borderRadius: 12, outline: 'none', color: '#0F172A', fontFamily: FONT,
              background: d ? PL : '#fff', transition: 'all 0.15s',
              boxShadow: d ? `0 0 0 3px ${PS}` : 'none',
            }}
          />
        ))}
      </motion.div>

      {err && <p style={{ textAlign: 'center', fontSize: 12, color: '#DC2626', fontWeight: 700, marginBottom: 14, fontFamily: FONT }}>{err}</p>}

      <button
        onClick={() => handleVerify(digits.join(''))}
        disabled={digits.join('').length !== 6}
        style={{
          width: '100%', height: 54, borderRadius: 12, border: 'none',
          background: digits.join('').length === 6 ? `linear-gradient(135deg,${P},#9B59FF)` : '#E2E8F0',
          color: digits.join('').length === 6 ? '#fff' : '#94A3B8',
          fontSize: 15, fontWeight: 800,
          cursor: digits.join('').length === 6 ? 'pointer' : 'not-allowed',
          boxShadow: digits.join('').length === 6 ? `0 4px 20px ${PS}` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s', marginBottom: 16, fontFamily: FONT,
        }}>
        <Shield size={15} /> Verify &amp; Continue
      </button>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', fontFamily: FONT }}>
        {resendTimer > 0
          ? `Resend OTP in ${resendTimer}s`
          : <span style={{ color: P, fontWeight: 700, cursor: 'pointer' }} onClick={() => setResendTimer(30)}>
              Resend OTP
            </span>
        }
      </p>
    </motion.div>
  )
}

// ── Step 3 — New user profile setup ───────────────────────────────────────────
const ROLE_OPTIONS: Array<{ role: UserRole; icon: string; label: string; sub: string }> = [
  { role: 'PARENT',  icon: '👪', label: 'Parent',  sub: "I manage my children's learning" },
  { role: 'STUDENT', icon: '📚', label: 'Student', sub: 'I track my own progress' },
  { role: 'TEACHER', icon: '👨‍🏫', label: 'Teacher', sub: 'I log sessions & homework' },
  { role: 'COACH',   icon: '🏆', label: 'Coach',   sub: 'I track training & activities' },
]

function SetupStep() {
  const { completeSetup, phone } = useAuthStore()
  const [name, setName]           = useState('')
  const [avatar, setAvatar]       = useState('👨')
  const [photoUrl, setPhotoUrl]   = useState<string | undefined>()
  const [role, setRole]           = useState<UserRole>('PARENT')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const parentAvatars = ['👨', '👩', '🧑', '👴', '👵', '👨‍💼', '👩‍💼', '🧑‍🎓']

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => { setPhotoUrl(reader.result as string); setUploading(false) }
    reader.readAsDataURL(file)
  }

  const handleCreate = () => {
    if (!name.trim()) return
    completeSetup(name.trim(), avatar, role, photoUrl)
  }

  return (
    <motion.div {...slide(1)} style={{ fontFamily: FONT }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>👋</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 6, fontFamily: FONT }}>
          Let's set up your account
        </h2>
        <p style={{ fontSize: 13, color: '#64748B' }}>
          New account for <strong style={{ color: '#0F172A' }}>{phone}</strong>
        </p>
      </div>

      {/* Photo / avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: 88, height: 88, borderRadius: 24, cursor: 'pointer',
            background: photoUrl ? 'transparent' : PL,
            border: `2.5px dashed ${P}60`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, overflow: 'hidden', position: 'relative', flexShrink: 0,
            transition: 'border-color 0.2s',
          }}>
          {photoUrl
            ? <img src={photoUrl} alt="you" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (uploading ? '⏳' : avatar)}
          <div style={{
            position: 'absolute', bottom: 4, right: 4,
            width: 22, height: 22, background: P, borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={12} color="#fff" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, fontFamily: FONT }}>
          {photoUrl ? 'Tap to change photo' : 'Tap to add photo (optional)'}
        </span>
        {photoUrl && (
          <button onClick={() => setPhotoUrl(undefined)} style={{ fontSize: 10, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2, fontWeight: 700, fontFamily: FONT }}>
            Remove photo
          </button>
        )}
      </div>

      {/* Avatar picker */}
      {!photoUrl && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT }}>
            Choose Avatar
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {parentAvatars.map(a => (
              <button key={a} onClick={() => setAvatar(a)}
                style={{
                  width: 44, height: 44, borderRadius: 11,
                  border: avatar === a ? `2.5px solid ${P}` : '1.5px solid #E2E8F0',
                  background: avatar === a ? PL : '#fff', fontSize: 24, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>{a}</button>
            ))}
          </div>
        </div>
      )}

      {/* Name */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT }}>
          Your Full Name *
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="e.g. Rahul Sharma"
          autoFocus
          style={{
            width: '100%', padding: '13px 16px', borderRadius: 12,
            border: `1.5px solid ${name.trim() ? P + '80' : '#DCE8F5'}`,
            fontSize: 15, fontWeight: 600, color: '#0F172A', fontFamily: FONT,
            outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
          }}
        />
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 5, fontFamily: FONT }}>
          This is your display name — visible to you only
        </p>
      </div>

      {/* Role picker */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT }}>
          I am a… *
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ROLE_OPTIONS.map(opt => (
            <button
              key={opt.role}
              onClick={() => setRole(opt.role)}
              style={{
                padding: '14px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                border: role === opt.role ? `2px solid ${P}` : '1.5px solid #E2E8F0',
                background: role === opt.role ? PL : '#fff',
                transition: 'all 0.15s', boxShadow: role === opt.role ? `0 0 0 3px ${PS}` : 'none',
              }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{opt.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: role === opt.role ? P : '#0F172A', fontFamily: FONT }}>{opt.label}</div>
              <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, lineHeight: 1.4, fontFamily: FONT }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleCreate}
        disabled={!name.trim()}
        style={{
          width: '100%', height: 54, borderRadius: 12, border: 'none',
          background: name.trim() ? `linear-gradient(135deg,${P},#9B59FF)` : '#E2E8F0',
          color: name.trim() ? '#fff' : '#94A3B8', fontSize: 15, fontWeight: 800,
          cursor: name.trim() ? 'pointer' : 'not-allowed',
          boxShadow: name.trim() ? `0 4px 20px ${PS}` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s', fontFamily: FONT,
        }}>
        <Sparkles size={15} />
        Create My Account
      </button>
    </motion.div>
  )
}

// Small subscription chip for a kid card: trial countdown / active / lapsed.
function getSubChip(sub?: Subscription): { label: string; bg: string; color: string } | null {
  if (!sub) return { label: 'No plan', bg: '#FEE2E2', color: '#B91C1C' }
  if (sub.status === 'skipped_test') return { label: 'Test access', bg: '#E0E7FF', color: '#4338CA' }
  if (!isSubscriptionActive(sub)) return { label: 'Expired', bg: '#FEE2E2', color: '#B91C1C' }
  if (sub.status === 'trialing') {
    const d = daysRemaining(sub)
    return { label: `Trial · ${d}d left`, bg: '#DCFCE7', color: '#15803D' }
  }
  return { label: sub.plan === 'yearly' ? 'Yearly' : 'Active', bg: '#DCFCE7', color: '#15803D' }
}

// ── Step 4 — Profile selection ─────────────────────────────────────────────────
function ProfilesStep() {
  const navigate = useNavigate()
  const { adminName, adminAvatar, adminPhotoUrl, kids, selectProfile, addKid, removeKid, logout, phone, role } = useAuthStore()
  const subs = useSubscriptionStore(s => s.subs)
  const [showAdd, setShowAdd]       = useState(false)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [uploading, setUploading]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', grade: 'Grade 4', age: '9', school: '', board: 'CBSE',
    avatar: '👧', color: P, colorLight: PL, photoUrl: undefined as string | undefined,
  })

  const kidAvatars = ['👧', '👦', '🧒', '🧑', '👩', '🎓', '🌟', '🦋', '🐬', '🦁', '🐯', '🚀']
  const colorOpts  = [
    { color: P,        light: PL        },
    { color: '#059669', light: '#ECFDF5' },
    { color: '#DC2626', light: '#FFF5F5' },
    { color: '#D97706', light: '#FFFBEB' },
    { color: '#7C3AED', light: '#F5F3FF' },
    { color: '#0891B2', light: '#ECFEFF' },
    { color: '#BE185D', light: '#FDF2F8' },
    { color: '#EA580C', light: '#FFF7ED' },
  ]

  const handleChildPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => { setForm(f => ({ ...f, photoUrl: reader.result as string })); setUploading(false) }
    reader.readAsDataURL(file)
  }

  const handleSelect = (kidId: string | null) => {
    selectProfile(kidId)
    navigate(kidId === null ? '/parent' : '/child')
  }

  const handleAdd = () => {
    if (!form.name.trim()) return
    addKid({
      name: form.name.trim(),
      grade: form.grade,
      age: parseInt(form.age) || 9,
      school: form.school.trim(),
      avatar: form.avatar,
      color: form.color,
      colorLight: form.colorLight,
      board: form.board,
      xpTotal: 0,
      streakDays: 0,
      photoUrl: form.photoUrl,
    })
    setForm({ name: '', grade: 'Grade 4', age: '9', school: '', board: 'CBSE', avatar: '👧', color: P, colorLight: PL, photoUrl: undefined })
    setShowAdd(false)
  }

  const getLevel = (xp: number) => {
    if (xp >= 1500) return { name: 'Champion', emoji: '🏆' }
    if (xp >= 500)  return { name: 'Scholar',  emoji: '⭐' }
    if (xp >= 100)  return { name: 'Learner',  emoji: '📚' }
    return                 { name: 'Explorer', emoji: '🌱' }
  }

  const roleLabel = role === 'TEACHER' ? 'Teacher' : role === 'COACH' ? 'Coach' : role === 'STUDENT' ? 'Student' : 'Parent'

  return (
    <motion.div {...slide(1)} style={{ fontFamily: FONT }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 4, fontFamily: FONT }}>
          Who's using Master-Kids?
        </h2>
        <p style={{ fontSize: 13, color: '#64748B' }}>Select a profile to continue</p>
      </div>

      {/* Admin card */}
      <motion.button
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        onClick={() => handleSelect(null)}
        style={{
          width: '100%', marginBottom: 14, padding: '16px 18px', borderRadius: 14,
          background: 'linear-gradient(135deg,#1E293B,#2D2659)',
          border: `1.5px solid ${P}40`,
          cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 4px 20px rgba(15,23,42,0.2)',
        }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
          background: `linear-gradient(135deg,${P},#9B59FF)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, boxShadow: `0 4px 12px ${PS}`,
        }}>
          {adminPhotoUrl
            ? <img src={adminPhotoUrl} alt={adminName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : adminAvatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9', marginBottom: 3, fontFamily: FONT }}>{adminName}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT }}>{roleLabel} · Admin Access · {kids.length} kid{kids.length !== 1 ? 's' : ''}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {['Dashboards', 'Reports', 'Tutors', 'Settings'].map(tag => (
              <span key={tag} style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 8, background: `${P}30`, color: '#B8B3FF', fontWeight: 700, fontFamily: FONT }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <Shield size={16} color="#B8B3FF" style={{ flexShrink: 0 }} />
      </motion.button>

      {/* Kids section */}
      {kids.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, fontFamily: FONT }}>CHILDREN</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {kids.map(kid => {
              const lv  = getLevel(kid.xpTotal)
              const nxp = kid.xpTotal >= 1500 ? 9999 : kid.xpTotal >= 500 ? 1500 : kid.xpTotal >= 100 ? 500 : 100
              const px  = kid.xpTotal >= 1500 ? 1500 : kid.xpTotal >= 500 ? 500 : kid.xpTotal >= 100 ? 100 : 0
              const pct = Math.min(100, Math.round(((kid.xpTotal - px) / (nxp - px)) * 100))
              const subChip = getSubChip(subs[kid.id])

              return (
                <div key={kid.id} style={{ position: 'relative' }}>
                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelect(kid.id)}
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: 14,
                      background: '#fff', border: `1.5px solid ${kid.color}30`,
                      cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                      boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
                    }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                      background: kid.colorLight, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 26, border: `2px solid ${kid.color}20`, overflow: 'hidden',
                    }}>
                      {kid.photoUrl
                        ? <img src={kid.photoUrl} alt={kid.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : kid.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: FONT }}>{kid.name}</span>
                        <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 8, background: kid.colorLight, color: kid.color, fontWeight: 700, fontFamily: FONT }}>{kid.grade}</span>
                        {!kid.isOnboarded && (
                          <span style={{ fontSize: 9.5, padding: '1px 7px', borderRadius: 8, background: '#FEF3C7', color: '#D97706', fontWeight: 700, fontFamily: FONT }}>Setup needed</span>
                        )}
                        {subChip && (
                          <span style={{ fontSize: 9.5, padding: '1px 7px', borderRadius: 8, background: subChip.bg, color: subChip.color, fontWeight: 700, fontFamily: FONT }}>{subChip.label}</span>
                        )}
                      </div>
                      {kid.school ? (
                        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FONT }}>
                          {kid.school} · {kid.board}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6, fontFamily: FONT }}>{kid.board}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: kid.color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10, color: kid.color, fontWeight: 700, flexShrink: 0, fontFamily: FONT }}>{lv.emoji} {kid.xpTotal} XP</span>
                        {kid.streakDays > 0 && <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 700, flexShrink: 0 }}>🔥 {kid.streakDays}d</span>}
                      </div>
                    </div>
                    <Eye size={14} color="#CBD5E1" style={{ flexShrink: 0 }} />
                  </motion.button>

                  {confirmDel === kid.id ? (
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                      <button onClick={() => { removeKid(kid.id); setConfirmDel(null) }}
                        style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: FONT }}>
                        Delete
                      </button>
                      <button onClick={() => setConfirmDel(null)}
                        style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: '#F1F5F9', color: '#64748B', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setConfirmDel(kid.id) }}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 4, borderRadius: 6 }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Add child */}
      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 14, marginBottom: 12,
            background: '#FAFBFF', border: `2px dashed ${P}50`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: P, fontSize: 13, fontWeight: 700, transition: 'all 0.15s', fontFamily: FONT,
          }}>
          <Plus size={16} />
          {kids.length === 0 ? 'Add Your First Child' : 'Add Another Child'}
        </button>
      )}

      {/* Add child form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ padding: '18px 16px', borderRadius: 14, background: '#F8FAFF', border: `1.5px solid ${P}30` }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 16, fontFamily: FONT }}>Add Child Profile</div>

              {/* Child photo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: 64, height: 64, borderRadius: 16, cursor: 'pointer', flexShrink: 0,
                    background: form.photoUrl ? 'transparent' : form.colorLight,
                    border: `2px dashed ${form.color}80`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, overflow: 'hidden', position: 'relative',
                  }}>
                  {form.photoUrl
                    ? <img src={form.photoUrl} alt="child" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (uploading ? '⏳' : form.avatar)}
                  <div style={{ position: 'absolute', bottom: 2, right: 2, width: 18, height: 18, background: form.color, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={10} color="#fff" />
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleChildPhoto} style={{ display: 'none' }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, fontFamily: FONT }}>Child's Photo</div>
                  <button onClick={() => fileRef.current?.click()} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, border: `1px solid ${form.color}50`, background: form.colorLight, color: form.color, cursor: 'pointer', fontWeight: 700, fontFamily: FONT }}>
                    {form.photoUrl ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {form.photoUrl && (
                    <button onClick={() => setForm(f => ({ ...f, photoUrl: undefined }))} style={{ marginLeft: 6, fontSize: 11, padding: '4px 10px', borderRadius: 7, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', cursor: 'pointer', fontWeight: 700, fontFamily: FONT }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Avatar picker */}
              {!form.photoUrl && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT }}>Avatar</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {kidAvatars.map(a => (
                      <button key={a} onClick={() => setForm(f => ({ ...f, avatar: a }))}
                        style={{
                          width: 36, height: 36, borderRadius: 9,
                          border: form.avatar === a ? `2px solid ${form.color}` : '1.5px solid #E2E8F0',
                          background: form.avatar === a ? form.colorLight : '#fff',
                          fontSize: 18, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{a}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color picker */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT }}>Profile Color</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {colorOpts.map(c => (
                    <button key={c.color} onClick={() => setForm(f => ({ ...f, color: c.color, colorLight: c.light }))}
                      style={{ width: 26, height: 26, borderRadius: '50%', background: c.color, cursor: 'pointer', border: 'none', outline: form.color === c.color ? `3px solid ${c.color}` : '2px solid transparent', outlineOffset: 2 }} />
                  ))}
                </div>
              </div>

              {/* Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4, fontFamily: FONT }}>Child's Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Priya"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${form.name.trim() ? form.color + '80' : '#DCE8F5'}`, fontSize: 13, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4, fontFamily: FONT }}>Age</label>
                  <input value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    placeholder="9" inputMode="numeric"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #DCE8F5', fontSize: 13, fontFamily: FONT, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4, fontFamily: FONT }}>Grade</label>
                  <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #DCE8F5', fontSize: 13, fontFamily: FONT, outline: 'none', background: '#fff' }}>
                    {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(g => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4, fontFamily: FONT }}>Board</label>
                  <select value={form.board} onChange={e => setForm(f => ({ ...f, board: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #DCE8F5', fontSize: 13, fontFamily: FONT, outline: 'none', background: '#fff' }}>
                    {['CBSE','ICSE','IB','State Board'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4, fontFamily: FONT }}>School Name</label>
                  <input value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))}
                    placeholder="School name (optional)"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #DCE8F5', fontSize: 13, fontFamily: FONT, outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleAdd} disabled={!form.name.trim()}
                  style={{
                    flex: 2, padding: '10px 0', borderRadius: 9, border: 'none',
                    background: form.name.trim() ? form.color : '#E2E8F0',
                    color: form.name.trim() ? '#fff' : '#94A3B8',
                    cursor: form.name.trim() ? 'pointer' : 'not-allowed', fontWeight: 800, fontSize: 13, fontFamily: FONT,
                  }}>
                  <Sparkles size={13} style={{ display: 'inline', marginRight: 5 }} />
                  Create Profile
                </button>
                <button onClick={() => setShowAdd(false)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: '1px solid #DCE8F5', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#64748B', fontFamily: FONT }}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign out */}
      <button onClick={logout}
        style={{
          width: '100%', padding: '10px 0', borderRadius: 10, border: '1px solid #E2E8F0',
          background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 7, color: '#94A3B8', fontSize: 12, fontWeight: 600, fontFamily: FONT,
        }}>
        <LogOut size={13} /> Sign out from {phone}
      </button>
    </motion.div>
  )
}

// ── Features list ──────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '📚', text: 'Full CBSE/ICSE Syllabus tracking' },
  { icon: '🏆', text: 'Olympiad prep — IMO, NSO, IEO' },
  { icon: '🤖', text: 'AI Tutor Miko — 24×7 doubt clearing' },
  { icon: '📅', text: 'Complete weekly schedule & study slots' },
  { icon: '📝', text: 'Online worksheets + answer sheet grading' },
  { icon: '🔥', text: 'XP, streaks & badges gamification' },
  { icon: '👪', text: 'Parent dashboard with AI summaries' },
  { icon: '🎨', text: 'Extra-curricular activity tracking' },
]

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepDots({ step }: { step: string }) {
  const index = step === 'phone' ? 0 : step === 'otp' ? 1 : 2
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 3,
          background: index >= i ? P : '#E2E8F0',
          transition: 'background 0.4s',
        }} />
      ))}
    </div>
  )
}

// ── Root Login page ────────────────────────────────────────────────────────────
export default function Login() {
  const { step } = useAuthStore()
  const goBack   = () => useAuthStore.setState({ step: 'phone', demoOtp: '' })

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-right { width: 100% !important; padding: 32px 24px !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg,${PL} 0%,#E8E3FF 50%,#EDE9FE 100%)`, display: 'flex', alignItems: 'stretch' }}>

        {/* ── Left branding panel ──────────────────────── */}
        <div
          className="login-left"
          style={{
            flex: 1, background: 'linear-gradient(160deg,#1E293B 0%,#0F172A 60%,#1E1545 100%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '48px 48px', minWidth: 0, fontFamily: FONT,
          }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg,${P},#9B59FF)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: `0 4px 16px ${PS}` }}>
              <span style={{ fontWeight: 900, color: '#fff', fontSize: 18, fontFamily: FONT }}>M</span>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.03em', fontFamily: FONT }}>Master-Kids</div>
              <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase' }}>Cradle to Career</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 16, fontFamily: FONT }}>
              Your child's complete<br />
              <span style={{ background: `linear-gradient(90deg,${P},#C084FC)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                learning journey
              </span><br />in one place.
            </div>
            <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.8, maxWidth: 360, marginBottom: 32, fontFamily: FONT }}>
              Track syllabus, schedule activities, prep for olympiads, and get AI-powered insights — for every child in your family.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FEATURES.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.4 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: `${P}20`, border: `1px solid ${P}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{f.icon}</div>
                  <span style={{ fontSize: 12.5, color: '#CBD5E1', fontWeight: 500, fontFamily: FONT }}>{f.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex' }}>
              {['👨‍👩‍👧', '👨‍👩‍👦', '👩‍👧', '👨‍👦', '👨‍👩‍👧‍👦'].map((e, i) => (
                <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginLeft: i > 0 ? -8 : 0 }}>{e}</div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={11} fill="#FBBF24" color="#FBBF24" />)}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: FONT }}>
                <strong style={{ color: '#94A3B8' }}>2,500+ families</strong> tracking progress
              </div>
            </div>
          </div>
        </div>

        {/* ── Right auth panel ─────────────────────────── */}
        <div
          className="login-right"
          style={{
            width: 480, flexShrink: 0, background: '#fff',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '48px 44px', overflowY: 'auto', fontFamily: FONT,
          }}>

          {step !== 'profiles' && <StepDots step={step} />}

          <AnimatePresence mode="wait">
            {step === 'phone'    && <motion.div key="phone"    {...slide(1)}><PhoneStep /></motion.div>}
            {step === 'otp'      && <motion.div key="otp"      {...slide(1)}><OtpStep onBack={goBack} /></motion.div>}
            {step === 'setup'    && <motion.div key="setup"    {...slide(1)}><SetupStep /></motion.div>}
            {step === 'profiles' && <motion.div key="profiles" {...slide(1)}><ProfilesStep /></motion.div>}
          </AnimatePresence>

          {step === 'phone' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '10px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <Users size={13} color="#94A3B8" />
              <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: FONT }}>
                <strong style={{ color: '#0F172A' }}>2,500+ families</strong> across 12 cities · CBSE, ICSE &amp; IB
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

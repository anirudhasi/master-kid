import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, ArrowRight, Shield, Users, Star, Sparkles, ChevronLeft, Plus, Trash2, LogOut, Eye, Camera } from 'lucide-react'
import { useAuthStore, type KidProfile } from '@/store/authStore'

const slide = (dir: 1 | -1 = 1) => ({
  initial:    { opacity: 0, x: 40 * dir },
  animate:    { opacity: 1, x: 0 },
  exit:       { opacity: 0, x: -40 * dir },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
})

// ── Step 1 — Phone entry ───────────────────────────────────────────────────────
function PhoneStep() {
  const { submitPhone } = useAuthStore()
  const [raw, setRaw]   = useState('')
  const [err, setErr]   = useState('')
  const [otp, setOtp]   = useState('')
  const [sent, setSent] = useState(false)

  const digits  = raw.replace(/\D/g, '').slice(0, 10)
  const display = digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits
  const valid   = digits.length === 10

  const handleSend = () => {
    if (!valid) { setErr('Please enter a valid 10-digit mobile number.'); return }
    const code = submitPhone(`+91 ${display}`)
    setOtp(code)
    setSent(true)
    setErr('')
  }

  return (
    <motion.div {...slide(1)}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
          background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, boxShadow: '0 8px 32px rgba(79,70,229,0.35)',
        }}>📱</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 6 }}>
          Welcome to Master-Kids
        </h2>
        <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6 }}>
          Enter your mobile number to sign in or create a new account
        </p>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
          Mobile Number
        </label>
        <div style={{ display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${err ? '#FECACA' : valid && digits.length > 0 ? '#A5B4FC' : '#DCE8F5'}`, transition: 'border-color 0.2s' }}>
          <div style={{ padding: '14px 14px', background: '#F8FAFC', borderRight: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>🇮🇳</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>+91</span>
          </div>
          <input
            value={display}
            onChange={e => { setRaw(e.target.value); setErr(''); setSent(false) }}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="98765 43210"
            inputMode="numeric"
            style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 16px', fontSize: 17, fontWeight: 600, color: '#0F172A', letterSpacing: '0.06em', background: '#fff', fontFamily: 'inherit' }}
          />
          {valid && (
            <div style={{ display: 'flex', alignItems: 'center', paddingRight: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
            </div>
          )}
        </div>
        {err && <p style={{ fontSize: 11.5, color: '#DC2626', marginTop: 5, fontWeight: 500 }}>{err}</p>}
      </div>

      {sent && otp && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '10px 14px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔑</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>Demo OTP for +91 {display}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#D97706', letterSpacing: '0.15em' }}>{otp}</div>
            <div style={{ fontSize: 10, color: '#B45309' }}>Use this code below · or type 000000</div>
          </div>
        </motion.div>
      )}

      <button
        onClick={handleSend}
        disabled={!valid}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
          background: valid ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#E2E8F0',
          color: valid ? '#fff' : '#94A3B8', fontSize: 14, fontWeight: 700,
          cursor: valid ? 'pointer' : 'not-allowed',
          boxShadow: valid ? '0 4px 20px rgba(79,70,229,0.35)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s',
        }}>
        <Phone size={15} />
        {sent ? 'Resend OTP' : 'Send OTP'}
        <ArrowRight size={15} />
      </button>

      <p style={{ fontSize: 11.5, color: '#94A3B8', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
        By continuing, you agree to our{' '}
        <span style={{ color: '#4F46E5', fontWeight: 600, cursor: 'pointer' }}>Terms of Service</span>
        {' '}and{' '}
        <span style={{ color: '#4F46E5', fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</span>
      </p>
    </motion.div>
  )
}

// ── Step 2 — OTP verification ──────────────────────────────────────────────────
function OtpStep({ onBack }: { onBack: () => void }) {
  const { phone, demoOtp, verifyOtp } = useAuthStore()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [err, setErr]       = useState('')
  const [shake, setShake]   = useState(false)
  const [timer, setTimer]   = useState(30)
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null))

  useEffect(() => { refs[0].current?.focus() }, [])
  useEffect(() => {
    if (timer <= 0) return
    const id = setInterval(() => setTimer(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [timer])

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus()
  }

  const handleChange = (i: number, val: string) => {
    const v    = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i]    = v
    setDigits(next)
    setErr('')
    if (v && i < 5) refs[i + 1].current?.focus()
    if (next.every(d => d !== '') && next.join('').length === 6) handleVerify(next.join(''))
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next   = Array.from({ length: 6 }, (_, i) => pasted[i] ?? '')
    setDigits(next)
    if (pasted.length === 6) handleVerify(pasted)
    else refs[Math.min(pasted.length, 5)].current?.focus()
  }

  const handleVerify = (code: string) => {
    if (!verifyOtp(code)) {
      setErr('Incorrect OTP. Please try again.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setDigits(['', '', '', '', '', ''])
      refs[0].current?.focus()
    }
  }

  return (
    <motion.div {...slide(1)}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, fontSize: 12, fontWeight: 600 }}>
        <ChevronLeft size={14} /> Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 6 }}>
          Enter Verification Code
        </h2>
        <p style={{ fontSize: 13, color: '#64748B' }}>
          Sent to <strong style={{ color: '#0F172A' }}>{phone}</strong>
        </p>
      </div>

      {demoOtp && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#92400E', fontWeight: 600 }}>Demo OTP</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#D97706', letterSpacing: '0.2em' }}>{demoOtp}</div>
          <div style={{ fontSize: 10, color: '#B45309' }}>or type 000000</div>
        </div>
      )}

      <motion.div
        animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
        {digits.map((d, i) => (
          <input
            key={i} ref={refs[i]} value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            inputMode="numeric" maxLength={1}
            style={{
              width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 800,
              border: `2px solid ${d ? '#4F46E5' : err ? '#FECACA' : '#E2E8F0'}`,
              borderRadius: 12, outline: 'none', color: '#0F172A', fontFamily: 'inherit',
              background: d ? '#EEF2FF' : '#fff', transition: 'all 0.15s',
              boxShadow: d ? '0 0 0 3px rgba(79,70,229,0.12)' : 'none',
            }}
          />
        ))}
      </motion.div>

      {err && <p style={{ textAlign: 'center', fontSize: 12, color: '#DC2626', fontWeight: 600, marginBottom: 14 }}>{err}</p>}

      <button
        onClick={() => handleVerify(digits.join(''))}
        disabled={digits.join('').length !== 6}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
          background: digits.join('').length === 6 ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#E2E8F0',
          color: digits.join('').length === 6 ? '#fff' : '#94A3B8', fontSize: 14, fontWeight: 700,
          cursor: digits.join('').length === 6 ? 'pointer' : 'not-allowed',
          boxShadow: digits.join('').length === 6 ? '0 4px 20px rgba(79,70,229,0.35)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s', marginBottom: 14,
        }}>
        <Shield size={15} /> Verify & Continue
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
        {timer > 0
          ? `Resend OTP in ${timer}s`
          : <span style={{ color: '#4F46E5', fontWeight: 600, cursor: 'pointer' }} onClick={() => setTimer(30)}>Resend OTP</span>
        }
      </p>
    </motion.div>
  )
}

// ── Step 3 — New user profile setup ───────────────────────────────────────────
function SetupStep() {
  const { completeSetup, phone } = useAuthStore()
  const [name, setName]         = useState('')
  const [avatar, setAvatar]     = useState('👨')
  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
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
    completeSetup(name.trim(), avatar, photoUrl)
  }

  return (
    <motion.div {...slide(1)}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>👋</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 6 }}>
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
            width: 88, height: 88, borderRadius: 22, cursor: 'pointer',
            background: photoUrl ? 'transparent' : 'linear-gradient(135deg,#EEF2FF,#E0E7FF)',
            border: '2.5px dashed #A5B4FC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, overflow: 'hidden', position: 'relative', flexShrink: 0,
            transition: 'border-color 0.2s',
          }}>
          {photoUrl
            ? <img src={photoUrl} alt="you" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (uploading ? '⏳' : avatar)}
          <div style={{
            position: 'absolute', bottom: 4, right: 4,
            width: 22, height: 22, background: '#4F46E5', borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={12} color="#fff" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
          {photoUrl ? 'Tap to change photo' : 'Tap to add photo (optional)'}
        </span>
        {photoUrl && (
          <button onClick={() => setPhotoUrl(undefined)} style={{ fontSize: 10, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2, fontWeight: 600 }}>
            Remove photo
          </button>
        )}
      </div>

      {/* Avatar picker — shown when no photo */}
      {!photoUrl && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Choose Avatar
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {parentAvatars.map(a => (
              <button key={a} onClick={() => setAvatar(a)}
                style={{
                  width: 44, height: 44, borderRadius: 11,
                  border: avatar === a ? '2.5px solid #4F46E5' : '1.5px solid #E2E8F0',
                  background: avatar === a ? '#EEF2FF' : '#fff', fontSize: 24, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>{a}</button>
            ))}
          </div>
        </div>
      )}

      {/* Name */}
      <div style={{ marginBottom: 22 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
            border: `1.5px solid ${name.trim() ? '#A5B4FC' : '#DCE8F5'}`,
            fontSize: 15, fontWeight: 600, color: '#0F172A', fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box', transition: 'border-color 0.2s',
          }}
        />
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>
          This is your parent profile name — visible only to you
        </p>
      </div>

      <button
        onClick={handleCreate}
        disabled={!name.trim()}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
          background: name.trim() ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#E2E8F0',
          color: name.trim() ? '#fff' : '#94A3B8', fontSize: 14, fontWeight: 700,
          cursor: name.trim() ? 'pointer' : 'not-allowed',
          boxShadow: name.trim() ? '0 4px 20px rgba(79,70,229,0.35)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s',
        }}>
        <Sparkles size={15} />
        Create My Account
        <ArrowRight size={15} />
      </button>
    </motion.div>
  )
}

// ── Step 4 — Profile selection ─────────────────────────────────────────────────
function ProfilesStep() {
  const navigate = useNavigate()
  const { adminName, adminAvatar, adminPhotoUrl, kids, selectProfile, addKid, removeKid, logout, phone } = useAuthStore()
  const [showAdd, setShowAdd]       = useState(false)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [uploading, setUploading]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', grade: 'Grade 4', age: '9', school: '', board: 'CBSE',
    avatar: '👧', color: '#4F46E5', colorLight: '#EEF2FF', photoUrl: undefined as string | undefined,
  })

  const kidAvatars  = ['👧', '👦', '🧒', '🧑', '👩', '🎓', '🌟', '🦋', '🐬', '🦁', '🐯', '🚀']
  const colorOpts   = [
    { color: '#4F46E5', light: '#EEF2FF' }, { color: '#059669', light: '#ECFDF5' },
    { color: '#DC2626', light: '#FFF5F5' }, { color: '#D97706', light: '#FFFBEB' },
    { color: '#7C3AED', light: '#F5F3FF' }, { color: '#0891B2', light: '#ECFEFF' },
    { color: '#BE185D', light: '#FDF2F8' }, { color: '#EA580C', light: '#FFF7ED' },
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
    setForm({ name: '', grade: 'Grade 4', age: '9', school: '', board: 'CBSE', avatar: '👧', color: '#4F46E5', colorLight: '#EEF2FF', photoUrl: undefined })
    setShowAdd(false)
  }

  const getLevel = (xp: number) => {
    if (xp >= 1500) return { name: 'Champion', emoji: '🏆' }
    if (xp >= 500)  return { name: 'Scholar',  emoji: '⭐' }
    if (xp >= 100)  return { name: 'Learner',  emoji: '📚' }
    return                 { name: 'Explorer', emoji: '🌱' }
  }

  return (
    <motion.div {...slide(1)}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 4 }}>
          Who's using Master-Kids?
        </h2>
        <p style={{ fontSize: 13, color: '#64748B' }}>Select a profile to continue</p>
      </div>

      {/* Parent / Admin card */}
      <motion.button
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        onClick={() => handleSelect(null)}
        style={{
          width: '100%', marginBottom: 14, padding: '16px 18px', borderRadius: 14,
          background: 'linear-gradient(135deg,#1E293B,#312E81)',
          border: '1.5px solid rgba(99,102,241,0.4)',
          cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 4px 20px rgba(15,23,42,0.2)',
        }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
          background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
        }}>
          {adminPhotoUrl
            ? <img src={adminPhotoUrl} alt={adminName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : adminAvatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9', marginBottom: 3 }}>{adminName}</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>Parent · Admin Access · {kids.length} kid{kids.length !== 1 ? 's' : ''}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {['Dashboards', 'Reports', 'Tutors', 'Settings'].map(tag => (
              <span key={tag} style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 8, background: 'rgba(99,102,241,0.3)', color: '#A5B4FC', fontWeight: 600 }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <Shield size={16} color="#A5B4FC" style={{ flexShrink: 0 }} />
      </motion.button>

      {/* Kids section */}
      {kids.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>CHILDREN</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {kids.map(kid => {
              const lv  = getLevel(kid.xpTotal)
              const nxp = kid.xpTotal >= 1500 ? 9999 : kid.xpTotal >= 500 ? 1500 : kid.xpTotal >= 100 ? 500 : 100
              const px  = kid.xpTotal >= 1500 ? 1500 : kid.xpTotal >= 500 ? 500 : kid.xpTotal >= 100 ? 100 : 0
              const pct = Math.min(100, Math.round(((kid.xpTotal - px) / (nxp - px)) * 100))

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
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{kid.name}</span>
                        <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 8, background: kid.colorLight, color: kid.color, fontWeight: 700 }}>{kid.grade}</span>
                        {!kid.isOnboarded && (
                          <span style={{ fontSize: 9.5, padding: '1px 7px', borderRadius: 8, background: '#FEF3C7', color: '#D97706', fontWeight: 700 }}>Setup needed</span>
                        )}
                      </div>
                      {kid.school ? (
                        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {kid.school} · {kid.board}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>{kid.board}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: kid.color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10, color: kid.color, fontWeight: 700, flexShrink: 0 }}>{lv.emoji} {kid.xpTotal} XP</span>
                        {kid.streakDays > 0 && <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 700, flexShrink: 0 }}>🔥 {kid.streakDays}d</span>}
                      </div>
                    </div>
                    <Eye size={14} color="#CBD5E1" style={{ flexShrink: 0 }} />
                  </motion.button>

                  {confirmDel === kid.id ? (
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                      <button onClick={() => { removeKid(kid.id); setConfirmDel(null) }}
                        style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                        Delete
                      </button>
                      <button onClick={() => setConfirmDel(null)}
                        style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: '#F1F5F9', color: '#64748B', border: 'none', cursor: 'pointer' }}>
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
            background: '#FAFBFF', border: '2px dashed #C7D2FE',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: '#6366F1', fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
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
            <div style={{ padding: '18px 16px', borderRadius: 14, background: '#F8FAFF', border: '1.5px solid #C7D2FE' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>Add Child Profile</div>

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
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Child's Photo</div>
                  <button onClick={() => fileRef.current?.click()} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, border: `1px solid ${form.color}50`, background: form.colorLight, color: form.color, cursor: 'pointer', fontWeight: 600 }}>
                    {form.photoUrl ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {form.photoUrl && (
                    <button onClick={() => setForm(f => ({ ...f, photoUrl: undefined }))} style={{ marginLeft: 6, fontSize: 11, padding: '4px 10px', borderRadius: 7, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', cursor: 'pointer', fontWeight: 600 }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Avatar picker */}
              {!form.photoUrl && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avatar</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {kidAvatars.map(a => (
                      <button key={a} onClick={() => setForm(f => ({ ...f, avatar: a }))}
                        style={{
                          width: 36, height: 36, borderRadius: 9, border: form.avatar === a ? `2px solid ${form.color}` : '1.5px solid #E2E8F0',
                          background: form.avatar === a ? form.colorLight : '#fff', fontSize: 18, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{a}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile Color</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {colorOpts.map(c => (
                    <button key={c.color} onClick={() => setForm(f => ({ ...f, color: c.color, colorLight: c.light }))}
                      style={{ width: 26, height: 26, borderRadius: '50%', background: c.color, cursor: 'pointer', border: 'none', outline: form.color === c.color ? `3px solid ${c.color}` : '2px solid transparent', outlineOffset: 2 }} />
                  ))}
                </div>
              </div>

              {/* Form fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>Child's Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Priya"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${form.name.trim() ? form.color + '80' : '#DCE8F5'}`, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>Age</label>
                  <input value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    placeholder="9" inputMode="numeric"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #DCE8F5', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>Grade</label>
                  <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #DCE8F5', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                    {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(g => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>Board</label>
                  <select value={form.board} onChange={e => setForm(f => ({ ...f, board: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #DCE8F5', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                    {['CBSE','ICSE','IB','State Board'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>School Name</label>
                <input value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))}
                  placeholder="School name (optional)"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #DCE8F5', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleAdd} disabled={!form.name.trim()}
                  style={{
                    flex: 2, padding: '10px 0', borderRadius: 9, border: 'none',
                    background: form.name.trim() ? form.color : '#E2E8F0',
                    color: form.name.trim() ? '#fff' : '#94A3B8',
                    cursor: form.name.trim() ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 13,
                  }}>
                  <Sparkles size={13} style={{ display: 'inline', marginRight: 5 }} />
                  Create Profile
                </button>
                <button onClick={() => setShowAdd(false)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: '1px solid #DCE8F5', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#64748B' }}>
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
          justifyContent: 'center', gap: 7, color: '#94A3B8', fontSize: 12, fontWeight: 600,
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
  // 3 bars: phone → otp → setup/profiles
  const index = step === 'phone' ? 0 : step === 'otp' ? 1 : 2
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 3,
          background: index >= i ? '#4F46E5' : '#E2E8F0',
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#EEF4FB 0%,#E0EEFB 50%,#EDE9FE 100%)', display: 'flex', alignItems: 'stretch' }}>

      {/* ── Left branding panel ──────────────────────── */}
      <div style={{
        flex: 1, background: 'linear-gradient(160deg,#1E293B 0%,#0F172A 60%,#1E1B4B 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 48px', minWidth: 0,
      }} className="login-left">

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 16px rgba(99,102,241,0.45)' }}>M</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.03em' }}>Master-Kids</div>
            <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase' }}>Cradle to Career</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 38, fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 16 }}>
            Your child's complete<br />
            <span style={{ background: 'linear-gradient(90deg,#818CF8,#C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              learning journey
            </span><br />in one place.
          </div>
          <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.8, maxWidth: 360, marginBottom: 32 }}>
            Track syllabus, schedule activities, prep for olympiads, and get AI-powered insights — for every child in your family.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{f.icon}</div>
                <span style={{ fontSize: 12.5, color: '#CBD5E1', fontWeight: 500 }}>{f.text}</span>
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
            <div style={{ fontSize: 11, color: '#64748B' }}>
              <strong style={{ color: '#94A3B8' }}>2,400+ families</strong> tracking progress
            </div>
          </div>
        </div>
      </div>

      {/* ── Right auth panel ─────────────────────────── */}
      <div style={{
        width: 460, flexShrink: 0, background: '#fff',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 40px', overflowY: 'auto',
      }} className="login-right">

        {step !== 'profiles' && <StepDots step={step} />}

        <AnimatePresence mode="wait">
          {step === 'phone' && <motion.div key="phone" {...slide(1)}><PhoneStep /></motion.div>}
          {step === 'otp'   && <motion.div key="otp"   {...slide(1)}><OtpStep onBack={goBack} /></motion.div>}
          {step === 'setup' && <motion.div key="setup" {...slide(1)}><SetupStep /></motion.div>}
          {step === 'profiles' && <motion.div key="profiles" {...slide(1)}><ProfilesStep /></motion.div>}
        </AnimatePresence>

        {step === 'phone' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '10px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <Users size={13} color="#94A3B8" />
            <span style={{ fontSize: 12, color: '#94A3B8' }}>
              <strong style={{ color: '#0F172A' }}>2,400+ families</strong> across 12 cities · CBSE, ICSE & IB
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

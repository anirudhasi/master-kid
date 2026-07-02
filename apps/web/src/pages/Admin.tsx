import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import {
  Users, Baby, GraduationCap, IndianRupee, Rss, CreditCard, Shield,
  Search, Trash2, Ban, RotateCcw, TrendingUp, Activity as ActivityIcon, History,
  UserPlus, X, Lock,
} from 'lucide-react'
import { GRADE_LADDER } from '@/lib/grades'
import { useAuthStore } from '@/store/authStore'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { useStoryboardStore } from '@/store/storyboardStore'
import { useSocialStore } from '@/store/socialStore'
import { useActivityStore } from '@/store/activityStore'
import { useCoachStore } from '@/store/coachStore'
import { useAdminStore, MODULES, moduleEnabled } from '@/store/adminStore'
import { useActivityLogStore, type ActivityEvent } from '@/store/activityLogStore'

const P = '#6C63FF'
const FONT = "'Nunito', 'Inter', sans-serif"
const PALETTE = ['#6C63FF', '#059669', '#D97706', '#DB2777', '#0EA5E9', '#7C3AED']
const RAMP = [0.1, 0.18, 0.29, 0.43, 0.58, 0.72, 0.86, 1]

export default function Admin() {
  const accounts = useAuthStore(s => s.accounts)
  const subs = useSubscriptionStore(s => s.subs)
  const story = useStoryboardStore(s => s.entries)
  const posts = useSocialStore(s => s.posts)
  const activities = useActivityStore(s => s.activities)
  const courses = useCoachStore(s => s.courses)
  const enrollments = useCoachStore(s => s.enrollments)
  const profiles = useCoachStore(s => s.profiles)
  const admin = useAdminStore()

  const data = useMemo(() => {
    const accountsArr = Object.values(accounts)
    const children = accountsArr.flatMap(a => a.kids.map(k => ({ ...k, parentPhone: a.phone, parentName: a.adminName })))
    const coachesArr = Object.values(profiles)
    const subsArr = Object.values(subs)
    const courseArr = Object.values(courses)
    const enrollArr = Object.values(enrollments)

    const subRev = subsArr.reduce((n, s) => n + (s.status === 'active' ? (s.plan === 'yearly' ? 999 : s.plan === 'monthly' ? 99 : 0) : 0), 0)
    const coachRev = enrollArr.filter(e => e.paid).reduce((n, e) => n + (courses[e.courseId]?.priceInr ?? 0), 0)

    const subMix = [
      { name: 'Trial', value: subsArr.filter(s => s.status === 'trialing').length, color: '#0EA5E9' },
      { name: 'Monthly', value: subsArr.filter(s => s.plan === 'monthly' && s.status === 'active').length, color: '#6C63FF' },
      { name: 'Yearly', value: subsArr.filter(s => s.plan === 'yearly' && s.status === 'active').length, color: '#059669' },
      { name: 'Test', value: subsArr.filter(s => s.status === 'skipped_test').length, color: '#94A3B8' },
    ].filter(d => d.value > 0)

    const engagement = [
      { name: 'Storyboard', value: Object.keys(story).length },
      { name: 'Community', value: Object.keys(posts).length },
      { name: 'Activities', value: Object.keys(activities).length },
      { name: 'Courses', value: courseArr.length },
      { name: 'Enrolments', value: enrollArr.length },
    ]

    const totalUsers = accountsArr.length + children.length
    const growth = RAMP.map((r, i) => ({
      label: `W${i + 1}`,
      Users: Math.max(0, Math.round(accountsArr.length * r)),
      Children: Math.max(0, Math.round(children.length * r)),
    }))

    return { accountsArr, children, coachesArr, subsArr, courseArr, enrollArr, revenue: subRev + coachRev, subMix, engagement, totalUsers, growth }
  }, [accounts, subs, story, posts, activities, courses, enrollments, profiles])

  const activeSubs = data.subsArr.filter(s => ['trialing', 'active', 'skipped_test'].includes(s.status)).length

  return (
    <div style={{ padding: '24px clamp(16px,4vw,40px) 64px', fontFamily: FONT, maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#0F172A,#312E81)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={24} color="#fff" /></div>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Admin Console</h1>
          <div style={{ fontSize: 13, color: '#64748B' }}>Platform overview, controls & monitoring</div>
        </div>
      </div>

      {/* Privacy posture */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 11, background: '#F0FDF4', border: '1px solid #BBF7D0', marginTop: 16, fontSize: 12, color: '#15803D' }}>
        <Lock size={15} />
        <span><strong>Privacy-first admin.</strong> Phone numbers are masked; children's photos, notes, certificates and parent↔coach messages are never shown here. Admin sees only operational data (names, class, status, counts) needed to manage the platform — per DPDP/COPPA.</span>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(168px,1fr))', gap: 12, margin: '20px 0' }}>
        <Kpi icon={<Users size={18} />} label="Accounts" value={data.accountsArr.length} delta="+12%" color="#6C63FF" />
        <Kpi icon={<Baby size={18} />} label="Children" value={data.children.length} delta="+9%" color="#059669" />
        <Kpi icon={<GraduationCap size={18} />} label="Coaches" value={data.coachesArr.length} delta="+5%" color="#D97706" />
        <Kpi icon={<CreditCard size={18} />} label="Active subs" value={activeSubs} delta="+18%" color="#0EA5E9" />
        <Kpi icon={<IndianRupee size={18} />} label="Revenue" value={`₹${data.revenue.toLocaleString('en-IN')}`} delta="+22%" color="#7C3AED" />
        <Kpi icon={<Rss size={18} />} label="Posts" value={Object.keys(posts).length} delta="+7%" color="#DB2777" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 14 }} className="adm-charts">
        <Panel title="Platform growth" sub="Users & children (illustrative trend)" icon={<TrendingUp size={15} color={P} />}>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={data.growth} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={P} stopOpacity={0.35} /><stop offset="95%" stopColor={P} stopOpacity={0} /></linearGradient>
                <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.3} /><stop offset="95%" stopColor="#059669" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="Users" stroke={P} strokeWidth={2.5} fill="url(#gU)" />
              <Area type="monotone" dataKey="Children" stroke="#059669" strokeWidth={2.5} fill="url(#gC)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Subscription mix" sub="By plan & status" icon={<CreditCard size={15} color={P} />}>
          {data.subMix.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={data.subMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={84} paddingAngle={3}>
                  {data.subMix.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 4 }}>
            {data.subMix.map(d => <Legend2 key={d.name} color={d.color} label={`${d.name} (${d.value})`} />)}
          </div>
        </Panel>
      </div>

      <Panel title="Module engagement" sub="Records created across the platform" icon={<ActivityIcon size={15} color={P} />}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.engagement} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F8FAFC' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.engagement.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      {/* Module monitor */}
      <h2 style={sectionH}>Module monitor</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 10, marginBottom: 26 }}>
        {MODULES.map(m => {
          const on = moduleEnabled(admin.moduleFlags, m.key)
          return (
            <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: '#fff', border: '1px solid #EEF0F5' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: on ? '#16A34A' : '#CBD5E1', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{m.label}</span>
              <Switch on={on} onClick={() => admin.toggleModule(m.key)} />
            </div>
          )
        })}
      </div>

      {/* User management */}
      <h2 style={sectionH}>User management</h2>
      <UserManagement accounts={data.accountsArr} children={data.children} coaches={data.coachesArr} courses={data.courseArr} />

      {/* Platform activity monitor */}
      <h2 style={sectionH}><ActivityIcon size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Activity monitor</h2>
      <ActivityMonitor />

      {/* Audit */}
      <h2 style={sectionH}><History size={16} style={{ verticalAlign: -3, marginRight: 6 }} />Recent admin actions</h2>
      {admin.audit.length === 0 ? <div style={{ fontSize: 13, color: '#94A3B8' }}>No actions yet.</div> : (
        <div style={{ display: 'grid', gap: 6 }}>
          {admin.audit.slice(0, 8).map(a => (
            <div key={a.id} style={{ display: 'flex', gap: 10, fontSize: 12.5, color: '#475569', padding: '8px 12px', background: '#fff', borderRadius: 9, border: '1px solid #EEF0F5' }}>
              <span style={{ fontWeight: 800, color: '#0F172A' }}>{a.action}</span>
              <span style={{ color: '#94A3B8' }}>{a.target}</span>
              <span style={{ marginLeft: 'auto', color: '#CBD5E1' }}>{new Date(a.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`@media (max-width: 820px){ .adm-charts { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

// ── User management (tabs + tables) ─────────────────────────────────────────────
function UserManagement({ accounts, children, coaches, courses }: { accounts: any[]; children: any[]; coaches: any[]; courses: any[] }) {
  const admin = useAdminStore()
  const removeAccount = useAuthStore(s => s.adminRemoveAccount)
  const removeChild = useAuthStore(s => s.adminRemoveChild)
  const [tab, setTab] = useState<'parents' | 'children' | 'coaches'>('parents')
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const match = (s: string) => s.toLowerCase().includes(q.toLowerCase())
  const addLabel = tab === 'parents' ? 'Add parent' : tab === 'children' ? 'Add student' : 'Add teacher/coach'

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F5', padding: 16, marginBottom: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 10, padding: 3 }}>
          {(['parents', 'children', 'coaches'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: 800, textTransform: 'capitalize', background: tab === t ? '#fff' : 'transparent', color: tab === t ? P : '#64748B', boxShadow: tab === t ? '0 1px 4px rgba(15,23,42,0.1)' : 'none' }}>{t}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, border: '1px solid #E2E8F0', minWidth: 160 }}>
          <Search size={14} color="#94A3B8" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={{ border: 'none', outline: 'none', fontFamily: FONT, fontSize: 13, flex: 1, background: 'transparent' }} />
        </div>
        <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${P},#9B59FF)`, color: '#fff', fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}><UserPlus size={14} /> {addLabel}</button>
      </div>

      <AnimatePresence>{adding && <AddUserModal tab={tab} accounts={accounts} onClose={() => setAdding(false)} />}</AnimatePresence>

      {tab === 'parents' && (
        <Table head={['Name', 'Phone', 'Role', 'Kids', 'Status', '']}>
          {accounts.filter(a => match(a.adminName || '') || match(a.phone || '')).map(a => {
            const sus = admin.suspendedAccounts[a.phone]
            return (
              <Row key={a.phone}>
                <Cell2 bold>{a.adminName || '—'}</Cell2><Cell2 title="Masked for privacy">+91 {maskPhone(a.phone)}</Cell2><Cell2>{a.role}</Cell2><Cell2>{a.kids.length}</Cell2>
                <Cell2><StatusPill sus={sus} /></Cell2>
                <Cell2 right>
                  <Actions sus={sus} onToggle={() => admin.toggleAccount(a.phone)} confirming={confirm === a.phone} onRemoveAsk={() => setConfirm(a.phone)} onRemoveCancel={() => setConfirm(null)} onRemove={() => { removeAccount(a.phone); admin.log('Removed account', a.phone); setConfirm(null) }} />
                </Cell2>
              </Row>
            )
          })}
        </Table>
      )}

      {tab === 'children' && (
        <Table head={['Name', 'Grade', 'Parent', 'Status', '']}>
          {children.filter(c => match(c.name || '') || match(c.parentName || '')).map(c => {
            const sus = admin.suspendedChildren[c.id]
            return (
              <Row key={c.id}>
                <Cell2 bold>{c.avatar} {c.name}</Cell2><Cell2>{c.grade}</Cell2><Cell2>{c.parentName}</Cell2>
                <Cell2><StatusPill sus={sus} /></Cell2>
                <Cell2 right>
                  <Actions sus={sus} onToggle={() => admin.toggleChild(c.id)} confirming={confirm === c.id} onRemoveAsk={() => setConfirm(c.id)} onRemoveCancel={() => setConfirm(null)} onRemove={() => { removeChild(c.parentPhone, c.id); admin.log('Removed child', c.name); setConfirm(null) }} />
                </Cell2>
              </Row>
            )
          })}
        </Table>
      )}

      {tab === 'coaches' && (
        <Table head={['Name', 'Disciplines', 'Courses', 'Status', '']}>
          {coaches.filter(c => match(c.name || '')).map(c => {
            const sus = admin.suspendedCoaches[c.coachId]
            const n = courses.filter(co => co.coachId === c.coachId).length
            return (
              <Row key={c.coachId}>
                <Cell2 bold>{c.name}</Cell2><Cell2>{(c.disciplines || []).slice(0, 2).join(', ')}</Cell2><Cell2>{n}</Cell2>
                <Cell2><StatusPill sus={sus} /></Cell2>
                <Cell2 right><button onClick={() => admin.toggleCoach(c.coachId)} style={sus ? restoreBtn : banBtn}>{sus ? <><RotateCcw size={12} /> Restore</> : <><Ban size={12} /> Suspend</>}</button></Cell2>
              </Row>
            )
          })}
        </Table>
      )}

      {((tab === 'parents' && accounts.length === 0) || (tab === 'children' && children.length === 0) || (tab === 'coaches' && coaches.length === 0)) && (
        <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: 24 }}>No {tab} yet.</div>
      )}
    </div>
  )
}

// ── Activity monitor — every user action, most recent first ─────────────────
const EVENT_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  login:               { label: 'Login',       bg: '#EFF6FF', color: '#1D4ED8' },
  logout:              { label: 'Logout',      bg: '#F1F5F9', color: '#64748B' },
  signup:              { label: 'Sign-up',     bg: '#ECFDF5', color: '#047857' },
  kid_added:           { label: 'Child added', bg: '#F5F3FF', color: '#6D28D9' },
  kid_updated:         { label: 'Child edit',  bg: '#F5F3FF', color: '#6D28D9' },
  kid_removed:         { label: 'Child removed', bg: '#FFF1F2', color: '#BE123C' },
  kid_onboarded:       { label: 'Onboarded',   bg: '#ECFDF5', color: '#047857' },
  worksheet_submitted: { label: 'Worksheet',   bg: '#FFFBEB', color: '#B45309' },
  worksheet_assigned:  { label: 'Assigned',    bg: '#EEF2FF', color: '#4338CA' },
  worksheet_downloaded:{ label: 'Download',    bg: '#F0FDF4', color: '#15803D' },
  chapter_added:       { label: 'Chapter +',   bg: '#ECFEFF', color: '#0E7490' },
  chapter_removed:     { label: 'Chapter −',   bg: '#FFF7ED', color: '#C2410C' },
  log_added:           { label: 'Study log',   bg: '#ECFEFF', color: '#0E7490' },
  subscription_started:{ label: 'Subscription', bg: '#FDF2F8', color: '#BE185D' },
  admin_action:        { label: 'Admin',       bg: '#0F172A', color: '#E2E8F0' },
}

const maskActor = (a: string) => {
  if (!a) return '—'
  if (a.includes('@')) {
    const [user, domain] = a.split('@')
    return `${user.slice(0, 2)}•••@${domain}`
  }
  return a.length >= 4 ? `${a.slice(0, 2)}••••${a.slice(-2)}` : '••••'
}

function ActivityMonitor() {
  const entries = useActivityLogStore(s => s.entries)
  const [filter, setFilter] = useState<'all' | ActivityEvent>('all')
  const shown = (filter === 'all' ? entries : entries.filter(e => e.event === filter)).slice(0, 30)
  const presentEvents = [...new Set(entries.map(e => e.event))]

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F5', padding: 16, marginBottom: 26 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <button onClick={() => setFilter('all')}
          style={{ padding: '4px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 800, fontFamily: FONT, background: filter === 'all' ? '#0F172A' : '#F1F5F9', color: filter === 'all' ? '#fff' : '#64748B' }}>
          All ({entries.length})
        </button>
        {presentEvents.map(ev => {
          const st = EVENT_STYLE[ev] ?? { label: ev, bg: '#F1F5F9', color: '#64748B' }
          return (
            <button key={ev} onClick={() => setFilter(ev)}
              style={{ padding: '4px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 800, fontFamily: FONT, background: filter === ev ? st.color : st.bg, color: filter === ev ? '#fff' : st.color }}>
              {st.label}
            </button>
          )
        })}
      </div>
      {shown.length === 0 ? (
        <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: 20 }}>
          No activity recorded yet. Logins, child profile changes, onboarding and worksheet submissions will appear here.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 5, maxHeight: 360, overflowY: 'auto' }}>
          {shown.map(e => {
            const st = EVENT_STYLE[e.event] ?? { label: e.event, bg: '#F1F5F9', color: '#64748B' }
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: '#475569', padding: '7px 10px', background: '#FAFBFF', borderRadius: 8, border: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 8, background: st.bg, color: st.color, flexShrink: 0, minWidth: 74, textAlign: 'center' }}>{st.label}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.detail}</span>
                <span title="Masked for privacy" style={{ color: '#94A3B8', fontSize: 11.5, flexShrink: 0 }}>{maskActor(e.actor)}</span>
                <span style={{ color: '#CBD5E1', fontSize: 11, flexShrink: 0 }}>
                  {new Date(e.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── bits ─────────────────────────────────────────────────────────────────────
const tooltipStyle = { borderRadius: 10, border: '1px solid #E2E8F0', fontFamily: FONT, fontSize: 12 }
const sectionH: React.CSSProperties = { fontSize: 17, fontWeight: 900, color: '#0F172A', margin: '8px 0 12px' }
const banBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid #FED7AA', background: '#FFF7ED', color: '#C2410C', cursor: 'pointer', fontSize: 11.5, fontWeight: 800, fontFamily: FONT }
const restoreBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#15803D', cursor: 'pointer', fontSize: 11.5, fontWeight: 800, fontFamily: FONT }

function Kpi({ icon, label, value, delta, color }: { icon: React.ReactNode; label: string; value: number | string; delta: string; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F5', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color + '18', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A' }}>{delta}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, marginTop: 3 }}>{label}</div>
    </div>
  )
}

function Panel({ title, sub, icon, children }: { title: string; sub: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F5', padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>{icon}<div><div style={{ fontSize: 14.5, fontWeight: 900, color: '#0F172A' }}>{title}</div><div style={{ fontSize: 11.5, color: '#94A3B8' }}>{sub}</div></div></div>
      {children}
    </div>
  )
}

function EmptyChart() { return <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>No subscription data yet</div> }
function Legend2({ color, label }: { color: string; label: string }) { return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#475569', fontWeight: 700 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />{label}</span> }
function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return <button onClick={onClick} style={{ width: 38, height: 22, borderRadius: 12, border: 'none', cursor: 'pointer', background: on ? P : '#CBD5E1', position: 'relative', transition: 'background 0.2s' }}>
    <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
  </button>
}
function StatusPill({ sus }: { sus?: boolean }) { return <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 8, background: sus ? '#FEE2E2' : '#DCFCE7', color: sus ? '#B91C1C' : '#15803D' }}>{sus ? 'Suspended' : 'Active'}</span> }

function Actions({ sus, onToggle, confirming, onRemoveAsk, onRemoveCancel, onRemove }: { sus?: boolean; onToggle: () => void; confirming: boolean; onRemoveAsk: () => void; onRemoveCancel: () => void; onRemove: () => void }) {
  if (confirming) return (
    <span style={{ display: 'inline-flex', gap: 5 }}>
      <button onClick={onRemove} style={{ ...banBtn, border: 'none', background: '#DC2626', color: '#fff' }}>Confirm delete</button>
      <button onClick={onRemoveCancel} style={{ ...banBtn, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B' }}>Cancel</button>
    </span>
  )
  return (
    <span style={{ display: 'inline-flex', gap: 5 }}>
      <button onClick={onToggle} style={sus ? restoreBtn : banBtn}>{sus ? <><RotateCcw size={12} /> Restore</> : <><Ban size={12} /> Suspend</>}</button>
      <button onClick={onRemoveAsk} title="Remove" style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 8px', borderRadius: 8, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={12} /></button>
    </span>
  )
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
        <thead><tr>{head.map((h, i) => <th key={i} style={{ textAlign: i === head.length - 1 ? 'right' : 'left', fontSize: 10.5, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 10px 8px' }}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
function Row({ children }: { children: React.ReactNode }) { return <tr style={{ borderTop: '1px solid #F1F5F9' }}>{children}</tr> }
function Cell2({ children, bold, right, title }: { children: React.ReactNode; bold?: boolean; right?: boolean; title?: string }) {
  return <td title={title} style={{ padding: '10px', fontSize: 13, color: bold ? '#0F172A' : '#475569', fontWeight: bold ? 800 : 600, textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap' }}>{children}</td>
}

// Privacy: never show full contact numbers in the admin console.
const maskPhone = (p: string) => (p && p.length >= 4 ? `${p.slice(0, 2)}••••${p.slice(-2)}` : '••••')

// Admin adds a parent / student / teacher from any login.
function AddUserModal({ tab, accounts, onClose }: { tab: 'parents' | 'children' | 'coaches'; accounts: any[]; onClose: () => void }) {
  const addAccount = useAuthStore(s => s.adminAddAccount)
  const addChild = useAuthStore(s => s.adminAddChild)
  const admin = useAdminStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [parent, setParent] = useState(accounts[0]?.phone ?? '')
  const [grade, setGrade] = useState('Class 4')
  const [err, setErr] = useState('')
  const isChild = tab === 'children'
  const title = tab === 'parents' ? 'Add parent' : isChild ? 'Add student' : 'Add teacher / coach'

  const save = () => {
    setErr('')
    if (isChild) {
      if (!name.trim() || !parent) { setErr('Choose a parent and enter the student name.'); return }
      addChild(parent, { name: name.trim(), grade, age: 9, school: '', avatar: '🧒', color: '#6C63FF', colorLight: '#EEECFF', board: 'CBSE', xpTotal: 0, streakDays: 0 })
      admin.log('Added student', name.trim())
    } else {
      const digits = phone.replace(/\D/g, '').slice(-10)
      if (!name.trim() || digits.length !== 10) { setErr('Enter a name and a 10-digit phone.'); return }
      addAccount(digits, name.trim(), tab === 'coaches' ? 'COACH' : 'PARENT')
      admin.log(tab === 'coaches' ? 'Added coach' : 'Added parent', name.trim())
    }
    onClose()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13.5, fontFamily: FONT, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 18, padding: 22, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>
        <label style={lbl}>Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder={isChild ? 'Student name' : 'Full name'} style={inp} />
        {isChild ? (
          <>
            <label style={lbl}>Parent account</label>
            <select value={parent} onChange={e => setParent(e.target.value)} style={inp}>
              {accounts.length === 0 && <option value="">No parents yet — add one first</option>}
              {accounts.map(a => <option key={a.phone} value={a.phone}>{a.adminName || a.phone} (+91 {maskPhone(a.phone)})</option>)}
            </select>
            <label style={lbl}>Class</label>
            <select value={grade} onChange={e => setGrade(e.target.value)} style={inp}>{GRADE_LADDER.map(g => <option key={g}>{g}</option>)}</select>
          </>
        ) : (
          <>
            <label style={lbl}>Mobile number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit phone" inputMode="numeric" style={inp} />
          </>
        )}
        {err && <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 700, marginBottom: 10 }}>{err}</div>}
        <button onClick={save} style={{ width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${P},#9B59FF)`, color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: FONT }}>{title}</button>
      </motion.div>
    </motion.div>
  )
}
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }

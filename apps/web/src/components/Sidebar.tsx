import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAppStore, getLevel } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { subjectPct } from '@/store/kidsDataStore'
import { useKidStore } from '@/hooks/useKidStore'
import {
  LayoutDashboard, User, BookOpen, CalendarDays, FileText,
  Bot, Trophy, Images, Drama, Award,
  Users, Rss, GraduationCap, Search, Tag,
  Menu, X, ChevronRight, LogOut, Shield,
  Newspaper, Smile, Bell,
} from 'lucide-react'

type NavSection = { label: string; items: { icon: typeof LayoutDashboard; label: string; href: string }[] }

// Child shell — everything scoped to the selected child.
const CHILD_NAV: NavSection[] = [
  {
    label: 'LEARNING',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',          href: '/child'      },
      { icon: Images,          label: 'Storyboard',         href: '/storyboard' },
      { icon: BookOpen,        label: 'Academics',          href: '/academic'   },
      { icon: User,            label: 'Profile',            href: '/profile'    },
      { icon: GraduationCap,   label: 'Syllabus & Progress', href: '/syllabus' },
      { icon: CalendarDays,    label: 'My Planner',          href: '/plan'      },
      { icon: Drama,           label: 'Extra-curricular',    href: '/activities' },
    ],
  },
  {
    label: 'PRACTICE',
    items: [
      { icon: FileText, label: 'Worksheets',        href: '/worksheets' },
      { icon: Trophy,   label: 'Olympiad Practice', href: '/olympiad'   },
      { icon: Award,    label: 'Olympiad Exams',    href: '/olympiads'  },
    ],
  },
  {
    label: 'DISCOVER',
    items: [
      { icon: Bell,      label: 'Daily Digest',    href: '/digest'    },
      { icon: Smile,     label: 'Fun & Knowledge', href: '/fun'       },
      { icon: Bot,       label: 'AI Tutor Miko',   href: '/assistant' },
      { icon: Newspaper, label: 'Blog & Articles', href: '/blog'      },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { icon: Rss, label: 'Social Feed', href: '/social' },
    ],
  },
]

// Parent / admin shell — manage the family, no single child in context.
const PARENT_NAV: NavSection[] = [
  {
    label: 'PARENT',
    items: [
      { icon: LayoutDashboard, label: 'Parent Dashboard', href: '/parent' },
      { icon: Users,           label: 'Manage Children',  href: '/login'  },
      { icon: Rss,             label: 'Social Feed',      href: '/social' },
    ],
  },
  {
    label: 'TEACHING',
    items: [
      { icon: GraduationCap, label: 'Coach Studio',  href: '/coach'  },
      { icon: Search,        label: 'Find Coaches',  href: '/tutors' },
    ],
  },
  {
    label: 'PLATFORM',
    items: [
      { icon: Shield,    label: 'Admin Console',   href: '/admin'   },
      { icon: Tag,       label: 'Pricing',         href: '/pricing' },
      { icon: Newspaper, label: 'Blog & Articles', href: '/blog'    },
    ],
  },
]

const CHILD_TABS = [
  { icon: LayoutDashboard, label: 'Home',     href: '/child'     },
  { icon: BookOpen,        label: 'Syllabus', href: '/syllabus'  },
  { icon: Trophy,          label: 'Olympiad', href: '/olympiad'  },
  { icon: Smile,           label: 'Fun',      href: '/fun'       },
  { icon: User,            label: 'Profile',  href: '/profile'   },
]

const PARENT_TABS = [
  { icon: LayoutDashboard, label: 'Home',     href: '/parent'  },
  { icon: Users,           label: 'Children', href: '/login'   },
  { icon: Rss,             label: 'Social',   href: '/social'  },
  { icon: Search,          label: 'Tutors',   href: '/tutors'  },
  { icon: Tag,             label: 'Plans',    href: '/pricing' },
]

export default function Sidebar() {
  const loc      = useLocation()
  const navigate = useNavigate()

  const { subscription } = useAppStore()
  const { adminName, adminAvatar, adminPhotoUrl, kids, activeKidId, selectProfile, logout } = useAuthStore()
  const { subjects, xpTotal: displayXP, streakDays: displayStreak } = useKidStore()

  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin   = activeKidId === null
  const activeKid = kids.find(k => k.id === activeKidId)

  const displayLevel = getLevel(displayXP)

  // Syllabus progress from live kid data (chapter progress rolls up per subject)
  const overallPct = subjects.length > 0
    ? Math.round(subjects.reduce((a, s) => a + subjectPct(s), 0) / subjects.length)
    : 0

  const isActive = (href: string) => loc.pathname === href.split('?')[0]

  const handleSwitchTo = (kidId: string | null) => {
    selectProfile(kidId)
    navigate(kidId === null ? '/parent' : '/child')
    setMobileOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Platform-admin (gated). Hide the Admin Console for everyone else.
  const isPlatformAdmin = useAuthStore(s => s.isAdmin)
  const navSections = (isAdmin ? PARENT_NAV : CHILD_NAV)
    .map(sec => ({ ...sec, items: sec.items.filter(it => it.href !== '/admin' || isPlatformAdmin) }))
    .filter(sec => sec.items.length > 0)

  const NavItems = () => (
    <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
      {navSections.map(section => (
        <div key={section.label} style={{ padding: '10px 8px 2px' }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#475569',
            padding: '0 6px', marginBottom: 2,
          }}>{section.label}</div>
          {section.items.map(item => {
            const active = isActive(item.href)
            const Icon   = item.icon
            return (
              <Link key={item.href} to={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: active ? '5px 8px 5px 6px' : '5px 8px',
                  borderRadius: 7, fontSize: 12, fontWeight: active ? 600 : 500,
                  color: active ? '#A5B4FC' : '#94A3B8',
                  textDecoration: 'none', cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: active ? 'rgba(99,102,241,0.18)' : 'transparent',
                  borderLeft: active ? '2px solid #6366F1' : '2px solid transparent',
                  marginBottom: 1,
                }}
                onClick={() => setMobileOpen(false)}>
                <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <ChevronRight size={11} style={{ opacity: 0.4 }} />}
              </Link>
            )
          })}
        </div>
      ))}
    </div>
  )

  const ProfileBlock = () => (
    <div style={{ padding: '6px 10px 4px', flexShrink: 0 }}>

      {/* Inline kid switcher */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        <button
          onClick={() => handleSwitchTo(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: isAdmin ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
            color: isAdmin ? '#A5B4FC' : '#64748B',
            fontSize: 10, fontWeight: 600, transition: 'all 0.15s',
          }}>
          <Shield size={9} /> {adminName}
        </button>
        {kids.map(kid => (
          <button
            key={kid.id}
            onClick={() => handleSwitchTo(kid.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 9px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: activeKidId === kid.id ? `${kid.color}33` : 'rgba(255,255,255,0.06)',
              color: activeKidId === kid.id ? kid.color : '#64748B',
              fontSize: 10, fontWeight: 600, transition: 'all 0.15s',
            }}>
            {kid.avatar} {kid.name}
          </button>
        ))}
      </div>

      {/* Active profile card */}
      {isAdmin ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
          borderRadius: 9, background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, overflow: 'hidden',
            background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
          }}>
            {adminPhotoUrl
              ? <img src={adminPhotoUrl} alt={adminName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : adminAvatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminName}</span>
              <Shield size={10} color="#A5B4FC" />
            </div>
            <div style={{ fontSize: 10, color: '#64748B' }}>Admin · {kids.length} kids</div>
          </div>
        </div>
      ) : (
        <Link to="/profile" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
            borderRadius: 9, background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)', transition: 'all 0.15s',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, overflow: 'hidden',
              background: activeKid ? activeKid.colorLight : 'rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
            }}>
              {activeKid?.photoUrl
                ? <img src={activeKid.photoUrl} alt={activeKid.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (activeKid?.avatar ?? '👤')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeKid?.name ?? 'Student'}
              </div>
              <div style={{ fontSize: 10, color: '#64748B' }}>{activeKid?.grade} · {activeKid?.board}</div>
            </div>
          </div>
        </Link>
      )}

      {/* Syllabus progress bar (kid only, when subjects data exists) */}
      {!isAdmin && subjects.length > 0 && (
        <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 9.5, color: '#64748B', fontWeight: 600 }}>SYLLABUS PROGRESS</span>
            <span style={{ fontSize: 9.5, color: '#A5B4FC', fontWeight: 700 }}>{overallPct}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${overallPct}%`, height: '100%', background: 'linear-gradient(90deg,#4F46E5,#7C3AED)', borderRadius: 3, transition: 'width 0.6s' }} />
          </div>
        </div>
      )}

      {/* Logout row */}
      <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'flex-end' }}>
        <button onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.06)', color: '#64748B', fontSize: 10, fontWeight: 600,
            transition: 'all 0.15s',
          }}>
          <LogOut size={10} /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────── */}
      <aside style={{
        width: 220, height: '100vh', background: '#1E293B',
        position: 'fixed', left: 0, top: 0,
        display: 'flex', flexDirection: 'column', zIndex: 40,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#fff', fontWeight: 800,
              boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
            }}>M</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.02em', lineHeight: 1 }}>Master-Kids</div>
              <div style={{ fontSize: 8, color: '#475569', letterSpacing: '0.06em', fontWeight: 600, marginTop: 2 }}>CRADLE TO CAREER</div>
            </div>
          </Link>
        </div>

        {ProfileBlock()}
        {NavItems()}

        {/* Footer */}
        <div style={{
          padding: '10px 12px 14px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          {/* XP + streak */}
          {!isAdmin && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', marginBottom: 8,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#FCD34D' }}>⚡ {displayXP} XP</span>
              <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#F87171' }}>🔥 {displayStreak}d</span>
              <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 10, color: '#94A3B8' }}>{displayLevel.emoji} {displayLevel.name}</span>
            </div>
          )}

          {/* Life goal */}
          {!isAdmin && (() => {
            const goal = activeKid?.onboarding?.lifeGoal
            return goal ? (
              <div style={{ padding: '6px 10px', borderRadius: 8, marginBottom: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#34D399', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>Goal</div>
                <div style={{ fontSize: 10, color: '#A7F3D0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal}</div>
              </div>
            ) : null
          })()}

          {/* Activities */}
          {!isAdmin && (() => {
            const acts = (activeKid?.onboarding?.activities ?? []).slice(0, 3)
            return acts.length > 0 ? (
              <>
                <div style={{ fontSize: 9.5, color: '#475569', fontWeight: 600, marginBottom: 4 }}>ACTIVITIES</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {acts.map(a => (
                    <span key={a} style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 10, background: 'rgba(139,92,246,0.15)', color: '#A78BFA', fontWeight: 600 }}>● {a}</span>
                  ))}
                </div>
              </>
            ) : null
          })()}

          {subscription === 'free' && (
            <Link to="/pricing" style={{ textDecoration: 'none', display: 'block', marginTop: 8 }}>
              <div style={{
                padding: '8px 10px', borderRadius: 8, textAlign: 'center',
                background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                boxShadow: '0 2px 8px rgba(99,102,241,0.3)', cursor: 'pointer',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>🚀 Upgrade to Pro</div>
              </div>
            </Link>
          )}
        </div>
      </aside>

      {/* ── Mobile drawer ─────────────────────────────── */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(15,23,42,0.5)' }} onClick={() => setMobileOpen(false)} />
          <div style={{ width: 240, background: '#1E293B', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9' }}>Master-Kids</span>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                <X size={18} />
              </button>
            </div>
            {ProfileBlock()}
            {NavItems()}
          </div>
        </div>
      )}

      {/* ── Mobile top bar ────────────────────────────── */}
      <div style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 48,
        background: '#1E293B', zIndex: 50, alignItems: 'center',
        padding: '0 16px', justifyContent: 'space-between',
      }} className="mobile-topbar">
        <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
          <Menu size={20} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9' }}>Master-Kids</span>
        <div style={{ fontSize: 20 }}>{activeKid?.avatar ?? adminAvatar}</div>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────── */}
      <nav className="mobile-tabbar">
        {(isAdmin ? PARENT_TABS : CHILD_TABS).map(tab => {
          const active = loc.pathname === tab.href
          const Icon   = tab.icon
          return (
            <Link key={tab.href} to={tab.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '5px 10px', borderRadius: 8, textDecoration: 'none',
              color: active ? '#818CF8' : '#64748B', transition: 'all 0.15s',
            }}>
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: 9.5, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

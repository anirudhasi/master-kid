import { LogoIcon } from '@/components/Logo'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '@/store/appStore'

const navItems = [
  { label: 'Child Dashboard', href: '/child'   },
  { label: 'Parent View',     href: '/parent'  },
  { label: 'Tutor Portal',    href: '/tutor'   },
  { label: 'Find Tutors',     href: '/tutors'  },
  { label: 'Profile',         href: '/profile' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const { xpTotal, streakDays } = useAppStore()

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #E8ECF4',
    }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <LogoIcon size={32} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
                <span style={{ color: '#10243F' }}>MASTER</span><span style={{ color: '#159A93' }}>KIDS</span>
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.04em', fontWeight: 500 }}>
                DAILY PROGRESS TRACKING
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 4 }}>
            {navItems.map((item) => {
              const active = loc.pathname === item.href
              return (
                <Link key={item.href} to={item.href} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  textDecoration: 'none', transition: 'all 0.15s',
                  color: active ? '#4F46E5' : '#6B7280',
                  background: active ? '#EEF2FF' : 'transparent',
                }}>
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Live stats pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 12px', borderRadius: 20,
              background: '#FFFBEB', border: '1px solid #FDE68A',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#B45309' }}>⚡ {xpTotal} XP</span>
              <div style={{ width: 1, height: 12, background: '#FDE68A' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>🔥 {streakDays}d</span>
            </div>

            <Link to="/child" className="btn btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>
              Log Now
            </Link>

            <button onClick={() => setOpen(!open)} className="btn btn-ghost md:hidden"
              style={{ padding: '7px 10px' }}>
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div style={{
            borderTop: '1px solid #E8ECF4', padding: '12px 0 16px',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} onClick={() => setOpen(false)} style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                textDecoration: 'none', color: '#374151', transition: 'all 0.15s',
              }}>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

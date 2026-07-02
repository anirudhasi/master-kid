// Official Master-Kids logo — the mark from the worksheet headers is THE brand
// logo everywhere (app, print, marketing). Single source of truth:
// this inline SVG + the standalone files in public/brand/ (logo-icon.svg,
// logo-full.svg) for use outside the app.
// Palette: navy #10243F · blue #1F5FA8 · teal #159A93 · gold #F2A93B.

export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-label="Master-Kids logo">
      <path d="M10 60 L46 52 L46 86 L10 79 Z" fill="#1F5FA8" />
      <path d="M86 60 L50 52 L50 86 L86 79 Z" fill="#159A93" />
      <path d="M16 62.5 L40 57.5" stroke="#EAF1F8" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d="M16 69.5 L40 64.5" stroke="#EAF1F8" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d="M56 57.5 L80 62.5" stroke="#EAF1F8" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d="M56 64.5 L80 69.5" stroke="#EAF1F8" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d="M48 6 L92 24 L48 42 L4 24 Z" fill="#10243F" />
      <path d="M27 32.5 L27 43 Q27 49.5 48 49.5 Q69 49.5 69 43 L69 32.5 L48 41 Z" fill="#10243F" />
      <line x1="78" y1="27.5" x2="78" y2="45" stroke="#F2A93B" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="78" cy="48.5" r="4.2" fill="#F2A93B" />
    </svg>
  )
}

/** Mark + MASTERKIDS wordmark. `dark` renders MASTER in white for dark backgrounds. */
export function Logo({ size = 30, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.28) }}>
      <LogoIcon size={size} />
      <span style={{
        fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1,
        fontSize: Math.round(size * 0.52),
        fontFamily: "'Inter', Helvetica, Arial, sans-serif",
      }}>
        <span style={{ color: dark ? '#F1F5F9' : '#10243F' }}>MASTER</span>
        <span style={{ color: '#159A93' }}>KIDS</span>
      </span>
    </span>
  )
}

export default Logo

import { Quote as QuoteIcon } from 'lucide-react'
import { PARENT_QUOTES } from '@/data/engagementCatalog'
import { dayKey } from '@/lib/dailyFeed'

const FONT = "'Nunito', 'Inter', sans-serif"

// Motivational quote of the day for parents — deterministic by date.
export default function QuoteOfDay() {
  const idx = Math.abs(dayKey().split('-').reduce((a, p) => a + parseInt(p), 0)) % PARENT_QUOTES.length
  const q = PARENT_QUOTES[idx]
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 18px', borderRadius: 16, background: 'linear-gradient(135deg,#1E293B,#312E81)', fontFamily: FONT }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <QuoteIcon size={18} color="#C4B5FD" />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#C4B5FD', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Quote of the day</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', lineHeight: 1.5 }}>“{q.text}”</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>— {q.author}</div>
      </div>
    </div>
  )
}

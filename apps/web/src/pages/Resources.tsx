// Worksheet Library — driven by the real PDF library at repo-root
// `master-kids_Worksheets/` (copied to /worksheets + manifest.json at build).
//
// Class 4 · Maths ships today (olympiad-grade sets). Every other class/subject
// renders an upload placeholder: drop PDFs into
//   master-kids_Worksheets/Class <N>/<Subject>/*.pdf
// rebuild, and they appear here automatically — no code changes needed.

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, ExternalLink, FolderOpen, Trophy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

type Manifest = Record<string, Record<string, string[]>>  // class → subjectSlug → files

const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

// Canonical subjects shown for every class (matches the upload folder names).
const SUBJECTS: { slug: string; name: string; icon: string; color: string }[] = [
  { slug: 'maths',    name: 'Maths',            icon: '📐', color: '#4F46E5' },
  { slug: 'english',  name: 'English',          icon: '📖', color: '#059669' },
  { slug: 'science',  name: 'Science / EVS',    icon: '🔬', color: '#0369A1' },
  { slug: 'hindi',    name: 'Hindi',            icon: '🔤', color: '#DC2626' },
  { slug: 'sst',      name: 'Social Studies',   icon: '🗺️', color: '#D97706' },
  { slug: 'kannada',  name: 'Kannada',          icon: '✍️', color: '#B45309' },
  { slug: 'computer', name: 'Computer',         icon: '💻', color: '#7C3AED' },
  { slug: 'gk',       name: 'GK',               icon: '🌟', color: '#CA8A04' },
]

// Folder slugs that should collapse onto a canonical subject tile.
const SLUG_ALIASES: Record<string, string> = {
  maths: 'maths', math: 'maths', mathematics: 'maths',
  english: 'english',
  science: 'science', evs: 'science',
  hindi: 'hindi',
  sst: 'sst', 'social-studies': 'sst', 'social-science': 'sst',
  kannada: 'kannada',
  computer: 'computer', 'computer-science': 'computer',
  gk: 'gk', 'general-knowledge': 'gk',
}

/** "MK-MATH-C4-L1-W01.pdf" → { title: 'Level 1 · Worksheet 1', sample: false } */
function describePdf(file: string) {
  const base = file.replace(/\.pdf$/i, '')
  const level = base.match(/-L(\d+)-/i)?.[1]
  const wsNum = base.match(/-W(\d+)/i)?.[1]
  const mock = /MOCK/i.test(base)
  const sample = /SAMPLE/i.test(base)
  const parts: string[] = []
  if (mock) parts.push('Mock Test')
  else if (level) parts.push(`Level ${parseInt(level)}`)
  if (wsNum) parts.push(`Worksheet ${parseInt(wsNum)}`)
  return { title: parts.length ? parts.join(' · ') : base, sample }
}

export default function Resources() {
  const { activeKidId, kids } = useAuthStore()
  const activeKid = kids.find(k => k.id === activeKidId)
  const kidClass = String(parseInt((activeKid?.grade ?? '').replace(/\D/g, '')) || 4)

  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selectedClass, setSelectedClass] = useState(CLASSES.includes(kidClass) ? kidClass : '4')
  const [selectedSubject, setSelectedSubject] = useState('maths')

  useEffect(() => {
    fetch('/worksheets/manifest.json')
      .then(r => (r.ok ? r.json() : {}))
      .then(setManifest)
      .catch(() => setManifest({}))
  }, [])

  // Resolve the selected class's folders onto canonical subject slugs.
  const classFiles = useMemo(() => {
    const byClass = manifest?.[selectedClass] ?? {}
    const out: Record<string, { file: string; url: string }[]> = {}
    for (const [folderSlug, files] of Object.entries(byClass)) {
      const canonical = SLUG_ALIASES[folderSlug] ?? folderSlug
      out[canonical] ??= []
      for (const f of files) out[canonical].push({ file: f, url: `/worksheets/class${selectedClass}/${folderSlug}/${f}` })
    }
    return out
  }, [manifest, selectedClass])

  const files = classFiles[selectedSubject] ?? []
  const subjectMeta = SUBJECTS.find(s => s.slug === selectedSubject) ?? SUBJECTS[0]
  const totalForClass = Object.values(classFiles).reduce((a, f) => a + f.length, 0)

  return (
    <div className="page-container" style={{ maxWidth: 960 }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <p className="label" style={{ marginBottom: 4 }}>Worksheet Library</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: '#0F172A' }}>
          Printable Worksheets
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Olympiad-grade practice sets, class by class, subject by subject.
          {activeKid && ` Showing Class ${selectedClass}${selectedClass === kidClass ? ` — ${activeKid.name}'s class` : ''}.`}
        </p>
      </motion.div>

      {/* Class selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4, flexWrap: 'wrap' }}>
        {CLASSES.map(c => {
          const has = Object.keys(manifest?.[c] ?? {}).length > 0
          return (
            <button key={c} onClick={() => setSelectedClass(c)}
              style={{
                padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 13, flexShrink: 0, position: 'relative',
                background: selectedClass === c ? '#4F46E5' : '#F1F5F9',
                color: selectedClass === c ? '#fff' : '#64748B',
                boxShadow: selectedClass === c ? '0 2px 8px rgba(79,70,229,0.25)' : 'none',
                transition: 'all 0.15s',
              }}>
              Class {c}
              {c === kidClass && activeKid && <span style={{ marginLeft: 4, fontSize: 10 }}>⭐</span>}
              {has && <span style={{
                position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%',
                background: selectedClass === c ? '#A7F3D0' : '#22C55E',
              }} />}
            </button>
          )
        })}
      </div>

      {/* Subject tiles */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {SUBJECTS.map(subj => {
          const active = selectedSubject === subj.slug
          const count = classFiles[subj.slug]?.length ?? 0
          return (
            <motion.button key={subj.slug} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedSubject(subj.slug)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                padding: '12px 18px', borderRadius: 14, border: `2px solid ${active ? subj.color : '#E2E8F0'}`,
                background: active ? subj.color + '12' : '#FAFAFA', cursor: 'pointer',
                minWidth: 86, transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 26 }}>{subj.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: active ? subj.color : '#374151' }}>{subj.name}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 8,
                background: count > 0 ? '#DCFCE7' : '#F1F5F9', color: count > 0 ? '#15803D' : '#94A3B8',
              }}>
                {count > 0 ? `${count} sheets` : 'coming soon'}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Results */}
      {manifest === null ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
          Loading library…
        </div>
      ) : files.length > 0 ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Trophy size={15} color={subjectMeta.color} />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
              Class {selectedClass} · {subjectMeta.name} — {files.length} worksheets
            </span>
            <span style={{ fontSize: 11.5, color: '#94A3B8' }}>({totalForClass} total in this class)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
            {files.map(({ file, url }) => {
              const d = describePdf(file)
              return (
                <motion.a key={file} href={url} target="_blank" rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  className="card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px',
                    textDecoration: 'none', borderLeft: `3px solid ${subjectMeta.color}`,
                  }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, background: subjectMeta.color + '15',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <FileText size={17} color={subjectMeta.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                      {d.title}
                      {d.sample && <span style={{ marginLeft: 6, fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 6, background: '#FEF3C7', color: '#B45309' }}>SAMPLE</span>}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file}</div>
                  </div>
                  <span style={{ display: 'flex', gap: 8, flexShrink: 0, color: subjectMeta.color }}>
                    <ExternalLink size={14} />
                  </span>
                </motion.a>
              )
            })}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={13} /> Open a worksheet, then print or save it — solve on paper, olympiad style.
          </div>
        </>
      ) : (
        /* Placeholder — the slot exists, the PDFs will be uploaded separately */
        <div className="card" style={{ padding: '44px 32px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
            background: subjectMeta.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FolderOpen size={28} color={subjectMeta.color} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
            Class {selectedClass} · {subjectMeta.name} worksheets are being prepared
          </div>
          <div style={{ fontSize: 13, color: '#64748B', maxWidth: 460, margin: '0 auto 18px', lineHeight: 1.6 }}>
            We're building 15–50 olympiad-grade worksheets per subject, the same format as
            Class 4 Maths. They'll appear here automatically as soon as they're published.
          </div>
          <button onClick={() => { setSelectedClass('4'); setSelectedSubject('maths') }}
            style={{
              padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#4F46E5', color: '#fff', fontSize: 12.5, fontWeight: 700,
            }}>
            <Trophy size={12} style={{ verticalAlign: -2, marginRight: 6 }} />
            See the Class 4 Maths set (available now)
          </button>
        </div>
      )}
    </div>
  )
}

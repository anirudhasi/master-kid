// apps/web/scripts/import-content.ts — content-as-code → catalog tables (PR-16)
// Run from apps/web:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   npx vite-node scripts/import-content.ts
// (vite-node resolves the '@/' alias exactly like the app build does.)
//
// IDEMPOTENT: upserts on legacy_id / natural keys; re-running yields zero changes.
// Emits a summary report to stdout — commit it to docs/reports/import-<date>.md.

/* eslint-disable no-console */
// Node runtime globals (script runs under vite-node, not the browser bundle):
declare const process: { env: Record<string, string | undefined>; exit(code?: number): never }
import { CATALOG as SYLLABUS } from '../src/data/syllabusCatalog'
import { KNOWLEDGE_ITEMS } from '../src/data/knowledgeCatalog'
import { OLYMPIAD_SETS } from '../src/data/olympiadCatalog'

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) { console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const H = {
  apikey: KEY, Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
}

async function sb(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init?.headers ?? {}) } })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

/** PostgREST upsert on a conflict target. */
async function upsert(table: string, rows: object[], onConflict: string): Promise<number> {
  if (rows.length === 0) return 0
  const BATCH = 200
  let n = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    await sb(`${table}?on_conflict=${onConflict}`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(chunk),
    })
    n += chunk.length
  }
  return n
}

const report: Record<string, number> = {}

// NOTE: catalog_lessons has no natural unique constraint in 004. The importer
// requires one for idempotency. Create it once in staging before first run:
//   create unique index if not exists catalog_lessons_nat_uidx
//     on public.catalog_lessons(subject_key, grade, title);
async function importLessons(): Promise<void> {
  const subjectKeys = new Set<string>()
  const lessons: object[] = []
  for (const [grade, subjects] of Object.entries(SYLLABUS as Record<string, Record<string, string[]>>)) {
    for (const [subjectKey, chapters] of Object.entries(subjects)) {
      subjectKeys.add(subjectKey)
      chapters.forEach((title, i) => {
        lessons.push({
          subject_key: subjectKey, grade: String(grade), ordinal: i, title,
          source: 'import', status: 'published',
        })
      })
    }
  }
  report['catalog_subjects'] = await upsert('catalog_subjects',
    [...subjectKeys].map((subject_key) => ({ subject_key, label: subject_key })), 'subject_key')
  report['catalog_lessons'] = await upsert('catalog_lessons', lessons, 'subject_key,grade,title')
}

async function importKnowledge(): Promise<void> {
  const rows = KNOWLEDGE_ITEMS.map((k: any) => ({
    legacy_id: k.id,
    type: k.type,
    level: k.level,
    max_grade: k.grade,
    payload: k,                      // full item preserved; app reads payload
    source: 'import', status: 'published',
  }))
  report['catalog_knowledge_items'] = await upsert('catalog_knowledge_items', rows, 'legacy_id')
}

async function importOlympiad(): Promise<void> {
  const rows = OLYMPIAD_SETS.map((s: any) => ({
    legacy_id: s.id,
    subject: s.subject, category: s.category, grade: s.grade,
    title: s.title, kind: s.kind,
    payload: s.questions ? { questions: s.questions } : null,
    asset_url: s.materialUrl ?? null,
    source: 'import', status: 'published',
  }))
  report['catalog_olympiad_sets'] = await upsert('catalog_olympiad_sets', rows, 'legacy_id')
}

async function main(): Promise<void> {
  await importLessons()
  await importKnowledge()
  await importOlympiad()
  console.log('\n=== IMPORT REPORT ===')
  for (const [table, n] of Object.entries(report)) console.log(`${table}: ${n} rows upserted`)
  console.log('Re-run to verify idempotency (expect identical counts, zero data changes).')
}

main().catch((e) => { console.error(e); process.exit(1) })

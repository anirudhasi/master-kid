// Copies the worksheet PDF library (single source of truth at repo-root
// `master-kids_Worksheets/`) into `apps/web/public/worksheets/` so Vite can serve
// them. Runs automatically before `dev` and `build` (see package.json pre-scripts),
// so the served copies are generated, never committed (they are git-ignored).
//
// Layout produced:  public/worksheets/class<N>/<subject-slug>/<file>.pdf
// e.g.              master-kids_Worksheets/Class 4/Maths/MK-MATH-C4-L1-W01.pdf
//             ->    public/worksheets/class4/maths/MK-MATH-C4-L1-W01.pdf

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const SRC = join(here, '..', '..', '..', 'master-kids_Worksheets')
const DEST = join(here, '..', 'public', 'worksheets')

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const isDir = (p) => statSync(p).isDirectory()

if (!existsSync(SRC)) {
  console.warn(`[worksheets] source folder not found, skipping: ${SRC}`)
  process.exit(0)
}

rmSync(DEST, { recursive: true, force: true })

let count = 0
for (const classDir of readdirSync(SRC)) {
  const classPath = join(SRC, classDir)
  if (!isDir(classPath)) continue
  const num = classDir.match(/\d+/)?.[0]
  const classSlug = num ? `class${num}` : slug(classDir)

  for (const subjectDir of readdirSync(classPath)) {
    const subjectPath = join(classPath, subjectDir)
    if (!isDir(subjectPath)) continue
    const outDir = join(DEST, classSlug, slug(subjectDir))
    mkdirSync(outDir, { recursive: true })

    for (const file of readdirSync(subjectPath)) {
      if (!file.toLowerCase().endsWith('.pdf')) continue
      cpSync(join(subjectPath, file), join(outDir, file))
      count++
    }
  }
}

console.log(`[worksheets] copied ${count} PDF(s) into public/worksheets`)

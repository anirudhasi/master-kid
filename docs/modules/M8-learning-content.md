# M8 — Learning Content (Module Spec)

**Status:** Draft for sign-off · **Stage:** 3
**This module has the platform's biggest hidden liability: content-as-code.**

## 1. Responsibility
The platform's content backbone: academic catalog (board/grade/subject/lesson/QA),
olympiad sets & worksheets, knowledge items, quotes — and the **Knowledge Base contract
that S1 agents will write through**. Content is *provided by the platform*; per-child
progress lives in M3.

## 2. Owned data
`catalog_subjects`, `catalog_lessons`, `catalog_qa`, `catalog_book_pages` (004) ·
`catalog_olympiad_sets` (005) · `catalog_knowledge_items`, `catalog_quotes` (008) ·
`016_content_v2.sql`: adds to every catalog table → `status draft|review|published`,
`source manual|agent|import`, `version int`, `reviewed_by`, `updated_at`.

## 3. Key decisions
1. **Content-as-code must end.** Today large catalogs live in `src/data/*.ts` — shipped
   in the JS bundle (slow loads), unversioned as data, uneditable without deploys, and
   unwritable by agents. Migration path: (a) importer script `src/data` → catalog tables,
   (b) pages read via ContentContract, (c) delete the TS data files. Do this BEFORE S1 —
   agents cannot maintain a knowledge base that lives in git.
2. **Publishing workflow now, not later.** The `status` column is the human-review gate
   for agent-generated content (S1 writes `draft`, humans publish). Adding this after
   agents exist means unreviewed content reaches children in the meantime — unacceptable
   for this product.
3. **Worksheet pipeline** (Python/reportlab, produced separately) registers PDFs as
   catalog items with files in Supabase Storage; page-1 brand enforcement stays in that
   pipeline's CI.

## 4. Contract (this IS the S1 boundary — treat as frozen once accepted)
```ts
export interface ContentContract {
  // read side (app)
  getSyllabus(board: Board, grade: Grade): Promise<SubjectTree>
  getLesson(lessonId: string): Promise<Lesson>
  queryItems(q: ContentQuery): Promise<ContentItem[]>       // knowledge, quotes, worksheets
  // write side (S1 + M10 only — enforced server-side)
  upsertDraft(item: ContentDraft, source: 'agent'|'manual'): Promise<{ id: string }>
  submitForReview(id: string): Promise<void>
  publish(id: string, reviewerId: string): Promise<void>    // emits content.updated
  deprecate(id: string, reason: string): Promise<void>
}
```

## 5. Events
Emits: `content.updated` · `content.draft_submitted` (→ M10 review queue, M12 notify)
Consumes: none (leaf provider)

## 6. DoD
- [ ] Migration 016 + importer executed; `src/data/*.ts` deleted; bundle size drop measured
- [ ] All content pages (Syllabus/Worksheets/Olympiads/Knowledge) reading via contract
- [ ] Draft→review→publish flow working with M10 review queue
- [ ] ContentContract reviewed and FROZEN (S1 gate)

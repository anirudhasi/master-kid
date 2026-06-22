// ── Knowledge service boundary ───────────────────────────────────────────────
// UI talks only to this. Mock (write-through to knowledgeStore) + supabase
// (knowledge_progress) impls. Catalog content is static (data/knowledgeCatalog).

import { supabase } from '@/lib/supabase'
import { AUTH_PROVIDER } from '@/lib/env'
import { useKnowledgeStore } from '@/store/knowledgeStore'

export interface KnowledgeService {
  markSolved(childId: string, itemId: string): Promise<void>
  recordQuiz(childId: string, itemId: string, score: number): Promise<void>
}

const store = () => useKnowledgeStore.getState()

const base: KnowledgeService = {
  async markSolved(childId, itemId) { store()._markSolved(childId, itemId) },
  async recordQuiz(childId, itemId, score) { store()._setScore(childId, itemId, score); store()._markSolved(childId, itemId) },
}

const supabaseKnowledgeService: KnowledgeService = {
  ...base,
  async recordQuiz(childId, itemId, score) {
    await base.recordQuiz(childId, itemId, score)
    if (!supabase) return
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('knowledge_progress').upsert({ account_id: u.user?.id, child_id: childId, item_id: itemId, status: 'done', score, updated_at: new Date().toISOString() })
  },
}

export const knowledgeService: KnowledgeService =
  AUTH_PROVIDER === 'supabase' ? supabaseKnowledgeService : base

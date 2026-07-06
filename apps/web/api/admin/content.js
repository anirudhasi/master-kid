// apps/web/api/admin/content.js — content-workflow admin actions (Stage 3 PR-18)
// Merge into the gateway in index.js:
//   const actions = { ...existingActions, ...require('./content') }
// All calls arrive pre-authenticated as role=admin (gateway enforces) and are audited.

const CATALOG_TABLES = {
  knowledge: 'catalog_knowledge_items',
  olympiad_set: 'catalog_olympiad_sets',
  lesson: 'catalog_lessons',
  qa: 'catalog_qa',
  quote: 'catalog_quotes',
}

async function sb(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`supabase ${path}: ${res.status} ${await res.text()}`)
  return res.status === 204 ? null : res.json()
}

function tableFor(kind) {
  const t = CATALOG_TABLES[kind]
  if (!t) throw Object.assign(new Error(`unknown content kind '${kind}'`), { status: 400 })
  return t
}

module.exports = {
  /** List items awaiting attention (interim surface until M10's unified queue). */
  async content_list_pending({ kind }) {
    const t = tableFor(kind || 'knowledge')
    return sb(`${t}?status=in.(draft,review)&order=updated_at.desc&limit=100`)
  },

  async content_upsert_draft({ kind, id, patch, source }) {
    const t = tableFor(kind)
    const body = { ...patch, status: 'draft', source: source === 'agent' ? 'agent' : 'manual',
      updated_at: new Date().toISOString() }
    if (id) return sb(`${t}?id=eq.${id}`, { method: 'PATCH', body })
    return sb(t, { method: 'POST', body })
  },

  async content_submit_review({ kind, id }) {
    return sb(`${tableFor(kind)}?id=eq.${id}&status=eq.draft`, {
      method: 'PATCH', body: { status: 'review', updated_at: new Date().toISOString() } })
  },

  async content_publish({ kind, id, reviewerId }) {
    const t = tableFor(kind)
    const [row] = await sb(`${t}?id=eq.${id}&status=in.(draft,review)&select=id,version`)
    if (!row) throw Object.assign(new Error('not found or already published'), { status: 404 })
    return sb(`${t}?id=eq.${id}`, { method: 'PATCH', body: {
      status: 'published', reviewed_by: reviewerId,
      version: (row.version || 1) + 1, updated_at: new Date().toISOString(),
    }})
  },

  async content_deprecate({ kind, id, reason }) {
    return sb(`${tableFor(kind)}?id=eq.${id}`, { method: 'PATCH', body: {
      status: 'deprecated', updated_at: new Date().toISOString(),
      // reason is captured by the gateway's audit log entry (params)
    }})
  },

  /** M4: coach verification decision (spec §3.1). */
  async coach_set_verification({ coachId, status }) {
    if (!['unverified', 'documents_submitted', 'verified'].includes(status)) {
      throw Object.assign(new Error('bad status'), { status: 400 })
    }
    return sb(`coach_profiles?account_id=eq.${coachId}`, {
      method: 'PATCH', body: { verification_status: status } })
  },
}

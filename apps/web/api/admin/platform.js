// apps/web/api/admin/platform.js — M10 platform actions (Stage 6, PRs 30–32, 34)
// Merge into gateway: const actions = { ...existing, ...require('./platform') }

async function sb(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`supabase ${path}: ${res.status} ${await res.text()}`)
  return res.status === 204 ? null : res.json()
}

module.exports = {
  // ── toggles ────────────────────────────────────────────────────────────────
  async toggles_list() {
    return sb('feature_toggles?order=key.asc')
  },
  async toggles_set({ key, scope, scopeRef, value, adminId }) {
    if (!['global', 'plan', 'account'].includes(scope)) {
      throw Object.assign(new Error('bad scope'), { status: 400 })
    }
    return sb('feature_toggles?on_conflict=key,scope,scope_ref', {
      method: 'POST',
      body: [{ key, scope, scope_ref: scopeRef || '*', value: !!value,
        updated_by: adminId, updated_at: new Date().toISOString() }],
    })
  },

  // ── journeys (versioned; rollback = publish an older version) ─────────────
  async journey_get_all({ key }) {
    return sb(`journey_definitions?key=eq.${encodeURIComponent(key)}&order=version.desc`)
  },
  async journey_save_draft({ key, definition, adminId }) {
    const rows = await sb(`journey_definitions?key=eq.${encodeURIComponent(key)}&select=version&order=version.desc&limit=1`)
    const version = (rows[0]?.version || 0) + 1
    return sb('journey_definitions', { method: 'POST', body: {
      key, version, definition, published: false, published_by: adminId } })
  },
  async journey_publish({ key, version, adminId }) {
    // unpublish current, publish target — the partial unique index enforces one-published
    await sb(`journey_definitions?key=eq.${encodeURIComponent(key)}&published=eq.true`, {
      method: 'PATCH', body: { published: false } })
    const rows = await sb(
      `journey_definitions?key=eq.${encodeURIComponent(key)}&version=eq.${Number(version)}`, {
      method: 'PATCH', body: { published: true, published_by: adminId } })
    if (!rows || rows.length === 0) {
      throw Object.assign(new Error('version not found'), { status: 404 })
    }
    return rows[0]
  },

  // ── review queue ───────────────────────────────────────────────────────────
  async review_list({ kind }) {
    const filter = kind ? `&kind=eq.${encodeURIComponent(kind)}` : ''
    return sb(`review_items?status=eq.pending${filter}&order=created_at.asc&limit=200`)
  },
  async review_resolve({ id, decision, notes, adminId }) {
    if (!['approved', 'rejected'].includes(decision)) {
      throw Object.assign(new Error('bad decision'), { status: 400 })
    }
    // Idempotent: only pending rows transition; a second click is a no-op.
    return sb(`review_items?id=eq.${id}&status=eq.pending`, {
      method: 'PATCH', body: { status: decision, notes: notes || null,
        reviewer_id: adminId, resolved_at: new Date().toISOString() } })
  },

  // ── ops snapshot (PR-34; one call, read-only) ──────────────────────────────
  async ops_snapshot() {
    const [reviews, tickets, notifFails, topTerms] = await Promise.all([
      sb('review_items?status=eq.pending&select=kind'),
      sb('support_tickets?select=status'),
      sb(`notification_log?status=eq.failed&created_at=gte.${new Date(Date.now() - 864e5).toISOString()}&select=id`),
      sb('discovery_queries?select=query_text&order=created_at.desc&limit=500'),
    ])
    const count = (arr, k) => arr.reduce((m, r) => ((m[r[k]] = (m[r[k]] || 0) + 1), m), {})
    const terms = count(topTerms.filter((r) => r.query_text), 'query_text')
    return {
      reviewCounts: count(reviews, 'kind'),
      ticketCounts: count(tickets, 'status'),
      notificationFailures24h: notifFails.length,
      topSearchTerms: Object.entries(terms)
        .map(([term, n]) => ({ term, count: n }))
        .sort((a, b) => b.count - a.count).slice(0, 10),
    }
  },
}

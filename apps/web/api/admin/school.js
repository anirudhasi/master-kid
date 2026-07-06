// apps/web/api/admin/school.js — school org admin actions (Stage 5 PR-25)
// Merge into gateway: const actions = { ...existing, ...require('./school') }

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

module.exports = {
  async school_list_pending() {
    return sb(`school_orgs?verification_status=in.(unverified,documents_submitted)&order=created_at.desc&limit=100`)
  },
  async school_set_verification({ orgId, status }) {
    if (!['unverified', 'documents_submitted', 'verified'].includes(status)) {
      throw Object.assign(new Error('bad status'), { status: 400 })
    }
    return sb(`school_orgs?id=eq.${orgId}`, {
      method: 'PATCH', body: { verification_status: status } })
  },
}

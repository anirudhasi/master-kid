// apps/web/api/admin/index.js — server-side admin gateway (M1 spec §5, dev-spec PR-5)
// Pattern: verify Supabase JWT → confirm role='admin' in DB → run whitelisted action
// with service role → audit. Matches the repo's Functions v3 conventions (see api/chat).
//
// Required app settings: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET.

const crypto = require('crypto')

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

// Minimal HS256 JWT verification (Supabase access tokens) — no deps.
function verifyJwt(token, secret) {
  const [h, p, s] = token.split('.')
  if (!h || !p || !s) return null
  const expected = crypto.createHmac('sha256', secret)
    .update(`${h}.${p}`).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString())
  if (payload.exp && payload.exp * 1000 < Date.now()) return null
  return payload // payload.sub = account id
}

async function sb(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`supabase ${path}: ${res.status} ${await res.text()}`)
  return res.status === 204 ? null : res.json()
}

// ── Whitelisted admin actions (extend deliberately; each is audited) ─────────
const actions = {
  async set_account_status({ accountId, status }) {
    if (!['active', 'disabled'].includes(status)) throw new Error('bad status')
    return sb(`accounts?id=eq.${accountId}`, { method: 'PATCH', body: { status } })
  },
  async set_account_role({ accountId, role, roles }) {
    return sb(`accounts?id=eq.${accountId}`, { method: 'PATCH', body: { role, roles } })
  },
  async search_accounts({ q }) {
    const enc = encodeURIComponent(`%${q}%`)
    return sb(`accounts?or=(phone.ilike.${enc},email.ilike.${enc},name.ilike.${enc})&limit=20`)
  },
}

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') { context.res = { status: 204, headers: corsHeaders() }; return }

  const fail = (status, error) =>
    (context.res = { status, headers: corsHeaders(), body: JSON.stringify({ error }) })

  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    const claims = token && verifyJwt(token, process.env.SUPABASE_JWT_SECRET)
    if (!claims?.sub) return fail(401, 'unauthenticated')

    // Server-side role check — the browser's opinion is irrelevant here.
    const [account] = await sb(`accounts?id=eq.${claims.sub}&select=id,role,roles,status`)
    const isAdmin = account && account.status === 'active' &&
      (account.role === 'admin' || (account.roles || []).includes('admin'))
    if (!isAdmin) return fail(403, 'forbidden')

    const { action, params } = req.body || {}
    if (!actions[action]) return fail(400, 'unknown action')

    const result = await actions[action](params || {})

    await sb('admin_audit_log', {
      method: 'POST',
      body: { admin_id: claims.sub, action, details: params || {} },
    }).catch((e) => context.log.error('audit write failed', e)) // audit failure is loud, not fatal

    context.res = { status: 200, headers: corsHeaders(), body: JSON.stringify({ data: result }) }
  } catch (err) {
    context.log.error(err)
    fail(500, 'internal error')
  }
}

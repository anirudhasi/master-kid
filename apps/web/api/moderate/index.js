// apps/web/api/moderate/index.js — synchronous content screen (M7 spec §3.3, PR-22)
// Verdicts: allow | flag | block. Cheap tiers run first; the AI tier is optional
// and only consulted for borderline content (cost control).
//
// App settings: SUPABASE_JWT_SECRET (caller must be authenticated),
//               ANTHROPIC_API_KEY (optional — enables the AI tier).

const crypto = require('crypto')

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

function verifyJwt(token, secret) {
  const [h, p, s] = (token || '').split('.')
  if (!h || !p || !s) return null
  const expected = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url')
  try { if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null }
  catch { return null }
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString())
  if (payload.exp && payload.exp * 1000 < Date.now()) return null
  return payload
}

// Tier 1: hard blocklist — maintain in one place; extend via PRs, keep lowercase.
// Seed list is deliberately minimal; grow it from real flagged content.
const BLOCK = [
  // profanity/abuse seeds (extend): 
  'bastard', 'bitch', 'chutiya', 'harami', 'kamina', 'saala',
]
// Tier 2: contact-info and off-platform-luring heuristics → flag for human review.
const FLAG_PATTERNS = [
  /\b\d{10}\b/,                        // bare 10-digit phone number
  /\bwhats\s?app\b/i,
  /\btelegram\b/i,
  /@[a-z0-9._%+-]+\.[a-z]{2,}/i,       // email-ish
  /\bmeet\s+(me|alone|privately)\b/i,
  /\bdon'?t\s+tell\s+(your\s+)?(parents|mom|dad|anyone)\b/i,
]

function cheapScreen(text) {
  const t = (text || '').toLowerCase()
  if (!t.trim()) return 'allow'
  if (BLOCK.some((w) => t.includes(w))) return 'block'
  if (FLAG_PATTERNS.some((re) => re.test(text))) return 'flag'
  return null // undecided → AI tier (or allow if AI unavailable)
}

async function aiScreen(text, log) {
  if (!process.env.ANTHROPIC_API_KEY) return 'allow'
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5,
        system:
          'You are a content-safety screen for a children\'s-education community used by ' +
          'parents and tutors in India (English/Hindi/Hinglish). Reply with EXACTLY one word: ' +
          'ALLOW (normal content), FLAG (possibly unsafe/inappropriate/solicitation — needs ' +
          'human review), or BLOCK (clearly abusive, sexual, or dangerous).',
        messages: [{ role: 'user', content: text.slice(0, 2000) }],
      }),
    })
    if (!res.ok) throw new Error(`anthropic ${res.status}`)
    const data = await res.json()
    const word = (data.content?.[0]?.text || '').trim().toUpperCase()
    if (word.startsWith('BLOCK')) return 'block'
    if (word.startsWith('FLAG')) return 'flag'
    return 'allow'
  } catch (e) {
    log('ai screen unavailable, failing safe to flag:', e.message)
    return 'flag' // fail SAFE on a children's platform: human reviews, content waits
  }
}

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') { context.res = { status: 204, headers: corsHeaders() }; return }
  const fail = (status, error) =>
    (context.res = { status, headers: corsHeaders(), body: JSON.stringify({ error }) })
  try {
    const claims = verifyJwt((req.headers.authorization || '').replace(/^Bearer\s+/i, ''),
      process.env.SUPABASE_JWT_SECRET)
    if (!claims?.sub) return fail(401, 'unauthenticated')

    const { text } = req.body || {}
    if (typeof text !== 'string') return fail(400, 'text required')

    let verdict = cheapScreen(text)
    if (verdict === null) verdict = await aiScreen(text, (...a) => context.log(...a))

    context.res = { status: 200, headers: corsHeaders(), body: JSON.stringify({ verdict }) }
  } catch (err) {
    context.log.error(err)
    fail(500, 'internal error')
  }
}

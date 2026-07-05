// apps/web/api/payments/index.js — M9 payments gateway (dev-spec PR-12)
// Actions: create_order (authenticated user) · webhook (Razorpay server callback).
// All entitlement writes happen HERE with the service role — never in the browser.
//
// App settings: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET,
//               RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET.

const crypto = require('crypto')

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-razorpay-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

function verifyJwt(token, secret) {
  const [h, p, s] = (token || '').split('.')
  if (!h || !p || !s) return null
  const expected = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url')
  try {
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null
  } catch { return null }
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString())
  if (payload.exp && payload.exp * 1000 < Date.now()) return null
  return payload
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

async function razorpay(path, body) {
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
  const res = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`razorpay ${path}: ${res.status} ${await res.text()}`)
  return res.json()
}

function periodEnd(period) {
  const d = new Date()
  if (period === 'year') d.setFullYear(d.getFullYear() + 1)
  else d.setMonth(d.getMonth() + 1)
  return d.toISOString()
}

// ── create_order: user picks child+plan, we create a Razorpay order ─────────
async function createOrder(claims, { childId, planId }) {
  // Ownership check server-side: the child must belong to the caller.
  const [child] = await sb(`children?id=eq.${childId}&account_id=eq.${claims.sub}&select=id`)
  if (!child) throw Object.assign(new Error('child not found'), { status: 403 })

  const [plan] = await sb(`plans?id=eq.${encodeURIComponent(planId)}&is_active=eq.true`)
  if (!plan || plan.amount_inr <= 0) throw Object.assign(new Error('invalid plan'), { status: 400 })

  const order = await razorpay('orders', {
    amount: plan.amount_inr * 100,             // paise
    currency: 'INR',
    notes: { child_id: childId, plan_id: planId, account_id: claims.sub },
  })

  await sb('payments', { method: 'POST', body: {
    account_id: claims.sub, target_type: 'child_subscription', target_id: childId,
    amount_inr: plan.amount_inr, provider: 'razorpay', provider_ref: order.id,
    status: 'created',
  }})

  return { orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID, amountInr: plan.amount_inr }
}

// ── webhook: signature-verified, idempotent, entitlement flip ────────────────
async function handleWebhook(rawBody, signature, log) {
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody).digest('hex')
  const ok = signature && expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  if (!ok) throw Object.assign(new Error('bad signature'), { status: 401 })

  const evt = JSON.parse(rawBody)
  const eventId = evt.id || evt.event_id
  const payment = evt.payload && evt.payload.payment && evt.payload.payment.entity
  if (!payment) return { ignored: true }

  const notes = payment.notes || {}
  const { child_id, plan_id, account_id } = notes
  if (!child_id || !plan_id || !account_id) return { ignored: true }

  if (evt.event === 'payment.captured') {
    // Idempotency: unique index on gateway_event_id makes a replay a no-op.
    let paid
    try {
      ;[paid] = await sb('payments', { method: 'POST', body: {
        account_id, target_type: 'child_subscription', target_id: child_id,
        amount_inr: Math.round(payment.amount / 100), provider: 'razorpay',
        provider_ref: payment.order_id, gateway_event_id: eventId, status: 'paid',
      }})
    } catch (e) {
      if (String(e.message).includes('duplicate')) { log('replay ignored', eventId); return { replay: true } }
      throw e
    }

    const [plan] = await sb(`plans?id=eq.${encodeURIComponent(plan_id)}`)
    const [existing] = await sb(`subscriptions?child_id=eq.${child_id}&select=id`)
    const subBody = {
      account_id, child_id, plan: plan_id, status: 'active',
      amount_inr: plan.amount_inr, current_period_end: periodEnd(plan.period),
      updated_at: new Date().toISOString(),
    }
    if (existing) await sb(`subscriptions?id=eq.${existing.id}`, { method: 'PATCH', body: subBody })
    else await sb('subscriptions', { method: 'POST', body: subBody })

    const number = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/next_invoice_number`, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      }, body: '{}',
    }).then((r) => r.json())
    await sb('invoices', { method: 'POST', body: {
      number, account_id, payment_id: paid.id, amount_inr: Math.round(payment.amount / 100),
    }})
    return { activated: true }
  }

  if (evt.event === 'payment.failed') {
    const [existing] = await sb(`subscriptions?child_id=eq.${child_id}&select=id,status`)
    if (existing && existing.status === 'active') {
      await sb(`subscriptions?id=eq.${existing.id}`, {
        method: 'PATCH', body: { status: 'past_due', updated_at: new Date().toISOString() } })
    }
    return { pastDue: true }
  }

  return { ignored: true }
}

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') { context.res = { status: 204, headers: corsHeaders() }; return }
  const fail = (status, error) =>
    (context.res = { status, headers: corsHeaders(), body: JSON.stringify({ error }) })

  try {
    const sig = req.headers['x-razorpay-signature']
    if (sig) {
      const result = await handleWebhook(req.rawBody || JSON.stringify(req.body), sig,
        (...a) => context.log(...a))
      context.res = { status: 200, headers: corsHeaders(), body: JSON.stringify(result) }
      return
    }

    const claims = verifyJwt((req.headers.authorization || '').replace(/^Bearer\s+/i, ''),
      process.env.SUPABASE_JWT_SECRET)
    if (!claims?.sub) return fail(401, 'unauthenticated')

    const { action, params } = req.body || {}
    if (action !== 'create_order') return fail(400, 'unknown action')
    const result = await createOrder(claims, params || {})
    context.res = { status: 200, headers: corsHeaders(), body: JSON.stringify({ data: result }) }
  } catch (err) {
    context.log.error(err)
    fail(err.status || 500, err.status ? err.message : 'internal error')
  }
}

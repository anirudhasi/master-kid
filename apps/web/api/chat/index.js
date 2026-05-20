module.exports = async function (context, req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders() }
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    context.res = { status: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'API key not configured' }) }
    return
  }

  const { messages } = req.body || {}
  if (!messages || !Array.isArray(messages)) {
    context.res = { status: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'messages array required' }) }
    return
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.7 }),
    })

    if (!response.ok) {
      const err = await response.text()
      context.res = { status: response.status, headers: corsHeaders(), body: JSON.stringify({ error: err }) }
      return
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content ?? ''
    context.res = { status: 200, headers: corsHeaders(), body: JSON.stringify({ reply }) }
  } catch (err) {
    context.res = { status: 500, headers: corsHeaders(), body: JSON.stringify({ error: String(err) }) }
  }
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

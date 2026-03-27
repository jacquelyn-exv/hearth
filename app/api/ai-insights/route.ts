import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { metrics } = await request.json()

  const prompt = `You are a product analytics advisor reviewing Hearth, a homeowner intelligence platform. Analyze these metrics and give exactly 3 prioritized action items. Be direct, specific, and actionable. Format as a JSON array of objects with keys: priority (1-3), title (short label), action (1 sentence of what to do), urgency (high/medium/low).

Metrics:
${metrics}

Respond with ONLY a valid JSON array. No markdown, no explanation, no backticks.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const data = await response.json()
    const text = data.content?.[0]?.text || '[]'
    return NextResponse.json({ insights: text })
  } catch (error: any) {
    return NextResponse.json({ insights: '[]', error: error.message }, { status: 500 })
  }
}

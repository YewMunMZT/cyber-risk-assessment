import { NextRequest, NextResponse } from 'next/server'

/* ─── Types ──────────────────────────────────────────────────────── */
interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatContext {
  companyName: string
  riskScore: number
  riskLevel: string
  industry?: string | null
  recommendations?: Array<{ title: string; finding: string; action: string }> | null
}

/* ─── System prompt ──────────────────────────────────────────────── */
function buildSystemPrompt(ctx: ChatContext): string {
  const recList = ctx.recommendations?.slice(0, 5)
    .map((r, i) => `${i + 1}. ${r.title}: ${r.finding}`)
    .join('\n') || 'Not yet available'

  return `You are a friendly senior cybersecurity advisor helping ${ctx.companyName}.

THEIR ASSESSMENT RESULTS:
- Company: ${ctx.companyName}
- Overall Risk Score: ${ctx.riskScore}/10 (${ctx.riskLevel} Risk)
- Industry: ${ctx.industry || 'Not determined'}

TOP SECURITY FINDINGS FROM THEIR SCAN:
${recList}

INSTRUCTIONS:
- Answer questions about their cybersecurity posture in plain, simple language
- Reference their specific results and findings when relevant
- Keep every response under 120 words — concise and actionable
- No markdown formatting, no bullet points with dashes, no asterisks — plain text only
- If asked something outside cybersecurity, politely redirect to their security needs`
}

/* ─── Ollama chat caller ─────────────────────────────────────────── */
async function callOllamaChat(messages: ChatMessage[]): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60000)

  try {
    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'phi3:mini',
        messages,
        stream: false,
        options: {
          temperature: 0.4,
          top_p: 0.9,
          num_predict: 300,
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)
    const data = await res.json()
    const reply = (data.message?.content as string ?? '').trim()
    if (!reply) throw new Error('Empty response from model')
    return reply
  } finally {
    clearTimeout(timer)
  }
}

/* ─── Route handler ──────────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  let messages: ChatMessage[] = []
  let context: ChatContext | null = null

  try {
    const body = await request.json()
    messages = body.messages ?? []
    context  = body.context  ?? null
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!messages.length || !context) {
    return NextResponse.json({ error: 'messages and context are required' }, { status: 400 })
  }

  // Health check Ollama
  try {
    const health = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(3000),
    })
    if (!health.ok) throw new Error('Ollama unhealthy')
  } catch {
    return NextResponse.json(
      { error: 'AI service unavailable. Please ensure Ollama is running with phi3:mini.' },
      { status: 503 }
    )
  }

  // Prepend system prompt and call model
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(context) },
    ...messages,
  ]

  try {
    const reply = await callOllamaChat(fullMessages)
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[ai-chat] Ollama error:', err)
    return NextResponse.json({ error: 'AI response failed. Please retry.' }, { status: 503 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

/* ─── Types ──────────────────────────────────────────────────────── */
interface VACheck { pass: boolean; label: string; detail: string }
interface VAResult {
  reachable: boolean
  url?: string
  isHttps?: boolean
  responseTimeMs?: number
  checks?: Record<string, VACheck>
  score?: number
  maxScore?: number
  grade?: string
}

interface SiteContext {
  title: string
  description: string
  h1s: string[]
  h2s: string[]
  ogTitle: string
  ogDesc: string
}

/* ─── Web scraper ────────────────────────────────────────────────── */
async function scrapeOrgContext(url: string): Promise<SiteContext> {
  const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 7000)

  try {
    const res = await fetch(withScheme, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SecurityAnalyser/1.0)',
        'Accept': 'text/html',
      },
      signal: controller.signal,
    })

    const html = await res.text()

    const title   = (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? '').trim().slice(0, 200)
    const desc    = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] ?? '').trim().slice(0, 400)
    const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ?? '').trim().slice(0, 200)
    const ogDesc  = (html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i)?.[1] ?? '').trim().slice(0, 400)

    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
      .filter(Boolean).slice(0, 4)

    const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
      .filter(Boolean).slice(0, 6)

    return { title, description: desc, h1s, h2s, ogTitle, ogDesc }
  } catch {
    return { title: '', description: '', h1s: [], h2s: [], ogTitle: '', ogDesc: '' }
  } finally {
    clearTimeout(timer)
  }
}

/* ─── Prompt builder ─────────────────────────────────────────────── */
function buildPrompt(companyName: string, ctx: SiteContext, vaResult: VAResult): string {
  const checks = vaResult.checks ?? {}

  const failedChecks = Object.values(checks)
    .filter(c => !c.pass)
    .map(c => `  ✗ ${c.label}: ${c.detail}`)
    .join('\n') || '  None — all checks passed'

  const passedChecks = Object.values(checks)
    .filter(c => c.pass)
    .map(c => c.label)
    .join(', ') || 'None'

  const pageContent = [
    ctx.ogTitle || ctx.title,
    ctx.ogDesc  || ctx.description,
    ...(ctx.h1s),
    ...(ctx.h2s),
  ].filter(Boolean).join(' | ').slice(0, 600)

  const hasScanData = vaResult.reachable && !!vaResult.checks

  const scanSection = hasScanData
    ? `SECURITY SCAN RESULTS:
Grade: ${vaResult.grade ?? 'N/A'} — ${vaResult.score ?? 0}/${vaResult.maxScore ?? 8} header checks passed
HTTPS enabled: ${vaResult.isHttps ? 'Yes' : 'No'}
Response time: ${vaResult.responseTimeMs ?? 'N/A'}ms

Failed security checks:
${failedChecks}

Passing checks: ${passedChecks}`
    : `SECURITY SCAN RESULTS:
No automated scan data available — base recommendations on the organisation's industry and website content.`

  return `You are a senior cybersecurity consultant generating a structured JSON report.

ORGANISATION PROFILE:
Company: ${companyName}
Website: ${vaResult.url || url}
Website content: ${pageContent || 'Not available'}

${scanSection}

INSTRUCTIONS:
1. Infer the organisation's industry from the website content.
2. Generate exactly 5 cybersecurity recommendations, prioritised from most to least critical.
3. Tailor each recommendation to this specific organisation's industry and the actual security gaps found.
4. Respond with ONLY valid JSON — no markdown, no code fences, no explanation text.

Use this exact JSON schema:

{"recommendations":[{"priority":1,"title":"Short title under 8 words","category":"Technology","finding":"What the scan found and why it matters for this type of organisation (2 sentences).","action":"Specific steps the organisation should take immediately (2 sentences).","effort":"Low"},{"priority":2,"title":"Short title","category":"Process","finding":"Finding explanation.","action":"Action to take.","effort":"Medium"}],"orgContext":{"title":"Page title from website","description":"Brief description","industry":"Inferred industry in 3-5 words"}}

Categories must be one of: People, Process, Technology, Infrastructure, Compliance
Effort must be one of: Low, Medium, High
Priority must be integers 1 through 5 in ascending order.`
}

/* ─── Ollama caller ──────────────────────────────────────────────── */
async function callOllama(prompt: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60000)

  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'phi3:mini',
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 1200,
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)
    const data = await res.json()
    return data.response as string
  } finally {
    clearTimeout(timer)
  }
}

/* ─── JSON extractor ─────────────────────────────────────────────── */
function extractJSON(raw: string): unknown {
  // Try direct parse
  try { return JSON.parse(raw.trim()) } catch { /* continue */ }

  // Find outermost { ... } block
  const start = raw.indexOf('{')
  const end   = raw.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(raw.slice(start, end + 1)) } catch { /* continue */ }
  }
  throw new Error('No valid JSON found in model response')
}

/* ─── Route handler ──────────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  let url = '', companyName = '', vaResult: VAResult | null = null

  try {
    const body = await request.json()
    url         = body.url         ?? ''
    companyName = body.companyName ?? ''
    vaResult    = body.vaResult    ?? null
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!url || !companyName) {
    return NextResponse.json(
      { error: 'url and companyName are required' },
      { status: 400 }
    )
  }

  // vaResult is optional — use whatever scan data was passed (may be partial or absent)
  if (!vaResult) vaResult = { reachable: false }

  // Check Ollama is running
  try {
    const health = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(3000)
    })
    if (!health.ok) throw new Error('Ollama unhealthy')
  } catch {
    return NextResponse.json(
      { error: 'AI service is not available. Please ensure Ollama is running with phi3:mini.' },
      { status: 503 }
    )
  }

  // Scrape website context (failure is non-fatal)
  let ctx: SiteContext
  try {
    ctx = await scrapeOrgContext(url)
  } catch {
    ctx = { title: '', description: '', h1s: [], h2s: [], ogTitle: '', ogDesc: '' }
  }

  // Call the AI model
  let rawResponse: string
  try {
    const prompt = buildPrompt(companyName, ctx, vaResult)
    rawResponse  = await callOllama(prompt)
  } catch (err) {
    console.error('[ai-recommendations] Ollama error:', err)
    return NextResponse.json({ error: 'AI model call failed. Please retry.' }, { status: 503 })
  }

  // Parse and return
  try {
    const parsed = extractJSON(rawResponse) as {
      recommendations: unknown[]
      orgContext: unknown
    }
    if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
      throw new Error('Empty recommendations array')
    }
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[ai-recommendations] JSON parse error:', err, '\nRaw:', rawResponse.slice(0, 500))
    return NextResponse.json({ error: 'AI returned an unexpected format. Please retry.' }, { status: 502 })
  }
}

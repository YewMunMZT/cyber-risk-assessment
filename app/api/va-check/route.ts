import { NextRequest, NextResponse } from 'next/server'

export interface VAResult {
  reachable: boolean
  url?: string
  isHttps?: boolean
  redirectedToHttps?: boolean
  responseTimeMs?: number
  statusCode?: number
  checks?: {
    https:              { pass: boolean; label: string; detail: string }
    hsts:               { pass: boolean; label: string; detail: string }
    xFrameOptions:      { pass: boolean; label: string; detail: string }
    csp:                { pass: boolean; label: string; detail: string }
    xContentTypeOptions:{ pass: boolean; label: string; detail: string }
    referrerPolicy:     { pass: boolean; label: string; detail: string }
    permissionsPolicy:  { pass: boolean; label: string; detail: string }
    serverHeader:       { pass: boolean; label: string; detail: string }
  }
  score?: number
  maxScore?: number
  grade?: string
  error?: string
}

function normaliseUrl(raw: string): URL | null {
  try {
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    return new URL(withScheme)
  } catch {
    return null
  }
}

function grade(score: number, max: number): string {
  const pct = score / max
  if (pct >= 0.875) return 'A'
  if (pct >= 0.75)  return 'B'
  if (pct >= 0.5)   return 'C'
  if (pct >= 0.25)  return 'D'
  return 'F'
}

export async function POST(request: NextRequest) {
  let body: { url?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const raw = (body.url || '').trim()
  if (!raw) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  // ── 1. Parse URL ──────────────────────────────────────────────────
  const parsed = normaliseUrl(raw)
  if (!parsed) return NextResponse.json({ reachable: false, error: 'Invalid URL format — please include a valid domain (e.g. https://example.com)' })

  const isHttps = parsed.protocol === 'https:'

  // ── 2. Attempt HEAD request with timeout ─────────────────────────
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), 8000)
  const start      = Date.now()

  let res: Response | null = null
  let fetchError = ''
  let redirectedToHttps = false

  try {
    // Try HTTPS first; if original URL was http, also check redirect
    const targetUrl = isHttps ? parsed.href : `https://${parsed.host}${parsed.pathname}${parsed.search}`

    res = await fetch(targetUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'UOB-Security-Scanner/1.0' },
    })

    // If original was HTTP and HTTPS succeeded, flag redirect
    if (!isHttps) redirectedToHttps = res.ok || res.status < 500
  } catch (err) {
    const e = err as Error
    fetchError = e.name === 'AbortError'
      ? 'Request timed out — the site may be slow or blocking automated scans'
      : 'Unable to reach the website — check that the URL is publicly accessible'
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res && fetchError) {
    return NextResponse.json({ reachable: false, error: fetchError } satisfies VAResult)
  }

  const responseTimeMs = Date.now() - start
  const h = res!.headers

  // ── 3. Evaluate security headers ─────────────────────────────────
  const hstsVal        = h.get('strict-transport-security')
  const xfoVal         = h.get('x-frame-options')
  const cspVal         = h.get('content-security-policy')
  const xctoVal        = h.get('x-content-type-options')
  const rpVal          = h.get('referrer-policy')
  const ppVal          = h.get('permissions-policy') ?? h.get('feature-policy')
  const serverVal      = h.get('server')
  const xPoweredByVal  = h.get('x-powered-by')

  const checks: VAResult['checks'] = {
    https: {
      pass: isHttps || redirectedToHttps,
      label: 'HTTPS',
      detail: isHttps
        ? 'Site uses HTTPS — data in transit is encrypted'
        : redirectedToHttps
          ? 'HTTP redirects to HTTPS — encryption enforced'
          : 'Site does not use HTTPS — data transmitted in plaintext',
    },
    hsts: {
      pass: !!hstsVal,
      label: 'HSTS',
      detail: hstsVal
        ? `Strict-Transport-Security enforced (max-age detected)`
        : 'Missing Strict-Transport-Security header — browsers may allow HTTP fallback',
    },
    xFrameOptions: {
      pass: !!xfoVal,
      label: 'Clickjacking Protection',
      detail: xfoVal
        ? `X-Frame-Options: ${xfoVal}`
        : 'Missing X-Frame-Options — site may be vulnerable to clickjacking',
    },
    csp: {
      pass: !!cspVal,
      label: 'Content Security Policy',
      detail: cspVal
        ? 'Content-Security-Policy header is present'
        : 'Missing Content-Security-Policy — increased XSS exposure risk',
    },
    xContentTypeOptions: {
      pass: xctoVal?.toLowerCase() === 'nosniff',
      label: 'MIME Sniffing Protection',
      detail: xctoVal
        ? `X-Content-Type-Options: ${xctoVal}`
        : 'Missing X-Content-Type-Options: nosniff — browser MIME sniffing enabled',
    },
    referrerPolicy: {
      pass: !!rpVal,
      label: 'Referrer Policy',
      detail: rpVal
        ? `Referrer-Policy: ${rpVal}`
        : 'Missing Referrer-Policy — full URL may leak in referrer headers',
    },
    permissionsPolicy: {
      pass: !!ppVal,
      label: 'Permissions Policy',
      detail: ppVal
        ? 'Permissions-Policy header restricts browser feature access'
        : 'Missing Permissions-Policy — browser APIs (camera, mic, etc.) not explicitly restricted',
    },
    serverHeader: {
      pass: !serverVal && !xPoweredByVal,
      label: 'Server Info Disclosure',
      detail: serverVal || xPoweredByVal
        ? `Server version exposed: ${[serverVal, xPoweredByVal].filter(Boolean).join(' / ')} — reveals tech stack to attackers`
        : 'Server/X-Powered-By headers suppressed — no technology stack exposure',
    },
  }

  const passed   = Object.values(checks).filter((c) => c.pass).length
  const maxScore = Object.keys(checks).length

  return NextResponse.json({
    reachable: true,
    url: res!.url || parsed.href,
    isHttps: isHttps || redirectedToHttps,
    redirectedToHttps,
    responseTimeMs,
    statusCode: res!.status,
    checks,
    score: passed,
    maxScore,
    grade: grade(passed, maxScore),
  } satisfies VAResult)
}

import { NextRequest, NextResponse } from 'next/server'

function normaliseUrl(raw: string): URL | null {
  try {
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    return new URL(withScheme)
  } catch {
    return null
  }
}

function scoreToGrade(score: number, max: number): string {
  const pct = score / max
  if (pct >= 0.875) return 'A'
  if (pct >= 0.75)  return 'B'
  if (pct >= 0.5)   return 'C'
  if (pct >= 0.25)  return 'D'
  return 'F'
}

export async function POST(request: NextRequest) {
  // ── Parse body ────────────────────────────────────────────────────
  let body: { url?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ reachable: false, error: 'Invalid request body' }, { status: 400 })
  }

  const raw = (body.url || '').trim()
  if (!raw) {
    return NextResponse.json({ reachable: false, error: 'URL is required' }, { status: 400 })
  }

  // ── Validate URL ──────────────────────────────────────────────────
  const parsed = normaliseUrl(raw)
  if (!parsed) {
    return NextResponse.json({
      reachable: false,
      error: 'Invalid URL format — please include a valid domain (e.g. https://example.com)',
    })
  }

  const originalIsHttps = parsed.protocol === 'https:'

  // ── Fetch with timeout ────────────────────────────────────────────
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), 8000)
  const startMs    = Date.now()

  let res: Response | null = null
  let fetchError = ''
  let redirectedToHttps = false

  try {
    // Always try HTTPS version to detect automatic redirect
    const httpsUrl = `https://${parsed.host}${parsed.pathname}${parsed.search}`
    res = await fetch(httpsUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'SecurityScanner/1.0 (header-check)' },
    })
    if (!originalIsHttps) redirectedToHttps = true
  } catch (err) {
    const e = err as Error
    // If HTTPS failed and original was HTTP, try HTTP
    if (!originalIsHttps) {
      try {
        res = await fetch(parsed.href, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
          headers: { 'User-Agent': 'SecurityScanner/1.0 (header-check)' },
        })
      } catch (err2) {
        const e2 = err2 as Error
        fetchError = e2.name === 'AbortError'
          ? 'Request timed out — the site may be slow or blocking automated scans'
          : 'Unable to reach the website — check that the URL is publicly accessible'
      }
    } else {
      fetchError = e.name === 'AbortError'
        ? 'Request timed out — the site may be slow or blocking automated scans'
        : 'Unable to reach the website — check that the URL is publicly accessible'
    }
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res && fetchError) {
    return NextResponse.json({ reachable: false, error: fetchError })
  }
  if (!res) {
    return NextResponse.json({ reachable: false, error: 'Unexpected error reaching the website' })
  }

  const responseTimeMs = Date.now() - startMs
  const h = res.headers
  const isHttps = originalIsHttps || redirectedToHttps

  // ── Security header checks ────────────────────────────────────────
  const hstsVal   = h.get('strict-transport-security')
  const xfoVal    = h.get('x-frame-options')
  const cspVal    = h.get('content-security-policy')
  const xctoVal   = h.get('x-content-type-options')
  const rpVal     = h.get('referrer-policy')
  const ppVal     = h.get('permissions-policy') || h.get('feature-policy')
  const srvVal    = h.get('server')
  const xpbVal    = h.get('x-powered-by')

  const checks = {
    https: {
      pass: isHttps,
      label: 'HTTPS',
      detail: isHttps
        ? originalIsHttps
          ? 'Site uses HTTPS — data in transit is encrypted'
          : 'HTTP redirects to HTTPS — encryption is enforced'
        : 'Site does not use HTTPS — data is transmitted in plaintext',
    },
    hsts: {
      pass: !!hstsVal,
      label: 'HSTS',
      detail: hstsVal
        ? 'Strict-Transport-Security is enforced — browsers will always use HTTPS'
        : 'Missing Strict-Transport-Security header — browsers may allow HTTP fallback',
    },
    xFrameOptions: {
      pass: !!xfoVal,
      label: 'Clickjacking Protection',
      detail: xfoVal
        ? `X-Frame-Options: ${xfoVal}`
        : 'Missing X-Frame-Options — page may be embeddable in malicious iframes',
    },
    csp: {
      pass: !!cspVal,
      label: 'Content Security Policy',
      detail: cspVal
        ? 'Content-Security-Policy header is present'
        : 'Missing Content-Security-Policy — increased risk of cross-site scripting (XSS)',
    },
    xContentTypeOptions: {
      pass: xctoVal?.toLowerCase() === 'nosniff',
      label: 'MIME Sniffing Protection',
      detail: xctoVal
        ? `X-Content-Type-Options: ${xctoVal}`
        : 'Missing X-Content-Type-Options: nosniff — MIME sniffing attacks are possible',
    },
    referrerPolicy: {
      pass: !!rpVal,
      label: 'Referrer Policy',
      detail: rpVal
        ? `Referrer-Policy: ${rpVal}`
        : 'Missing Referrer-Policy — full URL may leak to third-party sites via referrer headers',
    },
    permissionsPolicy: {
      pass: !!ppVal,
      label: 'Permissions Policy',
      detail: ppVal
        ? 'Permissions-Policy restricts browser feature access (camera, mic, geolocation)'
        : 'Missing Permissions-Policy — browser APIs are not explicitly restricted',
    },
    serverHeader: {
      pass: !srvVal && !xpbVal,
      label: 'Server Info Disclosure',
      detail: srvVal || xpbVal
        ? `Technology stack exposed: ${[srvVal, xpbVal].filter(Boolean).join(' / ')} — aids attacker reconnaissance`
        : 'Server and X-Powered-By headers are suppressed — no technology stack exposed',
    },
  }

  const passed   = Object.values(checks).filter((c) => c.pass).length
  const maxScore = Object.keys(checks).length

  return NextResponse.json({
    reachable: true,
    url: res.url || parsed.href,
    isHttps,
    redirectedToHttps,
    responseTimeMs,
    statusCode: res.status,
    checks,
    score: passed,
    maxScore,
    grade: scoreToGrade(passed, maxScore),
  })
}

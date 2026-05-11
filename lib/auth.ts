import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

const COOKIE_NAME = 'admin_token'
const COOKIE_MAX_AGE = 8 * 60 * 60 // 8 hours

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-change-in-production-32-chars'
  )
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

export async function getAdminFromRequest(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export function buildAuthCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}; Path=/${secure}`
}

export function buildLogoutCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`
}

export { COOKIE_NAME }

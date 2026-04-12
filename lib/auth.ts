import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const SECRET = process.env.NEXTAUTH_SECRET!

export function signToken(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
  try { return jwt.verify(token, SECRET) as any }
  catch { return null }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('fl_token')?.value
  if (!token) return null
  return verifyToken(token)
}

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    await connectDB()
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || !user.password) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    const token = signToken({ userId: user._id.toString(), email: user.email, name: user.name })

    const res = NextResponse.json({ ok: true })
    res.cookies.set('fl_token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    })
    return res
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  console.log("MONGODB_URI:", process.env.MONGODB_URI);
  try {
    const { name, email, password } = await req.json()
    if (!name || !email || !password) return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    await connectDB()
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

    const hashed = await bcrypt.hash(password, 12)
    const user   = await User.create({ name, email: email.toLowerCase(), password: hashed })

    const token = signToken({ userId: user._id.toString(), email: user.email, name: user.name })

    const res = NextResponse.json({ ok: true })
    res.cookies.set('fl_token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    })
    return res
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

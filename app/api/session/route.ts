import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Session } from '@/models/Session'
import { format } from 'date-fns'

// POST /api/session — called by extension every 15s
export async function POST(req: NextRequest) {
  const auth = await getSession()
  if (!auth) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json()
  const { sessionId, idleSeconds, reScrolls, readingSpeed, focusScore, pageTitle, pageUrl, platform, topic } = body

  await connectDB()
  const today = format(new Date(), 'yyyy-MM-dd')

  const signal = { timestamp: new Date(), idleSeconds, reScrolls, readingSpeed, focusScore, pageTitle, pageUrl }

  if (sessionId) {
    // Update existing session
    const doc = await Session.findById(sessionId)
    if (doc && doc.userId.toString() === auth.userId) {
      doc.signals.push(signal)
      const scores = doc.signals.map((s: any) => s.focusScore).filter(Boolean)
      doc.avgScore    = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      doc.peakScore   = Math.max(...scores)
      doc.lowestScore = Math.min(...scores)
      doc.totalMinutes = Math.round((Date.now() - new Date(doc.startTime).getTime()) / 60000)
      if (focusScore < 60) doc.alerts += 1
      await doc.save()
      return NextResponse.json({ ok: true, sessionId: doc._id, focusScore })
    }
  }

  // Create new session
  const newSession = await Session.create({
    userId: auth.userId, date: today,
    platform: platform || new URL(pageUrl || 'https://unknown').hostname,
    topic: topic || pageTitle || '',
    signals: [signal],
    avgScore: focusScore, peakScore: focusScore, lowestScore: focusScore,
  })
  return NextResponse.json({ ok: true, sessionId: newSession._id, focusScore })
}

// PATCH /api/session — called when extension session ends
export async function PATCH(req: NextRequest) {
  const auth = await getSession()
  if (!auth) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { sessionId } = await req.json()
  await connectDB()
  const doc = await Session.findById(sessionId)
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  doc.endTime      = new Date()
  doc.totalMinutes = Math.round((Date.now() - new Date(doc.startTime).getTime()) / 60000)
  await doc.save()
  return NextResponse.json({ ok: true })
}

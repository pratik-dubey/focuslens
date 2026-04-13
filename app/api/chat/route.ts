import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { nvidia, MODEL } from '@/lib/ai'

function corsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('origin') || '*'
  return {
    'Access-Control-Allow-Origin':  origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) })
}

export async function POST(req: NextRequest) {
  let auth = null
  try { auth = await getSession() } catch {}
  const origin      = req.headers.get('origin') || ''
  const isExtension = !origin.includes('localhost:3000') && !origin.includes('focuslens.app')
  if (!auth && !isExtension) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401, headers: corsHeaders(req) })
  }

  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders(req) }) }

  const { messages = [], pageTitle = '', focusScore = '' } = body

  const systemPrompt = `You are FocusLens AI Tutor — a friendly, concise learning assistant embedded in a Chrome extension popup.
You help students who are studying online.
Current context: Student is on "${pageTitle || 'a learning page'}", focus score: ${focusScore || 'unknown'}/100.
Rules:
1. Re-explain confusing concepts in simpler terms using analogies and real-world examples.
2. Generate short quizzes (max 3 MCQ) when asked — return as JSON: {"type":"quiz","questions":[{"q":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]}
3. Summarize long content into exactly 5 bullet points.
4. Use the Socratic method when student says they are stuck — ask ONE guiding question instead of giving the answer.
5. Keep ALL responses under 150 words. You appear in a small popup widget.
6. Be warm, encouraging, and specific to the topic at hand.`

  let history = (messages as any[]).slice(-6)
  while (history.length > 0 && history[0].role !== 'user') history.shift()
  if (history.length === 0) history = [{ role: 'user', content: 'Hello, I need help with what I am studying.' }]

  const chatMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m: any) => ({
      role:    (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: String(m.content || ''),
    })),
  ]

  try {
    const stream = await nvidia.chat.completions.create({
      model: MODEL, messages: chatMessages, max_tokens: 400, temperature: 0.7, stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        } catch (streamErr: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: '\n\n[Stream error: ' + streamErr.message + ']' })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        ...corsHeaders(req),
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })

  } catch (err: any) {
    console.error('NVIDIA API error:', err?.message, err?.status)
    const hint = err?.status === 400
      ? `Model "${MODEL}" returned 400. Fix: set NVIDIA_MODEL=mistralai/mistral-7b-instruct-v0.3 in .env.local`
      : (err?.message || 'AI API failed')
    return NextResponse.json({ error: hint }, { status: 500, headers: corsHeaders(req) })
  }
}
// import { NextRequest, NextResponse } from 'next/server'
// import { getSession } from '@/lib/auth'
// import { nvidia, MODEL } from '@/lib/ai'

// const SYSTEM_PROMPT = `You are FocusLens AI Tutor — a friendly, concise learning assistant embedded in a Chrome extension.
// You help students who are studying online. Your goals:
// 1. Re-explain confusing concepts in simpler terms (use analogies, real-world examples)
// 2. Generate short quizzes (3 MCQ questions max) when asked
// 3. Summarize long content into 5 bullet points
// 4. Use the Socratic method when student says they're stuck — ask one guiding question instead of giving the answer directly
// 5. Keep responses SHORT (under 150 words) since you appear in a small popup widget
// 6. Be warm, encouraging, and specific to the topic at hand
// Format quizzes as JSON: {"type":"quiz","questions":[{"q":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]}`

// function corsHeaders(req?: Request): Record<string, string> {
//   const origin = req?.headers.get('origin') || '*'
//   return {
//     'Access-Control-Allow-Origin': origin,
//     'Access-Control-Allow-Methods': 'POST, OPTIONS',
//     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     'Access-Control-Allow-Credentials': 'true',
//   }
// }

// export async function OPTIONS(req: Request) {
//   return new Response(null, {
//     status: 204,
//     headers: corsHeaders(req),
//   })
// }

// export async function POST(req: NextRequest) {
//   let auth = null
//   try {
//     auth = await getSession()
//   } catch {}

//   const origin = req.headers.get('origin')
//   const isExtension = origin && origin !== 'http://localhost:3000'

//   if (!auth && !isExtension) {
//     return NextResponse.json(
//       { error: 'Unauthenticated' },
//       { status: 401, headers: corsHeaders(req) }
//     )
//   }

//   const { messages, pageTitle, focusScore } = await req.json()

//   const contextMsg = `[Context: Student is on "${pageTitle || 'a learning page'}", current focus score: ${focusScore || 'unknown'}/100]`

//   const chatMessages = [
//     { role: 'system' as const, content: SYSTEM_PROMPT },
//     { role: 'user' as const, content: contextMsg },
//     ...messages.slice(-6),
//   ]

//   try {
//     const stream = await nvidia.chat.completions.create({
//       model: MODEL,
//       messages: chatMessages,
//       max_tokens: 400,
//       temperature: 0.7,
//       stream: true,
//     })

//     const encoder = new TextEncoder()

//     const readable = new ReadableStream({
//       async start(controller) {
//         for await (const chunk of stream) {
//           const text = chunk.choices[0]?.delta?.content || ''
//           if (text) {
//             controller.enqueue(
//               encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
//             )
//           }
//         }
//         controller.close()
//       },
//     })

//     const responseHeaders: Record<string, string> = {
//       ...corsHeaders(req),
//       'Content-Type': 'text/event-stream',
//       'Cache-Control': 'no-cache',
//       'Connection': 'keep-alive',
//     }

//     return new Response(readable, { headers: responseHeaders })

//   } catch (err: any) {
//     return NextResponse.json(
//       { error: err.message },
//       { status: 500, headers: corsHeaders(req) }
//     )
//   }
// }















import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { nvidia, MODEL } from '@/lib/ai'

function corsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('origin') || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) })
}

export async function POST(req: NextRequest) {
  // Auth — allow extension requests (they won't have the cookie)
  let auth = null
  try { auth = await getSession() } catch {}
  const origin      = req.headers.get('origin') || ''
  const isExtension = !origin.includes('localhost:3000') && !origin.includes('focuslens.app')
  if (!auth && !isExtension) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401, headers: corsHeaders(req) })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders(req) })
  }

  const { messages = [], pageTitle = '', focusScore = '' } = body

  // ── FIX: context goes into system prompt, NOT as a separate user message ──
  const systemPrompt = `You are FocusLens AI Tutor — a friendly, concise learning assistant embedded in a Chrome extension popup.
You help students who are studying online.

Current context: Student is on "${pageTitle || 'a learning page'}", focus score: ${focusScore || 'unknown'}/100.

Your goals:
1. Re-explain confusing concepts in simpler terms using analogies and real-world examples.
2. Generate short quizzes (max 3 MCQ) when asked — return as JSON: {"type":"quiz","questions":[{"q":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]}
3. Summarize long content into exactly 5 bullet points.
4. Use the Socratic method when student says they're stuck — ask ONE guiding question instead of giving the answer.
5. Keep ALL responses under 150 words. You appear in a small popup widget.
6. Be warm, encouraging, and specific to the topic at hand.`

  // ── FIX: ensure messages alternate properly (user/assistant/user/...)
  // Take last 6 messages but guarantee it starts with a user message
  let history = (messages as any[]).slice(-6)
  // Strip any leading assistant messages to avoid starting with assistant role
  while (history.length > 0 && history[0].role !== 'user') {
    history = history.slice(1)
  }
  // If empty after stripping, use a fallback
  if (history.length === 0) {
    history = [{ role: 'user', content: 'Hello, I need help with what I am studying.' }]
  }

  const chatMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m: any) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: String(m.content || ''),
    })),
  ]

  try {
    const stream = await nvidia.chat.completions.create({
      model:       MODEL,
      messages:    chatMessages,
      max_tokens:  400,
      temperature: 0.7,
      stream:      true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
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
    console.error('NVIDIA API error:', err?.message, err?.status, err?.error)
    return NextResponse.json(
      { error: err?.message || 'AI API failed' },
      { status: 500, headers: corsHeaders(req) }
    )
  }
}
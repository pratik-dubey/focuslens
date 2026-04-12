import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Session } from '@/models/Session'
import { askAI } from '@/lib/ai'
import { format } from 'date-fns'

async function getDailyData(userId: string) {
  await connectDB()
  const today = format(new Date(), 'yyyy-MM-dd')
  const sessions = await Session.find({ userId, date: today }).lean()

  if (!sessions.length) return null

  const totalMins   = sessions.reduce((a, s) => a + (s.totalMinutes || 0), 0)
  const avgScore    = Math.round(sessions.reduce((a, s) => a + (s.avgScore || 0), 0) / sessions.length)
  const peakScore   = Math.max(...sessions.map(s => s.peakScore || 0))
  const lowestScore = Math.min(...sessions.map(s => s.lowestScore || 100))
  const alerts      = sessions.reduce((a, s) => a + (s.alerts || 0), 0)
  const quizzes     = sessions.reduce((a, s) => a + (s.quizzes || 0), 0)
  const correct     = sessions.reduce((a, s) => a + (s.quizCorrect || 0), 0)

  // Find peak hour
  const hourScores: Record<number, number[]> = {}
  sessions.forEach(s => {
    s.signals?.forEach((sig: any) => {
      const h = new Date(sig.timestamp).getHours()
      if (!hourScores[h]) hourScores[h] = []
      hourScores[h].push(sig.focusScore || 0)
    })
  })
  const hourAvgs = Object.entries(hourScores).map(([h, scores]) => ({
    hour: parseInt(h),
    avg: scores.reduce((a, b) => a + b, 0) / scores.length
  }))
  const peakHour   = hourAvgs.sort((a, b) => b.avg - a.avg)[0]
  const lowestHour = hourAvgs.sort((a, b) => a.avg - b.avg)[0]

  // Timeline events
  const events: any[] = []
  sessions.forEach(s => {
    events.push({ time: s.startTime, type: 'start', topic: s.topic, platform: s.platform, score: s.avgScore })
    if (s.peakScore > 80) events.push({ time: new Date(new Date(s.startTime).getTime() + 30*60000), type: 'peak', score: s.peakScore })
    if (s.alerts > 0)     events.push({ time: new Date(new Date(s.startTime).getTime() + 60*60000), type: 'alert', score: s.lowestScore })
    if (s.endTime)        events.push({ time: s.endTime, type: 'end', topic: s.topic })
  })
  events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  // AI narrative
  const prompt = `You are an empathetic learning coach. Generate a 3-paragraph daily study report.
Data: Total study time: ${totalMins} minutes. Average focus score: ${avgScore}/100. Peak score: ${peakScore}. Lowest score: ${lowestScore}.
Fatigue alerts triggered: ${alerts}. Quizzes taken: ${quizzes}, correct: ${correct}.
Peak focus hour: ${peakHour ? peakHour.hour + ':00' : 'N/A'}. Lowest focus hour: ${lowestHour ? lowestHour.hour + ':00' : 'N/A'}.
Topics: ${sessions.map(s => s.topic).filter(Boolean).join(', ') || 'general study'}.
Write in second person ("You"), be specific, encouraging but honest. End with one concrete suggestion for tomorrow. No markdown, plain paragraphs.`

  let aiReport = ''
  try { aiReport = await askAI('You are a helpful learning coach.', prompt) }
  catch { aiReport = 'AI report unavailable. Check your NVIDIA_API_KEY in .env.local.' }

  return { totalMins, avgScore, peakScore, lowestScore, alerts, quizzes, correct, peakHour, lowestHour, events, aiReport, sessions }
}

export default async function DailyReportPage() {
  const session = await getSession()
  const data    = await getDailyData(session.userId)

  if (!data) return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-mono font-bold text-2xl mb-2">Daily report</h1>
      <p className="font-mono text-sm text-gray-500 mb-6">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      <div className="card-brutal-yellow p-8 text-center">
        <div className="font-mono font-bold text-lg">No study sessions today yet.</div>
        <p className="font-mono text-sm text-gray-600 mt-2">Enable the extension and start studying to see your report here.</p>
      </div>
    </div>
  )

  const fmt = (h: number) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-mono font-bold text-2xl">Daily report</h1>
        <p className="font-mono text-sm text-gray-500 mt-1">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Insight pills */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-brutal p-4 bg-[#C4F5A0]">
          <div className="font-mono text-xs text-gray-500 mb-1">Peak window</div>
          <div className="font-mono font-bold text-base">{data.peakHour ? fmt(data.peakHour.hour) : '—'}</div>
        </div>
        <div className="card-brutal p-4 bg-[#FFB3C6]">
          <div className="font-mono text-xs text-gray-500 mb-1">Lowest point</div>
          <div className="font-mono font-bold text-base">Score {data.lowestScore}</div>
        </div>
        <div className="card-brutal p-4 bg-brand-yellow">
          <div className="font-mono text-xs text-gray-500 mb-1">Quiz accuracy</div>
          <div className="font-mono font-bold text-base">
            {data.quizzes ? `${Math.round((data.correct/data.quizzes)*100)}%` : '—'}
          </div>
        </div>
      </div>

      {/* AI report */}
      <div className="card-brutal p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="tag-brutal bg-brand-yellow">AI summary</span>
          <span className="font-mono text-xs text-gray-400">powered by NVIDIA NIM</span>
        </div>
        <div className="font-mono text-sm leading-relaxed space-y-3 text-gray-800">
          {data.aiReport.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>

      {/* Timeline */}
      <div className="card-brutal p-6">
        <h2 className="font-mono font-bold text-sm mb-5">Session timeline</h2>
        <div className="space-y-4">
          {data.events.map((ev, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="font-mono text-xs text-gray-400 w-12 pt-0.5 shrink-0">
                {format(new Date(ev.time), 'h:mma').toLowerCase()}
              </div>
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 border border-brand-black ${
                ev.type==='peak' ? 'bg-[#3C3489]' : ev.type==='alert' ? 'bg-red-400' : ev.type==='start' ? 'bg-[#C4F5A0]' : 'bg-gray-300'
              }`}/>
              <div>
                <div className="font-mono text-sm font-bold">
                  {ev.type==='start' && `Session started${ev.platform ? ` on ${ev.platform}` : ''}${ev.topic ? ` — ${ev.topic}` : ''}`}
                  {ev.type==='peak'  && `Peak focus reached`}
                  {ev.type==='alert' && `Fatigue alert triggered`}
                  {ev.type==='end'   && `Session ended`}
                  {ev.score !== undefined && (
                    <span className={`ml-2 tag-brutal text-[10px] ${ev.type==='alert' ? 'bg-[#FFB3C6]' : 'bg-[#C4F5A0]'}`}>
                      Score {ev.score}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

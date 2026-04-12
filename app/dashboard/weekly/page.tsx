import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Session } from '@/models/Session'
import { askAI } from '@/lib/ai'
import { format, subDays, startOfWeek } from 'date-fns'

async function getWeeklyData(userId: string) {
  await connectDB()
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'))

  const sessions = await Session.find({
    userId,
    date: { $in: days },
  }).lean()

  if (!sessions.length) return null

  const totalMins    = sessions.reduce((a, s) => a + (s.totalMinutes || 0), 0)
  const avgScore     = Math.round(sessions.reduce((a, s) => a + (s.avgScore || 0), 0) / sessions.length)
  const totalAlerts  = sessions.reduce((a, s) => a + (s.alerts || 0), 0)
  const totalQuizzes = sessions.reduce((a, s) => a + (s.quizzes || 0), 0)
  const totalCorrect = sessions.reduce((a, s) => a + (s.quizCorrect || 0), 0)

  // Per-day breakdown
  const dayBreakdown = days.map(date => {
    const daySessions = sessions.filter(s => s.date === date)
    const mins  = daySessions.reduce((a, s) => a + (s.totalMinutes || 0), 0)
    const score = daySessions.length
      ? Math.round(daySessions.reduce((a, s) => a + (s.avgScore || 0), 0) / daySessions.length)
      : 0
    return { date, label: format(new Date(date + 'T12:00:00'), 'EEE'), mins, score }
  })

  // Topics
  const topicMap: Record<string, number> = {}
  sessions.forEach(s => {
    if (s.topic) topicMap[s.topic] = (topicMap[s.topic] || 0) + (s.totalMinutes || 0)
  })
  const topics = Object.entries(topicMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, mins]) => ({ name, mins }))

  // Best and worst day
  const bestDay  = [...dayBreakdown].sort((a, b) => b.score - a.score)[0]
  const worstDay = [...dayBreakdown].filter(d => d.score > 0).sort((a, b) => a.score - b.score)[0]

  const prompt = `You are an empathetic learning coach. Write a 4-paragraph weekly study report.
Data: Total study time this week: ${totalMins} minutes across ${sessions.length} sessions.
Average focus score: ${avgScore}/100. Total fatigue alerts: ${totalAlerts}.
Quizzes taken: ${totalQuizzes}, correct answers: ${totalCorrect}.
Best day: ${bestDay?.label} (score ${bestDay?.score}). Worst day: ${worstDay?.label || 'N/A'} (score ${worstDay?.score || 0}).
Top topics: ${topics.map(t => `${t.name} (${t.mins}min)`).join(', ') || 'general study'}.
Day breakdown: ${dayBreakdown.map(d => `${d.label}: ${d.mins}min, score ${d.score}`).join(' | ')}.
Paragraph 1: overall week summary. Paragraph 2: patterns noticed (peak days, topics). Paragraph 3: what went wrong and why. Paragraph 4: specific actionable suggestions for next week. No markdown.`

  let aiReport = ''
  try { aiReport = await askAI('You are a helpful learning coach.', prompt) }
  catch { aiReport = 'AI report unavailable. Check your NVIDIA_API_KEY.' }

  return { totalMins, avgScore, totalAlerts, totalQuizzes, totalCorrect, dayBreakdown, topics, bestDay, worstDay, aiReport }
}

export default async function WeeklyReportPage() {
  const session = await getSession()
  const data    = await getWeeklyData(session.userId)

  if (!data) return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-mono font-bold text-2xl mb-6">Weekly report</h1>
      <div className="card-brutal-yellow p-8 text-center">
        <div className="font-mono font-bold text-lg">No sessions this week yet.</div>
        <p className="font-mono text-sm text-gray-600 mt-2">Start studying with the extension to see your weekly report here.</p>
      </div>
    </div>
  )

  const maxMins = Math.max(...data.dayBreakdown.map(d => d.mins), 1)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-mono font-bold text-2xl">Weekly report</h1>
        <p className="font-mono text-sm text-gray-500 mt-1">
          {format(subDays(new Date(), 6), 'd MMM')} — {format(new Date(), 'd MMM yyyy')}
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Total study', v: `${Math.floor(data.totalMins/60)}h ${data.totalMins%60}m`, bg: 'bg-brand-yellow' },
          { l: 'Avg focus score', v: `${data.avgScore}`, bg: 'bg-[#C4F5A0]' },
          { l: 'Fatigue alerts', v: `${data.totalAlerts}`, bg: 'bg-[#FFB3C6]' },
          { l: 'Quiz accuracy', v: data.totalQuizzes ? `${Math.round((data.totalCorrect/data.totalQuizzes)*100)}%` : '—', bg: 'bg-[#A0D4FF]' },
        ].map(s => (
          <div key={s.l} className={`card-brutal p-4 ${s.bg}`}>
            <div className="font-mono text-xs text-gray-500 mb-1">{s.l}</div>
            <div className="font-mono font-bold text-2xl">{s.v}</div>
          </div>
        ))}
      </div>

      {/* Day-by-day bars */}
      <div className="card-brutal p-6">
        <h2 className="font-mono font-bold text-sm mb-4">Day-by-day breakdown</h2>
        <div className="space-y-3">
          {data.dayBreakdown.map(d => (
            <div key={d.date} className="flex items-center gap-3">
              <span className="font-mono text-xs text-gray-500 w-8">{d.label}</span>
              <div className="flex-1 bg-gray-100 border border-brand-black/10 h-6 rounded-sm overflow-hidden">
                <div
                  style={{ width: `${(d.mins / maxMins) * 100}%`, background: d.score > 70 ? '#534AB7' : d.score > 50 ? '#7F77DD' : '#AFA9EC' }}
                  className="h-full transition-all"
                />
              </div>
              <span className="font-mono text-xs text-gray-500 w-28 text-right">
                {d.mins ? `${Math.floor(d.mins/60)}h ${d.mins%60}m · score ${d.score}` : 'No session'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI report */}
      <div className="card-brutal p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="tag-brutal bg-brand-yellow">AI weekly insight</span>
          <span className="font-mono text-xs text-gray-400">powered by NVIDIA NIM</span>
        </div>
        <div className="font-mono text-sm leading-relaxed space-y-3 text-gray-800">
          {data.aiReport.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>

      {/* Topics */}
      {data.topics.length > 0 && (
        <div className="card-brutal p-6">
          <h2 className="font-mono font-bold text-sm mb-4">Topics studied this week</h2>
          <div className="space-y-3">
            {data.topics.map(t => (
              <div key={t.name} className="flex items-center gap-3">
                <span className="font-mono text-xs text-gray-600 w-36 truncate">{t.name}</span>
                <div className="flex-1 bg-gray-100 border border-brand-black/10 h-5 rounded-sm overflow-hidden">
                  <div style={{ width: `${(t.mins / data.topics[0].mins) * 100}%` }}
                    className="h-full bg-brand-black/80"/>
                </div>
                <span className="font-mono text-xs text-gray-400 w-16 text-right">
                  {Math.floor(t.mins/60)}h {t.mins%60}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

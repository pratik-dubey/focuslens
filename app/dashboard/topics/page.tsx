import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Session } from '@/models/Session'
import { format, subDays } from 'date-fns'

export default async function TopicsPage() {
  const session = await getSession()
  await connectDB()

  const sessions = await Session.find({
    userId: session.userId,
    startTime: { $gte: subDays(new Date(), 30) },
  }).lean()

  const topicMap: Record<string, { mins: number; sessions: number; avgScore: number; scores: number[] }> = {}
  sessions.forEach(s => {
    const t = s.topic || 'General'
    if (!topicMap[t]) topicMap[t] = { mins: 0, sessions: 0, avgScore: 0, scores: [] }
    topicMap[t].mins     += s.totalMinutes || 0
    topicMap[t].sessions += 1
    topicMap[t].scores.push(s.avgScore || 0)
  })
  Object.values(topicMap).forEach(t => {
    t.avgScore = Math.round(t.scores.reduce((a, b) => a + b, 0) / t.scores.length)
  })

  const topics = Object.entries(topicMap)
    .sort((a, b) => b[1].mins - a[1].mins)
    .map(([name, data]) => ({ name, ...data }))

  const todayTopics = sessions
    .filter(s => s.date === format(new Date(), 'yyyy-MM-dd'))
    .map(s => s.topic || 'General')
  const uniqueToday = [...new Set(todayTopics)]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-mono font-bold text-2xl">Topics studied</h1>
        <p className="font-mono text-sm text-gray-500 mt-1">Last 30 days</p>
      </div>

      {/* Today's topics */}
      <div className="card-brutal p-5 bg-brand-yellow">
        <h2 className="font-mono font-bold text-sm mb-3">Studied today</h2>
        {uniqueToday.length ? (
          <div className="flex flex-wrap gap-2">
            {uniqueToday.map(t => (
              <span key={t} className="tag-brutal bg-brand-white">{t}</span>
            ))}
          </div>
        ) : (
          <p className="font-mono text-sm text-gray-600">No sessions today yet.</p>
        )}
      </div>

      {/* All topics */}
      {topics.length > 0 ? (
        <div className="card-brutal p-6">
          <h2 className="font-mono font-bold text-sm mb-5">All topics — 30 days</h2>
          <div className="space-y-4">
            {topics.map((t, i) => (
              <div key={t.name} className="border-b-2 border-brand-black/10 pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono font-bold text-sm">{t.name}</span>
                    <span className="font-mono text-xs text-gray-400 ml-3">
                      {t.sessions} session{t.sessions !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className={`tag-brutal text-xs ${t.avgScore > 70 ? 'bg-[#C4F5A0]' : t.avgScore > 50 ? 'bg-brand-yellow' : 'bg-[#FFB3C6]'}`}>
                    avg {t.avgScore}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 border border-brand-black/10 h-3 rounded-sm">
                    <div style={{ width: `${(t.mins / topics[0].mins) * 100}%`, background: '#534AB7' }}
                      className="h-full rounded-sm"/>
                  </div>
                  <span className="font-mono text-xs text-gray-500 w-16 text-right">
                    {Math.floor(t.mins/60)}h {t.mins%60}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card-brutal p-8 text-center">
          <div className="font-mono font-bold">No topics tracked yet.</div>
          <p className="font-mono text-sm text-gray-500 mt-2">The extension detects the page title of each learning platform as your topic.</p>
        </div>
      )}
    </div>
  )
}

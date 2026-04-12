import { getSession } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Session } from '@/models/Session'
import { format, subDays, startOfDay } from 'date-fns'
import HeatmapClient from '@/components/dashboard/HeatmapClient'
import { StatCard } from '@/components/dashboard/StatCard'
import TopicBars from '@/components/dashboard/TopicBars'
import TodayTimeline from '@/components/dashboard/TodayTimeline'

async function getDashboardData(userId: string) {
  await connectDB()
  const today = format(new Date(), 'yyyy-MM-dd')

  // Last 30 days sessions
  const thirtyAgo = subDays(new Date(), 30)
  const sessions = await Session.find({
    userId,
    startTime: { $gte: thirtyAgo },
  }).lean()

  // Today's sessions
  const todaySessions = sessions.filter(s => s.date === today)
  const todayMinutes  = todaySessions.reduce((a, s) => a + (s.totalMinutes || 0), 0)
  const todayAvgScore = todaySessions.length
    ? Math.round(todaySessions.reduce((a, s) => a + (s.avgScore || 0), 0) / todaySessions.length)
    : 0
  const todayAlerts   = todaySessions.reduce((a, s) => a + (s.alerts || 0), 0)
  const todayQuizzes  = todaySessions.reduce((a, s) => a + (s.quizzes || 0), 0)

  // Build heatmap data (daily avg scores for 30 days)
  const heatmapData: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
    const daySessions = sessions.filter(s => s.date === d)
    const avg = daySessions.length
      ? Math.round(daySessions.reduce((a, s) => a + (s.avgScore || 0), 0) / daySessions.length)
      : 0
    heatmapData.push({ date: d, count: Math.ceil(avg / 20) })
  }

  // Hourly heatmap for today
  const hourlyScores = Array(24).fill(0)
  todaySessions.forEach(s => {
    s.signals?.forEach((sig: any) => {
      const h = new Date(sig.timestamp).getHours()
      hourlyScores[h] = Math.max(hourlyScores[h], sig.focusScore || 0)
    })
  })

  // Topics
  const topicMap: Record<string, number> = {}
  sessions.forEach(s => {
    if (s.topic) topicMap[s.topic] = (topicMap[s.topic] || 0) + (s.totalMinutes || 0)
  })
  const topics = Object.entries(topicMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, mins]) => ({ name, mins }))

  return { todayMinutes, todayAvgScore, todayAlerts, todayQuizzes, heatmapData, hourlyScores, topics, todaySessions }
}

export default async function DashboardPage() {
  const session = await getSession()
  const data    = await getDashboardData(session.userId)

  const h  = `${Math.floor(data.todayMinutes / 60)}h ${data.todayMinutes % 60}m`

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-mono font-bold text-2xl">Good {getGreeting()}, {session.name?.split(' ')[0]} 👋</h1>
        <p className="font-mono text-sm text-gray-500 mt-1">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Avg focus today"  value={data.todayAvgScore || '—'} sub="score out of 100" color="bg-brand-yellow" />
        <StatCard label="Study time"       value={data.todayMinutes ? h : '—'}  sub="today" color="bg-[#C4F5A0]" />
        <StatCard label="Fatigue alerts"   value={data.todayAlerts}  sub="triggered today" color="bg-[#FFB3C6]" />
        <StatCard label="Quizzes taken"    value={data.todayQuizzes} sub="AI sessions" color="bg-[#A0D4FF]" />
      </div>

      {/* Hourly heatmap */}
      <div className="card-brutal p-5">
        <h2 className="font-mono font-bold text-sm mb-4">Focus heatmap — today (hourly)</h2>
        <div className="flex gap-1 items-end h-14">
          {data.hourlyScores.map((score, h) => {
            const intensity = score > 80 ? '#3C3489' : score > 60 ? '#534AB7' : score > 40 ? '#7F77DD' : score > 20 ? '#AFA9EC' : score > 0 ? '#CECBF6' : '#F1EFE8'
            return (
              <div key={h} title={`${h}:00 — score ${score}`}
                style={{ height: `${Math.max(score, 5)}%`, background: intensity }}
                className="flex-1 border border-brand-black/10 rounded-sm transition-all" />
            )
          })}
        </div>
        <div className="flex justify-between mt-1">
          {['12am','3am','6am','9am','12pm','3pm','6pm','9pm'].map(l => (
            <span key={l} className="font-mono text-[10px] text-gray-400">{l}</span>
          ))}
        </div>
      </div>

      {/* 30-day calendar */}
      <div className="card-brutal p-5">
        <h2 className="font-mono font-bold text-sm mb-4">30-day focus calendar</h2>
        <HeatmapClient data={data.heatmapData} />
        <div className="flex items-center gap-2 mt-3">
          <span className="font-mono text-[10px] text-gray-400">Low</span>
          {['#F1EFE8','#CECBF6','#7F77DD','#534AB7','#3C3489'].map(c => (
            <div key={c} className="w-3 h-3 border border-brand-black/20 rounded-sm" style={{ background: c }}/>
          ))}
          <span className="font-mono text-[10px] text-gray-400">High</span>
        </div>
      </div>

      {/* Topics */}
      {data.topics.length > 0 && (
        <div className="card-brutal p-5">
          <h2 className="font-mono font-bold text-sm mb-4">Topics studied this week</h2>
          <TopicBars topics={data.topics} />
        </div>
      )}

      {/* Today timeline */}
      {data.todaySessions.length > 0 && (
        <div className="card-brutal p-5">
          <h2 className="font-mono font-bold text-sm mb-4">Today's session timeline</h2>
          <TodayTimeline sessions={data.todaySessions} />
        </div>
      )}

      {data.todaySessions.length === 0 && (
        <div className="card-brutal-yellow p-8 text-center">
          <div className="font-mono font-bold text-lg mb-2">No sessions yet today</div>
          <p className="font-mono text-sm text-gray-600">Enable the FocusLens Chrome extension on any learning platform to start tracking.</p>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

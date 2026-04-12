'use client'
import { useRouter } from 'next/navigation'

// ── StatCard ────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color }: { label: string; value: any; sub: string; color: string }) {
  return (
    <div className={`card-brutal p-4 ${color}`}>
      <div className="font-mono text-xs text-gray-900 mb-1">{label}</div>
      <div className="font-mono font-bold text-2xl">{value}</div>
      <div className="font-mono text-xs text-gray-700 mt-0.5">{sub}</div>
    </div>
  )
}

// ── LogoutBtn ───────────────────────────────────────────────────
export default function LogoutBtn() {
  const router = useRouter()
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }
  return (
    <button onClick={logout}
      className="font-mono text-xs border-2 border-brand-black px-3 py-1.5 hover:bg-brand-black hover:text-brand-yellow transition-all">
      Logout
    </button>
  )
}

// ── HeatmapClient ───────────────────────────────────────────────
export function HeatmapClient({ data }: { data: { date: string; count: number }[] }) {
  const colors = ['#F1EFE8', '#CECBF6', '#AFA9EC', '#7F77DD', '#534AB7', '#3C3489']
  return (
    <div className="flex flex-wrap gap-1">
      {data.map(d => (
        <div key={d.date} title={`${d.date}: focus level ${d.count}`}
          style={{ width: 14, height: 14, background: colors[Math.min(d.count, 5)] }}
          className="border border-brand-black/10 rounded-sm"/>
      ))}
    </div>
  )
}

// ── TopicBars ───────────────────────────────────────────────────
export function TopicBars({ topics }: { topics: { name: string; mins: number }[] }) {
  const max = Math.max(...topics.map(t => t.mins), 1)
  return (
    <div className="space-y-3">
      {topics.map(t => (
        <div key={t.name} className="flex items-center gap-3">
          <span className="font-mono text-xs text-gray-600 w-36 truncate">{t.name}</span>
          <div className="flex-1 bg-gray-100 border border-brand-black/10 h-4 rounded-sm overflow-hidden">
            <div style={{ width: `${(t.mins / max) * 100}%` }} className="h-full bg-[#534AB7]"/>
          </div>
          <span className="font-mono text-xs text-gray-700 w-16 text-right">
            {Math.floor(t.mins / 60)}h {t.mins % 60}m
          </span>
        </div>
      ))}
    </div>
  )
}

// ── TodayTimeline ───────────────────────────────────────────────
export function TodayTimeline({ sessions }: { sessions: any[] }) {
  return (
    <div className="space-y-3">
      {sessions.map((s, i) => (
        <div key={i} className="flex gap-3 items-start border-b border-brand-black/10 pb-3 last:border-0">
          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-[#534AB7] border border-brand-black"/>
          <div>
            <div className="font-mono text-sm font-bold">
              {s.topic || s.platform || 'Session'}
              <span className={`ml-2 tag-brutal text-[10px] ${s.avgScore > 70 ? 'bg-[#C4F5A0]' : s.avgScore > 50 ? 'bg-brand-yellow' : 'bg-[#FFB3C6]'}`}>
                avg {s.avgScore}
              </span>
            </div>
            <div className="font-mono text-xs text-gray-700 mt-0.5">
              {s.totalMinutes}m · {s.alerts} alert{s.alerts !== 1 ? 's' : ''} · {s.quizzes} quiz{s.quizzes !== 1 ? 'zes' : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

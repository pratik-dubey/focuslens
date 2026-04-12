import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import LogoutBtn from '@/components/dashboard/LogoutBtn'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const nav = [
    { href: '/dashboard',        label: 'Overview',       icon: '◈' },
    { href: '/dashboard/daily',  label: 'Daily report',   icon: '◉' },
    { href: '/dashboard/weekly', label: 'Weekly report',  icon: '◎' },
    { href: '/dashboard/topics', label: 'Topics studied', icon: '◆' },
  ]

  return (
    <div className="min-h-screen bg-brand-white flex flex-col">
      {/* Top nav */}
      <header className="border-b-3 border-brand-black bg-brand-yellow h-14 flex items-center px-6 justify-between sticky top-0 z-40">
        <Link href="/" className="font-mono font-bold text-lg flex items-center gap-2">
          <span className="w-7 h-7 bg-brand-black border-2 border-brand-black flex items-center justify-center text-brand-yellow text-xs font-bold">FL</span>
          FocusLens
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold hidden md:block">{session.name}</span>
          <div className="w-8 h-8 border-2 border-brand-black bg-brand-white flex items-center justify-center font-mono font-bold text-xs">
            {session.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <LogoutBtn />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-52 border-r-3 border-brand-black bg-brand-white hidden md:flex flex-col py-6 px-3 gap-1">
          {nav.map(n => (
            <Link key={n.href} href={n.href}
              className="flex items-center gap-2 px-3 py-2.5 font-mono text-sm font-bold border-2 border-transparent hover:border-brand-black hover:bg-brand-yellow transition-all">
              <span>{n.icon}</span>{n.label}
            </Link>
          ))}
        </aside>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t-3 border-brand-black bg-brand-white flex z-40">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className="flex-1 flex flex-col items-center py-2 font-mono text-xs gap-1 border-r-2 last:border-r-0 border-brand-black/20">
              <span className="text-base">{n.icon}</span>
              <span className="text-[10px]">{n.label.split(' ')[0]}</span>
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-6 pb-20 md:pb-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

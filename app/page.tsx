'use client'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useState } from 'react'

const NAV_LINKS = ['Features', 'How it works', 'Testimonials']

const FEATURES = [
  { icon: '🧠', title: 'Real-time focus scoring', desc: 'Tracks idle time, re-scrolls and reading speed every 15 seconds to compute a live cognitive load score.', color: 'bg-brand-yellow' },
  { icon: '⚡', title: 'AI fatigue intervention', desc: 'When your score drops below 60, an AI tutor pops up — not to nag you, but to re-explain the concept in a new way.', color: 'bg-[#C4F5A0]' },
  { icon: '📊', title: 'Heatmap dashboard', desc: 'See exactly when your brain is sharpest. Daily hourly heatmaps + 30-day calendar view, like GitHub for your focus.', color: 'bg-[#FFB3C6]' },
  { icon: '🎯', title: 'Quiz-to-recover mode', desc: 'Answer 3 AI-generated questions on your current topic. Get them right and your focus score actually goes back up.', color: 'bg-[#A0D4FF]' },
  { icon: '📝', title: 'Weekly AI report', desc: 'Every Sunday, an AI writes you a personal report: when you studied best, what tripped you up, and what to change.', color: 'bg-[#FFD9A0]' },
  { icon: '🌐', title: 'Works everywhere', desc: 'YouTube, Coursera, Udemy, any college LMS — the extension runs on any learning platform you enable it on.', color: 'bg-[#E0A0FF]' },
]

const TESTIMONIALS = [
  { name: 'Aarav S.', role: 'CS student, IIT Delhi', text: "I thought I was studying 4 hours a day. FocusLens showed me I was actually focused for 1h 40m. Game changer.", avatar: 'AS', color: 'bg-brand-yellow' },
  { name: 'Priya M.', role: 'UPSC aspirant', text: "The AI quiz feature is insane. I hit burnout at 3pm daily — now it catches it and runs a quick quiz. I barely notice I recovered.", avatar: 'PM', color: 'bg-[#C4F5A0]' },
  { name: 'Rohan K.', role: 'Self-taught dev', text: "Weekly report told me my Tuesday mornings are my peak window. I moved all hard topics there. My retention doubled.", avatar: 'RK', color: 'bg-[#A0D4FF]' },
]

const MARQUEE_ITEMS = ['Focus tracking', 'AI tutor', 'Burnout detection', 'Quiz recovery', 'Heatmaps', 'Weekly reports', 'Chrome extension', 'Works on any site']

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-brand-white overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav className="border-b-3 border-brand-black bg-brand-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-mono font-bold text-xl">
            <span className="w-8 h-8 bg-brand-yellow border-2 border-brand-black flex items-center justify-center text-sm shadow-brutal-sm">FL</span>
            FocusLens
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`}
                className="font-mono text-sm font-bold hover:underline underline-offset-4">{l}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="btn-brutal-outline text-xs px-4 py-2">Log in</Link>
            <Link href="/signup" className="btn-brutal text-xs px-4 py-2">Sign up free</Link>
          </div>

          <button className="md:hidden border-2 border-brand-black p-1.5" onClick={() => setMobileOpen(!mobileOpen)}>
            <span className="block w-5 h-0.5 bg-brand-black mb-1"></span>
            <span className="block w-5 h-0.5 bg-brand-black mb-1"></span>
            <span className="block w-5 h-0.5 bg-brand-black"></span>
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t-3 border-brand-black bg-brand-white px-4 py-4 flex flex-col gap-3">
            {NAV_LINKS.map(l => <a key={l} href={`#${l.toLowerCase()}`} className="font-mono font-bold text-sm">{l}</a>)}
            <Link href="/login" className="btn-brutal-outline text-xs w-full text-center">Log in</Link>
            <Link href="/signup" className="btn-brutal text-xs w-full text-center">Sign up free</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="tag-brutal bg-brand-yellow mb-4 inline-block">Chrome Extension + Dashboard</div>
<h1 className="font-mono font-bold text-5xl md:text-6xl leading-normal mb-6">
  Know exactly<br/>
  <span className="bg-brand-yellow px-2 inline-block leading-tight">when</span> you<br/>
  actually learn.
</h1>
          <p className="text-base text-gray-600 mb-8 max-w-md leading-relaxed">
            FocusLens tracks your real focus on any learning platform. When you start burning out, an AI tutor steps in — not with a break reminder, but with a quiz that actually rescues your session.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="btn-brutal text-sm">Get it free →</Link>
            <a href="#how-it-works" className="btn-brutal-outline text-sm">See how it works</a>
          </div>
          <p className="text-xs font-mono text-gray-400 mt-4">No credit card. Works on YouTube, Coursera, Udemy + more.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="relative">
          <div className="card-brutal p-6 bg-brand-yellow relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono font-bold text-sm">FocusLens — live session</span>
              <span className="tag-brutal bg-brand-black text-brand-yellow">ACTIVE</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[['Focus score','71','▲ Good'],['Study time','1h 22m','Today'],['Alerts','2','Resolved'],['Quizzes','4','74% correct']].map(([l,v,s]) => (
                <div key={l} className="border-2 border-brand-black p-3 bg-brand-white">
                  <div className="text-xs font-mono text-gray-500">{l}</div>
                  <div className="text-2xl font-mono font-bold">{v}</div>
                  <div className="text-xs font-mono text-gray-400">{s}</div>
                </div>
              ))}
            </div>
            <div className="border-2 border-brand-black p-3 bg-brand-white">
              <div className="text-xs font-mono mb-2">Hourly focus today</div>
              <div className="flex gap-1 items-end h-10">
                {[2,4,7,8,9,9,6,3,8,9,8,7,5,4,6,7,8,7,5,3,2,1,0,0].map((v,i) => (
                  <div key={i} style={{ height: `${v*10+5}%`, background: v>7?'#3C3489':v>5?'#7F77DD':v>2?'#AFA9EC':'#EEEDFE' }}
                    className="flex-1 border border-brand-black/20 rounded-sm"/>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute inset-0 translate-x-3 translate-y-3 border-3 border-brand-black bg-brand-black -z-0 rounded-none"/>
        </motion.div>
      </section>

      {/* ── Marquee ── */}
      <div className="border-y-3 border-brand-black bg-brand-black py-3 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="font-mono font-bold text-brand-yellow text-sm mx-8">★ {item}</span>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <div className="tag-brutal bg-brand-black text-brand-yellow mb-3">How it works</div>
          <h2 className="font-mono font-bold text-4xl">Three steps to smarter studying</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n:'01', title:'Install the extension', desc:'Add FocusLens to Chrome. Sign in with your account. Enable it on any learning site with one click.', color:'bg-brand-yellow' },
            { n:'02', title:'Study as you normally would', desc:'The extension silently tracks your focus signals — no cameras, no keyloggers. Just mouse, scroll, and reading patterns.', color:'bg-[#C4F5A0]' },
            { n:'03', title:'AI steps in when you fade', desc:'Score drops below 60? The AI tutor appears with a context-aware explanation or quiz. Recover your focus, keep learning.', color:'bg-[#FFB3C6]' },
          ].map(s => (
            <motion.div key={s.n} className={`card-brutal p-6 ${s.color}`}
              whileHover={{ translateX: -2, translateY: -2, boxShadow: '6px 6px 0px #0A0A0A' }}>
              <div className="font-mono font-bold text-5xl text-brand-black/20 mb-3">{s.n}</div>
              <h3 className="font-mono font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-brand-black py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="tag-brutal bg-brand-yellow mb-3">Features</div>
            <h2 className="font-mono font-bold text-4xl text-brand-yellow">Everything you need to stop faking focus</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} className={`border-3 border-brand-yellow ${f.color} p-6 shadow-[4px_4px_0px_#FFE500]`}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-mono font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <div className="tag-brutal bg-brand-yellow mb-3">Testimonials</div>
          <h2 className="font-mono font-bold text-4xl">Students who stopped lying to themselves</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} className="card-brutal p-6"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
              <p className="font-mono text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t-2 border-brand-black">
                <div className={`w-10 h-10 rounded-none border-2 border-brand-black ${t.color} flex items-center justify-center font-mono font-bold text-sm`}>{t.avatar}</div>
                <div>
                  <div className="font-mono font-bold text-sm">{t.name}</div>
                  <div className="font-mono text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-y-3 border-brand-black bg-brand-yellow py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-mono font-bold text-4xl mb-4">Ready to see how you actually study?</h2>
          <p className="font-mono text-sm text-gray-700 mb-8">Install the extension, study for one session, and your first report will genuinely surprise you.</p>
          <Link href="/signup" className="btn-brutal-dark text-base px-8 py-4">Start for free — no card needed</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t-3 border-brand-black bg-brand-black text-brand-yellow py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-mono font-bold text-xl flex items-center gap-2">
            <span className="w-7 h-7 bg-brand-yellow border-2 border-brand-yellow flex items-center justify-center text-brand-black text-xs font-bold">FL</span>
            FocusLens
          </div>
          <div className="font-mono text-xs text-brand-yellow/60">Built for GDG Hacker Cup @ KNIT Sultanpur</div>
          <div className="flex gap-6 font-mono text-xs">
            <Link href="/login" className="hover:text-brand-yellow/60">Login</Link>
            <Link href="/signup" className="hover:text-brand-yellow/60">Sign up</Link>
            <Link href="/dashboard" className="hover:text-brand-yellow/60">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

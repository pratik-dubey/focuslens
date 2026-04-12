'use client'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Signup failed'); setLoading(false); return }
      router.push('/dashboard')
    } catch {
      setError('Network error'); setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#C4F5A0] flex flex-col">
      <nav className="border-b-3 border-brand-black bg-brand-white px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-xl flex items-center gap-2">
          <span className="w-8 h-8 bg-brand-yellow border-2 border-brand-black flex items-center justify-center text-sm shadow-brutal-sm">FL</span>
          FocusLens
        </Link>
        <Link href="/login" className="btn-brutal-outline text-xs px-4 py-2">Log in</Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-md">
          <div className="card-brutal p-8 bg-brand-white">
            <h1 className="font-mono font-bold text-3xl mb-1">Create account.</h1>
            <p className="font-mono text-sm text-gray-500 mb-8">Free forever. No credit card.</p>

            {error && (
              <div className="border-2 border-red-500 bg-red-50 px-4 py-3 font-mono text-sm text-red-600 mb-5">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-xs font-bold block mb-1">YOUR NAME</label>
                <input type="text" required placeholder="Aarav Singh" className="input-brutal"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="font-mono text-xs font-bold block mb-1">EMAIL</label>
                <input type="email" required placeholder="you@email.com" className="input-brutal"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="font-mono text-xs font-bold block mb-1">PASSWORD</label>
                <input type="password" required placeholder="min 8 characters" minLength={8} className="input-brutal"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <button type="submit" disabled={loading} className="btn-brutal w-full justify-center mt-2">
                {loading ? 'Creating account...' : 'Create account →'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <hr className="flex-1 border-brand-black border-t-2"/><span className="font-mono text-xs text-gray-400">or</span><hr className="flex-1 border-brand-black border-t-2"/>
            </div>

            <a href="/api/auth/google" className="btn-brutal-outline w-full justify-center text-sm flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </a>

            <p className="font-mono text-xs text-center text-gray-500 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="font-bold underline">Log in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

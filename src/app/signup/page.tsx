'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } },
      })
      if (error) throw error
      setSuccess(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign up failed')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-sea-50 via-white to-sage-50 dark:from-[#0a0f0e] dark:via-[#111a18] dark:to-[#0a0f0e] flex items-center justify-center px-6">
      <div className="text-center max-w-sm card p-10 shadow-card">
        <div className="text-5xl mb-4">✉️</div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">Check your inbox</h2>
        <p className="text-slate-500 text-sm mb-6">
          We sent a confirmation link to <strong>{email}</strong>.
        </p>
        <Link href="/trips/new" className="btn-primary rounded-3xl">Start planning now <ArrowRight size={15}/></Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-sea-50 via-white to-sage-50 dark:from-[#0a0f0e] dark:via-[#111a18] dark:to-[#0a0f0e] flex items-center justify-center px-6">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-extrabold text-gradient">RoamRiot</Link>
          <p className="text-slate-400 mt-2 text-sm">Start your journey today</p>
        </div>
        <div className="card p-7 shadow-card">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="label">Your name</label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-11" placeholder="Raksha" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" className="input pl-11" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" className="input pl-11" placeholder="Min 8 characters"
                  minLength={8} value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-2xl">{error}</p>}
            <button type="submit" disabled={loading} className="btn-sage w-full justify-center py-3 rounded-3xl mt-2">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : <>Create account <ArrowRight size={15}/></>}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account? <Link href="/login" className="text-sea-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

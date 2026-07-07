'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(redirectTo)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sea-50 via-white to-sage-50 dark:from-[#0a0f0e] dark:via-[#111a18] dark:to-[#0a0f0e] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-extrabold text-gradient">RoamRiot</Link>
          <p className="text-slate-400 mt-2 text-sm">Welcome back, explorer</p>
        </div>
        <div className="card p-7 shadow-card">
          <form onSubmit={handleLogin} className="space-y-4">
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
                <input type="password" className="input pl-11" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-2xl">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 rounded-3xl mt-2">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : <>Sign in <ArrowRight size={15}/></>}
            </button>
          </form>
        </div>
        <div className="text-center mt-5 space-y-2">
          <p className="text-sm text-slate-500">
            No account? <Link href="/signup" className="text-sea-600 font-semibold hover:underline">Create one free</Link>
          </p>
          <Link href="/trips/new" className="block text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Continue without signing in →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

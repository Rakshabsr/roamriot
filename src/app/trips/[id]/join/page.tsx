'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, XCircle, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function JoinTripPage({ params }: { params: { id: string } }) {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const token       = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login'>('loading')
  const [msg, setMsg]       = useState('')
  const [destination, setDestination] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMsg('Invalid invite link — no token found.'); return }

    async function accept() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setStatus('login')
        return
      }

      // Find the collaborator row by token + trip_id
      const { data: collab, error: findErr } = await supabase
        .from('trip_collaborators')
        .select('id, invited_email, status, trip_id')
        .eq('trip_id', params.id)
        .eq('join_token', token)
        .single()

      if (findErr || !collab) {
        setStatus('error')
        setMsg('This invite link is invalid or has already been used.')
        return
      }

      if (collab.status === 'active') {
        // Already accepted — just go to the trip
        router.replace(`/trips/${params.id}`)
        return
      }

      // Fetch trip name
      const { data: trip } = await supabase.from('trips').select('destination').eq('id', params.id).single()
      if (trip) setDestination(trip.destination)

      // Accept: set user_id + status = active
      const { error: updateErr } = await supabase
        .from('trip_collaborators')
        .update({ user_id: user.id, status: 'active' })
        .eq('id', collab.id)

      if (updateErr) {
        setStatus('error')
        setMsg(updateErr.message)
        return
      }

      setStatus('success')
      setTimeout(() => router.replace(`/trips/${params.id}`), 2000)
    }

    accept()
  }, [token, params.id, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sea-50 via-white to-sage-50 dark:from-[#0a0f0e] dark:via-[#111a18] dark:to-[#0a0f0e] flex items-center justify-center px-6">
      <div className="card p-8 w-full max-w-sm text-center shadow-card">
        <div className="text-4xl mb-4">🌍</div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
          {status === 'loading' && 'Joining trip...'}
          {status === 'success' && `Welcome to ${destination || 'the trip'}!`}
          {status === 'error' && 'Invite not found'}
          {status === 'login' && 'Sign in to join'}
        </h1>

        {status === 'loading' && (
          <div className="flex justify-center mt-4">
            <Loader2 size={28} className="animate-spin text-sea-500" />
          </div>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={40} className="text-sea-500 mx-auto my-4" />
            <p className="text-sm text-slate-500 dark:text-slate-400">You now have access to this trip. Taking you there now…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={40} className="text-red-400 mx-auto my-4" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{msg}</p>
            <Link href="/dashboard" className="btn-primary text-sm">Go to dashboard</Link>
          </>
        )}

        {status === 'login' && (
          <>
            <MapPin size={32} className="text-sea-400 mx-auto my-4" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              You need to be signed in to accept this trip invite.
            </p>
            <Link
              href={`/login?redirect=/trips/${params.id}/join?token=${token}`}
              className="btn-primary w-full justify-center text-sm"
            >
              Sign in to continue
            </Link>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
              New here? <Link href={`/signup?redirect=/trips/${params.id}/join?token=${token}`} className="text-sea-600 font-semibold">Create a free account</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

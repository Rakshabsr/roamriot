'use client'

import { useState, useEffect } from 'react'
import { X, Users, Link2, Copy, Check, Trash2, Loader2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Collaborator {
  id: string
  invited_email: string
  role: string
  status: 'pending' | 'active'
  created_at: string
}

export function CollabModal({ tripId, isOwner, onClose }: {
  tripId: string
  isOwner: boolean
  onClose: () => void
}) {
  const [email, setEmail]           = useState('')
  const [role, setRole]             = useState<'editor' | 'viewer'>('editor')
  const [collabs, setCollabs]       = useState<Collaborator[]>([])
  const [joinUrl, setJoinUrl]       = useState('')
  const [copied, setCopied]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [fetching, setFetching]     = useState(true)
  const [error, setError]           = useState('')

  useEffect(() => {
    fetch(`/api/trips/${tripId}/collaborators`)
      .then(r => r.json())
      .then(d => setCollabs(d.collaborators ?? []))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [tripId])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true); setJoinUrl('')
    try {
      const res = await fetch(`/api/trips/${tripId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json() as { joinUrl?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setJoinUrl(data.joinUrl ?? '')
      setEmail('')
      // refresh list
      const list = await fetch(`/api/trips/${tripId}/collaborators`).then(r => r.json())
      setCollabs(list.collaborators ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(collaboratorId: string) {
    await fetch(`/api/trips/${tripId}/collaborators`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collaboratorId }),
    })
    setCollabs(c => c.filter(x => x.id !== collaboratorId))
    if (joinUrl) setJoinUrl('')
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-6 sm:pb-0"
      onClick={onClose}>
      <div className="bg-white dark:bg-[#1a1814] rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-pop" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-sea-500" />
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Trip collaborators</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        {/* Current collaborators */}
        {fetching ? (
          <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-sea-400" /></div>
        ) : collabs.length > 0 ? (
          <div className="space-y-2 mb-5">
            {collabs.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="w-8 h-8 rounded-full bg-sea-100 dark:bg-sea-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-sea-600 dark:text-sea-400">{c.invited_email[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{c.invited_email}</p>
                  <p className="text-xs text-slate-400 capitalize">{c.role} · {c.status === 'active' ? '✅ Active' : '⏳ Pending invite'}</p>
                </div>
                {isOwner && (
                  <button onClick={() => handleRemove(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 size={13} className="text-slate-400 hover:text-red-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3 mb-4">No collaborators yet</p>
        )}

        {/* Invite form — owner only */}
        {isOwner && (
          <form onSubmit={handleInvite} className="space-y-3">
            <div>
              <label className="label text-xs">Invite by email</label>
              <input
                type="email"
                className="input text-sm"
                placeholder="friend@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              {(['editor', 'viewer'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all',
                    role === r
                      ? 'border-sea-400 bg-sea-50 dark:bg-sea-900/30 text-sea-700 dark:text-sea-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-sea-200'
                  )}
                >
                  {r === 'editor' ? '✏️ Can edit' : '👁️ View only'}
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-sm">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              {loading ? 'Sending...' : 'Generate invite link'}
            </button>
          </form>
        )}

        {/* Generated join link */}
        {joinUrl && (
          <div className="mt-4 p-3 rounded-2xl bg-sea-50 dark:bg-sea-900/20 border border-sea-100 dark:border-sea-900/40">
            <p className="text-xs font-bold text-sea-700 dark:text-sea-300 mb-2 flex items-center gap-1.5">
              <Link2 size={11} /> Share this link with your travel mate
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex-1 truncate font-mono">{joinUrl}</p>
              <button onClick={() => handleCopy(joinUrl)} className="flex-shrink-0 p-1.5 rounded-lg bg-sea-100 dark:bg-sea-800/50 hover:bg-sea-200 transition-colors">
                {copied ? <Check size={13} className="text-sea-600" /> : <Copy size={13} className="text-sea-600" />}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
          Collaborators see &amp; edit the same live itinerary
        </p>
      </div>
    </div>
  )
}

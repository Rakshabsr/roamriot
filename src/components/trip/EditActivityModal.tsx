'use client'

import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { Activity } from '@/lib/types'
import { cn, categoryIcon } from '@/lib/utils'

interface Props {
  activity: Activity
  onSave: (updated: Activity) => void
  onClose: () => void
}

const CATEGORIES = ['attraction', 'food', 'experience', 'transport', 'accommodation', 'essentials'] as const

export function EditActivityModal({ activity, onSave, onClose }: Props) {
  const [name, setName]         = useState(activity.name)
  const [desc, setDesc]         = useState(activity.description ?? '')
  const [time, setTime]         = useState(activity.start_time)
  const [dur, setDur]           = useState(activity.duration_minutes)
  const [cat, setCat]           = useState(activity.category)
  const [tips, setTips]         = useState(activity.tips ?? '')

  function handleSave() {
    onSave({
      ...activity,
      name: name.trim() || activity.name,
      description: desc,
      start_time: time,
      duration_minutes: dur,
      category: cat,
      tips,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-pop"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-sea-100 flex items-center justify-center">
              <Pencil size={14} className="text-sea-600" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">Edit stop</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X size={15} className="text-slate-600" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Place name</label>
            <input
              autoFocus
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Brief description…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start time</label>
              <input
                type="time"
                className="input"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input
                type="number"
                className="input"
                min={15}
                max={480}
                step={15}
                value={dur}
                onChange={e => setDur(+e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={cn(
                    'px-2 py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize',
                    cat === c
                      ? 'border-sea-400 bg-sea-50 text-sea-700'
                      : 'border-slate-200 text-slate-500 hover:border-sea-200'
                  )}
                >
                  {categoryIcon(c)} {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Tips (optional)</label>
            <input
              className="input"
              placeholder="Any helpful tips…"
              value={tips}
              onChange={e => setTips(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-outline flex-1 justify-center">
            Cancel
          </button>
          <button
            disabled={!name.trim()}
            onClick={handleSave}
            className="btn-primary flex-1 justify-center"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}

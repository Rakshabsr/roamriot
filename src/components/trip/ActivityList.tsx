'use client'

import { useState, useRef, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Clock, Youtube, ExternalLink, Star, Info, Play, ChevronDown,
  ChevronUp, GripVertical, Trash2, Lock, Navigation, NotebookPen, Check,
} from 'lucide-react'
import { Activity, SourceVideo } from '@/lib/types'
import { cn, formatTime, categoryColor, categoryIcon, youtubeWatchUrl } from '@/lib/utils'

// ─── VideoCard (inline) ───────────────────────────────────────────────────
function VideoCard({ video }: { video: SourceVideo }) {
  const [embed, setEmbed] = useState(false)
  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 mt-2">
      <button
        onClick={() => setEmbed(v => !v)}
        className="w-full flex items-center gap-3 p-3 hover:bg-white transition-colors text-left group"
      >
        <img
          src={video.thumbnailUrl} alt=""
          className="w-14 h-9 rounded-xl object-cover bg-slate-200 flex-shrink-0"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 line-clamp-1">{video.title}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <Youtube size={9} className="text-red-500" /> {video.channelTitle}
          </p>
        </div>
        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all', embed ? 'bg-slate-200' : 'bg-sea-100 group-hover:bg-sea-200')}>
          {embed ? <ChevronUp size={12} className="text-slate-500" /> : <Play size={11} className="text-sea-600" />}
        </div>
      </button>
      {embed && (
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${video.videoId}?modestbranding=1&rel=0&autoplay=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen title={video.title}
          />
        </div>
      )}
      {!embed && (
        <div className="px-3 pb-2.5">
          <a
            href={youtubeWatchUrl(video.videoId)}
            target="_blank" rel="noopener noreferrer"
            className="text-xs text-sea-600 hover:underline font-medium inline-flex items-center gap-1"
          >
            Watch on YouTube <ExternalLink size={10} />
          </a>
        </div>
      )}
    </div>
  )
}

// ─── TravelStrip ──────────────────────────────────────────────────────────
function TravelStrip({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-4 ml-11">
      <div className="flex-1 border-t-2 border-dashed border-sea-100" />
      <span className="text-xs font-semibold text-sea-400 whitespace-nowrap flex items-center gap-1">
        <Navigation size={10} /> {minutes} min
      </span>
      <div className="flex-1 border-t-2 border-dashed border-sea-100" />
    </div>
  )
}

// ─── ActivityCard ─────────────────────────────────────────────────────────
function ActivityCard({
  activity, index, isLast, isActive, onClick, onDelete, dragHandleProps, isDragging, tripId,
}: {
  activity: Activity; index: number; isLast: boolean; isActive: boolean
  onClick: () => void; onDelete: () => void
  dragHandleProps?: Record<string, unknown>
  isDragging?: boolean
  tripId?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote]         = useState<string>('')
  const [noteSaved, setNoteSaved] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const noteKey = `roamriot_note_${activity.id}`

  // Load note from localStorage on first expand
  useEffect(() => {
    if (expanded && !note) {
      const saved = localStorage.getItem(noteKey) ?? activity.notes ?? ''
      setNote(saved)
    }
  }, [expanded, note, noteKey, activity.notes])

  function saveNote() {
    localStorage.setItem(noteKey, note)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 1500)
    // Persist to Supabase if we have tripId
    if (tripId) {
      fetch(`/api/trips/${tripId}/activities/${activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: note }),
      }).catch(() => {/* silent */})
    }
  }
  const STRIP_COLORS: Record<string, string> = {
    food: 'bg-orange-400', attraction: 'bg-sea-500', experience: 'bg-sage-500',
    accommodation: 'bg-purple-500', transport: 'bg-slate-400', essentials: 'bg-red-400',
  }

  useEffect(() => {
    if (isActive) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [isActive])

  return (
    <div ref={ref} className={cn('relative flex gap-3 animate-fade-up', isDragging && 'opacity-0')} style={{ animationDelay: `${index * 0.04}s` }}>
      {/* Timeline dot */}
      <div className="flex flex-col items-center w-10 flex-shrink-0 pt-1">
        <div className={cn(
          'w-8 h-8 rounded-2xl flex items-center justify-center text-sm z-10 shadow-soft transition-all',
          isActive ? 'bg-sea-500 text-white scale-110 shadow-lift' : 'bg-white border-2 border-sea-100'
        )}>
          {categoryIcon(activity.category)}
        </div>
        {!isLast && <div className="w-0.5 bg-gradient-to-b from-sea-200 to-transparent flex-1 mt-1 min-h-[1.5rem]" />}
      </div>

      {/* Card */}
      <div className="flex-1 pb-4">
        <div className={cn(
          'card overflow-hidden transition-all duration-200',
          isActive ? 'shadow-lift ring-2 ring-sea-300' : 'hover:shadow-card hover:-translate-y-0.5'
        )}>
          <div className={cn('h-1 w-full', STRIP_COLORS[activity.category] ?? 'bg-sea-400')} />
          <div className="p-3.5">
            <div className="flex items-start gap-2">
              {/* Drag handle */}
              {!activity.is_fixed ? (
                <div
                  {...dragHandleProps}
                  className="mt-0.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 touch-none"
                >
                  <GripVertical size={15} />
                </div>
              ) : (
                <Lock size={13} className="mt-0.5 text-slate-300 flex-shrink-0" />
              )}

              <button className="flex-1 text-left min-w-0" onClick={() => { onClick(); setExpanded(e => !e) }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock size={10} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-500">{formatTime(activity.start_time)}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{activity.duration_minutes}min</span>
                  {activity.source_videos.length > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-red-400 font-semibold ml-1">
                      <Youtube size={9} /> vlog
                    </span>
                  )}
                </div>
                <p className="font-bold text-slate-900 text-sm leading-snug">{activity.name}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className={cn('badge text-xs', categoryColor(activity.category))}>
                    {categoryIcon(activity.category)} {activity.category}
                  </span>
                  {activity.rating && (
                    <span className="badge bg-amber-50 text-amber-600 text-xs">
                      <Star size={9} fill="currentColor" /> {activity.rating}
                    </span>
                  )}
                  {activity.price_range && (
                    <span className="badge bg-slate-50 text-slate-500 text-xs">{activity.price_range}</span>
                  )}
                </div>
              </button>

              <div className="flex flex-col gap-1 flex-shrink-0">
                {!activity.is_fixed && (
                  <button
                    onClick={onDelete}
                    className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors group"
                  >
                    <Trash2 size={10} className="text-red-400 group-hover:text-red-600" />
                  </button>
                )}
                <button
                  onClick={() => { onClick(); setExpanded(e => !e) }}
                  className="w-6 h-6 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  {expanded ? <ChevronUp size={11} className="text-slate-400" /> : <ChevronDown size={11} className="text-slate-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded */}
        {expanded && (
          <div className="mt-2 px-1 space-y-2 animate-fade-up">
            {activity.description && (
              <p className="text-sm text-slate-600 leading-relaxed">{activity.description}</p>
            )}
            {activity.tips && (
              <div className="flex gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-100">
                <Info size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">{activity.tips}</p>
              </div>
            )}
            {activity.source_videos.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Youtube size={10} className="text-red-400" /> Recommended in
                </p>
                {activity.source_videos.map(v => <VideoCard key={v.videoId} video={v} />)}
              </div>
            )}

            {/* Quick notes */}
            <div className="mt-1">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <NotebookPen size={10} /> My notes
              </p>
              <div className="relative">
                <textarea
                  className="w-full px-3 py-2.5 text-xs bg-white dark:bg-[#172420] border-2 border-sea-100 dark:border-[#1e2f2b] rounded-2xl text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-sea-400 dark:focus:border-sea-600 resize-none transition-all"
                  rows={2}
                  placeholder="Add a quick note — booking ref, tips, what to bring…"
                  value={note}
                  onChange={e => { setNote(e.target.value); setNoteSaved(false) }}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNote() }}
                />
                <button
                  onClick={saveNote}
                  disabled={!note.trim()}
                  className={cn(
                    'absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all',
                    noteSaved
                      ? 'bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-400'
                      : 'bg-sea-500 text-white hover:bg-sea-600 disabled:opacity-40 disabled:cursor-not-allowed'
                  )}>
                  {noteSaved ? <><Check size={9} /> Saved</> : 'Save'}
                </button>
              </div>
              <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Cmd+Enter to save · Stored on device + synced</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SortableActivityCard ─────────────────────────────────────────────────
function SortableActivityCard(props: {
  activity: Activity; index: number; isLast: boolean; isActive: boolean
  onClick: () => void; onDelete: () => void
  activeId: string | null
  tripId?: string
}) {
  const { activity, activeId, tripId, ...rest } = props
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: activity.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ActivityCard
        activity={activity}
        dragHandleProps={!activity.is_fixed ? { ...attributes, ...listeners } : undefined}
        isDragging={activeId === activity.id}
        tripId={tripId}
        {...rest}
      />
    </div>
  )
}

// ─── ActivityList ─────────────────────────────────────────────────────────
interface ActivityListProps {
  activities: Activity[]
  activeActivityId: string
  tripId?: string
  dayId?: string
  onActivityClick: (id: string) => void
  onReorder: (reordered: Activity[]) => void
  onDelete: (id: string) => void
}

// Seeded random for consistent travel strip minutes
function seededMinutes(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  return 10 + Math.abs(h) % 20
}

export function ActivityList({
  activities,
  activeActivityId,
  tripId,
  dayId,
  onActivityClick,
  onReorder,
  onDelete,
}: ActivityListProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Separate fixed from sortable
  const fixedActivities = activities.filter(a => a.is_fixed)
  const sortableActivities = activities.filter(a => !a.is_fixed)

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortableActivities.findIndex(a => a.id === active.id)
    const newIndex = sortableActivities.findIndex(a => a.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reorderedSortable = arrayMove(sortableActivities, oldIndex, newIndex)
      .map((a, i) => ({ ...a, order_index: i }))

    // Merge fixed + reordered sortable, maintaining visual order
    const allActivities = [...activities]
    const reordered = allActivities.map(a => {
      if (a.is_fixed) return a
      return reorderedSortable.find(r => r.id === a.id) ?? a
    })

    onReorder(reordered)

    // Persist reorder to Supabase (fire-and-forget)
    if (tripId && dayId) {
      fetch(`/api/trips/${tripId}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId,
          activities: reorderedSortable.map(a => ({ id: a.id, order_index: a.order_index })),
        }),
      }).catch(() => {/* silent fail */})
    }
  }

  const activeActivity = activeDragId
    ? sortableActivities.find(a => a.id === activeDragId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortableActivities.map(a => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="px-4 pb-4">
          {activities.map((activity, i) => {
            const isFixed = activity.is_fixed
            const isLast = i === activities.length - 1

            if (isFixed) {
              return (
                <div key={activity.id}>
                  <ActivityCard
                    activity={activity}
                    index={i}
                    isLast={isLast}
                    isActive={activity.id === activeActivityId}
                    onClick={() => onActivityClick(activity.id)}
                    onDelete={() => onDelete(activity.id)}
                    tripId={tripId}
                  />
                  {!isLast && <TravelStrip minutes={seededMinutes(activity.id)} />}
                </div>
              )
            }

            return (
              <div key={activity.id}>
                <SortableActivityCard
                  activity={activity}
                  index={i}
                  isLast={isLast}
                  isActive={activity.id === activeActivityId}
                  activeId={activeDragId}
                  onClick={() => onActivityClick(activity.id)}
                  onDelete={() => onDelete(activity.id)}
                  tripId={tripId}
                />
                {!isLast && <TravelStrip minutes={seededMinutes(activity.id)} />}
              </div>
            )
          })}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeActivity && (
          <div className="opacity-90 rotate-1 scale-105">
            <ActivityCard
              activity={activeActivity}
              index={0}
              isLast={false}
              isActive={false}
              onClick={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

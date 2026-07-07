import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET  — list all collaborators for a trip (owner only)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership
    const { data: trip } = await supabase.from('trips').select('user_id').eq('id', params.id).single()
    if (!trip || trip.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabase
      .from('trip_collaborators')
      .select('id, invited_email, role, status, created_at')
      .eq('trip_id', params.id)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ collaborators: data ?? [] })
  } catch (err) {
    console.error('GET collaborators error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST — invite a collaborator by email
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership
    const { data: trip } = await supabase.from('trips').select('user_id, destination').eq('id', params.id).single()
    if (!trip || trip.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { email, role = 'editor' } = await req.json() as { email: string; role?: string }
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    if (email === user.email) return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 })

    const { data, error } = await supabase
      .from('trip_collaborators')
      .upsert({ trip_id: params.id, invited_email: email, role, invited_by: user.id }, { onConflict: 'trip_id,invited_email' })
      .select('join_token')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/trips/${params.id}/join?token=${data.join_token}`
    return NextResponse.json({ joinUrl, token: data.join_token })
  } catch (err) {
    console.error('POST collaborator error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE — remove a collaborator (owner only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: trip } = await supabase.from('trips').select('user_id').eq('id', params.id).single()
    if (!trip || trip.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { collaboratorId } = await req.json() as { collaboratorId: string }
    const { error } = await supabase.from('trip_collaborators').delete().eq('id', collaboratorId).eq('trip_id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE collaborator error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

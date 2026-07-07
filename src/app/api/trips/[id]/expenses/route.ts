import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/trips/[id]/expenses
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership
    const { data: trip } = await supabase
      .from('trips')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()
    if (!trip) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', params.id)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ expenses: data ?? [] })
  } catch (err) {
    console.error('Expenses GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/trips/[id]/expenses
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership
    const { data: trip } = await supabase
      .from('trips')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()
    if (!trip) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { description, amount, category, day_number, currency = 'INR', paid_by } = body

    if (!description || amount == null || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({ trip_id: params.id, description, amount, category, day_number: day_number ?? 1, currency, paid_by })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ expense: data })
  } catch (err) {
    console.error('Expenses POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

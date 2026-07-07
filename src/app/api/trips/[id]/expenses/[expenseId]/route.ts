import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/trips/[id]/expenses/[expenseId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership via trip
    const { data: expense } = await supabase
      .from('expenses')
      .select('id, trips!inner(user_id)')
      .eq('id', params.expenseId)
      .eq('trip_id', params.id)
      .single()

    if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const tripOwner = (expense as unknown as { trips: { user_id: string } }).trips
    if (tripOwner.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', params.expenseId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Expense DELETE error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { searchYouTubeVlogs } from '@/lib/youtube/search'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const destination = searchParams.get('destination') ?? ''
  const dietary = searchParams.get('dietary') ?? 'none'

  if (!destination) {
    return NextResponse.json({ error: 'destination is required' }, { status: 400 })
  }

  const videos = await searchYouTubeVlogs(destination, dietary)
  return NextResponse.json({ videos })
}

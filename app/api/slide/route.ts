import { NextRequest, NextResponse } from 'next/server'
import { pusherServer } from '@/lib/pusher-server'

export async function POST(req: NextRequest) {
  const { code, direction } = await req.json() as { code: string; direction: 'next' | 'prev' }

  if (!code || !['next', 'prev'].includes(direction)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  await pusherServer.trigger(`room-${code}`, 'slide:change', { direction })
  return NextResponse.json({ ok: true })
}

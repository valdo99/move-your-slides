import { NextResponse } from 'next/server'
import { generateRoomCode } from '@/lib/room'

export async function POST() {
  return NextResponse.json({ code: generateRoomCode() })
}

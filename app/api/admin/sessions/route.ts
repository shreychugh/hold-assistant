import { NextResponse } from 'next/server'
import { getAllSessions } from '@/lib/firebase-admin'

export async function GET() {
  const sessions = await getAllSessions(50)
  return NextResponse.json({ sessions }, {
    headers: { 'Cache-Control': 'no-store' }
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  const { userPhone } = await req.json()
  if (!userPhone) return NextResponse.json({ error: 'userPhone required' }, { status: 400 })

  const snap = await adminDb
    .collection('sessions')
    .where('userPhone', '==', userPhone)
    .where('status', 'in', ['initiated', 'calling', 'navigating', 'waiting', 'agent_found'])
    .get()

  const batch = adminDb.batch()
  snap.docs.forEach(doc => batch.update(doc.ref, { status: 'failed', errorMessage: 'Manually reset', updatedAt: Date.now() }))
  await batch.commit()

  return NextResponse.json({ cleared: snap.size })
}

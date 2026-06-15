import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { Session, SessionStatus } from '@/types/session'

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  })
}

export const adminDb = getFirestore()

export async function createSession(data: Omit<Session, 'createdAt' | 'updatedAt'>): Promise<void> {
  const now = Date.now()
  await adminDb.collection('sessions').doc(data.sessionId).set({
    ...data,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateSession(sessionId: string, data: Partial<Session>): Promise<void> {
  await adminDb.collection('sessions').doc(sessionId).update({
    ...data,
    updatedAt: Date.now(),
  })
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const doc = await adminDb.collection('sessions').doc(sessionId).get()
  return doc.exists ? (doc.data() as Session) : null
}

export async function getSessionByCallSid(callSid: string): Promise<Session | null> {
  const snap = await adminDb
    .collection('sessions')
    .where('callSid', '==', callSid)
    .limit(1)
    .get()
  return snap.empty ? null : (snap.docs[0].data() as Session)
}

export async function hasActiveSession(userPhone: string): Promise<boolean> {
  const snap = await adminDb
    .collection('sessions')
    .where('userPhone', '==', userPhone)
    .where('status', 'in', ['initiated', 'calling', 'navigating', 'waiting', 'agent_found'])
    .limit(1)
    .get()
  return !snap.empty
}

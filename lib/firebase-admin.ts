import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { Session } from '@/types/session'

function adminApp() {
  if (getApps().length) return getApp()
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  })
}

function db() {
  return getFirestore(adminApp())
}

export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_t, prop) { return Reflect.get(db(), prop) },
})

export async function createSession(data: Omit<Session, 'createdAt' | 'updatedAt'>): Promise<void> {
  const now = Date.now()
  await db().collection('sessions').doc(data.sessionId).set({
    ...data,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateSession(sessionId: string, data: Partial<Session>): Promise<void> {
  await db().collection('sessions').doc(sessionId).update({
    ...data,
    updatedAt: Date.now(),
  })
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const doc = await db().collection('sessions').doc(sessionId).get()
  return doc.exists ? (doc.data() as Session) : null
}

export async function getSessionByCallSid(callSid: string): Promise<Session | null> {
  const snap = await db()
    .collection('sessions')
    .where('callSid', '==', callSid)
    .limit(1)
    .get()
  return snap.empty ? null : (snap.docs[0].data() as Session)
}

export async function hasActiveSession(userPhone: string): Promise<boolean> {
  const snap = await db()
    .collection('sessions')
    .where('userPhone', '==', userPhone)
    .where('status', 'in', ['initiated', 'calling', 'navigating', 'waiting', 'agent_found'])
    .limit(1)
    .get()
  return !snap.empty
}

import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const { SERVICE_ACCOUNT, DATABASE_URL } = process.env

// INIT FIREBASE DB
initializeApp({
    credential: cert(JSON.parse(SERVICE_ACCOUNT)),
    databaseURL: DATABASE_URL,
})
const db = getFirestore()
export default db

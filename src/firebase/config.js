import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyDf4XaY5tRthfcIy5ssjcAKlCYgB7ZkMjU",
  authDomain: "goplace-f33c9.firebaseapp.com",
  databaseURL: "https://goplace-f33c9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "goplace-f33c9",
  storageBucket: "goplace-f33c9.firebasestorage.app",
  messagingSenderId: "978391795944",
  appId: "1:978391795944:web:342789484e502bfb19a15d"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Export auth services
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Export database services
export const db = getFirestore(app)
export const rtdb = getDatabase(app)

export default app
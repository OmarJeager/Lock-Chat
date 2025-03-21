
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzrCgBQH916ldV9hqlZEQ9tRDKMwqy2eM",
  authDomain: "chat-app-db4b3.firebaseapp.com",
  projectId: "chat-app-db4b3",
  storageBucket: "chat-app-db4b3.appspot.com",
  messagingSenderId: "1025187678167",
  appId: "1:1025187678167:web:1d5b89bee579c7bd98ed92",
  measurementId: "G-YSRBLFMHPD",
  databaseURL: "https://chat-app-db4b3-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

/* 
Firebase Realtime Database Rules (set these in Firebase Console):
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "messages": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$messageId": {
        ".validate": "newData.hasChildren(['text', 'senderId', 'senderName', 'timestamp'])",
        "text": { ".validate": "newData.isString()" },
        "senderId": { ".validate": "newData.isString() && newData.val() === auth.uid" },
        "senderName": { ".validate": "newData.isString()" },
        "timestamp": { ".validate": "newData.val() <= now" },
        "isEncrypted": { ".validate": "newData.isBoolean()" },
        "receiverId": { ".validate": "newData.isString() || newData.val() === null" }
      }
    },
    "users": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$userId": {
        ".validate": "newData.hasChildren(['displayName', 'lastActive'])",
        "displayName": { ".validate": "newData.isString()" },
        "email": { ".validate": "newData.isString() || newData.val() === null" },
        "lastActive": { ".validate": "newData.val() <= now" }
      }
    }
  }
}
*/

// Check if we're in development mode and need to connect to emulators
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
  // Connect to emulators if running locally
  const authEmulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST;
  const databaseEmulatorHost = import.meta.env.VITE_FIREBASE_DATABASE_EMULATOR_HOST;
  
  if (authEmulatorHost) {
    const [host, port] = authEmulatorHost.split(":");
    if (host && port) {
      connectDatabaseEmulator(database, host, Number(port));
    }
  }
}

// Enable database persistence to handle offline scenarios
// We need to use the Firebase SDK import instead of require
try {
  // Import dynamically to avoid ESM issues - removing setPersistenceEnabled which doesn't exist
  import('firebase/database')
    .then(module => {
      console.log("Firebase database module loaded successfully");
      // NOTE: setPersistenceEnabled is not available in the current Firebase version
      // Let the database handle caching automatically
    })
    .catch(error => {
      console.warn("Firebase database import error:", error);
    });
} catch (error) {
  console.warn("Firebase database module loading error:", error);
}

export default app;


import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
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

export default app;

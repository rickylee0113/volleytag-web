import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// TODO: 請將您從 Firebase Console 複製的設定貼在下方取代這個物件
const firebaseConfig = {
  apiKey: "AIzaSyDUDCW29hN-yK3iOVR99x1rGuvQVeWEZxc",
  authDomain: "volleytag-web.firebaseapp.com",
  projectId: "volleytag-web",
  storageBucket: "volleytag-web.firebasestorage.app",
  messagingSenderId: "930121052564",
  appId: "1:930121052564:web:99072eae70ee3eab5c5f81",
  measurementId: "G-X7DE68YVQJ"
};


// Initialize Firebase
// Ensure we don't initialize twice
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
export const auth = app.auth();
export const db = app.firestore();
export default app;
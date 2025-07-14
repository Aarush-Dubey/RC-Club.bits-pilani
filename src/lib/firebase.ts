// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBXBN-Ts29NO9vtAqCOfoB5HDmHSZ0iSks",
  authDomain: "rc-manager-65085.firebaseapp.com",
  projectId: "rc-manager-65085",
  storageBucket: "rc-manager-65085.appspot.com",
  messagingSenderId: "63464032218",
  appId: "1:63464032218:web:7b8eec3a72f4badfa222e3",
  measurementId: "G-64C6XG9QNB"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics only on the client side
let analytics;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, db, storage, analytics };

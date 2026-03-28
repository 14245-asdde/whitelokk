import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD32Zbpc6uewfh4HPpRVi2YVbDZ1uI4Zr8",
  authDomain: "whitelokk-9c930.firebaseapp.com",
  projectId: "whitelokk-9c930",
  storageBucket: "whitelokk-9c930.firebasestorage.app",
  messagingSenderId: "378636857138",
  appId: "1:378636857138:web:1d379070383a182d0f312b",
  measurementId: "G-R741BR952G"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

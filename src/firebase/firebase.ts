import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAA7tZTnalUv4OCAsU_wMe6WGlsMdSMiEU",
  authDomain: "studio-8728271286-596e7.firebaseapp.com",
  projectId: "studio-8728271286-596e7",
  storageBucket: "studio-8728271286-596e7.appspot.com",
  messagingSenderId: "881712555776",
  appId: "1:881712555776:web:3fe086790944534dbfb5e5",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);
const auth = getAuth(app);

export { app, firestore, auth };

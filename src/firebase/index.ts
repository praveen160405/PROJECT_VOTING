import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAA7tZTnalUv4OCAsU_wMe6WGlsMdSMiEU",
  authDomain: "studio-8728271286-596e7.firebaseapp.com",
  projectId: "studio-8728271286-596e7",
  storageBucket: "studio-8728271286-596e7.appspot.com",
  messagingSenderId: "881712555776",
  appId: "1:881712555776:web:3fe086790944534dbfb5e5",
};

export function initializeFirebase() {
  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { app, auth, firestore };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

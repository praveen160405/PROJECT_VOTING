import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export type FirebaseServices = {
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
};

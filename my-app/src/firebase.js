import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './env';

const firebaseConfigs= {
  apiKey: firebaseConfig.apikey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  measurementId: firebaseConfig.measurementId
};

const app = initializeApp(firebaseConfigs);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
export default app;
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDU61P8-pWAsIi_VfJ8BV3YFrnndE9AG6s",
  authDomain: "scholarcoach-c1e1e.firebaseapp.com",
  projectId: "scholarcoach-c1e1e",
  storageBucket: "scholarcoach-c1e1e.firebasestorage.app",
  messagingSenderId: "317733816834",
  appId: "1:317733816834:web:06d205389ffb986abd751b",
  measurementId: "G-SS34834T8C"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

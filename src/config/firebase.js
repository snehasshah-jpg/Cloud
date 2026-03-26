// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDU61P8-pWAsIi_VfJ8BV3YFrnndE9AG6s",
  authDomain: "scholarcoach-c1e1e.firebaseapp.com",
  projectId: "scholarcoach-c1e1e",
  storageBucket: "scholarcoach-c1e1e.firebasestorage.app",
  messagingSenderId: "317733816834",
  appId: "1:317733816834:web:06d205389ffb986abd751b",
  measurementId: "G-SS34834T8C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQguFel0NDPxwC-KGJhfYdXvWJcdKMMxQ",
  authDomain: "speedlab1-7f02c.firebaseapp.com",
  projectId: "speedlab1-7f02c",
  storageBucket: "speedlab1-7f02c.appspot.com",
  messagingSenderId: "298559435817",
  appId: "1:298559435817:web:5b3f63875ee9dda4ef5838",
  measurementId: "G-Y3H2W0K79V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export default app;
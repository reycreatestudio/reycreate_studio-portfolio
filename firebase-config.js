import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBlbeyeynUXvrSE-TBVjwaEiBobHTrBlQo",
    authDomain: "reycreatestudio-portfoli-9b09b.firebaseapp.com",
    projectId: "reycreatestudio-portfoli-9b09b",
    storageBucket: "reycreatestudio-portfoli-9b09b.firebasestorage.app",
    messagingSenderId: "41750977632",
    appId: "1:41750977632:web:f202e8614f20e5d9ceb705"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
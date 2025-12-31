
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCekpShTS7dn5XjQEcF5HeGa_J6-2nfXiI", 
  authDomain: "ma-super-todo-dadf0.firebaseapp.com",
  projectId: "ma-super-todo-dadf0",
  storageBucket: "ma-super-todo-dadf0.firebasestorage.app",
  messagingSenderId: "385818617888",
  appId: "1:385818617888:web:35a147999d90aec7c4b445"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
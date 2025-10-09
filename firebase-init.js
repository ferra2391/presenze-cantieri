// In firebase-init.js

// Importa le funzioni di base di Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
// AGGIUNGIAMO LE IMPORTAZIONI PER I SERVIZI CHE USEREMO
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// La tua configurazione (corretta!)
const firebaseConfig = {
  apiKey: "AIzaSyD6ZmxvoGnfQYy5DYOh69-C0VUi9ixISus",
  authDomain: "presenze-a0e61.firebaseapp.com",
  projectId: "presenze-a0e61",
  storageBucket: "presenze-a0e61.appspot.com",
  messagingSenderId: "502714159291",
  appId: "1:502714159291:web:6f62283a151933b62cd99e"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// ESPORTIAMO I SERVIZI PER USARLI IN ALTRI FILE
export const auth = getAuth(app);
export const db = getFirestore(app);

// =================================================================
// LOGIN.JS - GESTIONE ACCESSO CON FIREBASE AUTHENTICATION
// =================================================================

// Importa le funzioni necessarie da Firebase SDK
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
// Importa l'oggetto 'auth' che abbiamo inizializzato e configurato
import { auth } from './firebase-init.js';

// Riferimenti agli elementi HTML della pagina di login
const loginBtn = document.getElementById('loginBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

// Aggiunge un "ascoltatore" al pulsante di login che si attiva al click
loginBtn.addEventListener('click', () => {
  // Recupera i valori inseriti dall'utente, togliendo spazi extra dall'email
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Controllo base: assicura che entrambi i campi siano stati compilati
  if (!email || !password) {
    errorMessage.textContent = "Inserisci email e password.";
    errorMessage.style.display = 'block';
    return; // Interrompe l'esecuzione se i campi sono vuoti
  }
  
  // Nasconde eventuali messaggi di errore precedenti
  errorMessage.style.display = 'none';

  // Chiama la funzione di Firebase per tentare l'accesso
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Accesso RIUSCITO!
      // Firebase ha verificato l'utente.
      console.log('Login effettuato con successo per:', userCredential.user.email);
      
      // Reindirizza l'utente alla pagina principale dell'app
      window.location.href = 'newapp.html';
    })
    .catch((error) => {
      // Accesso FALLITO!
      // L'email o la password non erano corrette.
      console.error('Errore di login:', error.code, error.message);
      
      // Mostra un messaggio di errore generico all'utente
      errorMessage.textContent = 'Credenziali non valide. Riprova.';
      errorMessage.style.display = 'block';
    });
});

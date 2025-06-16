// INSERISCI QUI IL TUO URL PUBBLICO DELL'APPS SCRIPT
const API_URL = "https://script.google.com/macros/s/AKfycbxI_Jnf6D8bteWYlb_VjeayQhTt3n9E0cZtj-9Ddat1WAbVrHyEg-BuyrLXk7zBphjP/exec";

async function inviaDati() {
  const user = document.getElementById("user").value.trim();
  const cantiere = document.getElementById("cantiere").value;
  const lavorazione = document.getElementById("lavorazione").value.trim();
  const operaiInput = document.getElementById("operai").value.trim();

  if (!user || !cantiere || !lavorazione || !operaiInput) {
    alert("Compila tutti i campi prima di inviare.");
    return;
  }

  const oggi = new Date();
  const dataLavoro = oggi.toISOString().split('T')[0];

  const operai = operaiInput.split(",").map(nome => ({ nome: nome.trim() })).filter(o => o.nome);

  const payload = {
    dataLavoro,
    user,
    cantiere,
    lavorazione,
    operai
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.status === "success") {
      alert("✅ Dati inseriti correttamente!");
    } else {
      alert("❌ Errore dal server Google Apps Script.");
    }
  } catch (error) {
    console.error("Errore nella richiesta:", error);
    alert("❌ Errore di rete o URL non valido.");
  }
}

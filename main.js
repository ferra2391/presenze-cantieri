const API_URL = "https://script.google.com/macros/s/AKfycbxI_Jnf6D8bteWYlb_VjeayQhTt3n9E0cZtj-9Ddat1WAbVrHyEg-BuyrLXk7zBphjP/exec";

const operai = {
  "mata": "max321",
  "pata": "pasq@85",
  "maez": "maja44",
  "saac": "sam!90",
  "oot": "teo007",
  "emma": "manu12",
  "maro": "ronco33",
  "kero": "kevx88",
  "ahaz": "zrik77",
  "abaq": "aziz@19",
  "maru": "matt34",
  "guha": "gus123",
  "gigr": "giox55"
};

const cantieri = [
  "Visso", "Salvatori", "Petetta.G - Sarnano", "Romagnoli", "Pierangeli",
  "Petetta.G - Sant'Angelo", "Rommozzi", "Biondi", "Galassi", "Alidori",
  "Rioli", "Farroni", "Biaggi", "Fermani", "Casa Luca Appezzana"
];

let loggedUser = null;

function handleLogin() {
  const u = document.getElementById("loginUser").value.trim();
  const p = document.getElementById("loginPass").value.trim();
  if (operai[u] === p) {
    loggedUser = u;
    document.getElementById("loginContainer").classList.add("hidden");
    document.getElementById("formContainer").classList.remove("hidden");
    caricaCantieri();
    checkSettimanaCompleta();
    mostraUltimiDati();
  } else {
    document.getElementById("loginError").classList.remove("hidden");
  }
}

function caricaCantieri() {
  const sel = document.getElementById("cantiere");
  sel.innerHTML = "";
  cantieri.forEach(c => {
    const opt = document.createElement("option");
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

function aggiungiCantiere() {
  const nuovo = prompt("Inserisci il nuovo cantiere:");
  if (nuovo) {
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nuovoCantiere: nuovo })
    }).then(() => {
      alert(`Cantiere "${nuovo}" inviato a Google Sheet (fuori elenco fisso).`);
    });
  }
}

async function inviaDati() {
  const cant = document.getElementById("cantiere").value;
  const lav = document.getElementById("lavorazione").value.trim();
  const altri = document.getElementById("altriOperai").value.split(',').map(s => s.trim()).filter(s => s);
  const oggi = new Date().toISOString().split('T')[0];

  const operaiDaInserire = [loggedUser, ...altri].map(nome => ({ nome }));

  const payload = {
    dataLavoro: oggi,
    user: loggedUser,
    cantiere: cant,
    lavorazione: lav,
    operai: operaiDaInserire
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.status === "success") {
      alert("✅ Dati salvati correttamente!");
    } else {
      alert("❌ Errore salvataggio dati.");
    }
  } catch (err) {
    alert("Errore di rete o Apps Script.");
    console.error(err);
  }
}

function checkSettimanaCompleta() {
  const box = document.getElementById("statusBox");
  // In futuro: fetch su API per controllare i dati
  const completo = true;
  if (completo) {
    box.className = "status green";
    box.innerText = "✅ Dati degli ultimi 7 giorni completi";
  } else {
    box.className = "status red";
    box.innerText = "❌ Dati degli ultimi 7 giorni NON completi";
    box.onclick = () => alert("Mostra giorni mancanti (in sviluppo)");
  }
}

function mostraUltimiDati() {
  // Da implementare dinamicamente con chiamata GET
  const elenco = [
    "16-06 - lun - Romagnoli - getto pilastri",
    "14-06 - ven - Salvatori - armatura travi",
    "13-06 - gio - Visso - pulizia cantiere"
  ];
  document.getElementById("recordList").innerText = elenco.join("\n");
}

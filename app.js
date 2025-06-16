
const operai = [
  { nome: "Mario Rossi", username: "mario", password: "1234" },
  { nome: "Luca Bianchi", username: "luca", password: "1234" },
  { nome: "Giulia Verdi", username: "giulia", password: "1234" }
];

let cantieri = [
  "Cantiere Piazza XX Settembre",
  "Cantiere Via Roma",
  "Cantiere Scuola Media",
  "Cantiere Stazione FS",
  "Cantiere Ospedale Civitanova"
];

const backendUrl = "https://script.google.com/macros/s/AKfycbztrL-_qpimx__Mgo6ILq853OLogy_Pa8W8rl36ujpKXAJlBQ-p0NaMsWG84r4ZR8W3/exec";

let currentUser = null;

function mostraCampoNuovoCantiere() {
  document.getElementById("campoNuovoCantiere").style.display = "block";
}

function renderLogin() {
  document.getElementById("root").innerHTML = `
    <h2>Login Operaio</h2>
    <input id="user" placeholder="Username" />
    <input id="pass" placeholder="Password" type="password" />
    <button onclick="login()">Accedi</button>
  `;
}

function login() {
  const u = document.getElementById("user").value;
  const p = document.getElementById("pass").value;
  const found = operai.find(o => o.username === u && o.password === p);
  if (found) {
    currentUser = found;
    renderInserimento();
    renderVerifica();
  } else {
    alert("Credenziali errate");
  }
}

function renderInserimento() {
  const cantiereOptions = cantieri.map(c => `<option value="${c}">${c}</option>`).join("");
  document.getElementById("root").innerHTML = `
    <h2>Dati giornalieri</h2>
    <select id="cantiere"><option value="">-- Seleziona un cantiere --</option>${cantiereOptions}</select>
    <button class="rosso" onclick="mostraCampoNuovoCantiere()">+ Inserisci un cantiere non in elenco</button>
    <div id="campoNuovoCantiere" style="display:none;"><input id="nuovoCantiere" placeholder="Nuovo cantiere (opzionale)" />
    <textarea id="lavorazioni" rows="3" placeholder="Descrizione lavorazioni..."></textarea>
    <button onclick="inserisciDatoSingolo()">Inserisci</button>
    <button onclick="renderMultiplo()">Inserisci dati per altro operaio</button>
    <div id="conferma"></div>
  `;
}

function inserisciDatoSingolo() {
  const cantiere = document.getElementById("nuovoCantiere").value || document.getElementById("cantiere").value;
  const lavorazioni = document.getElementById("lavorazioni").value;
  if (!cantiere || !lavorazioni) return alert("Inserisci cantiere e lavorazioni");
  const now = new Date().toISOString();
  const payload = {
    nome: currentUser.nome,
    username: currentUser.username,
    lavorazioni: lavorazioni,
    cantiere: cantiere,
    ora: now
  };
  inviaDati(payload);
}

function renderMultiplo() {
  const otherOps = operai.filter(o => o.username !== currentUser.username);
  const checkboxes = otherOps.map(o => `<label><input type="checkbox" value="${o.nome}"> ${o.nome}</label>`).join("<br>");
  document.getElementById("root").innerHTML = `
    <h2>Dati per altri operai</h2>
    <select id="cantiere"><option value="">-- Seleziona un cantiere --</option>${cantieri.map(c => `<option value="${c}">${c}</option>`).join("")}</select>
    <button class="rosso" onclick="mostraCampoNuovoCantiere()">+ Inserisci un cantiere non in elenco</button>
    <div id="campoNuovoCantiere" style="display:none;"><input id="nuovoCantiere" placeholder="Nuovo cantiere (opzionale)" />
    <textarea id="lavorazioni" rows="3" placeholder="Descrizione lavorazioni..."></textarea>
    <div class="small">Seleziona gli operai per cui vuoi inserire i dati:</div>
    ${checkboxes}
    <br><br>
    <button onclick="inserisciMultiplo()">Inserisci</button>
    <button onclick="renderInserimento()">Indietro</button>
    <div id="conferma"></div>
  `;
}

function inserisciMultiplo() {
  const cantiere = document.getElementById("nuovoCantiere").value || document.getElementById("cantiere").value;
  const lavorazioni = document.getElementById("lavorazioni").value;
  const selezionati = [...document.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
  if (!cantiere || !lavorazioni || selezionati.length === 0) return alert("Completa tutti i campi");
  const now = new Date().toISOString();
  selezionati.forEach(nome => {
    const payload = {
      nome: nome,
      username: currentUser.username,
      lavorazioni: lavorazioni,
      cantiere: cantiere,
      ora: now
    };
    inviaDati(payload);
  });
}

function renderVerifica() {
  fetch(backendUrl + "?checkPresenze=1&username=" + currentUser.username)
    .then(r => r.json())
    .then(data => {
      const contenitore = document.createElement("div");
      if (data.completo) {
        contenitore.innerHTML = `<div style="color:green; text-align:center; margin-top:1rem;">✅ Dati degli ultimi 7 giorni completi</div>`;
      } else {
        contenitore.innerHTML = `<div class="rosso" onclick="correggiDati()">❌ Negli ultimi 7 giorni mancano dati. Clicca per completare.</div>`;
      }
      document.body.appendChild(contenitore);
    });
}

function correggiDati() {
  const date = ["2025-06-07", "2025-06-09", "2025-06-11"];
  const checkboxes = date.map(d => `<label><input type="checkbox" value="${d}"> ${d}</label>`).join("<br>");
  document.getElementById("root").innerHTML = `
    <h2>Dati mancanti</h2>
    <div class="small">Seleziona una o più date mancanti:</div>
    ${checkboxes}
    <textarea id="lavorazioniMancanti" rows="3" placeholder="Lavorazioni svolte..."></textarea>
    <button onclick="inserisciRecupero()">Inserisci dati</button>
    <button onclick="renderInserimento()">Indietro</button>
  `;
}

function inserisciRecupero() {
  const lavorazioni = document.getElementById("lavorazioniMancanti").value;
  const selezionate = [...document.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
  if (!lavorazioni || selezionate.length === 0) return alert("Inserisci lavorazioni e seleziona almeno una data");
  const cantiere = prompt("Inserisci nome cantiere per queste date:");
  if (!cantiere) return;
  selezionate.forEach(data => {
    const payload = {
      nome: currentUser.nome,
      username: currentUser.username,
      lavorazioni: lavorazioni,
      cantiere: cantiere,
      ora: data + "T08:00:00"
    };
    inviaDati(payload);
  });
}

function inviaDati(payload) {
  const form = new URLSearchParams();
  form.append("payload", JSON.stringify(payload));
  fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString()
  }).then(res => res.json()).then(r => {
    document.getElementById("conferma").innerHTML = "<div class='rosso'>✅ Dato inserito</div>";
    setTimeout(() => { renderLogin(); }, 2000);
  });
}

renderLogin();

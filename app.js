
const operai = [
  { nome: "Mario Rossi", username: "mario", password: "1234" },
  { nome: "Luca Bianchi", username: "luca", password: "1234" },
  { nome: "Giulia Verdi", username: "giulia", password: "1234" }
];

let cantieri = [
  "Cantiere A - Macerata",
  "Cantiere B - Civitanova",
  "Cantiere C - Tolentino"
];

const backendUrl = "https://script.google.com/macros/s/AKfycbztrL-_qpimx__Mgo6ILq853OLogy_Pa8W8rl36ujpKXAJlBQ-p0NaMsWG84r4ZR8W3/exec";

let currentUser = null;

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
    renderMain();
  } else {
    alert("Credenziali errate");
  }
}

function renderMain() {
  let opzioni = cantieri.map(c => `<option value="${c}">${c}</option>`).join("");
  document.getElementById("root").innerHTML = `
    <h2>Ciao, ${currentUser.nome}</h2>
    <label for="cantiere">Scegli il cantiere:</label>
    <select id="cantiere">${opzioni}</select>
    <div class="small">oppure aggiungi nuovo:</div>
    <input id="newCantiere" placeholder="Nuovo cantiere" />
    <button onclick="aggiungiCantiere()">Aggiungi Cantiere</button>
    <button onclick="inserisci()">Inserisci</button>
  `;
}

function aggiungiCantiere() {
  const nuovo = document.getElementById("newCantiere").value.trim();
  if (nuovo && !cantieri.includes(nuovo)) {
    cantieri.push(nuovo);
    renderMain();
    document.getElementById("cantiere").value = nuovo;
  }
}

function inserisci() {
  const cantiere = document.getElementById("cantiere").value;
  const now = new Date().toISOString();
  const payload = {
    nome: currentUser.nome,
    username: currentUser.username,
    cantiere: cantiere,
    ora: now
  };
  const form = new URLSearchParams();
  form.append("payload", JSON.stringify(payload));
  fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString()
  }).then(res => res.json()).then(r => {
    alert("Registrazione effettuata alle " + now);
  });
}

renderLogin();

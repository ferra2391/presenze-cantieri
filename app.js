
const operai = [
  { nome: "Mario Rossi", username: "mario", password: "1234" },
  { nome: "Luca Bianchi", username: "luca", password: "1234" },
  { nome: "Giulia Verdi", username: "giulia", password: "1234" }
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
  document.getElementById("root").innerHTML = `
    <h2>Ciao, ${currentUser.nome}</h2>
    <input id="cantiere" placeholder="Cantiere" />
    <button onclick="checkIn()">Check-in</button>
    <button onclick="checkOut()">Check-out</button>
  `;
}

function invia(tipo) {
  const cantiere = document.getElementById("cantiere").value;
  const now = new Date().toISOString();
  const payload = {
    nome: currentUser.nome,
    username: currentUser.username,
    cantiere: cantiere,
    tipo: tipo,
    ora: now
  };
  const form = new URLSearchParams();
  form.append("payload", JSON.stringify(payload));
  fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString()
  }).then(res => res.json()).then(r => {
    alert(tipo + " registrato alle " + now);
    document.getElementById("cantiere").value = "";
  });
}

function checkIn() { invia("check-in"); }
function checkOut() { invia("check-out"); }

renderLogin();

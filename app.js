
const dipendenti = [
  { nome: "Mario Rossi", username: "mrossi", password: "1234" },
  { nome: "Luca Bianchi", username: "lbianchi", password: "abcd" },
  { nome: "Giulia Verdi", username: "gverdi", password: "pass1" },
  { nome: "Anna Neri", username: "aneri", password: "ciao1" },
  { nome: "Paolo Gallo", username: "pgallo", password: "work1" },
  { nome: "Franco Blu", username: "fblu", password: "blue1" },
  { nome: "Sara Rosa", username: "srosa", password: "rosa22" },
  { nome: "Elena Gialli", username: "egialli", password: "yellow" },
  { nome: "Marco Marrone", username: "mmarrone", password: "marrone" },
  { nome: "Laura Viola", username: "lviola", password: "viola1" }
];

const cantieri = [
  "Cantiere A - Macerata",
  "Cantiere B - Civitanova",
  "Cantiere C - Tolentino",
  "Cantiere D - Corridonia",
  "Cantiere E - Recanati"
];

const backendUrl = "https://script.google.com/macros/s/AKfycbzKvYR7zNlNnsoKj5wnOt7sh8QZQUJbUwb0PyuFywkejmMzZq7Sc5mslwsHlAcqD3FJ/exec";

let stato = {
  loggedIn: false,
  currentUser: null,
  checkInTime: null,
  checkOutTime: null,
  position: null
};

function getGPS(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      stato.position = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
      callback();
    }, callback);
  } else {
    callback();
  }
}

function renderLogin() {
  document.getElementById("root").innerHTML = `
    <h2>Login Operaio</h2>
    <input placeholder="Username" id="user">
    <input type="password" placeholder="Password" id="pass">
    <button onclick="login()">Accedi</button>
  `;
}

function login() {
  const u = document.getElementById("user").value;
  const p = document.getElementById("pass").value;
  const found = dipendenti.find(d => d.username === u && d.password === p);
  if (found) {
    stato.loggedIn = true;
    stato.currentUser = found;
    renderDashboard();
  } else {
    alert("Credenziali errate");
  }
}

function renderDashboard() {
  const nome = stato.currentUser.nome;
  let opzioni = cantieri.map(c => `<option value="${c}">${c}</option>`).join("");
  document.getElementById("root").innerHTML = `
    <h2>Benvenuto, ${nome}</h2>
    <label>Cantiere:</label>
    <select id="cantiere">${opzioni}</select><br><br>
    <button onclick="checkIn()" ${stato.checkInTime ? "disabled" : ""}>Inizio Turno</button>
    <button onclick="checkOut()" ${stato.checkOutTime || !stato.checkInTime ? "disabled" : ""}>Fine Turno</button>
  `;
}

function sendData(data) {
  fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(res => res.json()).then(r => console.log(r));
}

function checkIn() {
  getGPS(() => {
    const now = new Date().toISOString();
    stato.checkInTime = now;
    sendData({
      nome: stato.currentUser.nome,
      username: stato.currentUser.username,
      cantiere: document.getElementById("cantiere").value,
      checkInTime: now,
      checkInLat: stato.position?.lat,
      checkInLng: stato.position?.lng
    });
    alert("Check-in alle " + now);
    renderDashboard();
  });
}

function checkOut() {
  getGPS(() => {
    const now = new Date().toISOString();
    stato.checkOutTime = now;
    sendData({
      nome: stato.currentUser.nome,
      username: stato.currentUser.username,
      cantiere: document.getElementById("cantiere").value,
      checkOutTime: now,
      checkOutLat: stato.position?.lat,
      checkOutLng: stato.position?.lng
    });
    alert("Check-out alle " + now);
    renderDashboard();
  });
}

renderLogin();

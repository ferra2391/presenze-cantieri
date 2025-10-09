// =========================================================
// MAIN.JS - LOGICA DELL'APP PRESENZE CON FIREBASE
// =========================================================

// === 1. IMPORTAZIONI FIREBASE ===
// Importiamo le funzioni che ci servono da Firebase
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
// Importiamo 'auth' e 'db' dal nostro file di configurazione
import { auth, db } from './firebase-init.js';

// === 2. GUARDIANO DELL'AUTENTICAZIONE ===
// Questa è la funzione più importante. Si attiva al caricamento della pagina
// e controlla se l'utente ha effettuato l'accesso.
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    // L'UTENTE È LOGGATO
    currentUser = user; // Salviamo i dati dell'utente per usarli dopo
    console.log("Utente autenticato:", user.email);

    // Mostra il container dell'app
    document.getElementById('appContainer').style.display = 'block';

    // Aggiorna l'header con l'email dell'utente
    document.getElementById('userName').textContent = user.email;

    // Aggiungi la funzionalità al pulsante di logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
      signOut(auth).then(() => {
        console.log('Logout effettuato');
        window.location.href = 'login.html'; // Torna alla pagina di login
      }).catch((error) => {
        console.error('Errore durante il logout:', error);
      });
    });

    // Avvia l'app vera e propria
    initializeOriginalApp();

  } else {
    // L'UTENTE NON È LOGGATO
    console.log("Nessun utente autenticato. Reindirizzamento al login.");
    // Reindirizza l'utente alla pagina di login
    window.location.href = 'login.html';
  }
});


// === 3. FUNZIONE DI SALVATAGGIO DATI SU FIRESTORE ===
// Sostituiamo la vecchia funzione `submitPresence`
function submitPresence() {
  if (!currentUser) {
    alert("Errore: nessun utente loggato. Impossibile salvare.");
    return;
  }

  // Crea l'oggetto 'payload' con tutti i dati da salvare
  const payload = {
    // Dati dell'utente che sta registrando la presenza
    userId: currentUser.uid,
    userEmail: currentUser.email,
    // Dati della registrazione
    dataISO: fmtISO(selectedDate),
    orari: buildOrariString(),
    ore: document.getElementById('summaryHours').textContent.replace('h', ''),
    note: (document.getElementById('notesInput').value || '').trim(),
    lavori: workState.map(w => ({
      cantiere: (w.siteSelect || w.siteManual || '-'),
      lavorazione: (w.work || '-')
    })),
    // Data di salvataggio nel database
    createdAt: serverTimestamp()
  };

  // Salva il documento nella collezione "presenze" di Firestore
  addDoc(collection(db, "presenze"), payload)
    .then(docRef => {
      console.log("Presenza salvata con ID:", docRef.id);
      // Mostra la modale di successo
      document.getElementById('successOverlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('successOverlay').classList.remove('show');
        resetToFirstPage(); // Resetta l'app alla prima pagina
      }, 1500);
    })
    .catch(error => {
      console.error("Errore nel salvataggio su Firestore:", error);
      alert("Si è verificato un errore nel salvataggio. Riprova.");
    });
}


// === 4. CODICE ORIGINALE DELL'APPLICAZIONE ===
// Tutto il tuo codice precedente, ora è qui.

let currentPage = 1;
let selectedDate = new Date();
const slotEnabled = { morning: true, afternoon: true };
let workState = [];

const SITE_OPTIONS = [
  'Condominio Aurora',
  'Scuola Media Verdi',
  'Capannone Logistica B12',
  'Villa Colli Sud',
  'Ristrutturazione Via Roma 21'
];

function initializeOriginalApp() {
  applyAutoScale();
  initDateSelector();
  renderMonthList(); // Sostituiremo il mock con dati reali
  setupMonthToggle();
  workState = [newWorkItem()];
  renderWorkItems();
  updateTimes();
}

function pad2(n) { return String(n).padStart(2, '0'); }
function fmtISO(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function fmtDateHuman(d) { return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }); }
function toMinutes(hhmm) { if (!hhmm) return 0; const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
function diffHours(s, e) { const a = toMinutes(s), b = toMinutes(e); return Math.max(0, (b - a)) / 60; }
function clampTime(val, min, max) {
  const v = toMinutes(val), mi = toMinutes(min), ma = toMinutes(max);
  if (v < mi) return min;
  if (v > ma) return max;
  return val;
}
function isWeekend(d) { const day = d.getDay(); return day === 0 || day === 6; }
function easterDate(year) { const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1; return new Date(year, month - 1, day); }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function sameYMD(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function isItalianHoliday(d) {
  const y = d.getFullYear();
  const fixed = [[1, 1], [1, 6], [4, 25], [5, 1], [6, 2], [8, 15], [11, 1], [12, 8], [12, 25], [12, 26]];
  for (const [mm, dd] of fixed) { if (sameYMD(d, new Date(y, mm - 1, dd))) return true; }
  const easter = easterDate(y);
  return sameYMD(d, addDays(easter, 1));
}
function applyAutoScale() {
  const base = 420, w = Math.max(320, Math.min(window.innerWidth, 1024));
  const scale = Math.max(1, Math.min(1.35, w / base));
  document.documentElement.style.setProperty('--zoom', scale.toFixed(3));
}
function initDateSelector() {
  const selector = document.getElementById('dateSelector'); selector.innerHTML = '';
  const today = new Date(); const dayLetter = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const dayDiv = document.createElement('div');
    dayDiv.className = 'date-day'; dayDiv.dataset.date = fmtISO(d);
    if (isWeekend(d)) dayDiv.classList.add('weekend');
    if (isItalianHoliday(d)) dayDiv.classList.add('holiday');
    if (i === 0) { dayDiv.classList.add('today', 'selected'); selectedDate = today; }
    dayDiv.innerHTML = `<div class="day-name">${dayLetter[d.getDay()]}</div><div class="day-num">${d.getDate()}</div>`;
    dayDiv.onclick = () => selectDate(dayDiv, d);
    selector.appendChild(dayDiv);
  }
  const last = selector.lastElementChild; if (last && last.scrollIntoView) { last.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'end' }); }
  updateSummary();
}
function selectDate(el, date) {
  document.querySelectorAll('.date-day').forEach(d => d.classList.remove('selected'));
  el.classList.add('selected'); selectedDate = date; updateSummary();
}
function updateTimes() {
  const mStartEl = document.getElementById('mStart');
  const mEndEl = document.getElementById('mEnd');
  const pStartEl = document.getElementById('pStart');
  const pEndEl = document.getElementById('pEnd');
  mStartEl.value = clampTime(mStartEl.value, mStartEl.min, mStartEl.max);
  mEndEl.value = clampTime(mEndEl.value, mEndEl.min, mEndEl.max);
  pStartEl.value = clampTime(pStartEl.value, pStartEl.min, pStartEl.max);
  pEndEl.value = clampTime(pEndEl.value, pEndEl.min, pEndEl.max);
  document.getElementById('morningText').textContent = `${mStartEl.value} - ${mEndEl.value}`;
  document.getElementById('afternoonText').textContent = `${pStartEl.value} - ${pEndEl.value}`;
  let hours = 0;
  if (slotEnabled.morning) hours += diffHours(mStartEl.value, mEndEl.value);
  if (slotEnabled.afternoon) hours += diffHours(pStartEl.value, pEndEl.value);
  document.getElementById('totalHours').textContent = hours.toFixed(1) + 'h';
  updateSummary();
}
function buildOrariString() {
  const ms = document.getElementById('mStart').value, me = document.getElementById('mEnd').value;
  const ps = document.getElementById('pStart').value, pe = document.getElementById('pEnd').value;
  return `${ms}-${me} + ${ps}-${pe}`;
}
function newWorkItem() { return { id: crypto.randomUUID(), siteSelect: '', siteManual: '', work: '' }; }
function renderWorkItems() {
  const wrap = document.getElementById('workItems'); wrap.innerHTML = '';
  workState.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'work-item'; el.dataset.id = item.id;
    el.innerHTML = `
      <div class="work-item-head">
        <div class="work-item-title">Cantiere ${idx + 1}</div>
        ${idx > 0 ? `<button class="work-item-remove" onclick="removeWorkItem('${item.id}')">Rimuovi</button>` : ''}
      </div>
      <div class="input-group">
        <span class="input-icon">🏷️</span>
        <select onchange="onWorkSelectChange('${item.id}', this.value)">
          <option value="">— Seleziona cantiere —</option>
          ${SITE_OPTIONS.map(s => `<option value="${s}" ${item.siteSelect === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="input-group">
        <span class="input-icon">🔍</span>
        <input type="text" placeholder="Oppure scrivi il nome del cantiere..." value="${item.siteManual.replace(/"/g, '&quot;')}" oninput="onWorkManualChange('${item.id}', this.value)">
      </div>
      <div class="input-group">
        <span class="input-icon">📝</span>
        <textarea placeholder="Descrivi la lavorazione..." oninput="onWorkTextChange('${item.id}', this.value)">${item.work}</textarea>
      </div>
    `;
    wrap.appendChild(el);

    // Sincronizza il valore del select dopo aver creato l'elemento
    const selectEl = el.querySelector('select');
    if (item.siteSelect) {
      selectEl.value = item.siteSelect;
    }
  });
  document.getElementById('addWorkBtn').disabled = (workState.length >= 3);
  updateSummary();
}
function addWorkItem() { if (workState.length >= 3) return; workState.push(newWorkItem()); renderWorkItems(); }
function removeWorkItem(id) { workState = workState.filter(w => w.id !== id); if (workState.length === 0) workState.push(newWorkItem()); renderWorkItems(); }
function onWorkSelectChange(id, val) { const it = workState.find(w => w.id === id); if (!it) return; it.siteSelect = val || ''; if (val) { it.siteManual = ''; renderWorkItems(); } updateSummary(); }
function onWorkManualChange(id, val) { const it = workState.find(w => w.id === id); if (!it) return; it.siteManual = val; if (val.trim()) { it.siteSelect = ''; renderWorkItems(); } updateSummary(); }
function onWorkTextChange(id, val) { const it = workState.find(w => w.id === id); if (!it) return; it.work = val; updateSummary(); }
function updateSummary() {
  document.getElementById('summaryDate').textContent = fmtDateHuman(selectedDate);
  document.getElementById('summaryTime').textContent = buildOrariString();
  const box = document.getElementById('summaryWorks'); box.innerHTML = '';
  workState.forEach((it, idx) => {
    const name = (it.siteSelect || it.siteManual || '-').trim() || '-';
    const work = (it.work || '-').trim() || '-';
    const div = document.createElement('div');
    div.className = 'summary-work';
    div.innerHTML = `<div class="line"><span class="label">Cantiere ${idx + 1}</span><span class="value">${name}</span></div><div class="line"><span class="label">Lavorazione</span><span class="value">${work}</span></div>`;
    box.appendChild(div);
  });
  const notes = (document.getElementById('notesInput')?.value || '').trim();
  document.getElementById('summaryNotes').textContent = notes || '-';
  const ms = document.getElementById('mStart').value, me = document.getElementById('mEnd').value;
  const ps = document.getElementById('pStart').value, pe = document.getElementById('pEnd').value;
  let hours = 0; hours += diffHours(ms, me); hours += diffHours(ps, pe);
  document.getElementById('summaryHours').textContent = hours.toFixed(1) + 'h';
}
function nextPage(p) {
  document.querySelector('.page.active').classList.remove('active');
  document.getElementById(`page${p}`).classList.add('active');
  currentPage = p;
  document.querySelectorAll('.step').forEach((s, i) => s.classList.toggle('active', i <= p - 1));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function prevPage(p) { nextPage(p); }
function resetToFirstPage() {
    // Resetta lo stato alla prima pagina
    nextPage(1);
    // Svuota i campi
    document.getElementById('notesInput').value = '';
    // Resetta lo stato dei cantieri a un solo item vuoto
    workState = [newWorkItem()];
    renderWorkItems();
    // Resetta gli orari ai valori di default
    document.getElementById('mStart').value = "08:00";
    document.getElementById('mEnd').value   = "12:00";
    document.getElementById('pStart').value = "13:00";
    document.getElementById('pEnd').value   = "17:00";
    updateTimes();
    // Resetta la data a oggi
    initDateSelector();
}
async function renderMonthList() {
    if (!currentUser) return;

    const list = document.getElementById('monthList');
    list.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">Caricamento presenze...</p>';

    // Calcola inizio e fine del mese corrente
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // Crea la query per Firestore
    const q = query(collection(db, "presenze"),
        where("userId", "==", currentUser.uid),
        where("createdAt", ">=", startDate),
        where("createdAt", "<=", endDate)
    );
    
    const querySnapshot = await getDocs(q);
    let rows = [];
    querySnapshot.forEach((doc) => {
        rows.push(doc.data());
    });

    // Ordina i risultati per data, dal più recente al più vecchio
    rows.sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));

    list.innerHTML = ''; // Pulisci la lista

    if (rows.length === 0) {
        list.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">Nessuna presenza registrata questo mese.</p>';
        return;
    }

    const mese = now.toLocaleDateString('it-IT', { month: 'long' });
    const titleEl = document.getElementById('monthTitle');
    if (titleEl) titleEl.textContent = `📆 Presenze di ${mese}`;
    
    rows.forEach(r => {
        const d = new Date(r.dataISO);
        const item = document.createElement('div');
        const cls = ['month-item'];
        if (isWeekend(d)) cls.push('weekend');
        if (isItalianHoliday(d)) cls.push('holiday');
        item.className = cls.join(' ');
        
        // Prende il nome del primo cantiere, se esiste
        const primoCantiere = r.lavori && r.lavori.length > 0 ? r.lavori[0].cantiere : 'N/D';
        const primaLavorazione = r.lavori && r.lavori.length > 0 ? r.lavori[0].lavorazione : 'N/D';

        item.innerHTML = `
            <div class="mi-left">
                <div class="mi-date">
                    <div>${pad2(d.getDate())}</div>
                    <div style="font-size:11px;color:var(--text-secondary)">${d.toLocaleDateString('it-IT', { month: 'short' })}</div>
                </div>
                <div class="mi-main">
                    <div class="mi-cant">${primoCantiere}</div>
                    <div class="mi-lav">${primaLavorazione}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
                <div class="mi-ore">${r.ore}h</div>
                <button class="mi-btn">Usa</button>
            </div>`;
        item.querySelector('.mi-btn').onclick = () => applyTemplateFromMonth(r);
        list.appendChild(item);
    });
}
function setupMonthToggle() {
  const toggle = document.getElementById('monthToggle');
  const arrow = document.getElementById('monthToggleArrow');
  const list = document.getElementById('monthList');
  list.classList.remove('open');
  toggle.addEventListener('click', () => {
    const isOpen = list.classList.toggle('open');
    arrow.textContent = isOpen ? '▲' : '▼';
    // Se apriamo, ricarichiamo i dati
    if (isOpen) {
        renderMonthList();
    }
  });
}
function applyTemplateFromMonth(r) {
  // orari
  const parts = r.orari.split('+').map(s => s.trim());
  const [m, p] = parts;
  if (m) { const [ms, me] = m.split('-'); document.getElementById('mStart').value = ms || "08:00"; document.getElementById('mEnd').value = me || "12:00"; }
  if (p) { const [ps, pe] = p.split('-'); document.getElementById('pStart').value = ps || "13:00"; document.getElementById('pEnd').value = pe || "17:00"; }
  updateTimes();
  
  // cantieri e lavorazioni
  if (r.lavori && r.lavori.length > 0) {
      workState = r.lavori.map(l => ({
          id: crypto.randomUUID(),
          siteSelect: SITE_OPTIONS.includes(l.cantiere) ? l.cantiere : '',
          siteManual: SITE_OPTIONS.includes(l.cantiere) ? '' : l.cantiere,
          work: l.lavorazione
      }));
  } else {
      workState = [newWorkItem()];
  }
  renderWorkItems();
  
  // note
  document.getElementById('notesInput').value = r.note || '';

  // Chiudi il toggle e vai alla pagina 2
  document.getElementById('monthList').classList.remove('open');
  document.getElementById('monthToggleArrow').textContent = '▼';
  nextPage(2);
}

// === 5. ESPORTAZIONE FUNZIONI GLOBALI ===
// Poiché usiamo un modulo, le funzioni chiamate da onclick="" nell'HTML
// devono essere "esposte" sull'oggetto window.
window.nextPage = nextPage;
window.prevPage = prevPage;
window.updateTimes = updateTimes;
window.addWorkItem = addWorkItem;
window.removeWorkItem = removeWorkItem;
window.onWorkSelectChange = onWorkSelectChange;
window.onWorkManualChange = onWorkManualChange;
window.onWorkTextChange = onWorkTextChange;
window.updateSummary = updateSummary;
window.submitPresence = submitPresence;

// Inizializza l'auto-scaling all'avvio
window.addEventListener('resize', applyAutoScale, { passive: true });
window.addEventListener('orientationchange', applyAutoScale);


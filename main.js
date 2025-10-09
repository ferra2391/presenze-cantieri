// Importa le funzioni di Firebase necessarie
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { auth, db } from './firebase-init.js';

// Riferimenti agli elementi UI
const appContainer = document.getElementById('appContainer');
const userNameEl = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

// =========================================================
// STATO GLOBALE DELL'APP
// =========================================================
let currentPage = 1;
let selectedDate = new Date();
let workState = [];
let currentUser = null;

// =========================================================
// GESTIONE AUTENTICAZIONE (IL "GUARDIANO")
// =========================================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    // L'utente è loggato.
    currentUser = user;
    userNameEl.textContent = user.email;
    appContainer.style.display = 'block'; // Mostra l'app
    initializeAppUI();
  } else {
    // L'utente non è loggato.
    window.location.href = 'login.html'; // Reindirizza al login
  }
});

logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    console.log('Utente disconnesso');
  }).catch((error) => {
    console.error('Errore durante il logout:', error);
  });
});

// =========================================================
// FUNZIONI DI INIZIALIZZAZIONE
// =========================================================
function initializeAppUI() {
  applyAutoScale();
  initDateSelector();
  renderMonthList(currentUser.uid); // Carica le presenze reali dell'utente
  setupMonthToggle();
  workState = [newWorkItem()];
  renderWorkItems();
  updateTimes();
}

// =========================================================
// UTILS DATE & TIME (INVARIATO)
// =========================================================
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

// =========================================================
// UI & LOGICA DELL'APP
// =========================================================
function applyAutoScale() { const base = 420, w = Math.max(320, Math.min(window.innerWidth, 1024)); const scale = Math.max(1, Math.min(1.35, w / base)); document.documentElement.style.setProperty('--zoom', scale.toFixed(3)); }
window.addEventListener('resize', applyAutoScale, { passive: true });

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
  updateSummary();
}
function selectDate(el, date) { document.querySelectorAll('.date-day').forEach(d => d.classList.remove('selected')); el.classList.add('selected'); selectedDate = date; updateSummary(); }

function updateTimes() {
  const mStartEl = document.getElementById('mStart'); const mEndEl = document.getElementById('mEnd');
  const pStartEl = document.getElementById('pStart'); const pEndEl = document.getElementById('pEnd');
  mStartEl.value = clampTime(mStartEl.value, mStartEl.min, mStartEl.max);
  mEndEl.value = clampTime(mEndEl.value, mEndEl.min, mEndEl.max);
  pStartEl.value = clampTime(pStartEl.value, pStartEl.min, pStartEl.max);
  pEndEl.value = clampTime(pEndEl.value, pEndEl.min, pEndEl.max);
  document.getElementById('morningText').textContent = `${mStartEl.value} - ${mEndEl.value}`;
  document.getElementById('afternoonText').textContent = `${pStartEl.value} - ${pEndEl.value}`;
  let hours = 0;
  hours += diffHours(mStartEl.value, mEndEl.value);
  hours += diffHours(pStartEl.value, pEndEl.value);
  document.getElementById('totalHours').textContent = hours.toFixed(1) + 'h';
  updateSummary();
}
function buildOrariString() { return `${document.getElementById('mStart').value}-${document.getElementById('mEnd').value} + ${document.getElementById('pStart').value}-${document.getElementById('pEnd').value}`; }

const SITE_OPTIONS = ['Condominio Aurora', 'Scuola Media Verdi', 'Capannone Logistica B12', 'Villa Colli Sud', 'Ristrutturazione Via Roma 21'];
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
      </div>`;
    wrap.appendChild(el);
  });
  document.getElementById('addWorkBtn').style.display = (workState.length >= 3) ? 'none' : 'block';
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
  document.getElementById('summaryHours').textContent = document.getElementById('totalHours').textContent;
}

function nextPage(p) {
  document.querySelector('.page.active').classList.remove('active');
  document.getElementById(`page${p}`).classList.add('active');
  currentPage = p;
  document.querySelectorAll('.step').forEach((s, i) => s.classList.toggle('active', i <= p - 1));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (p === 4) updateSummary();
}
function prevPage(p) { nextPage(p); }

// =========================================================
// NUOVA GESTIONE "PRESENZE MESE" CON FIRESTORE
// =========================================================
async function renderMonthList(userId) {
  const list = document.getElementById('monthList');
  list.innerHTML = `<div class="month-item" style="justify-content:center;">Caricamento presenze...</div>`;
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  document.getElementById('monthTitle').textContent = `📆 Presenze di ${today.toLocaleDateString('it-IT', { month: 'long' })}`;

  try {
    const presenzeRef = collection(db, 'presenze');
    const q = query(presenzeRef,
      where("userId", "==", userId),
      where("createdAt", ">=", startOfMonth)
    );
    const querySnapshot = await getDocs(q);
    const presenze = [];
    querySnapshot.forEach((doc) => presenze.push({ id: doc.id, ...doc.data() }));
    presenze.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

    if (presenze.length === 0) {
      list.innerHTML = `<div class="month-item" style="justify-content:center;">Nessuna presenza registrata questo mese.</div>`;
      return;
    }

    list.innerHTML = '';
    presenze.forEach(r => {
      const displayDate = r.createdAt.toDate();
      const primoLavoro = r.lavori && r.lavori.length > 0 ? r.lavori[0] : { cantiere: '-', lavorazione: '-' };
      const item = document.createElement('div');
      const cls = ['month-item'];
      if (isWeekend(displayDate)) cls.push('weekend');
      if (isItalianHoliday(displayDate)) cls.push('holiday');
      item.className = cls.join(' ');
      item.innerHTML = `
        <div class="mi-left">
          <div class="mi-date">
            <div>${pad2(displayDate.getDate())}</div>
            <div style="font-size:11px;color:var(--text-secondary)">${displayDate.toLocaleDateString('it-IT', { month: 'short' })}</div>
          </div>
          <div class="mi-main">
            <div class="mi-cant">${primoLavoro.cantiere}</div>
            <div class="mi-lav">${primoLavoro.lavorazione}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="mi-ore">${r.ore}h</div>
          <button class="mi-btn">Usa</button>
        </div>`;
      item.querySelector('.mi-btn').onclick = () => applyTemplateFromMonth(r);
      list.appendChild(item);
    });
  } catch (error) {
    console.error("Errore nel caricare le presenze:", error);
    list.innerHTML = `<div class="month-item" style="justify-content:center; color: var(--danger);">Errore nel caricamento.</div>`;
  }
}

function setupMonthToggle() {
  const toggle = document.getElementById('monthToggle');
  const arrow = document.getElementById('monthToggleArrow');
  const list = document.getElementById('monthList');
  list.classList.remove('open');
  toggle.addEventListener('click', () => {
    const isOpen = list.classList.toggle('open');
    arrow.textContent = isOpen ? '▲' : '▼';
  });
}

function applyTemplateFromMonth(data) {
  const dParts = data.dataISO.split('-');
  selectedDate = new Date(+dParts[0], +dParts[1] - 1, +dParts[2]);
  document.querySelectorAll('.date-day').forEach(dd => dd.classList.toggle('selected', dd.dataset.date === data.dataISO));
  
  const parts = data.orari.split('+').map(s => s.trim());
  const [m, p] = parts;
  if (m) { const [ms, me] = m.split('-'); document.getElementById('mStart').value = ms; document.getElementById('mEnd').value = me; }
  if (p) { const [ps, pe] = p.split('-'); document.getElementById('pStart').value = ps; document.getElementById('pEnd').value = pe; }
  updateTimes();
  
  workState = data.lavori.map(l => {
    const newWork = newWorkItem();
    const isPredefined = SITE_OPTIONS.includes(l.cantiere);
    newWork.siteSelect = isPredefined ? l.cantiere : '';
    newWork.siteManual = isPredefined ? '' : l.cantiere;
    newWork.work = l.lavorazione;
    return newWork;
  });
  if (workState.length === 0) workState.push(newWorkItem());

  renderWorkItems();
  nextPage(2);
}

// =========================================================
// SUBMIT FINALE SU FIRESTORE
// =========================================================
function submitPresence() {
  if (!currentUser) {
    alert("Errore: nessun utente loggato.");
    return;
  }
  const payload = {
    userId: currentUser.uid,
    userEmail: currentUser.email,
    dataISO: fmtISO(selectedDate),
    orari: buildOrariString(),
    ore: document.getElementById('totalHours').textContent.replace('h', ''),
    note: (document.getElementById('notesInput').value || '').trim(),
    lavori: workState.map(w => ({
      cantiere: (w.siteSelect || w.siteManual || '-'),
      lavorazione: (w.work || '-')
    })).filter(l => l.cantiere !== '-'),
    createdAt: serverTimestamp()
  };

  if (payload.lavori.length === 0) {
    alert("Devi specificare almeno un cantiere.");
    return;
  }

  const confirmBtn = document.querySelector('#page4 .btn-success');
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<span>Salvataggio...</span>';

  addDoc(collection(db, "presenze"), payload)
    .then(docRef => {
      console.log("Presenza salvata con ID:", docRef.id);
      document.getElementById('successOverlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('successOverlay').classList.remove('show');
        resetToPage1();
        renderMonthList(currentUser.uid); // Aggiorna la lista con il nuovo dato
      }, 1500);
    })
    .catch(error => {
      console.error("Errore nel salvataggio:", error);
      alert("Errore nel salvataggio. Riprova.");
    })
    .finally(() => {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<span>✓</span>Conferma';
    });
}

function resetToPage1() {
  // Resetta lo stato
  selectedDate = new Date();
  workState = [newWorkItem()];
  document.getElementById('notesInput').value = '';
  
  // Resetta la UI
  initDateSelector();
  renderWorkItems();
  updateTimes();
  nextPage(1);
}


// Rendi le funzioni accessibili dall'HTML
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


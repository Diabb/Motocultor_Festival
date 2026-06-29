// ══════════════════════════════════
//  STATE MANAGEMENT
// ══════════════════════════════════
let favorites = [];
try {
  favorites = JSON.parse(localStorage.getItem('moto_favs') || '[]');
} catch (e) {
  favorites = [];
}

// Initialisation dynamique à partir de FESTIVAL_DATA (chargé via data.js)
let CURRENT_YEAR = localStorage.getItem('moto_year') || "2026";
if (!FESTIVAL_DATA[CURRENT_YEAR]) CURRENT_YEAR = "2026";

let YEAR_DATA    = FESTIVAL_DATA[CURRENT_YEAR];
let STAGES       = YEAR_DATA.stages;
let LINE_UP      = YEAR_DATA.lineup;
let DAY_DATES    = YEAR_DATA.dates;

let currentDay = 'thursday';
let currentStage = 'all';
let currentView = 'lineup';

// ══════════════════════════════════
//  HELPERS
// ══════════════════════════════════
function saveState() { localStorage.setItem('moto_favs', JSON.stringify(favorites)); }
function isFav(id) { return favorites.includes(id); }

function getSortWeight(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const mins = h * 60 + m;
  return h < 6 ? mins + (24 * 60) : mins;
}

function updateBadge() {
  const badge = document.getElementById('fav-badge');
  const n = favorites.length;
  badge.textContent = n;
  badge.style.display = n ? 'flex' : 'none';
}

function stageClass(s) {
  if (s === 'Dave Mustage') return 'keltia';
  if (s === 'Supositor Stage') return 'dolmen';
  if (s === 'Massey Ferguscène') return 'menhir';
  if (s === 'Bruce Dickinscène') return 'souterrain';
  return 'main';
}

function allSets() { return Object.values(LINE_UP).flat(); }
function findSet(id) { return allSets().find(s => s.id === id); }

// ══════════════════════════════════
//  RENDER ENGINE (Optimisé)
// ══════════════════════════════════
function renderSetCard(set) {
  const fav = isFav(set.id);
  const sc = stageClass(set.stage);
  return `
    <div class="set-card ${fav ? 'is-fav' : ''}" data-id="${set.id}">
      ${fav ? '<div class="crack"></div>' : ''}
      <div class="set-time">${set.time}</div>
      <div class="set-info">
        <div class="set-name">${set.name}</div>
        <div class="set-meta">
          <span class="stage-dot ${sc}"></span>
          <span class="stage-label">${set.stage}</span>
          <span class="genre-tag">${set.genre}</span>
        </div>
      </div>
      <button class="fav-btn ${fav ? 'active' : ''}" data-id="${set.id}" aria-label="Favori">
        <svg viewBox="0 0 24 24" fill="${fav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>`;
}

function renderDay(day) {
  const sets = (LINE_UP[day] || []).filter(s => currentStage === 'all' || s.stage === currentStage).sort((a, b) => getSortWeight(a.time) - getSortWeight(b.time));
  const panel = document.getElementById(`panel-${day}`);
  if (panel) panel.innerHTML = sets.map(renderSetCard).join('');
}

// ══════════════════════════════════
//  INITIALISATION
// ══════════════════════════════════
(function init() {
  const yearSelect = document.getElementById('year-select');
  if (yearSelect) yearSelect.value = CURRENT_YEAR;
  
  // Rendu initial
  Object.keys(LINE_UP).forEach(renderDay);
  updateBadge();
  
  // Enregistrement du Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
// ════════════════════════════════════════════════════
//  MOTOCULTOR FESTIVAL — GESTION D'ÉTAT (STATE)
// ════════════════════════════════════════════════════
let favorites = [];
try {
  favorites = JSON.parse(localStorage.getItem('moto_favs') || '[]');
} catch (e) {
  console.error("Impossible de charger les favoris depuis le stockage local :", e);
  favorites = [];
}

let CURRENT_YEAR = localStorage.getItem('moto_year') || "2026";
if (!FESTIVAL_DATA[CURRENT_YEAR]) CURRENT_YEAR = "2026";

let YEAR_DATA    = FESTIVAL_DATA[CURRENT_YEAR];
let STAGES       = YEAR_DATA.stages;
let LINE_UP      = YEAR_DATA.lineup;
let DAY_DATES    = YEAR_DATA.dates;

let currentDay = 'thursday';
let currentStage = 'all';
let currentView = 'lineup';

// ════════════════════════════════════════════════════
//  FONCTIONS D'ASSISTANCE (HELPERS)
// ════════════════════════════════════════════════════
function saveState() { 
  try {
    localStorage.setItem('moto_favs', JSON.stringify(favorites)); 
  } catch (e) {
    console.error("Échec de la sauvegarde des favoris :", e);
  }
}

function isFav(id) { return favorites.includes(id); }

function getSortWeight(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const mins = h * 60 + m;
  return h < 6 ? mins + (24 * 60) : mins; // Gestion des concerts après minuit
}

function updateBadge() {
  const badge = document.getElementById('fav-badge');
  if (badge) {
    const n = favorites.length;
    badge.textContent = n;
    badge.style.display = n ? 'flex' : 'none';
  }
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

// Sélection automatique du jour du festival en fonction de la date système
function autoSelectDay() {
  const todayStr = new Date().toISOString().split('T')[0];
  for (const [day, date] of Object.entries(DAY_DATES)) {
    if (date === todayStr) {
      currentDay = day;
      break;
    }
  }
}

// ════════════════════════════════════════════════════
//  MOTEUR DE RENDU (RENDER ENGINE)
// ════════════════════════════════════════════════════
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
  const sets = (LINE_UP[day] || [])
    .filter(s => currentStage === 'all' || s.stage === currentStage)
    .sort((a, b) => getSortWeight(a.time) - getSortWeight(b.time));
    
  const panel = document.getElementById(`panel-${day}`);
  if (panel) {
    if (sets.length > 0) {
      panel.innerHTML = sets.map(renderSetCard).join('');
    } else {
      panel.innerHTML = `<div class="empty"><p>Aucun groupe prévu pour cette sélection.</p></div>`;
    }
  }
}

function renderFavorites() {
  const favPanel = document.getElementById('fav-panel');
  if (!favPanel) return;
  
  if (favorites.length === 0) {
    favPanel.innerHTML = `
      <div class="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <p>Aucun favori pour le moment. Cliquez sur l'étoile d'un groupe pour l'ajouter !</p>
      </div>`;
    return;
  }
  
  let html = '';
  const daysOrder = ['thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = { thursday: 'Jeudi 13', friday: 'Vendredi 14', saturday: 'Samedi 15', sunday: 'Dimanche 16' };
  
  daysOrder.forEach(day => {
    const daySets = (LINE_UP[day] || []).filter(s => isFav(s.id)).sort((a, b) => getSortWeight(a.time) - getSortWeight(b.time));
    if (daySets.length > 0) {
      html += `<div class="fav-day-title">${dayLabels[day]}</div>`;
      html += daySets.map(renderSetCard).join('');
    }
  });
  
  favPanel.innerHTML = html;
}

function renderGrid(day) {
  const gridPanel = document.getElementById('grid-panel');
  if (!gridPanel) return;
  
  const stagesList = ["Dave Mustage", "Supositor Stage", "Massey Ferguscène", "Bruce Dickinscène"];
  const startHour = 11; // 11h00 du matin
  const endHour = 27;   // 03h00 du matin (24 + 3)
  const rowHeight = 60; // 60px par heure (soit 1px par minute)
  const totalHeight = (endHour - startHour) * rowHeight;
  
  let html = `<div class="grid-wrap">`;
  
  // Rendu des en-têtes de colonnes (Scènes)
  html += `<div class="grid-stages"><div class="grid-stage-label">Heures</div>`;
  stagesList.forEach(stg => {
    const cls = STAGES[stg]?.cls || 'main';
    html += `<div class="grid-stage-label ${cls}" style="border: 1px solid var(--border); background: var(--surface);">${stg.replace(' Stage', '').replace('cène', '.')}</div>`;
  });
  html += `</div>`;
  
  html += `<div class="grid-timeline" style="height: ${totalHeight}px;">`;
  
  // Tracé des lignes repères horaires
  for (let h = startHour; h <= endHour; h++) {
    const displayHour = h >= 24 ? h - 24 : h;
    const topPos = (h - startHour) * rowHeight;
    html += `
      <div class="grid-hour-label" style="top: ${topPos}px;">${String(displayHour).padStart(2, '0')}:00</div>
      <div class="grid-hour-rule" style="top: ${topPos}px;"></div>`;
  }
  
  // Rendu des colonnes de concerts
  html += `<div class="grid-cols" style="height: ${totalHeight}px;"><div></div>`;
  
  stagesList.forEach(stg => {
    html += `<div class="grid-stage-col">`;
    const sets = (LINE_UP[day] || []).filter(s => s.stage === stg);
    
    sets.forEach(set => {
      const [sh, sm] = set.time.split(':').map(Number);
      const [eh, em] = set.end.split(':').map(Number);
      
      let startMins = sh * 60 + sm;
      if (sh < startHour) startMins += 24 * 60;
      
      let endMins = eh * 60 + em;
      if (eh < startHour) endMins += 24 * 60;
      
      const topPx = ((startMins - startHour * 60) / 60) * rowHeight;
      const heightPx = ((endMins - startMins) / 60) * rowHeight;
      
      const fav = isFav(set.id);
      
      html += `
        <div class="grid-set ${fav ? 'is-fav' : ''}" data-id="${set.id}" style="top: ${topPx}px; height: ${heightPx}px; background: var(--card); border: 1px solid var(--border); border-left: 4px solid ${STAGES[stg]?.color || 'var(--teal)'};">
          <div class="grid-set-name">${set.name}</div>
          <div class="grid-set-time">${set.time}</div>
        </div>`;
    });
    html += `</div>`;
  });
  
  html += `</div></div></div>`;
  gridPanel.innerHTML = html;
}

// ════════════════════════════════════════════════════
//  GESTION DES VUES & MODALS (INTERACTIONS)
// ════════════════════════════════════════════════════
function switchView(view) {
  currentView = view;
  
  // Cacher tous les modules principaux
  document.querySelectorAll('.day-panel').forEach(p => p.style.display = 'none');
  document.getElementById('search-results').style.display = 'none';
  document.getElementById('fav-panel').style.display = 'none';
  document.getElementById('grid-panel').style.display = 'none';
  
  // Réinitialiser les boutons de navigation basse
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  
  if (view === 'lineup') {
    document.getElementById('nav-lineup').classList.add('active');
    document.getElementById('day-tabs').style.display = 'flex';
    document.getElementById('stage-filter').style.display = 'flex';
    
    if (!document.getElementById('search-wrap').classList.contains('hidden') && document.getElementById('search-input').value) {
      document.getElementById('search-results').style.display = 'block';
    } else {
      document.getElementById(`panel-${currentDay}`).style.display = 'block';
    }
  } else if (view === 'favs') {
    document.getElementById('nav-favs').classList.add('active');
    document.getElementById('day-tabs').style.display = 'none';
    document.getElementById('stage-filter').style.display = 'none';
    renderFavorites();
    document.getElementById('fav-panel').style.display = 'block';
  } else if (view === 'grid') {
    document.getElementById('nav-grid').classList.add('active');
    document.getElementById('day-tabs').style.display = 'flex';
    document.getElementById('stage-filter').style.display = 'none';
    renderGrid(currentDay);
    document.getElementById('grid-panel').style.display = 'block';
  } else if (view === 'share') {
    document.getElementById('share-sheet').classList.add('open');
    document.getElementById('share-overlay').classList.add('open');
    // Conserver la vue précédente active sous la modale
    currentView = 'lineup';
    switchView('lineup');
  }
}

function toggleFavorite(id) {
  const idx = favorites.indexOf(id);
  if (idx > -1) {
    favorites.splice(idx, 1);
  } else {
    favorites.push(id);
  }
  saveState();
  updateBadge();
  
  // Synchroniser l'état visuel en temps réel sur l'écran courant
  if (currentView === 'lineup') {
    Object.keys(LINE_UP).forEach(renderDay);
    if (document.getElementById('search-input').value) {
      document.getElementById('search-input').dispatchEvent(new Event('input'));
    }
  } else if (currentView === 'favs') {
    renderFavorites();
  } else if (currentView === 'grid') {
    renderGrid(currentDay);
  }
}

// Gestion de la fiche modale descriptive (Detail Sheet)
function openDetail(id) {
  const set = findSet(id);
  if (!set) return;
  
  const sc = stageClass(set.stage);
  document.getElementById('sheet-header').innerHTML = `
    <div class="sheet-stage-row">
      <span class="stage-dot ${sc}"></span>
      <span class="sheet-stage-name">${set.stage}</span>
      <span class="sheet-time-badge">${set.time} - ${set.end}</span>
    </div>
    <h2 class="sheet-title">${set.name}</h2>
    <div class="sheet-genre">${set.genre}</div>`;
    
  document.getElementById('sheet-body').innerHTML = `
    <div class="sheet-country">${set.country}</div>
    <p class="sheet-desc">${set.desc}</p>`;
    
  const favBtn = document.getElementById('sheet-fav-btn');
  favBtn.setAttribute('data-id', set.id);
  if (isFav(set.id)) {
    favBtn.classList.add('active');
    favBtn.textContent = '★ Retirer des favoris';
  } else {
    favBtn.classList.remove('active');
    favBtn.textContent = '☆ Ajouter aux favoris';
  }
  
  document.getElementById('detail-sheet').classList.add('open');
  document.getElementById('sheet-overlay').classList.add('open');
}

function closeDetail() {
  document.getElementById('detail-sheet').classList.remove('open');
  document.getElementById('sheet-overlay').classList.remove('open');
}

// ════════════════════════════════════════════════════
//  FONCTIONNALITÉS DE PARTAGE (SHARE SYSTEM)
// ════════════════════════════════════════════════════
function copyShareText() {
  if (favorites.length === 0) {
    alert("Votre liste de favoris est vide.");
    return;
  }
  let text = `🎪 Mon planning personnalisé — Motocultor Festival ${CURRENT_YEAR} :\n\n`;
  const daysOrder = ['thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = { thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche' };
  
  daysOrder.forEach(day => {
    const daySets = (LINE_UP[day] || []).filter(s => isFav(s.id)).sort((a, b) => getSortWeight(a.time) - getSortWeight(b.time));
    if (daySets.length > 0) {
      text += `📅 ${dayLabels[day]} :\n`;
      daySets.forEach(s => text += `  • ${s.time} : ${s.name} [${s.stage}]\n`);
      text += `\n`;
    }
  });
  
  navigator.clipboard.writeText(text).then(() => {
    alert("📋 Programme copié dans le presse-papier !");
  }).catch(() => alert("Erreur lors de la copie du texte."));
}

function generateShareImage() {
  const canvas = document.getElementById('share-canvas');
  const previewImg = document.getElementById('share-preview-img');
  if (!canvas || !previewImg) return;
  
  const ctx = canvas.getContext('2d');
  canvas.width = 600;
  canvas.height = 700;
  
  ctx.fillStyle = '#0f0f0f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#e8e4dc';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('MOTOCULTOR FESTIVAL ' + CURRENT_YEAR, 40, 60);
  
  ctx.fillStyle = '#1a9e8f';
  ctx.font = '16px sans-serif';
  ctx.fillText('MON ITINÉRAIRE PERSONNALISÉ', 40, 90);
  
  let y = 150;
  const daysOrder = ['thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = { thursday: 'JEUDI', friday: 'VENDREDI', saturday: 'SAMEDI', sunday: 'DIMANCHE' };
  
  daysOrder.forEach(day => {
    const daySets = (LINE_UP[day] || []).filter(s => isFav(s.id)).sort((a, b) => getSortWeight(a.time) - getSortWeight(b.time));
    if (daySets.length > 0 && y < 650) {
      ctx.fillStyle = '#1a9e8f';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(dayLabels[day], 40, y);
      y += 25;
      
      daySets.forEach(s => {
        if (y > 660) return;
        ctx.fillStyle = '#e8e4dc';
        ctx.font = '14px sans-serif';
        ctx.fillText(`${s.time} - ${s.name}`, 60, y);
        y += 22;
      });
      y += 15;
    }
  });
  
  previewImg.src = canvas.toDataURL('image/png');
  previewImg.style.display = 'block';
}

// ════════════════════════════════════════════════════
//  ÉCOUTEURS D'ÉVÉNEMENTS GLOBALS (EVENT LISTENERS)
// ════════════════════════════════════════════════════
function setupEventListeners() {
  // Navigation par Onglets (Jours)
  document.getElementById('day-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentDay = tab.getAttribute('data-day');
    
    if (currentView === 'lineup') {
      switchView('lineup');
    } else if (currentView === 'grid') {
      renderGrid(currentDay);
    }
  });

  // Filtrage par Scène
  document.getElementById('stage-filter').addEventListener('click', (e) => {
    const chip = e.target.closest('.stage-chip');
    if (!chip) return;
    
    document.querySelectorAll('.stage-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentStage = chip.getAttribute('data-stage');
    renderDay(currentDay);
  });

  // Moteur de Recherche Interactif
  const searchToggle = document.getElementById('search-toggle');
  const searchWrap = document.getElementById('search-wrap');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  searchToggle.addEventListener('click', () => {
    const isHidden = searchWrap.classList.toggle('hidden');
    if (!isHidden) {
      searchInput.focus();
    } else {
      searchInput.value = '';
      searchResults.style.display = 'none';
      if (currentView === 'lineup') switchView('lineup');
    }
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length === 0) {
      searchResults.style.display = 'none';
      if (currentView === 'lineup') switchView('lineup');
      return;
    }
    
    document.querySelectorAll('.day-panel').forEach(p => p.style.display = 'none');
    const matches = allSets().filter(s => s.name.toLowerCase().includes(query) || s.genre.toLowerCase().includes(query));
    searchResults.style.display = 'block';
    
    if (matches.length > 0) {
      searchResults.innerHTML = matches.map(renderSetCard).join('');
    } else {
      searchResults.innerHTML = `<div class="empty"><p>Aucun résultat pour "${query}"</p></div>`;
    }
  });

  // Gestion unifiée des clics sur les cartes (Délégation d'événements)
  document.getElementById('main-content').addEventListener('click', (e) => {
    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
      e.stopPropagation();
      toggleFavorite(favBtn.getAttribute('data-id'));
      return;
    }
    
    const card = e.target.closest('.set-card') || e.target.closest('.grid-set');
    if (card) {
      openDetail(card.getAttribute('data-id'));
    }
  });

  // Sélecteur d'Année Dynamique
  const yearSelect = document.getElementById('year-select');
  if (yearSelect) {
    yearSelect.addEventListener('change', (e) => {
      const year = e.target.value;
      if (FESTIVAL_DATA[year]) {
        CURRENT_YEAR = year;
        localStorage.setItem('moto_year', year);
        YEAR_DATA = FESTIVAL_DATA[CURRENT_YEAR];
        STAGES = YEAR_DATA.stages;
        LINE_UP = YEAR_DATA.lineup;
        DAY_DATES = YEAR_DATA.dates;
        
        currentStage = 'all';
        document.querySelectorAll('.stage-chip').forEach(c => c.classList.remove('active'));
        document.querySelector('.stage-chip[data-stage="all"]')?.classList.add('active');
        
        autoSelectDay();
        document.querySelectorAll('.tab').forEach(t => {
          t.classList.toggle('active', t.getAttribute('data-day') === currentDay);
        });
        
        Object.keys(LINE_UP).forEach(renderDay);
        updateBadge();
        if (currentView !== 'lineup') switchView('lineup');
      }
    });
  }

  // Écouteurs pour la navigation basse (Menu principal)
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.target.closest('.nav-btn').getAttribute('data-view');
      if (view) switchView(view);
    });
  });

  // Boutons de Partage
  document.getElementById('btn-copy-text')?.addEventListener('click', copyShareText);
  document.getElementById('btn-generate-img')?.addEventListener('click', generateShareImage);
  document.getElementById('share-close-btn')?.addEventListener('click', () => {
    document.getElementById('share-sheet').classList.remove('open');
    document.getElementById('share-overlay').classList.remove('open');
  });

  // Fermetures des Modales & Événements Internes
  document.getElementById('sheet-close-btn').addEventListener('click', closeDetail);
  document.getElementById('sheet-overlay').addEventListener('click', closeDetail);
  document.getElementById('sheet-fav-btn').addEventListener('click', (e) => {
    // Récupération de l'ID via le bouton cliqué
    const id = e.target.getAttribute('data-id');
    toggleFavorite(id);
    
    // Mise à jour visuelle du bouton dans la modale
    if (isFav(id)) {
      e.target.classList.add('active');
      e.target.textContent = '★ Retirer des favoris';
    } else {
      e.target.classList.remove('active');
      e.target.textContent = '☆ Ajouter aux favoris';
    }
  });
}

// ════════════════════════════════════════════════════
//  INITIALISATION DE L'APPLICATION
// ════════════════════════════════════════════════════
function init() {
  // 1. Initialiser tous les écouteurs d'événements
  setupEventListeners();
  
  // 2. Définir le jour actuel par défaut et mettre à jour le compteur de favoris
  autoSelectDay();
  updateBadge();
  
  // 3. Activer visuellement l'onglet correspondant au bon jour
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-day') === currentDay);
  });
  
  // 4. Générer le HTML de tous les concerts pour chaque jour (LE CORRECTIF EST ICI)
  Object.keys(LINE_UP).forEach(renderDay);
  
  // 5. Lancer la vue principale pour afficher les données HTML
  switchView('lineup');
}

// Déclencher l'initialisation uniquement quand la page est totalement chargée
document.addEventListener('DOMContentLoaded', init);
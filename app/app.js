// Leonida Trophy Guide: checklist tracker for the 55 GTA VI trophies.
// Loads app/data/trophies.json, saves progress in localStorage, and never
// fetches anything over the network. Screenshot/demo state comes from the
// URL (?demo=1, ?view=, ?kind=, ?open=<id>) so a view can be shared.
const STORAGE_KEY = 'gta6-trophy-guide-v1';
const PLATINUM_NAME = 'Vice Got a Price!';

const ROADMAP_STAGES = [
  { n: 1, title: 'Story first — Chapters 1–5 (60–80 hours)', body: 'Play the five chapters in order and take the named story missions as they come: Gone Fishing, Breakfast Run, The Cartel Heist, Child\u2019s Play, Headliners, VCIA Takedown, Operation Savage Glory and the final mission. Do Lucia\u2019s balcony meditation in Chapter 1 — it is the one missable moment. Trophies: 14 (chapters, missions, final mission, the choice trophy).' },
  { n: 2, title: 'Partner & stranger strands', body: 'Finish the final missions for Andy, Kenton, Billy, Randy and Tyrone, and complete 8 full Strangers & Freaks strands. These strands open during the story and can be finished in free-roam. Trophies: 6.' },
  { n: 3, title: 'Collectibles & exploring Leonida', body: 'Complete 3 card sets, WAiNK-scan 100 locations, discover 100 vehicles (200 for 100%), explore the whole state, and buy all garage properties. Check the progress database for what is still missing. Trophies: 5.' },
  { n: 4, title: 'Activities, challenges & robberies', body: '250 stunts, gold medals in all 42 Shooting Range challenges, 20 different race wins, drone races at every location, fishing, arcade, meditation spots, hunting, partner robberies, bank vaults, armored trucks, Marked Bills and $100,000 of shopping. Also: 50 of the 80 challenges (70 for 100%). Trophies: 28.' },
  { n: 5, title: '100% completion & the platinum', body: 'Open the 100% checklist (Progress > Stats > 100% Completion) and finish it: 70/80 challenges, 300/397 stunts, 200/277 vehicles, 100/255 animals, 50/66 weapons. A Long Road (gold) pops at 100%, and the platinum pops right after. Trophies: 2.' },
];

// Demo set for screenshots and shared links: a spread of earned trophies.
const DEMO_EARNED_IDS = [1, 2, 3, 4, 5, 8, 15, 21, 28, 30, 35, 42, 46, 53];

const params = new URLSearchParams(location.search);
const demoMode = params.get('demo') === '1';
const listEl = document.getElementById('trophyList');
const stageListEl = document.getElementById('stageList');
const searchInput = document.getElementById('search');
const gradeFilter = document.getElementById('gradeFilter');
const spoilerToggle = document.getElementById('spoilerToggle');
const statusLine = document.getElementById('statusLine');
const emptyNote = document.getElementById('emptyNote');

let trophies = [];
let earned = loadEarned();
let kindFilter = params.get('kind') || 'all';
let openId = params.get('open') ? Number(params.get('open')) : null;

function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function saveEarned() {
  if (demoMode) return; // demo state is in-memory only, never persisted
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
}

function applyDemoEarned() {
  if (!demoMode) return;
  earned = new Set(DEMO_EARNED_IDS.map((id) => trophies.find((t) => t.id === id)?.name).filter(Boolean));
}

function isStoryTrophy(t) {
  return t.kind.includes('story');
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindTags(t) {
  const tags = [...t.kind];
  return tags.map((k) => (k === 'missable' ? 'Missable' : k === 'meta' ? 'Platinum path' : k.charAt(0).toUpperCase() + k.slice(1)));
}

function renderStages() {
  stageListEl.replaceChildren();
  for (const s of ROADMAP_STAGES) {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = `Stage ${s.n} — ${s.title}`;
    const p = document.createElement('p');
    p.textContent = s.body;
    p.style.margin = '4px 0 0';
    li.append(b, p);
    stageListEl.append(li);
  }
}

function renderStats() {
  const total = trophies.length;
  const count = earned.size;
  const pct = total ? Math.round((count / total) * 100) : 0;
  document.getElementById('progressText').textContent = `${count} of ${total} earned`;
  document.getElementById('platPct').textContent = `${pct}%`;
  document.getElementById('platRing').style.background =
    `conic-gradient(var(--plat) ${pct * 3.6}deg, var(--panel2) 0deg)`;
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (earned.has(t.name)) byGrade[t.grade]++;
  document.getElementById('gradeText').textContent =
    `${byGrade.platinum} platinum · ${byGrade.gold} gold · ${byGrade.silver} silver · ${byGrade.bronze} bronze`;
}

function spoilerHidden(t) {
  return spoilerToggle.checked && isStoryTrophy(t) && !earned.has(t.name);
}

function trophyMatches(t) {
  if (kindFilter === 'online') return false; // the official list has no online trophies
  if (kindFilter !== 'all' && !t.kind.includes(kindFilter)) return false;
  if (gradeFilter.value !== 'all' && t.grade !== gradeFilter.value) return false;
  const q = searchInput.value.trim().toLowerCase();
  if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
  return true;
}

function renderSources(t) {
  const p = document.createElement('p');
  p.className = 'src';
  p.textContent = 'Sources: ';
  t.sources.forEach((s, i) => {
    if (i > 0) p.append(document.createTextNode('; '));
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      a.target = '_blank';
      a.rel = 'noopener';
      p.append(a);
    } else {
      p.append(document.createTextNode(s.name));
    }
  });
  return p;
}

function renderTrophyCard(t) {
  const card = document.createElement('article');
  card.className = 'card' + (earned.has(t.name) ? ' earned' : '');
  card.dataset.trophyId = String(t.id);
  card.id = `trophy-${t.id}`;

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.name);
  box.setAttribute('aria-label', `Earned: ${t.name}`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.name);
    else earned.delete(t.name);
    saveEarned();
    renderStats();
    renderList();
  });

  const body = document.createElement('div');
  const head = document.createElement('div');
  head.className = 'card-head';
  const name = document.createElement('h3');
  const badge = document.createElement('span');
  badge.className = `badge ${t.grade}`;
  badge.textContent = gradeLabel(t.grade);
  if (spoilerHidden(t)) {
    name.textContent = 'Hidden story trophy — earn it to reveal';
    name.className = 'spoiled';
    head.append(badge, name);
    const note = document.createElement('p');
    note.className = 'desc spoiled';
    note.textContent = 'Spoiler-safe mode hides this story trophy\u2019s name and description until you earn it.';
    body.append(head, note);
  } else {
    name.textContent = t.name;
    head.append(badge, name);
    for (const tag of kindTags(t)) {
      const s = document.createElement('span');
      s.className = 'tag' + (tag === 'Missable' ? ' missable' : '');
      s.textContent = tag;
      head.append(s);
    }
    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.innerHTML = '';
    desc.append(document.createTextNode('Official: '));
    const em = document.createElement('span');
    em.className = 'official';
    em.textContent = t.description;
    desc.append(em);
    const stage = document.createElement('p');
    stage.className = 'stage-note';
    stage.textContent = `Roadmap: Stage ${t.stage}${t.missable ? ' · ⚠ Missable — do it in Chapter 1' : ''}`;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'guide-toggle';
    toggle.textContent = openId === t.id ? '▾ Hide guide' : '▸ Read guide & sources';
    const guide = document.createElement('div');
    guide.className = 'guide' + (openId === t.id ? '' : ' hidden');
    const gtext = document.createElement('p');
    gtext.textContent = t.guide;
    const steps = document.createElement('ol');
    for (const step of t.steps) {
      const li = document.createElement('li');
      li.textContent = step;
      steps.append(li);
    }
    guide.append(gtext, steps, renderSources(t));
    toggle.addEventListener('click', () => {
      const hidden = guide.classList.toggle('hidden');
      toggle.textContent = hidden ? '▸ Read guide & sources' : '▾ Hide guide';
    });
    body.append(head, desc, stage, toggle, guide);
  }
  card.append(box, body);
  return card;
}

function renderList() {
  const shown = trophies.filter(trophyMatches);
  listEl.replaceChildren();
  for (const t of shown) listEl.append(renderTrophyCard(t));
  const total = trophies.length;
  statusLine.textContent = kindFilter === 'online'
    ? 'Showing 0 of 55 trophies — the official list has no online trophies; all 55 are earned solo, offline.'
    : `Showing ${shown.length} of ${total} trophies.`;
  emptyNote.classList.toggle('hidden', shown.length > 0);
}

function exportProgress() {
  const data = { game: 'GTA VI', exportedAt: new Date().toISOString(), earned: [...earned].sort() };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('bad file');
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => known.has(n)));
    saveEarned();
    renderStats();
    renderList();
    statusLine.textContent = `Imported ${earned.size} earned trophies.`;
  } catch {
    statusLine.textContent = 'Import failed: that file is not a trophy-progress export from this guide.';
  }
}

function syncKindButtons() {
  document.querySelectorAll('#kindFilters button').forEach((b) => b.classList.toggle('active', b.dataset.kind === kindFilter));
}

function bindControls() {
  document.querySelectorAll('#kindFilters button').forEach((btn) => {
    btn.addEventListener('click', () => {
      kindFilter = btn.dataset.kind;
      syncKindButtons();
      renderList();
    });
  });
  syncKindButtons();
  gradeFilter.addEventListener('change', renderList);
  searchInput.addEventListener('input', renderList);
  spoilerToggle.addEventListener('change', renderList);
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', (e) => importProgress(e.target.files[0]));
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies?')) return;
    earned = new Set();
    saveEarned();
    renderStats();
    renderList();
  });
  document.getElementById('showMissable').addEventListener('click', () => {
    kindFilter = 'missable';
    syncKindButtons();
    document.getElementById('roadmap').scrollIntoView({ behavior: 'smooth' });
    renderList();
    listEl.scrollIntoView({ behavior: 'smooth' });
  });
}

function applyUrlView() {
  if (params.get('spoiler') === 'on') spoilerToggle.checked = true;
  if (params.get('spoiler') === 'off') spoilerToggle.checked = false;
  if (params.get('q')) searchInput.value = params.get('q');
  if (params.get('grade')) gradeFilter.value = params.get('grade');
  if (params.get('view') === 'missable') kindFilter = 'missable';
  syncKindButtons();
}

// Scroll after the list has rendered: fragment scrolling happens before
// the async trophy list loads, so it lands in the wrong place. This runs
// after renderList, so the target is in its final position.
function scrollIntoPlace() {
  const view = params.get('view');
  let target = null;
  if (view === 'roadmap') target = document.getElementById('roadmap');
  else if (view === 'list') target = document.getElementById('listHeading');
  else if (openId) target = document.getElementById(`trophy-${openId}`);
  if (target) setTimeout(() => target.scrollIntoView({ behavior: 'auto', block: 'start' }), 150);
}

async function initGuide() {
  const doc = await (await fetch('data/trophies.json')).json();
  trophies = doc.trophies;
  applyDemoEarned();
  renderStages();
  renderStats();
  bindControls();
  applyUrlView();
  renderList();
  scrollIntoPlace();
}

initGuide();

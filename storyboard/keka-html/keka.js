const P = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  me: '<circle cx="12" cy="7" r="4"/><path d="M5 21c0-4 3-6 7-6s7 2 7 6z"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
  team: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 20c0-4 2.5-6 6-6s6 2 6 6"/><path d="M15 14c4-1 7 1 7 5"/>',
  fin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6v2m0 8v2"/>',
  org: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2"/>',
  engage: '<path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z"/>',
  perf: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/>',
  bell: '<path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 004 0"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  palette: '<path d="M12 3a9 9 0 100 18c1.5 0 2-1 1.5-2-.5-1 0-2 1.5-2h2a4 4 0 004-4c0-5-4-10-9-10z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10l2 2M5 19l2-2m10-10l2-2"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9m-3 3l3 3"/>',
  out: '<path d="M9 4H5v16h4"/><path d="M10 12h11m-4-4l4 4-4 4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8v.01"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24">${P[n]}</svg>`;
const fill = (root) =>
  root.querySelectorAll('[data-i]').forEach((e) => {
    if (!e.querySelector(':scope > svg')) e.insertAdjacentHTML('afterbegin', icon(e.dataset.i));
  });

const RAIL = [
  ['home', 'Home', 'index.html'], ['me', 'Me', 'attendance.html'], ['inbox', 'Inbox', '#'],
  ['team', 'My Team', '#'], ['fin', 'My Finances', '#'], ['org', 'Org', '#'],
  ['engage', 'Engage', '#'], ['perf', 'Performance', 'goals.html'],
];
const FLY = [
  ['Attendance', 'attendance.html'], ['Leave', 'leave.html'], ['Performance', 'goals.html', 1],
  ['Expenses & Travel', '#'], ['Apps', '#', 1],
];

// tabs: [[label, href, dot?]], activeTab: label
function shell(tabs, activeTab) {
  const cur = document.body.dataset.rail;
  const page = location.pathname.split('/').pop();
  document.body.insertAdjacentHTML('afterbegin', `
  <header class="topbar"><div class="brand">keka</div><div class="tenant">VoltusWave</div>
    <div class="search" data-i="search"><span>Search employees or actions (Ex: Apply Leave)</span><kbd>Alt + K</kbd></div>
    <div class="top-right"><div class="bell" data-i="bell"><b>10</b></div><button class="avatar" id="av">KV</button></div></header>
  <nav class="rail">${RAIL.map((r) => `<a href="${r[2]}" data-k="${r[0]}" class="${r[0] === cur ? 'on' : ''}" data-i="${r[0]}"><span>${r[1]}</span></a>`).join('')}</nav>
  <div class="flyout" id="fly">${FLY.map((f) => `<a href="${f[1]}" class="${f[1] === page ? 'cur' : ''}"><span>${f[0]}</span>${f[2] ? icon('chev') : ''}</a>`).join('')}</div>
  <div class="menu" id="menu"><a data-i="me">My profile</a><a data-i="sun">Display mode<span class="chev">${icon('chev')}</span></a><a data-i="palette">Theme color<span class="chev">${icon('chev')}</span></a><a data-i="gear">User preferences</a><a data-i="key">Change password</a><a data-i="out">Logout</a></div>`);
  fill(document.body);
  const sh = document.querySelector('.shell');
  if (tabs) {
    sh.insertAdjacentHTML('afterbegin', `<div class="tabs">${tabs.map((t) => `<a href="${t[1] || '#'}" class="${t[0] === activeTab ? 'on' : ''}">${t[0]}${t[2] ? '<i></i>' : ''}</a>`).join('')}</div>`);
  }
  const fly = document.getElementById('fly'), menu = document.getElementById('menu');
  const close = () => setTimeout(() => { if (!fly.matches(':hover') && !document.querySelector('.rail a[data-k=me]').matches(':hover')) fly.classList.remove('open'); }, 120);
  document.querySelector('.rail a[data-k=me]').addEventListener('mouseenter', () => fly.classList.add('open'));
  document.querySelector('.rail a[data-k=me]').addEventListener('mouseleave', close);
  fly.addEventListener('mouseleave', close);
  document.getElementById('av').onclick = (e) => { e.stopPropagation(); menu.classList.toggle('open'); };
  document.addEventListener('click', () => menu.classList.remove('open'));
}
const ME_TABS = [['Attendance', 'attendance.html'], ['Leave', 'leave.html'], ['Performance', 'goals.html'], ['Expenses & Travel', '#'], ['Apps', '#']];

import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/400-italic.css';
import '@fontsource/eb-garamond/500.css';
import '@fontsource/eb-garamond/600.css';
import './styles.css';

import { ROOM_COUNT } from './data';
import { h, icon } from './dom';
import { globalNote, noteField } from './components/noteField';
import { undo } from './components/journey';
import { navigate, parse, paths, startRouter, type NavKind, type Route } from './router';
import { stepCount, store } from './store';
import { roomView } from './views/room';
import { mapView } from './views/map';
import { notesView } from './views/notes';
import { aboutView, contestView, directionsView, homeView, notFoundView, prologueView } from './views/pages';
import type { View } from './views/types';

// ---------------------------------------------------------------- shell

const stepChip = h('a', { class: 'chip', href: paths.map, title: 'Pas du parcours en cours — voir la carte' });
const notesBtn = h('button', { type: 'button', class: 'nav-btn', 'aria-expanded': 'false', 'aria-controls': 'drawer', title: 'Carnet (N)', onclick: () => toggleDrawer() }, icon('notes'), h('span', { class: 'label' }, 'Carnet'));

const header = h(
  'header',
  { class: 'topbar' },
  h('a', { class: 'brand', href: paths.home }, 'Maze'),
  h(
    'nav',
    { class: 'topnav', 'aria-label': 'Navigation principale' },
    stepChip,
    h('button', { type: 'button', class: 'nav-btn', title: 'Aller à une salle (G)', onclick: () => openGoto() }, icon('jump'), h('span', { class: 'label' }, 'Salles')),
    h('a', { class: 'nav-btn', href: paths.map, title: 'Carte des salles (C)' }, icon('map'), h('span', { class: 'label' }, 'Carte')),
    notesBtn,
  ),
);

const main = h('main', { id: 'main', tabindex: '-1' });

// Global notebook drawer
const drawerNote = noteField({ ...globalNote, id: 'note-global-drawer', label: 'Carnet général', placeholder: 'Ce qui vaut pour tout le Labyrinthe : chemins, symboles, hypothèses…', rows: 12 });
const drawer = h(
  'aside',
  { id: 'drawer', class: 'drawer', 'aria-label': 'Carnet', hidden: true },
  h(
    'div',
    { class: 'drawer-head' },
    h('h2', null, 'Carnet'),
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Fermer le carnet', onclick: () => toggleDrawer(false) }, icon('close')),
  ),
  drawerNote.el,
  h('p', { class: 'drawer-foot' }, h('a', { href: paths.notes }, 'Toutes mes notes et l’export →')),
);

function toggleDrawer(open = drawer.hidden) {
  drawer.hidden = !open;
  document.body.classList.toggle('drawer-open', open);
  notesBtn.setAttribute('aria-expanded', String(open));
  if (open) drawerNote.textarea.focus();
}

// Go-to-room dialog
const gotoGrid = h('div', { class: 'goto-grid' });
const gotoInput = h('input', { type: 'number', min: 1, max: ROOM_COUNT, inputmode: 'numeric', placeholder: 'N°', 'aria-label': 'Numéro de salle' });
const gotoDialog = h(
  'dialog',
  { class: 'goto', 'aria-label': 'Aller à une salle' },
  h(
    'form',
    {
      method: 'dialog',
      class: 'goto-form',
      onsubmit: (e: Event) => {
        e.preventDefault();
        const n = Number(gotoInput.value);
        if (n >= 1 && n <= ROOM_COUNT) {
          gotoDialog.close();
          navigate(paths.room(n));
        }
      },
    },
    h('h2', null, 'Aller à une salle'),
    gotoInput,
    h('button', { type: 'submit', class: 'btn primary' }, 'Y aller'),
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Fermer', onclick: () => gotoDialog.close() }, icon('close')),
  ),
  gotoGrid,
  h(
    'ul',
    { class: 'goto-links' },
    h('li', null, h('a', { href: paths.directions }, 'Mode d’emploi')),
    h('li', null, h('a', { href: paths.prologue }, 'Prologue')),
    h('li', null, h('a', { href: paths.contest }, 'Concours')),
    h('li', null, h('a', { href: paths.about }, 'À propos')),
  ),
  h('p', { class: 'muted small' }, 'Sauter directement à une salle ne compte pas comme un pas.'),
);
gotoDialog.addEventListener('click', (e) => {
  if (e.target === gotoDialog || (e.target as Element).closest('a')) gotoDialog.close();
});

function openGoto() {
  const st = store.get();
  const visited = new Set(st.visited);
  const current = route.name === 'room' ? route.n : 0;
  gotoGrid.replaceChildren(
    ...Array.from({ length: ROOM_COUNT }, (_, i) => i + 1).map((n) =>
      h(
        'a',
        {
          href: paths.room(n),
          class: `${visited.has(n) ? 'visited' : ''}${n === current ? ' current' : ''}${st.notes.rooms[n] ? ' noted' : ''}`,
          'aria-current': n === current ? 'page' : null,
        },
        n,
      ),
    ),
  );
  gotoInput.value = '';
  gotoDialog.showModal();
  gotoInput.focus();
}

const footer = h(
  'footer',
  { class: 'site-footer' },
  h('p', null, h('em', null, 'Maze'), ' © Christopher Manson, 1985 · adaptation web non officielle · ', h('a', { href: paths.about }, 'À propos')),
);

document.querySelector('#app')!.replaceChildren(header, main, footer, drawer, gotoDialog);

function updateChrome() {
  const { journey } = store.get();
  const steps = stepCount(journey);
  stepChip.textContent = journey.length ? `${steps} pas` : '';
  stepChip.hidden = !journey.length;
}
store.subscribe(updateChrome);
updateChrome();

// ---------------------------------------------------------------- routing

let route: Route = parse(location.pathname);
let view: View | undefined;

function render(r: Route): View {
  switch (r.name) {
    case 'home': return homeView();
    case 'directions': return directionsView();
    case 'prologue': return prologueView();
    case 'room': return roomView(r.n);
    case 'map': return mapView();
    case 'notes': return notesView();
    case 'contest': return contestView();
    case 'about': return aboutView();
    default: return notFoundView();
  }
}

function onRoute(next: Route, kind: NavKind) {
  const prev = route;
  route = next;

  if (next.name === 'room') {
    const { journey } = store.get();
    if (kind === 'history' && journey.length >= 2 && journey[journey.length - 2].room === next.n) {
      // Browser "back" to the previous room of the journey: treat it as an undo.
      store.undoStep();
    } else {
      // A door only counts as a step when taken from a room.
      const via = kind === 'door' && prev.name === 'room' ? 'door' : 'jump';
      store.enterRoom(next.n, via);
    }
  }

  view?.dispose?.();
  view = render(next);
  main.replaceChildren(view.el);
  main.classList.remove('enter');
  void main.offsetWidth;
  main.classList.add('enter');
  document.title = next.name === 'home' ? 'Maze — le livre-labyrinthe' : `${view.title} · Maze`;
  if (kind !== 'initial') {
    window.scrollTo({ top: 0 });
    main.focus({ preventScroll: true });
  }
  updateChrome();
}

// ---------------------------------------------------------------- keyboard

let digits = '';
let digitTimer: number | undefined;

function flushDigits() {
  const n = Number(digits);
  digits = '';
  if (!n) return;
  const doors = view?.doorTargets ?? [];
  if (doors.includes(n)) navigate(paths.room(n), 'door');
}

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target as HTMLElement;
  if (t.closest('input, textarea, select, [contenteditable="true"]')) {
    if (e.key === 'Escape') (t as HTMLElement).blur();
    return;
  }
  if (gotoDialog.open) return;

  if (/^[0-9]$/.test(e.key) && view?.doorTargets) {
    digits += e.key;
    window.clearTimeout(digitTimer);
    const n = Number(digits);
    const doors = view.doorTargets;
    // Go immediately when no other door number starts with what was typed.
    const ambiguous = doors.some((d) => d !== n && String(d).startsWith(digits));
    if (!ambiguous || digits.length >= 2) flushDigits();
    else digitTimer = window.setTimeout(flushDigits, 700);
    return;
  }

  const page = view?.keys?.[e.key] ?? view?.keys?.[e.key.toLowerCase()];
  const actions: Record<string, () => void> = {
    g: openGoto,
    n: () => toggleDrawer(),
    c: () => navigate(paths.map),
    r: undo,
    e: () => view?.focusNote?.(),
    '?': () => navigate(paths.about),
    Escape: () => toggleDrawer(false),
  };
  const action = page ?? actions[e.key] ?? actions[e.key.toLowerCase()];
  if (action) {
    e.preventDefault();
    action();
  }
});

startRouter(onRoute);

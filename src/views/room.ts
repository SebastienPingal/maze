import { getRoom, imageUrl, ROOM_COUNT } from '../data';
import { h, icon, para } from '../dom';
import { renderPlate } from '../components/plate';
import { openZoom } from '../components/zoom';
import { noteField, roomNote } from '../components/noteField';
import { journeyPanel } from '../components/journey';
import { navigate, paths } from '../router';
import { store } from '../store';
import type { View } from './types';

export function roomView(n: number): View {
  const room = getRoom(n)!;
  const st = store.get();
  const visited = new Set(st.visited);
  const taken = new Set(st.edges.filter((e) => e.startsWith(`${n}>`)).map((e) => Number(e.split('>')[1])));
  const alt = `Illustration de la salle ${n}`;

  const plateEl = renderPlate(room, { alt, visited, taken, eager: true });
  const figure = h('figure', { class: 'plate-figure' }, plateEl);
  const applyShowDoors = () => figure.classList.toggle('show-doors', store.get().prefs.showDoors);
  applyShowDoors();

  const zoom = () => openZoom(room, { alt, visited, taken });
  plateEl.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('a.door')) zoom();
  });

  const doorsBtn = h(
    'button',
    {
      type: 'button',
      class: 'tool',
      'aria-pressed': String(store.get().prefs.showDoors),
      title: 'Afficher / masquer les portes (D)',
      onclick: () => toggleDoors(),
    },
    icon('doors'),
    h('span', null, 'Portes'),
  );

  function toggleDoors() {
    store.setShowDoors(!store.get().prefs.showDoors);
    doorsBtn.setAttribute('aria-pressed', String(store.get().prefs.showDoors));
    applyShowDoors();
  }

  const doorList = room.doors.length
    ? h(
        'ul',
        { class: 'door-list', 'aria-label': 'Portes de cette salle' },
        [...room.doors]
          .sort((a, b) => a.to - b.to)
          .map((d) =>
            h(
              'li',
              null,
              h(
                'a',
                {
                  class: `door-chip${taken.has(d.to) ? ' taken' : visited.has(d.to) ? ' visited' : ''}`,
                  href: paths.room(d.to),
                  'data-via': 'door',
                  'data-to': d.to,
                  title: taken.has(d.to)
                    ? 'Porte déjà empruntée depuis cette salle'
                    : visited.has(d.to)
                      ? 'Salle déjà visitée'
                      : 'Salle jamais visitée',
                },
                String(d.to),
              ),
            ),
          ),
      )
    : h('p', { class: 'door-none' }, 'Aucune porte ne mène hors d’ici.');

  // Highlight the matching door on the image when hovering a chip, and vice versa.
  const link = (to: string | undefined, on: boolean) => {
    if (!to) return;
    figure.querySelectorAll(`[data-to="${to}"]`).forEach((el) => el.classList.toggle('hot', on));
    doorList.querySelectorAll(`[data-to="${to}"]`).forEach((el) => el.classList.toggle('hot', on));
  };
  for (const root of [figure, doorList]) {
    root.addEventListener('pointerover', (e) => link((e.target as Element).closest<HTMLElement>('[data-to]')?.dataset.to, true));
    root.addEventListener('pointerout', (e) => link((e.target as Element).closest<HTMLElement>('[data-to]')?.dataset.to, false));
    root.addEventListener('focusin', (e) => link((e.target as Element).closest<HTMLElement>('[data-to]')?.dataset.to, true));
    root.addEventListener('focusout', (e) => link((e.target as Element).closest<HTMLElement>('[data-to]')?.dataset.to, false));
  }

  const note = noteField({ ...roomNote(n), id: `note-room-${n}`, label: `Mes notes · salle ${n}`, placeholder: 'Indices, symboles, hypothèses sur cette salle…', rows: 4 });
  const journey = journeyPanel(n);

  const prev = n > 1 ? n - 1 : null;
  const next = n < ROOM_COUNT ? n + 1 : null;

  const el = h(
    'section',
    { class: 'room' },
    h(
      'header',
      { class: 'room-head' },
      prev
        ? h('a', { class: 'page-turn', href: paths.room(prev), title: `Page ${prev} (←)`, 'aria-label': `Page précédente : salle ${prev}` }, icon('prev'), h('span', null, prev))
        : h('a', { class: 'page-turn', href: paths.prologue, title: 'Prologue (←)' }, icon('prev'), h('span', null, 'Prologue')),
      h('h1', { class: 'room-title' }, h('span', { class: 'room-word' }, 'Salle'), h('span', { class: 'room-number' }, n)),
      next
        ? h('a', { class: 'page-turn', href: paths.room(next), title: `Page ${next} (→)`, 'aria-label': `Page suivante : salle ${next}` }, h('span', null, next), icon('next'))
        : h('span', { class: 'page-turn', 'aria-hidden': 'true' }),
    ),
    h(
      'div',
      { class: 'room-body' },
      h(
        'div',
        { class: 'plate-col' },
        figure,
        h(
          'div',
          { class: 'door-bar' },
          h('span', { class: 'door-bar-label' }, room.doors.length > 1 ? 'Portes' : room.doors.length ? 'Porte' : ''),
          doorList,
          h(
            'div',
            { class: 'tools' },
            doorsBtn,
            h('button', { type: 'button', class: 'tool', title: 'Agrandir l’illustration (Z)', onclick: zoom }, icon('zoom'), h('span', null, 'Agrandir')),
          ),
        ),
      ),
      h(
        'article',
        { class: 'page-col' },
        h('div', { class: 'book-text', lang: 'en' }, room.paragraphs.map(para)),
        note.el,
        journey.el,
      ),
    ),
  );

  // Warm the cache for the rooms behind each door.
  const prefetch = () => room.doors.forEach((d) => (new Image().src = imageUrl(`room${d.to}`)));
  const idle = (window as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  if (idle) idle(prefetch);
  else window.setTimeout(prefetch, 800);

  return {
    el,
    title: `Salle ${n}`,
    keys: {
      d: toggleDoors,
      z: zoom,
      ArrowLeft: () => navigate(prev ? paths.room(prev) : paths.prologue),
      ArrowRight: () => next && navigate(paths.room(next)),
    },
    doorTargets: room.doors.map((d) => d.to),
    focusNote: () => note.textarea.focus(),
    dispose: () => {
      note.dispose();
      journey.dispose();
    },
  };
}

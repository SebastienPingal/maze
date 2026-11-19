import { imageUrl, rooms } from '../data';
import { h, icon } from '../dom';
import { journeyPanel } from '../components/journey';
import { paths } from '../router';
import { store } from '../store';
import type { View } from './types';

type Filter = 'all' | 'visited' | 'unvisited' | 'notes';
let filter: Filter = 'all';

export function mapView(): View {
  const journey = journeyPanel();
  const summary = h('p', { class: 'map-summary muted' });
  const grid = h('ol', { class: 'room-grid' });

  const filters: [Filter, string][] = [
    ['all', 'Toutes'],
    ['visited', 'Visitées'],
    ['unvisited', 'Jamais visitées'],
    ['notes', 'Avec notes'],
  ];
  const filterBar = h(
    'div',
    { class: 'segmented', role: 'group', 'aria-label': 'Filtrer les salles' },
    filters.map(([f, label]) =>
      h(
        'button',
        {
          type: 'button',
          'aria-pressed': String(filter === f),
          onclick: (e: Event) => {
            filter = f;
            filterBar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
            render();
          },
        },
        label,
      ),
    ),
  );

  function render() {
    const st = store.get();
    const visited = new Set(st.visited);
    const edges = new Set(st.edges);
    const current = st.journey[st.journey.length - 1]?.room;
    const noteCount = Object.keys(st.notes.rooms).length;

    summary.textContent = `${visited.size} / 45 salles visitées · ${edges.size} porte${edges.size > 1 ? 's' : ''} franchie${edges.size > 1 ? 's' : ''} · ${noteCount} salle${noteCount > 1 ? 's' : ''} annotée${noteCount > 1 ? 's' : ''}`;

    const list = rooms.filter((r) => {
      if (filter === 'visited') return visited.has(r.n);
      if (filter === 'unvisited') return !visited.has(r.n);
      if (filter === 'notes') return Boolean(st.notes.rooms[r.n]);
      return true;
    });

    grid.replaceChildren(
      ...list.map((r) => {
        const note = st.notes.rooms[r.n];
        return h(
          'li',
          { class: `room-card${visited.has(r.n) ? ' visited' : ''}${r.n === current ? ' current' : ''}` },
          h(
            'a',
            { class: 'room-card-link', href: paths.room(r.n), 'aria-label': `Salle ${r.n}${visited.has(r.n) ? ', visitée' : ''}${note ? ', annotée' : ''}` },
            h('img', { src: imageUrl(r.image, 'thumb'), alt: '', loading: 'lazy', width: 480, height: Math.round((480 * r.height) / r.width) }),
            h(
              'span',
              { class: 'room-card-title' },
              h('span', { class: 'num' }, r.n),
              r.n === current ? h('span', { class: 'tag' }, 'ici') : visited.has(r.n) ? icon('check', 'visitée') : null,
              note ? icon('notes', 'annotée') : null,
            ),
          ),
          h(
            'div',
            { class: 'room-card-exits' },
            r.doors.length
              ? [...r.doors]
                  .sort((a, b) => a.to - b.to)
                  .map((d) =>
                    h(
                      'a',
                      {
                        href: paths.room(d.to),
                        class: edges.has(`${r.n}>${d.to}`) ? 'taken' : '',
                        title: edges.has(`${r.n}>${d.to}`) ? `${r.n} → ${d.to} : porte déjà franchie` : `Porte vers ${d.to}`,
                      },
                      d.to,
                    ),
                  )
              : h('span', { class: 'muted' }, 'aucune porte'),
          ),
          note ? h('p', { class: 'room-card-note' }, note.length > 140 ? `${note.slice(0, 140)}…` : note) : null,
        );
      }),
    );
    if (!list.length) grid.append(h('li', { class: 'muted empty' }, 'Aucune salle ne correspond à ce filtre.'));
  }

  render();
  const unsubscribe = store.subscribe(render);

  const el = h(
    'section',
    { class: 'map-page' },
    h('header', { class: 'page-header' }, h('h1', null, 'Carte des salles'), summary),
    journey.el,
    h('div', { class: 'map-toolbar' }, filterBar, h('p', { class: 'legend muted' }, h('span', { class: 'legend-taken' }, '12'), ' porte déjà franchie depuis cette salle')),
    grid,
    h(
      'details',
      { class: 'danger' },
      h('summary', null, 'Réinitialiser'),
      h('p', { class: 'muted' }, 'Efface le parcours, les salles visitées et les portes franchies. Les notes sont conservées.'),
      h(
        'button',
        {
          type: 'button',
          class: 'btn danger-btn',
          onclick: () => {
            if (confirm('Effacer toute la progression (parcours, salles visitées, portes franchies) ? Les notes sont conservées.')) store.resetProgress();
          },
        },
        'Effacer la progression',
      ),
    ),
  );

  return {
    el,
    title: 'Carte des salles',
    dispose: () => {
      unsubscribe();
      journey.dispose();
    },
  };
}

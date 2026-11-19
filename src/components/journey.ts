import { h, icon } from '../dom';
import { navigate, paths } from '../router';
import { stepCount, store } from '../store';

const MAX_SHOWN = 30;

/** Current path through the maze, with undo / restart controls. Re-renders on store changes. */
export function journeyPanel(current?: number) {
  const el = h('section', { class: 'journey', 'aria-label': 'Parcours' });

  function render() {
    const { journey } = store.get();
    const steps = stepCount(journey);
    const shown = journey.slice(-MAX_SHOWN);
    const hidden = journey.length - shown.length;

    const path = h(
      'ol',
      { class: 'path' },
      hidden > 0 ? h('li', { class: 'path-more' }, `… ${hidden} étape${hidden > 1 ? 's' : ''}`) : null,
      shown.map((s, i) =>
        h(
          'li',
          { class: `path-step${s.via === 'jump' && (i > 0 || hidden > 0) ? ' jump' : ''}` },
          h(
            'a',
            {
              href: paths.room(s.room),
              class: i === shown.length - 1 ? 'here' : '',
              title: s.via === 'jump' && (i > 0 || hidden > 0) ? `Salle ${s.room} (atteinte sans porte)` : `Salle ${s.room}`,
            },
            s.room,
          ),
        ),
      ),
    );

    el.replaceChildren(
      h(
        'div',
        { class: 'journey-head' },
        h('h2', null, 'Parcours'),
        h('span', { class: 'step-count' }, journey.length ? `${steps} pas` : ''),
      ),
      journey.length
        ? path
        : h('p', { class: 'muted' }, 'Ton chemin s’affichera ici au fil des portes franchies.'),
      h(
        'div',
        { class: 'journey-actions' },
        h(
          'button',
          {
            type: 'button',
            class: 'tool',
            disabled: journey.length < 2,
            title: 'Annuler le dernier pas et revenir à la salle précédente (R)',
            onclick: undo,
          },
          icon('back'),
          h('span', null, 'Revenir'),
        ),
        current
          ? h(
              'button',
              {
                type: 'button',
                class: 'tool',
                disabled: journey.length === 1 && journey[0].room === current,
                title: 'Effacer le parcours et repartir de cette salle',
                onclick: () => {
                  if (journey.length < 3 || confirm(`Effacer le parcours actuel (${steps} pas) et repartir de la salle ${current} ?`)) {
                    store.restartJourney(current);
                  }
                },
              },
              icon('restart'),
              h('span', null, 'Repartir d’ici'),
            )
          : null,
      ),
      h('p', { class: 'journey-hint muted' }, 'Défi : aller de la salle 1 à la salle 45 puis revenir à la 1 en seize pas.'),
    );
  }

  render();
  const unsubscribe = store.subscribe(render);
  return { el, dispose: () => unsubscribe() };
}

export function undo() {
  const back = store.undoStep();
  if (back) navigate(paths.room(back), 'jump');
}

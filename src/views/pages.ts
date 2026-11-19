import { contestParagraphs, coverPlate, directionsPlate, imageUrl, prologuePlate } from '../data';
import { h, icon, para } from '../dom';
import { renderPlate } from '../components/plate';
import { openZoom } from '../components/zoom';
import { paths } from '../router';
import { stepCount, store } from '../store';
import type { View } from './types';

function zoomable(plate: typeof coverPlate, alt: string, eager = true) {
  const el = renderPlate(plate, { alt, eager });
  el.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('a.door')) openZoom(plate, { alt });
  });
  return h('figure', { class: 'plate-figure' }, el);
}

const ext = (href: string, text: string) => h('a', { href, target: '_blank', rel: 'noopener' }, text);

export function homeView(): View {
  const { journey, visited, notes } = store.get();
  const last = journey[journey.length - 1];
  const noteCount = Object.keys(notes.rooms).length + (notes.global.trim() ? 1 : 0);

  const el = h(
    'section',
    { class: 'home' },
    h(
      'div',
      { class: 'home-grid' },
      h('div', { class: 'home-cover' }, zoomable(coverPlate, 'Couverture du livre Maze')),
      h(
        'div',
        { class: 'home-intro' },
        h('p', { class: 'eyebrow' }, 'Christopher Manson · 1985'),
        h('h1', { class: 'home-title' }, 'Maze'),
        h('p', { class: 'home-subtitle', lang: 'en' }, 'Solve the World’s Most Challenging Puzzle'),
        h(
          'p',
          { class: 'lede' },
          'Un livre-énigme de quarante-cinq salles. Chaque page est une pièce, chaque porte mène à une autre page. ',
          'Trouve le chemin le plus court vers la salle 45, puis reviens à la salle 1… en seize pas.',
        ),
        h(
          'div',
          { class: 'cta' },
          last
            ? h('a', { class: 'btn primary', href: paths.room(last.room) }, `Reprendre en salle ${last.room}`)
            : h('a', { class: 'btn primary', href: paths.directions }, 'Commencer la lecture'),
          last
            ? h('a', { class: 'btn', href: paths.directions }, 'Mode d’emploi')
            : h('a', { class: 'btn', href: paths.room(1) }, 'Aller directement à la salle 1'),
        ),
        last
          ? h(
              'p',
              { class: 'progress-line muted' },
              `${visited.length} salle${visited.length > 1 ? 's' : ''} visitée${visited.length > 1 ? 's' : ''} sur 45 · `,
              `parcours en cours : ${stepCount(journey)} pas`,
              noteCount ? ` · ${noteCount} note${noteCount > 1 ? 's' : ''}` : '',
            )
          : null,
        h(
          'ul',
          { class: 'home-links' },
          h('li', null, h('a', { href: paths.prologue }, 'Prologue')),
          h('li', null, h('a', { href: paths.map }, 'Carte des salles')),
          h('li', null, h('a', { href: paths.notes }, 'Carnet de notes')),
          h('li', null, h('a', { href: paths.contest }, 'Le concours de 1985')),
          h('li', null, h('a', { href: paths.about }, 'À propos')),
        ),
      ),
    ),
    h(
      'blockquote',
      { class: 'back-cover', lang: 'en' },
      h('p', { class: 'eyebrow', lang: 'fr' }, 'Quatrième de couverture'),
      para('I invite you to enter my Maze. I say it is mine, because despite who else I might be, I am the architect as well as your guide. Your first goal is to find the shortest route through the Maze—a simple task, I assure you, if you know what to look for. I have planted clues throughout for your interpretation—or misinterpretation. Indeed, you will be fascinated by the Maze’s ambiguity, stimulated by its mystery, stymied by its riddle. But fear not! I will be with you all the way. Fear not, that is, if you truly believe that my clues or I can be trusted.'),
      para('Tempted? Test your wits against mine. I guarantee that my Maze will challenge you to think in ways you’ve never thought before. But beware… one wrong turn and you may never escape.'),
    ),
  );
  return { el, title: 'Maze' };
}

function textPage(opts: {
  cls: string;
  heading: string;
  plate: typeof coverPlate;
  alt: string;
  body: (HTMLElement | null)[];
}): HTMLElement {
  return h(
    'section',
    { class: `room ${opts.cls}` },
    h('header', { class: 'room-head' }, h('span'), h('h1', { class: 'room-title' }, h('span', { class: 'room-word' }, opts.heading)), h('span')),
    h(
      'div',
      { class: 'room-body' },
      h('div', { class: 'plate-col' }, zoomable(opts.plate, opts.alt)),
      h('article', { class: 'page-col' }, ...opts.body),
    ),
  );
}

export function directionsView(): View {
  const el = textPage({
    cls: 'directions',
    heading: 'Mode d’emploi',
    plate: directionsPlate,
    alt: 'Illustration du mode d’emploi',
    body: [
      h(
        'div',
        { class: 'book-text', lang: 'en' },
        para('This is not really a book.'),
        para('This is a building in the shape of a book . . . a maze. Each numbered page depicts a room in the Maze. The doors in each room lead to other rooms. For example, the room on page 1 has doors leading to rooms 20, 26, 41, and 21. To go through door number 20, simply turn to page 20.'),
        para('Your challenge is to find your way from room 1 (after the Prologue) to room 45 and then back to room 1 using the shortest possible path. If you use your head, you should be able to make the journey in only sixteen steps.'),
        para('There are any number of clues in the drawings and in the story to help you choose the right door in each room. Clues in a series of rooms may relate to one another, and may indicate a path. Other clues may refer to a specific door in a single room.'),
        para('Anything in this book might be a clue.'),
        para('Not all clues are necessarily trustworthy.'),
        para('Once you’ve found the shortest path in and out of the Maze, challenge yourself further. Go back and find the riddle hidden in room 45. The answer to that riddle is concealed somewhere on the shortest path.'),
      ),
      h(
        'aside',
        { class: 'site-help' },
        h('h2', null, 'Sur ce site'),
        h(
          'ul',
          null,
          h('li', null, 'Clique sur une porte de l’illustration (ou sur son numéro sous l’image) pour la franchir. Le bouton ', h('em', null, 'Portes'), ' les fait toutes apparaître.'),
          h('li', null, 'Ton parcours et le nombre de pas sont enregistrés ; ', h('em', null, 'Revenir'), ' annule le dernier pas.'),
          h('li', null, 'Chaque salle a son bloc-notes, et un carnet général t’accompagne partout (touche N).'),
          h('li', null, 'Clique sur une illustration pour l’agrandir et en scruter les détails.'),
          h('li', null, 'Tout reste dans ton navigateur ; le carnet peut être exporté.'),
        ),
      ),
      h('p', { class: 'next-link' }, h('a', { class: 'btn primary', href: paths.prologue }, 'Lire le prologue', icon('next'))),
    ],
  });
  return { el, title: 'Mode d’emploi' };
}

export function prologueView(): View {
  const el = textPage({
    cls: 'prologue',
    heading: 'Prologue',
    plate: prologuePlate,
    alt: 'Illustration du prologue : la porte du Labyrinthe',
    body: [
      h(
        'div',
        { class: 'book-text', lang: 'en' },
        para('The Maze.'),
        para('I met them at the gate though I usually wait inside. Preoccupied with their own thoughts, impatient, like so many children, they didn’t see who I really was. They never noticed my crown, my pain, the fire in my eyes.'),
        para('Like all the others they think the Maze was made for them; actually, it is the other way around. They think I am some poet who will lead them through the symbols and spaces of this Underworld. They think I will teach them lessons. They should call me Cerberus . . . I am the lesson.'),
        para('The monstrous walls rise up and run away as far as the human eye can see, circling and dividing. Which half is the Maze?'),
        para('Even I get lost. It changes—sometimes slowly, imperceptibly . . . sometimes suddenly. This House is not only made of stone and mortar, wood and paint; it is made of time and mystery, hope and fear. Construction never stops. I take some pride in my role as architect.'),
        para('They think I will guide them to the center. Perhaps I will. . . .'),
        para('The sun was very hot.'),
        h('p', null, h('a', { href: paths.room(1) }, 'Together we walked through the gate into . . .')),
      ),
      h('p', { class: 'next-link' }, h('a', { class: 'btn primary', href: paths.room(1) }, 'Entrer dans la salle 1', icon('next'))),
    ],
  });
  return {
    el,
    title: 'Prologue',
    keys: { ArrowRight: () => (el.querySelector('.next-link a') as HTMLAnchorElement).click() },
  };
}

export function contestView(): View {
  const el = h(
    'section',
    { class: 'prose-page' },
    h('h1', null, 'Le concours de 1985'),
    h(
      'p',
      { class: 'lede' },
      'À sa sortie, le livre promettait 10 000 $ à qui trouverait le chemin le plus court, l’énigme cachée dans la salle 45 et sa réponse. ',
      'Le concours est clos depuis 1987 ; le règlement original est reproduit ici pour le contexte.',
    ),
    h('div', { class: 'book-text', lang: 'en' }, h('h2', null, 'MAZE $10,000 Prize — Official Contest Rules'), contestParagraphs.map(para)),
  );
  return { el, title: 'Le concours' };
}

export function aboutView(): View {
  const el = h(
    'section',
    { class: 'prose-page' },
    h('h1', null, 'À propos'),
    h(
      'p',
      null,
      h('em', null, 'Maze: Solve the World’s Most Challenging Puzzle'),
      ' est un livre de Christopher Manson publié en 1985 par Henry Holt and Company, aujourd’hui épuisé. ',
      'Textes et illustrations appartiennent à leurs ayants droit.',
    ),
    h(
      'p',
      null,
      'Les textes, images et coordonnées des portes proviennent de l’adaptation web d’Al Sweigart (',
      ext('https://github.com/asweigart/mazewebsite', 'asweigart/mazewebsite'),
      '). Ce site en propose une lecture plus confortable : navigation par les portes, parcours, carte et carnet de notes.',
    ),
    h('p', { class: 'muted' }, 'Site non officiel, sans lien avec Christopher Manson ni Henry Holt and Company.'),
    h('h2', null, 'Raccourcis clavier'),
    h(
      'dl',
      { class: 'shortcuts' },
      [
        ['← / →', 'Page précédente / suivante'],
        ['1 … 45', 'Taper le numéro d’une porte de la salle pour la franchir'],
        ['G', 'Aller à une salle'],
        ['R', 'Revenir (annuler le dernier pas)'],
        ['D', 'Afficher / masquer les portes'],
        ['Z', 'Agrandir l’illustration'],
        ['N', 'Ouvrir / fermer le carnet'],
        ['E', 'Écrire dans les notes de la salle'],
        ['C', 'Carte des salles'],
        ['Échap', 'Fermer'],
      ].flatMap(([k, v]) => [h('dt', null, h('kbd', null, k)), h('dd', null, v)]),
    ),
    h('h2', null, 'Pour aller plus loin'),
    h(
      'ul',
      null,
      h('li', null, ext('https://en.wikipedia.org/wiki/Maze:_Solve_the_World%27s_Most_Challenging_Puzzle', 'Maze sur Wikipédia')),
      h('li', null, ext('https://archive.org/details/mazesolvetheworldsmostchallengingpuzzle1985', 'Le livre sur Internet Archive')),
      h('li', null, ext('https://boingboing.net/2015/07/27/escaping-the-maze.html', 'Escaping the Maze'), ' (Boing Boing, 2015)'),
      h('li', null, ext('https://www.thebeliever.net/the-crying-of-page-45/', 'The Crying of Page 45'), ' (Reif Larsen, 2011)'),
      h('li', null, ext('http://gameshelf.jmac.org/2008/03/maze-beautiful-inspirational-u/', 'Maze: beautiful, inspirational, unsolvable'), ' (Jason McIntosh, 2008)'),
      h('li', null, ext('http://www.intotheabyss.net/', 'Into the Abyss'), ' — site consacré aux énigmes visuelles, dont Maze'),
      h('li', null, ext('https://www.mazecast.com/', 'Mazecast'), ' — podcast sur Maze'),
      h('li', null, ext('https://www.typebarmagazine.com/2024/05/29/interpreting-the-abyss-an-ode-to-christopher-mansons-maze/', 'Interpreting the Abyss'), ' (Angus Stewart, 2024) — ', h('strong', null, 'contient des solutions')),
      h('li', null, ext('http://mazecast.wikidot.com/', 'mazecast.wikidot.com'), ' — ', h('strong', null, 'contient des solutions')),
    ),
    h('p', { class: 'muted' }, 'Le jeu vidéo ', h('em', null, 'Blue Prince'), ' (2025) s’inspire largement de Maze, et Christopher Manson y a contribué.'),
  );
  return { el, title: 'À propos' };
}

export function notFoundView(): View {
  const el = h(
    'section',
    { class: 'prose-page center' },
    h('h1', null, 'Une porte qui ne mène nulle part'),
    h('p', { class: 'muted' }, 'Cette page n’existe pas… ou alors elle a changé de place. Le Labyrinthe change parfois.'),
    h('p', null, h('a', { class: 'btn primary', href: paths.home }, 'Retour à l’entrée')),
    h('img', { src: imageUrl('room24', 'thumb'), alt: '', class: 'notfound-img' }),
  );
  return { el, title: 'Introuvable' };
}

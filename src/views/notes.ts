import { imageUrl } from '../data';
import { h, icon } from '../dom';
import { globalNote, noteField, roomNote, type NoteField } from '../components/noteField';
import { paths } from '../router';
import { store } from '../store';
import type { View } from './types';

function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toMarkdown(): string {
  const { notes, journey } = store.get();
  const out = ['# Maze — mes notes', ''];
  if (notes.global.trim()) out.push('## Carnet', '', notes.global.trim(), '');
  const rooms = Object.keys(notes.rooms).map(Number).sort((a, b) => a - b);
  for (const n of rooms) out.push(`## Salle ${n}`, '', notes.rooms[n].trim(), '');
  if (journey.length) out.push('## Parcours', '', journey.map((s) => s.room).join(' → '), '');
  return out.join('\n');
}

export function notesView(): View {
  const fields: NoteField[] = [];
  const global = noteField({ ...globalNote, id: 'note-global-page', label: 'Carnet général', placeholder: 'Hypothèses, chemins possibles, symboles récurrents, l’énigme de la salle 45…', rows: 10 });
  fields.push(global);

  const list = h('div', { class: 'room-notes' });
  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });

  function renderList() {
    fields.splice(1).forEach((f) => f.dispose());
    const rooms = Object.keys(store.get().notes.rooms).map(Number).sort((a, b) => a - b);
    list.replaceChildren(
      ...(rooms.length
        ? rooms.map((n) => {
            const f = noteField({ ...roomNote(n), id: `note-list-${n}`, label: `Salle ${n}`, placeholder: 'Note vide (elle sera supprimée)', rows: 3 });
            fields.push(f);
            return h(
              'article',
              { class: 'room-note-card' },
              h('a', { href: paths.room(n), class: 'room-note-thumb', 'aria-label': `Aller à la salle ${n}` }, h('img', { src: imageUrl(`room${n}`, 'thumb'), alt: '', loading: 'lazy' }), h('span', null, n)),
              f.el,
            );
          })
        : [h('p', { class: 'muted' }, 'Aucune note de salle pour l’instant. Chaque salle a un bloc-notes sous son texte (touche E).')]),
    );
  }
  renderList();

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      if (confirm('Remplacer tes notes et ta progression actuelles par celles de ce fichier ?')) {
        store.importJson(text);
        renderList();
      }
    } catch {
      alert('Ce fichier ne semble pas être une sauvegarde valide.');
    }
    fileInput.value = '';
  });

  const el = h(
    'section',
    { class: 'notes-page' },
    h('header', { class: 'page-header' }, h('h1', null, 'Carnet de notes'), h('p', { class: 'muted' }, 'Tout est enregistré automatiquement dans ce navigateur.')),
    h('div', { class: 'notes-global' }, global.el),
    h('h2', null, 'Notes par salle'),
    list,
    h(
      'section',
      { class: 'backup' },
      h('h2', null, 'Sauvegarde'),
      h('p', { class: 'muted' }, 'Les notes restent sur cet appareil. Exporte-les pour les garder ou les transférer.'),
      h(
        'div',
        { class: 'backup-actions' },
        h('button', { type: 'button', class: 'btn', onclick: () => download('maze-notes.md', toMarkdown(), 'text/markdown') }, icon('download'), 'Exporter en Markdown'),
        h('button', { type: 'button', class: 'btn', onclick: () => download('maze-sauvegarde.json', store.exportJson(), 'application/json') }, icon('download'), 'Sauvegarde complète (.json)'),
        h('button', { type: 'button', class: 'btn', onclick: () => fileInput.click() }, icon('upload'), 'Restaurer une sauvegarde'),
        fileInput,
      ),
    ),
  );

  return { el, title: 'Carnet de notes', dispose: () => fields.forEach((f) => f.dispose()) };
}

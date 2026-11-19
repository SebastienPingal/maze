import { h } from '../dom';
import { store } from '../store';

export interface NoteField {
  el: HTMLElement;
  textarea: HTMLTextAreaElement;
  dispose: () => void;
}

/**
 * Autosaving textarea bound to a note in the store. Several fields can show the same
 * note at once (e.g. drawer + notes page); they stay in sync.
 */
export function noteField(opts: {
  get: () => string;
  set: (v: string) => void;
  placeholder: string;
  label: string;
  rows?: number;
  id: string;
}): NoteField {
  const status = h('span', { class: 'note-status', 'aria-live': 'polite' });
  const textarea = h('textarea', {
    id: opts.id,
    class: 'note-input',
    rows: opts.rows ?? 6,
    placeholder: opts.placeholder,
    spellcheck: 'true',
  });
  textarea.value = opts.get();

  let timer: number | undefined;
  textarea.addEventListener('input', () => {
    status.textContent = '…';
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      opts.set(textarea.value);
      status.textContent = 'Enregistré';
      timer = window.setTimeout(() => (status.textContent = ''), 1600);
    }, 300);
    autoGrow();
  });
  textarea.addEventListener('blur', () => {
    if (textarea.value !== opts.get()) opts.set(textarea.value);
  });

  function autoGrow() {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight + 2, 0)}px`;
  }
  requestAnimationFrame(autoGrow);

  const unsubscribe = store.subscribe(() => {
    const v = opts.get();
    if (document.activeElement !== textarea && textarea.value !== v) {
      textarea.value = v;
      autoGrow();
    }
  });

  const el = h(
    'div',
    { class: 'note-field' },
    h('div', { class: 'note-head' }, h('label', { for: opts.id }, opts.label), status),
    textarea,
  );

  return {
    el,
    textarea,
    dispose: () => {
      if (textarea.value !== opts.get()) opts.set(textarea.value);
      window.clearTimeout(timer);
      unsubscribe();
    },
  };
}

export const roomNote = (n: number) => ({
  get: () => store.get().notes.rooms[n] ?? '',
  set: (v: string) => store.setRoomNote(n, v),
});

export const globalNote = {
  get: () => store.get().notes.global,
  set: (v: string) => store.setGlobalNote(v),
};

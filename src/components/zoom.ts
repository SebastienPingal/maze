import type { Plate } from '../data';
import { h, icon } from '../dom';
import { renderPlate, type PlateOptions } from './plate';

const MIN = 1;
const MAX = 6;

/** Full-screen viewer with wheel / pinch zoom and drag panning. Doors stay clickable. */
export function openZoom(plate: Plate, opts: PlateOptions) {
  const previousFocus = document.activeElement as HTMLElement | null;
  const content = renderPlate(plate, { ...opts, variant: 'full', eager: true });
  content.classList.add('show-doors-hover');
  const stage = h('div', { class: 'zoom-stage' }, content);

  let k = 1;
  let x = 0;
  let y = 0;

  const btn = (name: Parameters<typeof icon>[0], label: string, fn: () => void, text?: string) =>
    h('button', { class: 'zoom-btn', type: 'button', title: label, 'aria-label': label, onclick: fn }, text ?? icon(name));

  const viewport = h('div', { class: 'zoom-viewport' }, stage);
  const overlay = h(
    'div',
    { class: 'zoom', role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.alt },
    viewport,
    h(
      'div',
      { class: 'zoom-toolbar' },
      btn('zoom', 'Zoom arrière', () => zoomBy(1 / 1.5), '−'),
      btn('zoom', 'Zoom avant', () => zoomBy(1.5), '+'),
      btn('restart', 'Ajuster à l’écran', () => set(1, 0, 0)),
      btn('close', 'Fermer (Échap)', close),
    ),
    h('p', { class: 'zoom-hint' }, 'Molette ou pincement pour zoomer · glisser pour se déplacer · double-clic pour agrandir'),
  );

  function fit() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const ratio = plate.width / plate.height;
    const w = Math.min(vw, vh * ratio);
    stage.style.width = `${w}px`;
    stage.style.height = `${w / ratio}px`;
  }

  function clamp() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = stage.offsetWidth * k;
    const sh = stage.offsetHeight * k;
    const mx = Math.max(0, (sw - vw) / 2);
    const my = Math.max(0, (sh - vh) / 2);
    x = Math.min(mx, Math.max(-mx, x));
    y = Math.min(my, Math.max(-my, y));
  }

  function set(nk: number, nx: number, ny: number) {
    k = Math.min(MAX, Math.max(MIN, nk));
    x = nx;
    y = ny;
    clamp();
    stage.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    overlay.classList.toggle('zoomed', k > 1.01);
  }

  /** Zoom by factor f keeping the viewport point (px, py), relative to its center, fixed. */
  function zoomBy(f: number, px = 0, py = 0) {
    const nk = Math.min(MAX, Math.max(MIN, k * f));
    const r = nk / k;
    set(nk, px - (px - x) * r, py - (py - y) * r);
  }

  function rel(e: { clientX: number; clientY: number }) {
    const r = viewport.getBoundingClientRect();
    return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2] as const;
  }

  viewport.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const [px, py] = rel(e);
      zoomBy(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0018)), px, py);
    },
    { passive: false },
  );

  viewport.addEventListener('dblclick', (e) => {
    const [px, py] = rel(e);
    if (k > 1.5) set(1, 0, 0);
    else zoomBy(2.5, px, py);
  });

  // Pointer handling: one pointer pans, two pointers pinch.
  const pointers = new Map<number, { x: number; y: number }>();
  let moved = 0;
  let pinchDist = 0;

  viewport.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) moved = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });

  viewport.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    if (pointers.size === 1) {
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 6) viewport.setPointerCapture(e.pointerId);
      set(k, x + dx, y + dy);
    } else if (pointers.size === 2) {
      moved = 100;
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const [px, py] = rel({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
      if (pinchDist) zoomBy(d / pinchDist, px, py);
      pinchDist = d;
    }
  });

  const up = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
  };
  viewport.addEventListener('pointerup', up);
  viewport.addEventListener('pointercancel', up);

  // A drag must not count as a click on a door.
  viewport.addEventListener(
    'click',
    (e) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if ((e.target as Element).closest('a.door')) close();
    },
    true,
  );

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
    else if (e.key === '+' || e.key === '=') zoomBy(1.5);
    else if (e.key === '-') zoomBy(1 / 1.5);
    else if (e.key === '0') set(1, 0, 0);
    else return;
    e.preventDefault();
    e.stopPropagation();
  }

  function onResize() {
    fit();
    set(k, x, y);
  }

  function close() {
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('popstate', close);
    overlay.remove();
    document.body.classList.remove('no-scroll');
    previousFocus?.focus?.();
  }

  document.addEventListener('keydown', onKey, true);
  window.addEventListener('resize', onResize);
  window.addEventListener('popstate', close);
  document.body.append(overlay);
  document.body.classList.add('no-scroll');
  fit();
  set(1, 0, 0);
  (overlay.querySelector('.zoom-btn:last-child') as HTMLButtonElement).focus();
}

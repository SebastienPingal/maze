export type Route =
  | { name: 'home' }
  | { name: 'directions' }
  | { name: 'prologue' }
  | { name: 'room'; n: number }
  | { name: 'map' }
  | { name: 'notes' }
  | { name: 'contest' }
  | { name: 'about' }
  | { name: 'notfound' };

export function parse(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { name: 'home' };
  const room = /^\/(?:salle|room)\/(\d{1,2})$/.exec(path);
  if (room) {
    const n = Number(room[1]);
    return n >= 1 && n <= 45 ? { name: 'room', n } : { name: 'notfound' };
  }
  const simple: Record<string, Route> = {
    '/mode-d-emploi': { name: 'directions' },
    '/prologue': { name: 'prologue' },
    '/carte': { name: 'map' },
    '/carnet': { name: 'notes' },
    '/concours': { name: 'contest' },
    '/a-propos': { name: 'about' },
  };
  return simple[path] ?? { name: 'notfound' };
}

export const paths = {
  home: '/',
  directions: '/mode-d-emploi',
  prologue: '/prologue',
  room: (n: number) => `/salle/${n}`,
  map: '/carte',
  notes: '/carnet',
  contest: '/concours',
  about: '/a-propos',
};

/** How the reader arrived at the current page; used to record the journey. */
export type NavKind = 'door' | 'jump' | 'history' | 'initial';

type Handler = (route: Route, kind: NavKind) => void;
let handler: Handler = () => {};

export function startRouter(h: Handler) {
  handler = h;
  window.addEventListener('popstate', () => handler(parse(location.pathname), 'history'));

  // Intercept same-origin links. A data-via="door" attribute marks a door crossing.
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest?.('a');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href') ?? a.getAttribute('xlink:href');
    if (!href || !href.startsWith('/') || href.startsWith('//')) return;
    e.preventDefault();
    navigate(href, a.dataset.via === 'door' ? 'door' : 'jump');
  });

  handler(parse(location.pathname), 'initial');
}

export function navigate(href: string, kind: 'door' | 'jump' = 'jump', replace = false) {
  if (href === location.pathname && !replace) {
    window.scrollTo({ top: 0 });
    return;
  }
  if (replace) history.replaceState(null, '', href);
  else history.pushState(null, '', href);
  handler(parse(location.pathname), kind);
}

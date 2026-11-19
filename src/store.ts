/**
 * Persistent reader state (localStorage): journey through the maze, visited rooms,
 * doors taken, and notes.
 */

export type Via = 'door' | 'jump';

export interface Step {
  room: number;
  via: Via;
  at: number;
}

export interface State {
  version: 1;
  journey: Step[];
  visited: number[];
  /** Doors taken, as "from>to". */
  edges: string[];
  notes: {
    global: string;
    rooms: Record<string, string>;
  };
  prefs: {
    showDoors: boolean;
  };
  updatedAt: number;
}

const KEY = 'maze-state-v1';

function emptyState(): State {
  return {
    version: 1,
    journey: [],
    visited: [],
    edges: [],
    notes: { global: '', rooms: {} },
    prefs: { showDoors: false },
    updatedAt: Date.now(),
  };
}

function sanitize(raw: unknown): State {
  const base = emptyState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<State>;
  const isRoom = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 45;
  return {
    version: 1,
    journey: Array.isArray(r.journey)
      ? r.journey
          .filter((s) => s && isRoom(s.room))
          .map((s) => ({ room: s.room, via: s.via === 'door' ? 'door' : 'jump', at: Number(s.at) || 0 }))
      : [],
    visited: Array.isArray(r.visited) ? [...new Set(r.visited.filter(isRoom))] : [],
    edges: Array.isArray(r.edges) ? [...new Set(r.edges.filter((e) => typeof e === 'string' && /^\d+>\d+$/.test(e)))] : [],
    notes: {
      global: typeof r.notes?.global === 'string' ? r.notes.global : '',
      rooms: Object.fromEntries(
        Object.entries(r.notes?.rooms ?? {}).filter(([k, v]) => isRoom(Number(k)) && typeof v === 'string' && v.trim()),
      ),
    },
    prefs: { showDoors: Boolean(r.prefs?.showDoors) },
    updatedAt: Number(r.updatedAt) || Date.now(),
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitize(JSON.parse(raw)) : emptyState();
  } catch {
    return emptyState();
  }
}

let state = load();
const listeners = new Set<() => void>();
let saveTimer: number | undefined;

function persist() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable (private mode, quota): state lives for this session only */
    }
  }, 150);
}

function commit(mutate: (s: State) => void, notify = true) {
  mutate(state);
  state.updatedAt = Date.now();
  persist();
  if (notify) listeners.forEach((l) => l());
}

window.addEventListener('beforeunload', () => {
  if (saveTimer !== undefined) {
    window.clearTimeout(saveTimer);
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
});

// Keep several open tabs in sync.
window.addEventListener('storage', (e) => {
  if (e.key === KEY && e.newValue) {
    try {
      state = sanitize(JSON.parse(e.newValue));
      listeners.forEach((l) => l());
    } catch {
      /* ignore */
    }
  }
});

export const store = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /** Record an arrival in a room. */
  enterRoom(room: number, via: Via) {
    const last = state.journey[state.journey.length - 1];
    if (last && last.room === room) return;
    commit((s) => {
      if (via === 'door' && last) {
        const edge = `${last.room}>${room}`;
        if (!s.edges.includes(edge)) s.edges.push(edge);
      }
      s.journey.push({ room, via, at: Date.now() });
      if (!s.visited.includes(room)) s.visited.push(room);
    });
  },

  /** Remove the last step and return the room to go back to. */
  undoStep(): number | undefined {
    if (state.journey.length < 2) return undefined;
    commit((s) => {
      s.journey.pop();
    });
    return state.journey[state.journey.length - 1].room;
  },

  /** Start a new journey from the given room (keeps visited rooms and notes). */
  restartJourney(from?: number) {
    commit((s) => {
      s.journey = from ? [{ room: from, via: 'jump', at: Date.now() }] : [];
    });
  },

  resetProgress() {
    commit((s) => {
      s.journey = [];
      s.visited = [];
      s.edges = [];
    });
  },

  setRoomNote(room: number, text: string) {
    commit((s) => {
      if (text.trim()) s.notes.rooms[room] = text;
      else delete s.notes.rooms[room];
    }, false);
    listeners.forEach((l) => l());
  },

  setGlobalNote(text: string) {
    commit((s) => {
      s.notes.global = text;
    }, false);
    listeners.forEach((l) => l());
  },

  setShowDoors(v: boolean) {
    commit((s) => {
      s.prefs.showDoors = v;
    });
  },

  exportJson(): string {
    return JSON.stringify(state, null, 2);
  },

  importJson(text: string) {
    const parsed = sanitize(JSON.parse(text));
    commit((s) => Object.assign(s, parsed));
  },
};

/** Number of doors taken in the current journey. */
export function stepCount(journey: Step[]): number {
  return journey.filter((s, i) => i > 0 && s.via === 'door').length;
}

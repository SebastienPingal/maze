export interface View {
  el: HTMLElement;
  title: string;
  /** Page-specific keyboard shortcuts (key → action). */
  keys?: Record<string, () => void>;
  /** Rooms reachable by typing their number on the keyboard (room pages). */
  doorTargets?: number[];
  focusNote?: () => void;
  dispose?: () => void;
}

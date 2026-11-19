import { imageUrl, type Plate } from '../data';
import { h, s } from '../dom';
import { paths } from '../router';

export interface PlateOptions {
  alt: string;
  variant?: 'display' | 'full';
  /** Rooms whose door should be marked as already visited. */
  visited?: Set<number>;
  /** Doors already taken from this room. */
  taken?: Set<number>;
  eager?: boolean;
}

function centroid(points: number[]): [number, number] {
  let x = 0;
  let y = 0;
  const n = points.length / 2;
  for (let i = 0; i < points.length; i += 2) {
    x += points[i];
    y += points[i + 1];
  }
  return [x / n, y / n];
}

/** An illustration with its doors drawn as an SVG overlay in image-pixel coordinates. */
export function renderPlate(plate: Plate, opts: PlateOptions): HTMLDivElement {
  const img = h('img', {
    src: imageUrl(plate.image, opts.variant ?? 'display'),
    alt: opts.alt,
    width: plate.width,
    height: plate.height,
    decoding: 'async',
    loading: opts.eager ? 'eager' : 'lazy',
    fetchpriority: opts.eager ? 'high' : null,
    draggable: 'false',
  });

  const labelR = Math.round(plate.width * 0.024);
  const svg = s(
    'svg',
    {
      class: 'doors',
      viewBox: `0 0 ${plate.width} ${plate.height}`,
      preserveAspectRatio: 'none',
      role: 'group',
      'aria-label': 'Portes',
    },
    plate.doors.map((d) => {
      const [cx, cy] = centroid(d.points);
      const cls = ['door', opts.visited?.has(d.to) && 'visited', opts.taken?.has(d.to) && 'taken']
        .filter(Boolean)
        .join(' ');
      return s(
        'a',
        { class: cls, href: paths.room(d.to), 'data-via': 'door', 'data-to': d.to, 'aria-label': `Porte vers la salle ${d.to}` },
        s('title', null, `Salle ${d.to}`),
        s('polygon', { points: d.points.join(' ') }),
        s(
          'g',
          { class: 'door-label', transform: `translate(${cx} ${cy})` },
          s('circle', { r: labelR }),
          s('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': labelR * 1.15 }, d.to),
        ),
      );
    }),
  );

  return h('div', { class: 'plate', style: `aspect-ratio: ${plate.width} / ${plate.height}` }, img, svg);
}

import roomsJson from './data/rooms.json';
import sizesJson from './data/sizes.json';
import contestJson from './data/contest.json';

export interface Door {
  to: number;
  /** Polygon points in full-resolution image pixels: x1,y1,x2,y2,... */
  points: number[];
}

export interface Plate {
  /** Base image name in /images (without extension). */
  image: string;
  width: number;
  height: number;
  doors: Door[];
}

export interface Room extends Plate {
  n: number;
  paragraphs: string[];
}

const sizes = sizesJson as unknown as Record<string, [number, number]>;

function plate(image: string, doors: Door[] = []): Plate {
  const [width, height] = sizes[image];
  return { image, width, height, doors };
}

export const ROOM_COUNT = 45;

export const rooms: Room[] = (roomsJson.rooms as { n: number; paragraphs: string[]; doors: Door[] }[]).map(
  (r) => ({ ...plate(`room${r.n}`, r.doors), n: r.n, paragraphs: r.paragraphs }),
);

export function getRoom(n: number): Room | undefined {
  return rooms[n - 1];
}

/** The prologue's gate leads to room 1 (coordinates scaled from the original thumbnail map). */
export const prologuePlate = plate('prologue', [
  { to: 1, points: [529, 277, 1491, 277, 1491, 1375, 529, 1375] },
]);
export const directionsPlate = plate('directions');
export const coverPlate = plate('cover');

export const contestParagraphs = contestJson as string[];

export const imageUrl = (name: string, variant: 'display' | 'full' | 'thumb' = 'display') =>
  `/images/${name}${variant === 'display' ? '' : `-${variant}`}.webp`;

// Shapes of the JSON metadata exported by the art pipeline.

export type Pt = [number, number];

export interface RoomHotspotMeta {
  poly?: Pt[];
  walk?: Pt;
  face?: 'up' | 'down' | 'left' | 'right';
}

export interface RoomObjectMeta {
  x: number;
  y: number;
  w: number;
  h: number;
  baseline: number | null;
  state: boolean;
  depth: number | null;
  variants?: string[];
}

export interface RoomAnimMeta {
  x: number;
  y: number;
  w: number;
  h: number;
  frames: number;
  fps: number;
  depth: number | null;
}

export interface RoomMeta {
  name: string;
  w: number;
  h: number;
  hotspots: Record<string, RoomHotspotMeta>;
  walk: { poly: Pt[]; holes: Pt[][] }[];
  points: Record<string, { x: number; y: number; face?: 'up' | 'down' | 'left' | 'right' }>;
  objects: Record<string, RoomObjectMeta>;
  variants: string[];
  anims: Record<string, RoomAnimMeta>;
  rain?: { x: number; y: number; w: number; h: number; density: number; kind: 'window' | 'outdoor' }[];
  scale?: { yFar: number; sFar: number; yNear: number; sNear: number };
  floor?: string;
}

export interface CharMeta {
  id: string;
  frameW: number;
  frameH: number;
  anchorX: number;
  anchorY: number;
  sizes: { k: number; file: string }[];
  anims: Record<string, { frames: number[]; fps: number; loop: boolean }>;
  color: string;
}

export interface AssetManifest {
  rooms: string[];
  chars: string[];
  items: string[];
  ui: string[];
}

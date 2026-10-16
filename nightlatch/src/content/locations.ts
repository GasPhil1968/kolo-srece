import type { LocationDef } from '../engine/types';

const L = (id: string, name: string, room: string, x: number, y: number, extra: Partial<LocationDef> = {}): LocationDef =>
  ({ id, name, room, x, y, at: 'from_map', ...extra });

/** Pins on the city map (ui/map.png is painted to match these coordinates). */
export const LOCATIONS: Record<string, LocationDef> = Object.fromEntries(
  [
    L('halcyon', 'Halcyon House', 'halcyon_gate', 50, 36, { when: 'chapter=3', at: 'start' }),
    L('cemetery', 'St. Brigid’s Cemetery', 'cemetery', 98, 50),
    L('mission', 'St. Brigid’s Mission', 'mission', 124, 60),
    L('cityhall', 'City Hall', 'radio_booth', 176, 56, { when: 'chapter=7', at: 'door_spot' }),
    L('commission', 'Harbor Commission', 'commission', 214, 66),
    L('precinct', '1st Precinct', 'precinct', 150, 80),
    L('gazette', 'Brackwater Gazette', 'gazette', 116, 96),
    L('pharmacy', 'Kessler’s Pharmacy', 'pharmacy', 86, 112),
    L('office', 'Rook’s Office, Marrow St.', 'office', 156, 104),
    L('hask', 'Hask’s Lock & Key', 'hask_shop', 168, 116),
    L('hotel', 'Hotel Sorrento', 'hotel_lobby', 202, 106),
    L('bellwether', 'Bellwether Apartments', 'nora_flat', 244, 94),
    L('lantern', 'The Blue Lantern', 'lantern', 226, 128),
    L('pier9', 'Pier 9', 'pier9', 264, 148),
    L('pier4', 'Pier 4 \u2014 MV Calypso', 'calypso_deck', 194, 154, { when: 'false', at: 'start' }),
  ].map((l) => [l.id, l]),
);

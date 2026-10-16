import type { Content, DialogDef, RoomDef } from '../engine/types';
import { CHAPTERS } from './chapters';
import { CLOSEUPS } from './closeups';
import { CLUES, DEDUCTIONS, PEOPLE, TIMELINES } from './clues';
import { DOCS } from './docs';
import * as ending from './ending';
import { ITEMS } from './items';
import { LOCATIONS } from './locations';
import { NPCS } from './npcs';
import { START } from './story';
import * as dlg1 from './dialogs/ch1';
import * as dlg2 from './dialogs/ch2';
import * as dlg6 from './dialogs/ch6';
import * as phone from './dialogs/phone';
import * as recurring from './dialogs/recurring';
import * as calypso from './rooms/calypso';
import * as cityhall from './rooms/cityhall';
import * as commission from './rooms/commission';
import * as gazette from './rooms/gazette';
import * as halcyon from './rooms/halcyon';
import * as hotel from './rooms/hotel';
import * as lantern from './rooms/lantern';
import * as mission from './rooms/mission';
import * as flat from './rooms/nora_flat';
import * as office from './rooms/office';
import * as pharmacy from './rooms/pharmacy';
import * as pier from './rooms/pier';
import * as precinct from './rooms/precinct';

function collect<T extends { id: string }>(mods: Record<string, unknown>[], test: (v: unknown) => boolean): Record<string, T> {
  const out: Record<string, T> = {};
  for (const m of mods) for (const v of Object.values(m)) if (test(v)) out[(v as T).id] = v as T;
  return out;
}

const isRoom = (v: unknown) => !!v && typeof v === 'object' && 'hotspots' in (v as object) && 'id' in (v as object);
const isDialog = (v: unknown) => !!v && typeof v === 'object' && 'nodes' in (v as object) && 'npc' in (v as object);

const roomMods = [hotel, office, flat, lantern, pier, pharmacy, gazette, mission, commission, precinct, halcyon, calypso, cityhall];
const dialogMods = [dlg1, dlg2, dlg6, phone, recurring, mission, commission, precinct, halcyon, calypso, cityhall, ending];

export const CONTENT: Content = {
  rooms: collect<RoomDef>(roomMods, isRoom),
  items: ITEMS,
  npcs: NPCS,
  dialogs: collect<DialogDef>(dialogMods, isDialog),
  clues: CLUES,
  deductions: DEDUCTIONS,
  timelines: TIMELINES,
  docs: DOCS,
  closeups: CLOSEUPS,
  chapters: CHAPTERS,
  locations: LOCATIONS,
  people: PEOPLE,
  defaults: {
    look: ['Nothing special about it.', 'I look. It looks back. Neither of us learns anything.', 'Just what it looks like.'],
    use: ['I can\u2019t see what that would accomplish.', 'That won\u2019t help.', 'I\u2019d rather not.'],
    item: ['That doesn\u2019t work.', 'I can\u2019t make those two get along.', 'No. Not even on a bad day.'],
    talk: ['Nothing to say.', 'They\u2019re not much of a talker.'],
    combine: ['I can\u2019t see a connection between those.', 'Those don\u2019t go together.', 'No luck.'],
  },
  start: START,
  watch: ending.WATCH,
  playerSprite: [['chapter=1 & !c1_hat_taken', 'rook_nohat']],
};

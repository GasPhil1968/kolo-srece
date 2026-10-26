import type { CloseupDef } from '../engine/types';

export const CLOSEUPS: Record<string, CloseupDef> = {
  pike_lock: {
    id: 'pike_lock',
    kind: 'combo',
    title: 'Pike\u2019s drawer \u2014 three-wheel lock',
    solution: '417',
    wheels: 3,
    knownWhen: 'c2_desk_ok & c2_saw_417',
    solved: [
      { sfx: 'drawer_open' }, { give: 'pike_camera' }, { clue: 'pike_notes' }, { doc: 'pike_notes' },
      'Pike\u2019s notebook, and his camera. The counter says the roll inside is half used.',
      'Whatever Pike saw before he vanished is still in there, in the dark.',
      'And Kerrigan, Pike says, sleeps at St. Brigid\u2019s Mission.', { unlock: 'mission' },
      { autosave: 'Chapter 2 \u2014 Pike\u2019s drawer' },
    ],
    wrong: ['Not that one. Pike used one number for everything, Abernathy said.'],
  },
  briefcase_lock: {
    id: 'briefcase_lock',
    kind: 'combo',
    title: 'Delaney\u2019s briefcase',
    solution: '226',
    wheels: 3,
    knownWhen: 'clue:badge_226',
    solved: [
      { sfx: 'padlock_open' }, { set: 'c7_case_open' }, { unstash: true }, { give: 'calypso_manifest' }, { give: 'blank_form' }, { give: 'rubber_stamp' },
      'Two-two-six. Frank, Frank.',
      'Everything they took off me \u2014 Frank collected the whole set \u2014 and the Calypso\u2019s own papers.',
      'Under the papers: a stack of blank accreditation forms for the Commission gala, and the purser\u2019s stamp. Anyone with those could be anybody.',
      { doc: 'calypso_manifest' }, { clue: 'telegram' },
      { autosave: 'Chapter 7 \u2014 The briefcase' },
    ],
    wrong: ['No. Frank only ever had one number.'],
  },
  patch_booth: {
    id: 'patch_booth',
    kind: 'patch',
    title: 'WBRK patch bay',
    solution: 'BOOTH MIC-PROGRAM LINE',
    jacks: ['BOOTH MIC', 'HALL MIC', 'TURNTABLE', 'PROGRAM LINE', 'MONITOR', 'TALKBACK'],
    knownWhen: 'clue:patch_card',
    solved: [{ set: 'c8_patched' }, 'Booth mic to program line. When the key turns, the city hears this room.'],
    wrong: ['That\u2019s not what the engineer\u2019s card says.'],
  },
};

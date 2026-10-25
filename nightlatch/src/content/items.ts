import type { ItemDef, Script } from '../engine/types';

const I = (id: string, name: string, look: string | Script, extra: Partial<ItemDef> = {}): ItemDef => ({
  id,
  name,
  look: Array.isArray(look) ? look : [look],
  ...extra,
});

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(
  [
    // ---------------------------------------------------------------- chapter 1 ----
    I('newspaper', 'newspaper', 'The Brackwater Gazette. I give it a proper read.', { doc: 'gazette_oct15' }),
    I('hanger', 'wire hanger', 'A wire coat hanger. Of everything in this room, the only thing with ambition.', {
      combine: {},
    }),
    I('wire', 'straightened wire', 'A hanger with its pretensions removed. Long, stiff, thin enough for a keyhole.'),
    I('key9', 'room key', 'A brass key on a wooden tag: SORRENTO 9.'),
    I('lighter', 'Zippo lighter', [
      "My Zippo. The engraving reads 'To Tommy — from Frank. Partners. 1938.'",
      'Frank Delaney gave it to me the day we both made detective.',
    ]),
    I('matchbook', 'matchbook', [
      'A matchbook from the Blue Lantern on Harbor Street.',
      "Inside the flap, in my handwriting: 'Tue 11'. Tuesday was the ninth.",
    ]),
    I('pocketbook', 'pocket notebook', "My notebook. Every page after October the eighth has been torn out.", {
      doc: 'pocketbook',
    }),
    I('nora_photo', 'photograph of Nora', [
      'Nora Marsh, twenty-six. Dark eyes looking straight into the lens,',
      'like she knew somebody would have to come looking for her.',
    ]),
    I('retainer', 'fifty dollars', [
      'Two twenties and a ten, crisp as a new collar.',
      'Clients who pay in advance worry me. Clients who pay in new bills worry me more.',
    ]),
    I('carbon', 'carbon paper', [
      'A used sheet of carbon paper. The typing is backwards and faint.',
      "I'd need a strong light behind it to read anything.",
    ]),
    // ---------------------------------------------------------------- chapter 2 ----
    I('ice_pick', 'ice pick', 'An ice pick with a wooden handle, rimed with frost. Useful. Unfriendly.'),
    I('rock_salt', 'rock salt', 'A fistful of coarse rock salt. Fishmongers pour it in the brine to keep the tubs from freezing.'),
    I('release_handle', 'release handle', 'A T-shaped iron handle with a square socket. It belongs on the inside of that door.'),
    I('minutes1', 'transcript, page one', 'A typed page in an oilskin packet. Page one of three.', {
      doc: 'minutes1',
      evidence: true,
    }),
    I('vial', 'vial marked L-7', [
      'A small glass vial of clear liquid. The label says HALCYON HOUSE — L-7 — DISPENSARY USE ONLY.',
      "I don't know what L-7 is. I have a feeling it knows me.",
    ], { evidence: true }),
    I('press_card', "Pike's press card", "Wendell Pike's press card. Brackwater Gazette, No. 417. He's smiling in the photo. People usually don't."),
    I('pike_camera', "Pike's camera", [
      "Wendell Pike's folding camera. The counter says the roll inside is half used.",
      "Whatever Pike saw before he disappeared is still in there, in the dark.",
    ]),
    // ---------------------------------------------------------------- chapter 3 ----
    I('negatives', 'negatives', 'A strip of developed negatives. Black where the world was white.'),
    I('contact_sheet', 'contact sheet', 'A contact print of the whole roll, still smelling of fixer.', {
      doc: 'contact_sheet',
      evidence: true,
    }),
    I('padlock_key', 'padlock key', 'A small steel key. Mine, for my own padlock, which I used to lock myself in. Naturally.'),
    I('steno_pad', "Nora's steno pad", [
      "Nora's stenographer's notebook. Pages of Pitman shorthand,",
      'which to me looks like a seismograph having a nervous breakdown.',
    ], { evidence: true }),
    I('lockpicks', 'lock picks', 'My old set of picks in a leather roll. Hask taught me to use them. Hask also taught me not to.'),
    // ---------------------------------------------------------------- chapter 4 ----
    I('spoon', 'tin spoon', 'A tin spoon. The edges are rounded so nobody gets ideas.'),
    I('flat_spoon', 'flattened spoon', 'The handle is ground flat as a screwdriver. Ideas were had.'),
    I('cup', 'cup of water', 'A tin cup of water. It tastes faintly of the pills they wanted me to take.'),
    I('pills', 'pills', "Two white pills from my breakfast tray. 'Vitamins.' I'll take them later. Much later. Never.", {
      evidence: true,
    }),
    I('matches', 'matches', "Three matches wrapped in a scrap of paper. Pike's whole fortune, left to whoever came next."),
    I('straw', 'mattress straw', 'A handful of straw from the mattress. Dry as a sermon.', {
      combine: {
        cup: [{ take: 'straw' }, { give: 'damp_straw' }, { sfx: 'pour' },
          'I pour the water over the straw. Now it\u2019ll smoulder instead of burn.'],
      },
    }),
    I('damp_straw', 'damp straw', "Wet straw. It won't burn so much as sulk — and sulking straw makes smoke."),
    I('halcyon_files', 'Halcyon patient files', 'Patient files from Dr. Vey’s 1949 cabinet. Mine is on top.', {
      doc: 'rook_file',
      evidence: true,
    }),
    // ---------------------------------------------------------------- chapter 5 ----
    I('blanket', 'prison blanket', 'A gray wool blanket. It has been sneezed on by better men than me.'),
    I('cell_keys', 'cell keys', 'A ring of heavy keys. The precinct’s, not mine, but we’re getting acquainted.'),
    I('padlock', 'Meridian padlock', [
      'The padlock from the Meridian’s forward hold, tagged as evidence in 1949.',
      'Brass, scorched black, shackle still locked through a hasp the firemen had to saw off.',
    ], { evidence: true }),
    I('gate_log', 'harbor gate log', 'A page from the harbor gate log, October 21, 1949.', {
      doc: 'gate_log',
      evidence: true,
    }),
    // ---------------------------------------------------------------- chapter 6 ----
    I('minutes2', 'transcript, page two', 'Page two of Nora’s transcript, folded small.', {
      doc: 'minutes2',
      evidence: true,
    }),
    I('lantern', 'hurricane lantern', 'An old hurricane lantern. The tank is bone dry.', {
      combine: {
        rum: [{ take: 'lantern' }, { take: 'rum' }, { give: 'lantern_fueled' }, { sfx: 'pour' },
          'I fill the lantern\u2019s tank with smugglers\u2019 rum. It\u2019s what the smugglers would have wanted.'],
        lighter: ['There\u2019s nothing in the tank to light.'],
      },
    }),
    I('rum', 'smugglers’ rum', 'A dusty bottle of 151-proof rum. More fuel than drink.'),
    I('lantern_fueled', 'filled lantern', 'The lantern, its tank sloshing with rum. Probably the happiest it\u2019s been since 1924.', {
      combine: {
        lighter: [{ take: 'lantern_fueled' }, { give: 'lantern_lit' }, { sfx: 'lighter' },
          'The wick catches with a soft blue whump. A lantern, a lighter and a hundred and fifty-one proof: a man could get somewhere.'],
      },
    }),
    I('lantern_lit', 'lit lantern', 'The lantern burns with a low blue-yellow flame. It smells like a pirate’s funeral.'),
    // ---------------------------------------------------------------- chapter 7 ----
    I('hat', 'my hat', [{ pick: [
      { when: '!c7_matches', do: [{ anim: 'reach_side' }, { set: 'c7_matches' }, { give: 'hat_matches' },
        'I run a finger round the inside of the hatband. Old habits: two matches, tucked in where I once tucked a note.'] },
      { do: ['My hat. Lighter by two matches and heavier by one good idea.'] },
    ] }]),
    I('hat_matches', 'two matches', 'Two matches from my hatband. Old habits. Good habits.'),
    I('walter_knife', "Walter's knife", [
      'A pocket knife with a bone handle, engraved W.M.',
      'Walter Marsh’s knife. Nora carried it in her boot.',
    ]),
    I('calypso_manifest', 'Calypso papers', 'Cargo manifest and a telegram from Delaney’s briefcase.', {
      doc: 'calypso_manifest',
      evidence: true,
    }),
    I('minutes3', 'transcript, page three', 'The last page of Nora’s transcript. The one with the names.', {
      doc: 'minutes3',
      evidence: true,
    }),
    I('booth_key', 'booth key', 'A freshly cut key, still warm from Hask’s machine. WBRK, City Hall.'),
    I('press_pass', 'gala press pass', 'A press pass for the Commission centenary gala. It says I’m H. Abernathy. I don’t look it.'),
    I('gus_log', "Gus's watch log", 'Gus Tolliver’s own watch log for 1949, in pencil, with gull feathers pressed in it.', {
      doc: 'gus_log',
      evidence: true,
    }),
    I('antidote', 'physostigmine ampoule', [{ pick: [
      { when: 'chapter=8 & !c8_clear', do: [{ anim: 'reach_side' }, { set: 'c8_clear' }, { take: 'antidote' },
        'I roll up my sleeve, find a vein on the second try, and push the plunger.', { wait: 900 }, { blur: 0 },
        'The room stops swimming. The furniture goes back where it was. My head is my own again \u2014 for an hour, Kessler said.',
        'An hour is a long time, if you use it well.'] },
      { do: ['A glass ampoule and a syringe from Kessler. \u201cIt clears the fog \u2014 for an hour.\u201d'] },
    ] }]),
    // ---------------------------------------------------------------- chapter 8 ----
    I('self_notes', 'notes in my hand', 'Notes in my own handwriting. I seem to have been expecting me.', { doc: 'self_notes' }),
    I('bulb', 'ON AIR bulb', 'The bulb from the ON AIR lamp. Without it, nobody outside knows we’re live.'),
  ].map((i) => [i.id, i]),
);

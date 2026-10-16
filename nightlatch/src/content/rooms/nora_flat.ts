import type { RoomDef } from '../../engine/types';
import { anim, clue, give, otherwise, pick, set, sfx, when } from '../dsl';

export const nora_flat: RoomDef = {
  id: 'nora_flat',
  name: 'Bellwether Apartments, 3B',
  music: [['c1_record_on', 'lullaby'], ['true', 'sorrow']],
  amb: 'rain_window',
  objects: { carbon_gone: 'c1_carbon_taken' },
  enter: [{ once: 'c1_flat_first', do: ['Bellwether 3B. Somebody got here before me, and they weren’t tidy about it.'] }],
  hotspots: {
    exit_door: {
      name: 'door',
      look: ['The door. The lock wasn’t forced. Whoever came in had a key, or a friend with one.'],
      exit: { to: '', map: true },
    },
    wastebasket: {
      name: 'wastebasket',
      verb: 'Search',
      look: ['A wastebasket. The only thing in the flat nobody bothered to tip over.'],
      use: [pick(
        when('!c1_carbon_taken', anim('pickup_side'), set('c1_carbon_taken'), give('carbon'),
          'Crumpled carbon paper. Typists go through it like other people go through cigarettes.'),
        otherwise('Pencil shavings and a recipe for meatloaf. Nobody wants the meatloaf.'),
      )],
    },
    window: {
      name: 'window',
      look: ['A gray afternoon pressed against the glass. A fire escape zigzags down to the alley.'],
      use: ['The fire escape’s an option. The stairs are a better one.'],
      items: {
        carbon: [anim('reach_side'), 'I hold the carbon up against the window. With the light behind it, backwards runs the right way round.',
          { doc: 'carbon_letter' }, clue('nora_letter'), set('c1_carbon_read'),
          'She wrote to me. She found something at the Commission, and she came to me with it.',
          'And I don’t remember a word of it.'],
      },
    },
    gramophone: {
      name: 'gramophone',
      verb: 'Play',
      look: ['A portable gramophone with a record still on the platter.'],
      use: [sfx('gramophone'), set('c1_record_on'), { music: 'lullaby' },
        '“Lullaby of the Lamplighter.” The Deacon Boone Trio.', clue('lamplighter_record'),
        'Deacon Boone. Plays piano at the Blue Lantern. Has done since before I could drink there legally.'],
    },
    photo: {
      name: 'framed photo',
      look: [clue('family_photo'), '“Walter and Nora, Coney Pier, 1946.”',
        'Walter Marsh. I knew him. Dockworker, union man, a laugh you could hear across the harbor.', 'Just the two of them in the picture.'],
      use: [clue('family_photo'), '“Walter and Nora, Coney Pier, 1946.” Just the two of them.'],
    },
    bookshelf: {
      name: 'bookshelf',
      look: ['Pitman’s Shorthand, a dictionary, Bleak House, and a book about lighthouses. A girl after my own heart.'],
      use: ['I leaf through the shorthand manual. It might as well be Chinese. It might be Chinese.'],
    },
    flour: {
      name: 'spilled flour',
      look: [clue('searched_flat'), 'Somebody upended the flour tin. There’s a footprint in it — a man’s, size twelve, with a heel plate.',
        'They were looking for papers, and they were thorough about it.'],
      use: ['I’m a detective, not a baker.'],
    },
    dresser: {
      name: 'dressing table',
      look: ['Lipstick, a comb, and no message on the mirror. In the pictures there’s always a message on the mirror.'],
      use: ['Nothing in the drawers but stockings and the smell of violets.'],
    },
    bed: {
      name: 'bed',
      look: ['Turned over and stripped. Whoever did it was looking for something flat.'],
      use: ['They already looked. They looked hard.'],
    },
    desk: {
      name: 'desk',
      look: ['A cheap desk. The drawers have been yanked out and emptied onto the rug.'],
      use: ['Typing exercises, bills, a library card. Nora Marsh: excellent at shorthand, late with Dickens.'],
    },
    typewriter: {
      name: 'typewriter',
      look: ['A Remington portable. The ribbon’s new. She liked her typing crisp.'],
      use: ['I type my name. It looks guilty.'],
    },
    papers: {
      name: 'papers',
      look: ['Bills, carbons of nothing, a recipe for meatloaf with NO written across it in red.'],
      use: ['Nothing here they didn’t already throw on the floor.'],
    },
  },
};

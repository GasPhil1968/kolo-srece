import type { RoomDef } from '../../engine/types';
import { S, sfx } from '../dsl';

export const pharmacy: RoomDef = {
  id: 'pharmacy',
  name: 'Kessler’s Pharmacy',
  music: 'city',
  amb: 'rain_street',
  npcs: [{ id: 'kessler', at: 'kessler_spot', face: 'down' }],
  enter: [{ if: 'c2_vial_testing', then: [{ set: 'c2_vial_ready' }] }],
  hotspots: {
    exit_street: {
      name: 'street door',
      look: ['The door, with a bell over it that announces every customer like a butler with a grudge.'],
      exit: { to: '', map: true },
    },
    globes: {
      name: 'show globes',
      look: ['Two great glass globes in the window, one red, one green. A pharmacist’s way of saying “we have chemicals”.'],
      use: ['They’re older than me and in better condition.'],
    },
    shelves: {
      name: 'apothecary jars',
      look: ['Jars labelled in Latin: digitalis, belladonna, laudanum. Half the shelf could kill you and the other half could save you.'],
      use: [S('kessler', 'Please don’t touch the belladonna, Mr. Rook. It has a temper.')],
    },
    counter: {
      name: 'counter',
      look: ['Marble, cold and spotless. Kessler polishes it like it owes him rent.'],
    },
    scales: {
      name: 'brass scales',
      look: ['Brass scales, accurate to a grain. I’d trust them with my life. Kessler does, daily.'],
      use: ['I weigh my options. They’re light.'],
    },
    bell: {
      name: 'counter bell',
      verb: 'Ring',
      look: ['A little brass bell.'],
      use: [sfx('glass_clink'), S('kessler', 'I am standing right in front of you, Mr. Rook.')],
    },
    poison_cabinet: {
      name: 'poison cabinet',
      look: ['A locked cabinet with POISON painted on the glass in red letters. Subtle.'],
      use: ['Locked. Good.'],
    },
    lab_door: {
      name: 'back room',
      look: ['A bead curtain to the back room, where Kessler does chemistry and talks to his retorts.'],
      use: [S('kessler', 'The laboratory is private. The fumes are not.')],
    },
    newspapers: {
      name: 'newspapers',
      look: ['Today’s Gazette. CRANE TO ADDRESS CITY. Crane addresses the city about as often as the city addresses its rent.'],
    },
  },
};

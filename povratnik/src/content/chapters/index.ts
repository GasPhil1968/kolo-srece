// Chapter order of the whole game.
import type { ChapterDef } from '../../core/content';
import type { CombatDef } from '../../core/combat';
import { sarajevo } from './c01_sarajevo';
import { weideChapter } from './c02_weide';
import { dorfChapter } from './c03_dorf';
import { povratnikChapter } from './c04_povratnik';
import { elftageChapter } from './c05_elftage';
import { zaesurChapter } from './c06_zaesur';
import { anconaChapter, anconaDuel } from './c07_ancona';
import { herbergeChapter, herbergeDuel } from './c08_herberge';
import { kolonneChapter } from './c09_kolonne';
import { lagerChapter } from './c10_lager';

export const CHAPTERS: ChapterDef[] = [sarajevo, weideChapter, dorfChapter, povratnikChapter, elftageChapter, zaesurChapter, anconaChapter, herbergeChapter, kolonneChapter, lagerChapter];
export const COMBATS: CombatDef[] = [anconaDuel, herbergeDuel];

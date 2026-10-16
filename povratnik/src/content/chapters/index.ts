// Chapter order of the whole game.
import type { ChapterDef } from '../../core/content';
import type { CombatDef } from '../../core/combat';
import { sarajevo } from './c01_sarajevo';
import { weideChapter } from './c02_weide';
import { dorfChapter } from './c03_dorf';

export const CHAPTERS: ChapterDef[] = [sarajevo, weideChapter, dorfChapter];
export const COMBATS: CombatDef[] = [];

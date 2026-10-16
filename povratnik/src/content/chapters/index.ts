// Chapter order of the whole game.
import type { ChapterDef } from '../../core/content';
import type { CombatDef } from '../../core/combat';
import { sarajevo } from './c01_sarajevo';
import { weideChapter } from './c02_weide';

export const CHAPTERS: ChapterDef[] = [sarajevo, weideChapter];
export const COMBATS: CombatDef[] = [];

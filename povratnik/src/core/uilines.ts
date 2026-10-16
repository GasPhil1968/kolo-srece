// Fallback lines for interactions without a specific response. Every room is expected to
// answer plausible attempts specifically; these only cover the implausible remainder.
export const UI_LINES = {
  look: ['Nichts, was mir weiterhilft.', 'Ich sehe genauer hin. Nichts Neues.', 'Daran ist nichts Besonderes.'],
  take: ['Das lasse ich, wo es ist.', 'Wozu sollte ich das mitnehmen?', 'Das bleibt hier.'],
  use: ['Damit kann ich hier nichts anfangen.', 'Ich wüsste nicht, was das bewirken sollte.', 'Nein. Das bringt nichts.'],
  talkThing: ['Es antwortet nicht.', 'Ich rede nicht mit Dingen. Noch nicht.'],
  useItem: ['Das passt hier nicht.', 'Nein, so geht das nicht.', 'Damit erreiche ich hier nichts.'],
  combine: ['Das passt nicht zusammen.', 'Ich sehe nicht, wie das zusammengehen soll.', 'Nein. Das ergibt nichts.'],
  lookPerson: ['Ich sehe ihn an. Er bemerkt es.'],
  talk: ['Jetzt nicht.'],
  usePerson: ['Das lasse ich lieber.'],
  give: ['Das braucht hier niemand.', 'Dafür hat niemand Verwendung.'],
  noHint: ['Gerade gibt es nichts, wobei ich nicht weiterwüsste.'],
} as const;

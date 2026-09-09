
/* ============================================================
   Sektion 06  PALETTEN
   ------------------------------------------------------------
   M. ist dieselbe Person durch sieben Jahrzehnte. Haut- und Haarton
   bleiben darum in allen Lebensaltern derselbe Grundwert und werden
   nur aufgehellt (ergraut), nie ausgetauscht -- sonst liest der
   Spieler in jedem Kapitel eine neue Figur.
   ============================================================ */
var HAUT_M = '#c9946a', HAAR_M = '#2e2118';
var PAL = {
  /* 1953, elf Jahre, Rosko Polje. Barfuss, ungefaerbte Wolle, ein Hemd,
     das einmal jemand anderem gehoert hat. */
  mKind:   { skin:HAUT_M, hair:HAAR_M, coat:'#8a7a5e', vest:'#6b5c42', shirt:'#c9bda0',
             trouser:'#7a6a4e', shoe:HAUT_M, belt:'#4a3a26' },
  /* 1955, dreizehn, Schulausflug nach Mostar. Erste eigene Schuhe. */
  mSchueler:{ skin:HAUT_M, hair:HAAR_M, coat:'#5c6470', vest:'#4a525c', shirt:'#d8d4c4',
             trouser:'#3a4048', shoe:'#2a2620', belt:'#3a3028' },
  /* 1960er, Marine. Weisses Hemd, dunkelblaue Hose, Matrosenmuetze. */
  /* 1960er, Marine. Die Bildvorlage zeigt eine dunkelblaue Uniform mit
     weisser Muetze und Ringelhemd unter dem Kragen -- nicht die weisse
     Sommeruniform, die hier zuerst stand. */
  mMarine: { skin:HAUT_M, hair:HAAR_M, coat:'#26355a', shirt:'#dfe4e8',
             uniform:'#26355a', uniformTief:'#1e2a49', kragen:'#1a2540', knopf:'#c9a860',
             muetzenband:'#141c30', trouser:'#22304f', shoe:'#14161c', belt:'#14161c' },
  /* 1970er, Sarajevo. Junge Ehe, ein Hemd, eine Weste, kein Geld. */
  mSarajevo:{ skin:HAUT_M, hair:HAAR_M, coat:'#6a5f4c', vest:'#4f4736', shirt:'#dcd2b8',
             trouser:'#3e3a30', shoe:'#26201a', belt:'#31281e' },
  /* 1970er, Deutschland. Werksoverall, ausgegeben, eine Nummer zu gross. */
  /* 1970er, Deutschland. Vorlage: blaue Latzhose ueber ockerfarbenem
     Arbeitshemd, braune Schuhe. */
  mWerk:   { skin:HAUT_M, hair:HAAR_M, coat:'#c29a52', overall:'#4a5f7e', overallTief:'#3a4c66',
             shirt:'#c29a52', trouser:'#415470', shoe:'#4a3524', belt:'#3a4c66' },
  /* 1991. Fast fuenfzig, erstes Grau. Der Anorak aus dem Kaufhaus. */
  mMann:   { skin:'#c08d66', hair:'#4a4038', coat:'#4a5a66', vest:'#3c4a54', shirt:'#cfd4d4',
             trouser:'#333a40', shoe:'#22242a', belt:'#26282c' },
  /* 2004 bis 2018, Podaca. Grau, Hemd offen, Sandalen. Er ist angekommen. */
  mAlt:    { skin:'#bd8f6c', hair:'#c8c2b4', beard:'#cfcabc', mous:'#c4bfb0',
             coat:'#7d8a86', vest:'#6a7672', shirt:'#e2ddcc',
             trouser:'#4a4c48', shoe:'#3a332c', belt:'#3a332c' },
  /* L. Praktisch, liebevoll, stark. Sie traegt in jedem Jahrzehnt
     dieselbe Kittelschuerze in einer anderen Farbe. */
  lena:    { skin:'#c69a76', hair:'#3a2a20', coat:'#8a5a52', vest:'#7a4a44', shirt:'#e0d4bc',
             skirt:'#6b3f3a', schuerze:'#9a6a5e', scarf:'#8a4a42', trim:'rgba(220,180,140,0.4)',
             trouser:'#5a3a34', shoe:'#3a2620' },
  lenaAlt: { skin:'#c09070', hair:'#b8b0a4', coat:'#7a7a86', vest:'#6a6a76', shirt:'#ded8cc',
             skirt:'#5a5a66', schuerze:'#8a8a94', scarf:'#7a7a86',
             trouser:'#4a4a54', shoe:'#33302c' },
  /* Luka, der juengste Enkel. Neun Jahre, Trikot, Turnschuhe, Fragen. */
  luka:    { skin:'#d6a87e', hair:'#3a2a1e', coat:'#2f5f9a', shirt:'#e8ecf0',
             trouser:'#26303c', shoe:'#e2e4e2', belt:'#26303c' },
  /* Vater. Vierzig, sieht aus wie sechzig. Haende, die nicht aufgehen. */
  otac:    { skin:'#a9835f', hair:'#3a3128', beard:'#4a4030', mous:'#443a2c', coat:'#5a4d38',
             vest:'#4a4030', shirt:'#a89878', trouser:'#443a2c', shoe:'#2a2118',
             muetze:'#4a4234' },
  /* Mutter. Kopftuch, Schuerze, immer in Bewegung. */
  majka:   { skin:'#bb9370', hair:'#3a2c22', coat:'#5c4a44', vest:'#4a3a34', shirt:'#c9bca4',
             skirt:'#4a3a34', schuerze:'#7a6258', tuch:'#7a4a40', trouser:'#4a3a34', shoe:'#2a1e18' },
  /* Ivo Andrin. Mantel, Hut, Brille, ein Gesicht wie eine Bruecke. */
  andrin:  { skin:'#c4a888', hair:'#d8d4cc', coat:'#3a3a40', vest:'#2e2e34', shirt:'#e0dcd0',
             sakko:'#3a3a40', hemd:'#e0dcd0', krawatte:'#4a3a3a', muetze:'#33333a',
             brille:'#2a2620', trouser:'#33333a', shoe:'#1e1c1a' },
  /* Der Lehrer, Mostar 1955. Zu grosse Jacke, zu kleine Geduld. */
  petar:   { skin:'#c19871', hair:'#4a4038', mous:'#4a4038', coat:'#6b6350', vest:'#59523f',
             shirt:'#d8cfb4', hemd:'#d8cfb4', sakko:'#6b6350',
             brille:'#2e2820', trouser:'#4a4438', shoe:'#3a3028', belt:'#3a3028' },
  lehrer:  { skin:'#b8906a', hair:'#3a3028', mous:'#3a3028', coat:'#4a5240', vest:'#3c4436',
             sakko:'#4a5240', hemd:'#d8d4c0', krawatte:'#6a3a30',
             shirt:'#d8d4c0', trouser:'#38402f', shoe:'#241f18' },
  /* Josip Broz Tiko. Weisse Sommeruniform, Schirmmuetze, Sonnenbrille. */
  tiko:    { skin:'#c9a884', hair:'#d0cec6', coat:'#eceee8', uniform:'#eceee8', uniformTief:'#d4d8d0',
             kragen:'#e4e8e0', knopf:'#d8b048', muetze:'#eceee8', kokarde:'#d8b048',
             brille:'#1a1a1e', shirt:'#eceee8', trouser:'#e4e6e0', shoe:'#1e1c1a', belt:'#c9a038' },
  /* Narednik Zdravko. Kasernenhofstimme, Bauchansatz, gutes Herz. */
  zdravko: { skin:'#bd8a60', hair:'#33302a', mous:'#3a352e', coat:'#3a4a5e',
             uniform:'#3a4a5e', uniformTief:'#2e3c4c', kragen:'#4a5c72', knopf:'#c9a860',
             muetze:'#2e3c4c', kokarde:'#c9a038', shirt:'#c8ccc8', trouser:'#33404f', shoe:'#1c1e22' },
  /* Admiral Pivopija. Weiss, Gold, eine Nase wie ein Sonnenuntergang. */
  admiral: { skin:'#cf9a78', hair:'#dcd8d0', beard:'#d8d4cc', mous:'#d0ccc4',
             coat:'#f0f2ee', uniform:'#f0f2ee', uniformTief:'#dadedc', kragen:'#e8ece8',
             knopf:'#e0b848', muetze:'#f0f2ee', kokarde:'#e0b848',
             shirt:'#f0f2ee', trouser:'#e8eae6', shoe:'#1c1a18', belt:'#d8b048' },
  /* Safet Susovic. Trainingsjacke, Fussballerfrisur, Wildlederschuhe. */
  safet:   { skin:'#c29a70', hair:'#241c16', coat:'#8a2a2a', vest:'#6f2222', shirt:'#e8e4d8',
             trouser:'#2a2a30', shoe:'#c9b48c', belt:'#2a2a30' },
  /* Yilmaz. Derselbe Overall, dieselbe Schicht, ein Jahr Vorsprung. */
  yilmaz:  { skin:'#a87850', hair:'#231c16', mous:'#2a221a', coat:'#3a4a5c',
             overall:'#3a4a5c', overallTief:'#2a3644', shirt:'#c4c8c4',
             trouser:'#2f3a46', shoe:'#22242a' },
  /* Meister Krause. Kittel, Klemmbrett, Schirmmuetze, kein Boeswilliger. */
  krause:  { skin:'#d0a888', hair:'#8a8478', mous:'#8a8478', coat:'#5a6a60',
             sakko:'#5a6a60', hemd:'#e0e0d8', muetze:'#3a4a42',
             shirt:'#e0e0d8', vest:'#4c5c54', trouser:'#3a4038', shoe:'#26241f', brille:'#33302a' },
  /* Frau Sommer von der Post. Freundlich, hilflos, korrekt. */
  sommer:  { skin:'#d8b294', hair:'#a08050', coat:'#3a5a72', vest:'#2f4a5e', shirt:'#e4e8ec',
             skirt:'#8a4a52', schuerze:'#c2c8cc', trim:'rgba(240,240,235,0.5)',
             trouser:'#8a4a52', shoe:'#2a2620' },
  /* Franjo Tudzmanic. Nur im Fernsehen. Anzug, Krawatte, Stimme. */
  tudz:    { skin:'#c2a284', hair:'#d4d0c8', coat:'#2a3040', sakko:'#2a3040',
             hemd:'#e8e8e0', krawatte:'#8a2a2a', shirt:'#e8e8e0',
             trouser:'#262c38', shoe:'#1a1a1e', brille:'#2a2620' },
  /* Nachbar Jure. Baustelle, Zementstaub, unerschoepfliche Meinung. */
  jure:    { skin:'#b8845a', hair:'#5a5048', mous:'#5a5048', coat:'#7a6a52', vest:'#645640',
             shirt:'#c9bfa4', muetze:'#5f5442', trouser:'#4a4234', shoe:'#2e2820' },
  /* Die Gestalt am Abend. Steinstaub im Haar, Haende zu gross. */
  gestalt: { skin:'#a89684', hair:'#c4bcae', beard:'#bab2a4', mous:'#b0a89a',
             coat:'#585048', vest:'#4a443c', shirt:'#b8b0a2',
             trouser:'#443e36', shoe:'#2a2620' },
  /* Dedo Muratović. Nach der Bildvorlage: wettergegerbte, warme Haut,
     grauer Schnauzbart, dunkles Sakko ueber weissem Hemd, Sonnenbrille.
     Der Hut wechselt pro Kapitel und steckt darum nicht in der Palette. */
  dedo:    { skin:'#d4551c', hair:'#8f2f0a', beard:'#8f2f0a', mous:'#edb070',
             coat:'#6b4a2e', sakko:'#6b4a2e', hemd:'#e2d2aa', krawatte:'#d8811e',
             vest:'#573a22', shirt:'#e2d2aa',
             brille:'#3a1d16', brilleGlas:'#6e3a58',
             trouser:'#4a3220', shoe:'#3a2618', belt:'#3a2618',
             hutRot:'#a8291c', hutHell:'#c2381f', hutGold:'#d8901e' },

  /* Baba Roga. Nie ganz im Bild, nie ganz Farbe. */
  roga:    { skin:'#8c7a72', hair:'#c8c4c0', coat:'#2e2a30', vest:'#262228',
             shirt:'#4a444a', skirt:'#282430', tuch:'#221e26',
             trouser:'#282430', shoe:'#1a1820' }
};

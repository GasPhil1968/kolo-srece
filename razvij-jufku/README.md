# RAZVIJ JUFKU — da se kroz nju Trebević vidi

Igra vještine iz iste kuhinje kao TRI FILDŽANA: jedan `index.html`, Canvas 2D,
Web Audio, localStorage, PWA. Jedna pita = oklagija → razvijanje rukama →
fil → motanje → pečenje → Nanina ocjena. Tri pite "za mačku" i Nana preuzima.

Jufka je mreža od 36 sektora × 7 prstenova: ruka ispod tijesta nosi sve što je
ispred nje, a ono iza nje se razvuče (najviše uz dlan, sredina ostaje deblja).
Debljina = masa / površina; što tanje, to se više vidi šara mušeme.
Ispod praga puca. Jedan potez razvuče najviše ~25 %, dalje dlan klizi.

## Deploy (Netlify)

Zaseban site: **Base directory** `razvij-jufku`, **Publish directory** `razvij-jufku`.
Sve putanje su relativne, pa radi i u podfolderu. Poslije deploya upiši apsolutnu
adresu u `og:image` u `index.html`.

## Provjera

Iz korijena repozitorija (`npm install` jednom, Playwright je devDependency):

    node razvij-jufku/tools/smoke.js   # cijela jedna pita + sva stanja, greške iz konzole
    node razvij-jufku/tools/shot.js    # ekrani u više veličina → tools/out
    node razvij-jufku/tools/icons.js   # ikona i og-cover iz same igre

Test-kuka `window.EP` postoji samo kad je prije učitavanja postavljen `window.__EPTEST`.

## Gdje se šta mijenja

- pragovi tankoće i pucanja, veličina stola: `T_THIN`, `T_TEAR`, `R_T`, `R0` na vrhu
- model tijesta (koliko potez razvuče, kako se raspodijeli): odjeljak JUFKA
- vrste pite i boje fila: tabela `PITE`
- Nanine replike i ocjene: objekt `L`; bodovanje: `gradePita()`
- sušenje i ljepljivost po redu pite: `startPita()`

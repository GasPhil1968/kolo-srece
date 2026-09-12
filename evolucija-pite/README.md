# EVOLUCIJA PITE — od jufke do bureka

Merge/fizika igra iz iste kuhinje kao TRI FILDŽANA: jedan `index.html`, Canvas 2D,
Web Audio, localStorage, PWA. Puštaš pite u tepsiju, dvije iste postaju jedna veća,
Amidža komentariše. Burek je s mesom.

## Deploy (Netlify)

Zaseban site: **Base directory** `evolucija-pite`, **Publish directory** `evolucija-pite`
(ili `.` relativno na base). `netlify.toml` u ovom folderu nosi cache-zaglavlja.
Sve putanje su relativne, pa radi i u podfolderu drugog sitea.
Poslije deploya upiši apsolutnu adresu u `og:image` u `index.html`.

## Provjera

Iz korijena repozitorija (`npm install` jednom, Playwright je devDependency):

    node evolucija-pite/tools/smoke.js      # sva stanja, greške iz konzole
    node evolucija-pite/tools/autoplay.js   # balans: pametan i nasumičan igrač
    node evolucija-pite/tools/shot.js       # ekrani u više veličina → tools/out
    node evolucija-pite/tools/icons.js      # ikona i og-cover iz same igre

Test-kuka `window.EP` postoji samo kad je prije učitavanja postavljen `window.__EPTEST`.

## Gdje se šta mijenja

- nivoi pite (veličina, bodovi, boje, crtanje): tabela `PITE` na vrhu odjeljka PITE
- fizika: objekt `PH`; tepsija i crvena linija: `TRAY`, `DANGER_Y`, `DANGER_T`
- replike Amidže i kraja: objekt `L`
- vjerovatnoće bacanja: `SPAWN_W`

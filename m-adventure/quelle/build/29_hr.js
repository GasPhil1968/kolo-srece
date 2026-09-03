
/* ============================================================
   Sektion 04f  KROATISCHE FASSUNG
   ------------------------------------------------------------
   Diese Tabelle ist der uebersetzbare Teil des Spiels. Sie ist
   bewusst eine einzige Liste aus Paaren, damit man sie am
   Stueck herausloesen, in eine Tabelle geben und wieder
   einsetzen kann, ohne den Code zu lesen.

   Zum Ton: M. stammt aus einem kroatischen Dorf in der
   Herzegowina und lebt an der Adria. Beide Gegenden sprechen
   ikavisch (dite statt dijete, misec statt mjesec). Das
   Konzept sagt: Dialektfaerbung sparsam, Verstaendlichkeit vor
   Kolorit. Die Faerbung steht darum in den Repliken der
   Dorffiguren und nicht in den Beschreibungen -- dort steht
   Standardkroatisch.
   ============================================================ */
var HR = {

  /* ---- Bedienung ---- */
  'Ansehen':'Pogledaj', 'Nehmen':'Uzmi', 'Benutzen':'Upotrijebi',
  'Reden mit':'Razgovaraj', 'Geben':'Daj', 'Gehen zu':'Idi do',
  'Mich selbst':'Sebe', 'Hauptmenü':'Glavni izbornik',
  'Speichern':'Spremi', 'Laden':'Učitaj',
  'Spiel gespeichert':'Igra spremljena', 'Spielstand geladen':'Igra učitana',
  'Kein Spielstand — Datei wählen':'Nema spremljene igre — odaberi datoteku',
  'Nur für diese Sitzung — Datei wird geladen':'Samo za ovu sesiju — datoteka se preuzima',
  'Vorlage und Plan gespeichert':'Predložak i nacrt spremljeni',
  'Gespräch':'Razgovor', 'NEU':'NOVO', 'GEFRAGT':'PITANO',
  'Tippen oder Zahl drücken':'Dodirni ili pritisni broj',
  'M., später':'M., poslije',
  'Neues Spiel':'Nova igra', 'Fortsetzen':'Nastavi', 'Bildstil':'Stil slike',
  'Ein Leben in Erinnerungen':'Život u sjećanjima',
  'Klicken, um weiterzugehen':'Klikni za dalje', 'weiter':'dalje',
  'Rosko Polje · 1953':'Rosko Polje · 1953.',
  'Mostar · 1955':'Mostar · 1955.',
  'Die Marine · 1960er':'Mornarica · 1960-e',
  'Sarajevo · 1970er':'Sarajevo · 1970-e',
  'Das Werk · 1970er':'Tvornica · 1970-e',
  'Vier Markstücke · 1991':'Četiri marke · 1991.',
  'Der Hausbau · 2004':'Gradnja kuće · 2004.',

  /* ---- Raumtitel ---- */
  'PODACA · SOMMER 2018':'PODACA · LJETO 2018.',
  'DIE GARAGE':'GARAŽA',
  'ÜBER ROSKO POLJE · MORGEN':'IZNAD ROSKOG POLJA · JUTRO',
  'DAS HAUS':'KUĆA',
  'ROSKO POLJE · 1953':'ROSKO POLJE · 1953.',
  'DIE BRÜCKE':'MOST',

  /* ---- Gegenstände ---- */
  'Taschenlampe':'Baterijska lampa',
  'Wacholderzweig':'Grančica smrike',
  'Speckschwarte':'Kožica od slanine',
  'Holzkeil':'Drveni klin',
  'Radnagel':'Osovinski klin',
  'Sack Mehl':'Vreća brašna',
  'Autoschlüssel':'Ključevi auta',
  'Das Foto':'Fotografija',
  'Frisch abgebrochen, die Beeren blau bereift. Zwischen den Fingern zerrieben hält sich der Geruch zwei Tage. Länger.':
    'Svježe odlomljena, bobice modro zamagljene. Kad je protrljaš među prstima, miris ostaje dva dana. I duže.',
  'Trocken, salzig, und viel zu schade zum Wegwerfen. Bei uns wurde sie zuerst gegessen und dann noch zweimal benutzt.':
    'Suha, slana i predobra da se baci. Kod nas se prvo pojela, pa se onda još dvaput upotrijebila.',
  'Aus dem Stapel hinter dem Haus. Buche, hart, an einer Seite schon einmal eingeschlagen.':
    'S hrpe iza kuće. Bukva, tvrda, s jedne strane već jednom zabijena.',
  'Der Splint, der das Rad auf der Achse hält. Handgeschmiedet, krumm, unersetzlich.':
    'Klin koji drži kotač na osovini. Ručno kovan, kriv, nezamjenjiv.',
  'Fünfzehn Kilo aus dem Nachbardorf. Er riecht nach Staub und nach dem, was man daraus macht.':
    'Petnaest kila iz susjednog sela. Miriše na prašinu i na ono što se od njega radi.',

  /* ---- Rahmen: Terrasse und Luka ---- */
  'Haustür':'Kućna vrata', 'Radio':'Radio', 'Tisch':'Stol', 'Mein Stuhl':'Moja stolica',
  'Kaffeetasse':'Šalica kave', 'Die Katze':'Mačka', 'Feigenbaum':'Smokva',
  'Die Mauer':'Zid', 'Das Meer':'More', 'Garagentor':'Vrata garaže',
  'Die Kiste':'Sanduk', 'Lukas Ball':'Lukina lopta', 'Fenstersims':'Prozorska daska',
  'Sie hat keinen Namen. Sie kam mit dem Haus.':'Nema ime. Došla je s kućom.',
  'Sie hat einen Namen. Ich sage ihn nur nicht laut.':'Ima ime. Samo ga ne govorim naglas.',
  'Sie hört zu. Sie antwortet nicht, aber sie hört zu.':'Sluša. Ne odgovara, ali sluša.',
  'Mit der Katze kann man reden, ohne dass jemand nachfragt.':'S mačkom možeš pričati, a da te nitko ne propituje.',
  'Nichts. Ich langweile mich.':'Ništa. Dosadno mi je.',
  'Das ist auch etwas.':'I to je nešto.',
  'In der Garage. Ich komme nicht dran, da ist alles zu.':'U garaži. Ne mogu do nje, sve je zatrpano.',
  'In der Garage ist nichts, was du brauchst.':'U garaži nema ništa što tebi treba.',
  'Mein Ball.':'Moja lopta.',
  'Also gut. Aber du fasst nichts an.':'Dobro. Ali ništa ne diraj.',
  'Er hat etwas angefasst.':'Nešto je dirnuo.',
  'Deda! Was ist das für eine Kiste?':'Deda! Kakav je ovo sanduk?',
  'Eine Kiste.':'Sanduk.',
  'Ja, aber was für eine?':'Da, ali kakav?',
  'Eine alte.':'Star.',
  'Ich hätte etwas anderes sagen können. Ich habe siebenundvierzig Jahre Zeit gehabt, mir etwas anderes zu überlegen.':
    'Mogao sam reći nešto drugo. Imao sam četrdeset i sedam godina da smislim nešto drugo.',
  'Nehmen wir sie mit raus?':'Hoćemo ga iznijeti van?',
  'Sie ist schwer.':'Težak je.',
  'Ich helfe.':'Ja ću pomoći.',
  'Er hat geholfen. Elf Kilo, und er wirklich geholfen.':'Pomogao je. Jedanaest kila, i stvarno je pomogao.',

  /* ---- Kapitel 1: Weide ---- */
  'Die Ziegen':'Koze', 'Der große Fels':'Velika stijena',
  'Der Schatten des Felsens':'Sjena stijene', 'Wacholder':'Smrika',
  'Die Kante':'Rub', 'Vater':'Otac', 'Der Pfad hinunter':'Staza dolje',
  'Im Sommer war ich oben, bevor es hell wurde, und unten, wenn es dunkel wurde.':
    'Ljeti sam bio gore prije nego što se razdanilo, a dolje kad bi pao mrak.',
  'Dazwischen passierte nichts, und das war das Beste am ganzen Jahr.':
    'Između se nije događalo ništa, i to je bilo najbolje u cijeloj godini.',
  'Zähl sie.':'Prebroj ih.',
  'Eins, zwei, drei... neun, zehn, elf.':'Jedan, dva, tri... devet, deset, jedanaest.',
  'Elf.':'Jedanaest.',
  'Zwölf.':'Dvanaest.',
  'Elf, Vater.':'Jedanaest, ćaća.',
  'Er hat nicht hingesehen. Er hat den ganzen Morgen nicht hingesehen.':
    'Nije ni pogledao. Cijelo jutro nije pogledao.',
  'Im Schatten ist es dunkler als die Ziegen hell sind.':'U sjeni je tamnije nego što su koze svijetle.',
  'Da steht eine.':'Ondje stoji jedna.',
  'Ich weiß.':'Znam.',
  'Warum hast du nichts gesagt?':'Zašto nisi ništa reka?',
  'Weil du dann elf gezählt hättest und mir geglaubt.':'Zato što bi onda izbrojio jedanaest i vjerova meni.',
  'Das ist die einzige Lektion, die er mir je mit Absicht beigebracht hat, und ich habe sechzig Jahre davon gelebt.':
    'To je jedina lekcija koju mi je ikad namjerno dao, i od nje sam živio šezdeset godina.',
  'Zähl noch mal.':'Prebroj još jednom.',
  'Ich habe zweimal gezählt.':'Brojio sam dvaput.',
  'Dann hast du zweimal dasselbe falsch gemacht.':'Onda si dvaput isto pogriješio.',
  'Du zählst, was hell ist.':'Brojiš ono što je svijetlo.',
  'Gut.':'Dobro.',
  'Dann geh runter. Der Karren steht schief seit Dienstag, und im Sack ist nichts mehr.':
    'Onda idi dolje. Kola stoje nakrivo od utorka, a u vreći više nema ništa.',
  'Allein?':'Sam?',
  'Ich komme nach. Einer muss bei den Ziegen bleiben.':'Doći ću za tobom. Netko mora ostati kod koza.',
  'Bei allen zwölf.':'Kod svih dvanaest.',
  'Er ist nachgekommen. Er ist immer nachgekommen, und immer erst dann, wenn nichts mehr zu machen war.':
    'Došao je za mnom. Uvijek je došao za mnom, i uvijek tek onda kad se više ništa nije dalo napraviti.',
  'Nein.':'Ne.',
  'Es sieht so aus.':'Tako izgleda.',
  'Ich passe auf.':'Pazim.',
  'Worauf?':'Na što?',
  'Darauf, dass du aufpasst.':'Na to da ti paziš.',
  'Vierzig war er da. Er sah aus wie sechzig, und ich habe ihn für alt gehalten.':
    'Imao je četrdeset. Izgledao je kao da ima šezdeset, i ja sam ga držao starim.',
  'Zwischen den Fingern zerrieben hält sich der Geruch zwei Tage.':
    'Kad je protrljaš među prstima, miris ostaje dva dana.',
  'Länger. Viel länger.':'Duže. Puno duže.',
  'Am Waldrand steht etwas.':'Na rubu šume nešto stoji.',
  'Was.':'Što.',
  'Nichts.':'Ništa.',
  'Nicht, solange die Herde nicht stimmt.':'Ne dok stado ne štima.',
  'Wenn eine fehlt und ich gehe, ist es meine Schuld.':'Ako jedna fali a ja odem, moja je krivnja.',

  /* ---- Kapitel 1: Haus ---- */
  'Tür':'Vrata', 'Der Herd':'Ognjište', 'Die Speckschwarte':'Kožica od slanine',
  'Der Mehlsack':'Vreća brašna', 'Der Tisch':'Stol', 'Petroleumlampe':'Petrolejka',
  'Das Bett':'Krevet', 'Das Bild':'Slika', 'Mutter':'Mater',
  'Mit dem Karren?':'S kolima?',
  'Ja.':'Da.',
  'Der Karren steht schief seit Dienstag.':'Kola stoje nakrivo od utorka.',
  'Ich mache ihn.':'Ja ću ih popraviti.',
  'Dann mach ihn. Aber die Achse ist trocken, und trocken geht kein Rad drauf.':
    'Onda ih popravi. Ali osovina je suha, a na suho ne ide nijedan kotač.',
  'Sie hat nicht gesagt, womit man eine Achse fettet. Sie hat gewartet, ob ich es weiß.':
    'Nije rekla čime se maže osovina. Čekala je znam li.',
  'Die Schwarte hängt am Haken.':'Kožica visi na kuki.',
  'Danke.':'Hvala.',
  'Und bring sie zurück. Die ist noch gut.':'I vrati je. Još je dobra.',
  'Zurückbringen? Nach dem Fetten?':'Da je vratim? Nakon mazanja?',
  'Du hast mich verstanden.':'Razumio si me.',
  'Ich habe sie zurückgebracht. Sie lag drei Tage später noch im Speiseplan.':
    'Vratio sam je. Tri dana kasnije još je bila na jelovniku.',
  'Für wie lange reicht es noch?':'Za koliko još ima?',
  'Bis du zurück bist.':'Dok se ne vratiš.',
  'Das war keine Aufmunterung. Das war eine Zeitangabe.':'To nije bilo hrabrenje. To je bio rok.',
  'Wenn das Mehl da ist.':'Kad bude brašna.',
  'Und wenn es nicht kommt?':'A ako ga ne bude?',
  'Dann gibt es Zwiebeln.':'Onda ima luka.',
  'Es gab oft Zwiebeln. Ich esse sie bis heute gern, und ich weiß nicht, ob das trotzig ist oder ehrlich.':
    'Luka je bilo često. Još ga i danas rado jedem, i ne znam je li to inat ili iskrenost.',
  'Fünfzehn Kilo.':'Petnaest kila.',
  'Stell ihn dorthin.':'Stavi je tamo.',
  'Der Karren steht wieder gerade.':'Kola opet stoje ravno.',
  'Wasch dir die Hände, es gibt gleich etwas.':'Operi ruke, odmah će nešto biti.',
  'Das war alles. Und es war genug.':'To je bilo sve. I bilo je dosta.',
  'Sie steht nie still. Wenn sie still steht, ist etwas passiert.':
    'Nikad ne stoji na miru. Kad stoji na miru, nešto se dogodilo.',

  /* ---- Kapitel 1: Hof ---- */
  'Das Haus':'Kuća', 'Brunnen':'Bunar', 'Ochsenkarren':'Volovska kola',
  'Achse':'Osovina', 'Vorderrad':'Prednji kotač', 'Holzstapel':'Hrpa drva',
  'Der Weg':'Put',
  'Ich sehe es.':'Vidim.',
  'Machst du es?':'Hoćeš ti to?',
  'Ich habe zwölf Jahre gebraucht, bis mein Vater mich einen Karren hat richten lassen. Du bist elf. Du bist mir voraus.':
    'Meni je trebalo dvanaest godina dok mi je moj ćaća dao popraviti kola. Ti imaš jedanaest. Ispred mene si.',
  'Und wenn ich es falsch mache?':'A ako pogriješim?',
  'Dann machst du es zweimal.':'Onda ćeš napraviti dvaput.',
  'Was hält Holz?':'Što drži drvo?',
  'Holz?':'Drvo?',
  'Bis zum ersten Stein.':'Do prvog kamena.',
  'Was hält Eisen?':'Što drži željezo?',
  'Eisen.':'Željezo.',
  'Und wo ist auf diesem Hof Eisen, das man entbehren kann?':
    'A gdje je na ovom imanju željezo bez kojeg se može?',
  'Denk nach. Und geh nicht ins Haus, deine Mutter hat genug zu tun.':
    'Razmisli. I ne idi u kuću, mater ima posla dosta.',
  'Hm.':'Hm.',
  'Der Splint vom Brunnen.':'Klin s bunara.',
  'Der Eimer hängt an einer Schnur.':'Kanta visi na uzici.',
  'Fahr los. Und sag dem Müller, ich zähle mit.':'Kreni. I reci mlinaru da i ja brojim.',
  'Das war das Lob. Es hat mir für zwei Jahre gereicht.':'To je bila pohvala. Trajala mi je dvije godine.',
  'Der Eimer kann warten. Das Mehl nicht.':'Kanta može čekati. Brašno ne može.',
  'Ich binde den Eimer mit der Schnur an. Das hält bis heute Abend.':
    'Vezat ću kantu uzicom. Držat će do večeras.',
  'Es hat bis 1961 gehalten.':'Držalo je do 1961.',
  'Rad drauf. Splint durch. Umbiegen.':'Kotač na osovinu. Klin kroz rupu. Saviti.',
  'Es sitzt.':'Sjelo je.',
  'Es war das erste Mal, dass ich etwas repariert habe, von dem etwas abhing. Ich war elf.':
    'Bio je to prvi put da sam popravio nešto o čemu je nešto ovisilo. Imao sam jedanaest godina.',
  'Der Keil geht durch das Loch. Fast.':'Klin prolazi kroz rupu. Skoro.',
  'Er hält, solange nichts passiert.':'Drži dok se ništa ne dogodi.',
  'Bis zum ersten Stein, Sohn. Dann liegt das Rad im Graben und du unter dem Karren.':
    'Do prvog kamena, sine. Onda je kotač u jarku, a ti pod kolima.',
  'Holz hält Holz. Eisen hält Eisen.':'Drvo drži drvo. Željezo drži željezo.',
  'Ich reibe die Schwarte über die Achse, bis sie glänzt.':'Trljam kožicu po osovini dok se ne sjaji.',
  'Fertig. Jetzt geht das Rad drauf.':'Gotovo. Sad kotač ide na osovinu.',
  'Also los.':'Idemo onda.',

  /* ---- Kapitel 1: Brücke ---- */
  'Brüstung':'Ograda', 'Der Fluss':'Rijeka', 'Der Bogen':'Luk',
  'Mühle':'Mlin', 'Der Rückweg':'Put natrag', 'Der Fremde':'Stranac',
  'Warten Sie auf jemanden?':'Čekate nekoga?',
  'Nein. Ich sehe nur.':'Ne. Samo gledam.',
  'Was denn?':'Što?',
  'Die Brücke.':'Most.',
  'Die ist immer da.':'On je uvijek tu.',
  'Eben.':'Upravo.',
  'Leute, die schon lange tot sind.':'Ljudi kojih odavno nema.',
  'Und sie haben sie nicht für sich gebaut. Eine Brücke baut man immer für die, die danach kommen.':
    'I nisu ga gradili za sebe. Most se uvijek gradi za one koji dolaze poslije.',
  'Warum baut man dann eine?':'Zašto ga onda netko gradi?',
  'Weil ein Fluss nur eine Sache kann: trennen.':'Zato što rijeka zna samo jedno: razdvajati.',
  'Und weil es Leute gibt, die das nicht hinnehmen.':'I zato što ima ljudi koji to ne prihvaćaju.',
  'Ich war elf. Ich habe das Wort hinnehmen nicht gekannt. Ich habe es an diesem Tag gelernt.':
    'Imao sam jedanaest godina. Riječ prihvatiti nisam znao. Naučio sam je toga dana.',
  'Geh nur.':'Idi samo.',
  'Wie heißt du?':'Kako se zoveš?',
  'Gut. Dann weiß ich, wer über die Brücke gegangen ist.':
    'Dobro. Onda znam tko je prešao preko mosta.',
  'Neun Jahre später habe ich sein Bild in der Zeitung gesehen. Es stand etwas von einem Preis darunter.':
    'Devet godina kasnije vidio sam mu sliku u novinama. Ispod je pisalo nešto o nagradi.',
  'Ich habe es niemandem erzählt. Wer hätte mir das geglaubt.':
    'Nisam nikome rekao. Tko bi mi to vjerovao.',
  'Fünfzehn Kilo. Er hat mir beim Aufladen geholfen.':'Petnaest kila. Pomogao mi je utovariti.',
  'Er hat nicht geholfen. Ich habe es allein aufgeladen und drei Tage nichts heben können.':
    'Nije pomogao. Sam sam utovario i tri dana nisam mogao ništa dići.',
  'Ohne Mehl brauche ich gar nicht erst heimzugehen.':'Bez brašna ne trebam ni ići kući.',

  /* ---- Kapitelkarte 1 ---- */
  'ERSTES KAPITEL':'PRVO POGLAVLJE',
  '1953':'1953.',
  'Wir waren nicht arm. Arm waren die, die weggegangen sind.':
    'Nismo bili siromašni. Siromašni su bili oni koji su otišli.',

  /* ---- Die Korrektur am Ende ---- */
  'Der Hof ist noch da. Kleiner, als ich ihn im Kopf hatte.':
    'Imanje je još tu. Manje nego što mi je bilo u glavi.',
  'Und mein Vater stand nicht am Rand und sah zu.':
    'I moj ćaća nije stajao sa strane i gledao.',
  'Er stand daneben. Die ganze Zeit.':'Stajao je uz mene. Cijelo vrijeme.',
  /* ---- Dialogoptionen Rahmen und Kapitel 1 ----
     Die Antwortzeilen des Spielers. Sie sind kuerzer als die
     Repliken und muessen es bleiben, sonst sprengen sie den
     Kasten -- Kroatisch baut hier meist etwas kuerzer als
     Deutsch, das kommt entgegen. */
  '(Nichts.)':'(Ništa.)',
  '(Nichts sagen.)':'(Ne reći ništa.)',
  '(Weitergehen.)':'(Ići dalje.)',
  'Was machst du da?':'Što to radiš?',
  'Wo ist dein Ball?':'Gdje ti je lopta?',
  'Frag deine Baka, die weiß das besser.':'Pitaj baku, ona to bolje zna.',
  'Was ist in der Kiste, willst du wissen.':'Zanima te što je u sanduku.',
  'Setz dich. Ich erzähle dir etwas.':'Sjedni. Ispričat ću ti nešto.',
  'Elf sind es.':'Jedanaest ih je.',
  'Zwölf. Sie stand im Schatten.':'Dvanaest. Stajala je u sjeni.',
  'Was ist heute zu tun?':'Što se danas radi?',
  'Sitzt du da den ganzen Tag?':'Sjediš tu cijeli dan?',
  'Das Rad ist ab.':'Kotač je spao.',
  'Womit soll ich es festmachen?':'Čime da ga pričvrstim?',
  'Es sitzt. Sieh es dir an.':'Sjelo je. Dođi pogledati.',
  'Warum gehen wir nicht auch weg?':'Zašto i mi ne odemo?',
  'Ich hole das Mehl.':'Idem po brašno.',
  'Die Achse ist trocken. Darf ich die Schwarte?':'Osovina je suha. Mogu li kožicu?',
  'Der Sack ist leer.':'Vreća je prazna.',
  'Wann gibt es etwas zu essen?':'Kad će se jesti?',
  'Was steht in dem Buch?':'Što piše u toj knjizi?',
  'Wer hat die Brücke gebaut?':'Tko je sagradio most?',
  'Wohnen Sie hier?':'Živite li ovdje?',
  'Ich muss weiter. Das Mehl.':'Moram dalje. Brašno.',
  'Am Waldrand':'Na rubu šume',

  /* ---- Satzvorlagen. %s ist der eingesetzte Name. ---- */
  'Was sagt %s?':'Što kaže %s?',
  'Benutze %s mit %s':'Upotrijebi %s s %s',
  'Benutze %s mit …':'Upotrijebi %s s …',
  'Pfeiltasten oder Klick, Enter zum Bestätigen · H = Hinweis · S/L = Speichern und Laden':
    'Strelice ili klik, Enter za potvrdu · H = savjet · S/L = spremi i učitaj',

  /* ---- Studiokarte ---- */
  'präsentiert':'predstavlja',
  'Erinnerungen zwischen den Zeiten':'Sjećanja između vremena'
};

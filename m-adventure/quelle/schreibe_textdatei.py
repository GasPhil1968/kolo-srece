# -*- coding: utf-8 -*-
import io, json, os
H = os.path.dirname(os.path.abspath(__file__))
E = json.load(io.open(os.path.join(H,'texte_index.json'), encoding='utf-8'))

ORT_NAME = {'-':'Allgemein'}
def linie(z='─', n=74): return z*n

out = []
w = out.append
w('╔' + '═'*74 + '╗')
w('║' + 'M.  ·  ALLE SPIELTEXTE, DEUTSCH'.center(74) + '║')
w('║' + 'Erinnerungen zwischen den Zeiten'.center(74) + '║')
w('╚' + '═'*74 + '╝')
w('')
w('%d Textstellen, %d Zeichen.  Stand: 2. September 2026.'
  % (len(E), sum(len(e['text']) for e in E)))
w('')
w(linie('═'))
w('  SO BEARBEITEST DU DIE DATEI')
w(linie('═'))
w('')
w('  Jede Zeile hat die Form:')
w('')
w('      [T0042 · Vater] Der Text, den du ändern kannst.')
w('')
w('  Ändere NUR den Text rechts von der schließenden Klammer.')
w('')
w('  1.  Die Kennung in eckigen Klammern muss bleiben, Zeichen für Zeichen.')
w('      Sie ist der Anker, über den ich deine Änderung zurückspiele.')
w('      Ohne sie ist die Zeile verloren.')
w('')
w('  2.  Eine Textstelle ist eine Zeile. Auch wenn sie lang wird.')
w('      Kein Zeilenumbruch mitten im Satz — der Umbruch im Spiel')
w('      passiert automatisch und richtet sich nach der Fensterbreite.')
w('')
w('  3.  Ein  ↵  im Text ist ein gewollter Absatz. Lass ihn stehen,')
w('      oder setze einen neuen, wo du einen brauchst.')
w('')
w('  4.  Zeilen ohne eckige Klammer sind Überschriften und Notizen.')
w('      Die kannst du ignorieren, sie kommen nicht im Spiel vor.')
w('')
w('  5.  Löschen geht nicht. Wenn eine Zeile weg soll, schreib  [WEG]')
w('      als einzigen Inhalt hinter die Kennung — dann sage ich dir,')
w('      was daran hängt, bevor ich sie entferne.')
w('')
w('  6.  Neue Zeilen kannst du dazuschreiben. Setze  [NEU]  statt einer')
w('      Kennung davor und darunter eine kurze Notiz, wo sie hin soll.')
w('')
w('  Kroatisch und Englisch hängen an den deutschen Sätzen. Wenn du einen')
w('  deutschen Satz änderst, ziehe ich die Übersetzung automatisch mit um;')
w('  wo sich der Sinn verschiebt, melde ich mich.')
w('')
w('  Speichern als reine Textdatei, UTF-8. Word geht, aber dann bitte')
w('  ausdrücklich als .txt speichern, nicht als .docx.')
w('')

ab_alt, ort_alt = None, None
for e in E:
    if e['abschnitt'] != ab_alt:
        ab_alt, ort_alt = e['abschnitt'], None
        w(''); w(linie('═')); w('  ' + e['abschnitt'].upper()); w(linie('═'))
    if e['ort'] != ort_alt:
        ort_alt = e['ort']
        w(''); w('  ── ' + ORT_NAME.get(ort_alt, ort_alt) + ' ' + '─'*max(2, 60-len(ort_alt)))
    marke = e['sprecher'] if e['sprecher'] else e['art']
    t = e['text'].replace('\n', ' ↵ ')
    w('[%s · %s] %s' % (e['id'], marke, t))

w(''); w(linie('═'))
w('  ENDE  ·  %d Textstellen' % len(E))
w(linie('═'))

ziel = os.path.join(H, 'M-Spieltexte-DE.txt')
io.open(ziel, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('geschrieben:', ziel)
print('Zeilen:', len(out), '| KB:', round(os.path.getsize(ziel)/1024, 1))

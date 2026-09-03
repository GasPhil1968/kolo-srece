
/* ============================================================
   Sektion 34  MUSIK
   ------------------------------------------------------------
   Das Konzept verlangt Musik, die nicht Untermalung ist, sondern
   selbst Ausloeser von Erinnerungen: rockig, melancholisch, in
   der Naehe von Zabranjeno Pušenje. Was hier laeuft, ist kein
   Soundtrack, sondern sein Platzhalter -- dieselbe Tonart,
   dasselbe Tempo, dieselbe Rolle im Spiel:

     · aus dem Radio auf der Terrasse (und dort ist sie der
       Ausloeser fuer Kapitel 2, siehe KAP_AUSLOESER),
     · unter den Kapitelkarten,
     · unter dem Abspann.

   Alles prozedural, damit die Datei eine einzige HTML-Datei
   bleibt. Jeder Zugriff auf WebAudio ist gekapselt: ein Browser,
   der keinen Ton erlaubt, soll das Spiel nicht anhalten.
   ============================================================ */
var MUSIK = {
  an:false, modus:null, bus:null, filter:null, naechster:0, takt:0,
  /* a-Moll, langsam. Die Terz bleibt oft aus -- das ist der Grund,
     warum diese Musik weder traurig noch froehlich klingt. */
  akkorde: [
    { bass:110.00, toene:[220.00, 261.63, 329.63] },   // Am
    { bass:87.31,  toene:[174.61, 220.00, 261.63] },   // F
    { bass:98.00,  toene:[196.00, 246.94, 293.66] },   // G
    { bass:110.00, toene:[220.00, 261.63, 329.63] },   // Am
    { bass:82.41,  toene:[164.81, 196.00, 246.94] },   // Em
    { bass:87.31,  toene:[174.61, 220.00, 261.63] },   // F
    { bass:98.00,  toene:[196.00, 246.94, 293.66] },   // G
    { bass:98.00,  toene:[196.00, 233.08, 293.66] }    // G7-ish
  ],

  sicher: function(fn){ try { return fn(); } catch(e){ return null; } },

  aufbau: function(){
    var self = this;
    return this.sicher(function(){
      var ac = ensureAudio();
      if (!ac) return null;
      if (!self.bus){
        self.bus = ac.createGain();
        self.bus.gain.value = 0.0001;
        self.filter = ac.createBiquadFilter();
        self.filter.type = 'lowpass';
        self.filter.frequency.value = 2200;
        self.filter.connect(self.bus);
        self.bus.connect(ac.destination);
      }
      return ac;
    });
  },

  setModus: function(m){
    if (this.modus === m) return;
    this.modus = m;
    var self = this;
    this.sicher(function(){
      var ac = self.aufbau(); if (!ac) return;
      var ziel = m === 'radio' ? 0.055 : (m === 'karte' ? 0.075 : 0.0001);
      /* Das Radio klingt nach Radio: schmalbandig, ein wenig belegt.
         Die Kapitelkarte darf offen klingen. */
      self.filter.frequency.setTargetAtTime(m === 'radio' ? 1250 : 2600, ac.currentTime, 0.4);
      self.bus.gain.setTargetAtTime(ziel, ac.currentTime, 0.5);
      if (m && !self.an){ self.an = true; self.naechster = ac.currentTime + 0.15; self.takt = 0; }
    });
  },
  aus: function(){ this.setModus(null); },

  /* Eine Stimme: Ton, Zeitpunkt, Dauer, Lautstaerke, Klang. */
  ton: function(ac, f, t, dauer, amp, art){
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = art || 'triangle';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amp, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    o.connect(g); g.connect(this.filter);
    o.start(t); o.stop(t + dauer + 0.05);
  },

  tick: function(dt){
    if (!this.an || !this.modus) return;
    var self = this;
    this.sicher(function(){
      var ac = self.aufbau(); if (!ac) return;
      /* Zwei Takte im Voraus planen, damit ein ausgelassener Frame
         kein Loch in die Musik reisst. */
      while (self.naechster < ac.currentTime + 1.2){
        var t = self.naechster;
        var a = self.akkorde[self.takt % self.akkorde.length];
        var dauer = 1.9;
        // Bass auf der Eins, mit Oktavsprung auf der Drei
        self.ton(ac, a.bass, t, 1.5, 0.30, 'sawtooth');
        self.ton(ac, a.bass * 2, t + 0.95, 0.6, 0.16, 'sawtooth');
        // Gebrochener Akkord daruber, drei Toene, ungleich lang
        for (var i = 0; i < a.toene.length; i++)
          self.ton(ac, a.toene[i], t + 0.12 + i * 0.30, 0.85 - i * 0.12, 0.16 - i * 0.02, 'triangle');
        // Eine Melodienote, die sich alle zwei Takte aendert
        var mel = a.toene[(self.takt % 2) ? 2 : 1] * 2;
        self.ton(ac, mel, t + 1.15, 0.9, 0.085, 'square');
        self.naechster = t + dauer;
        self.takt++;
      }
    });
  }
};

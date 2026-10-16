// Decision-based sword fights. The opponent telegraphs each attack with a readable wind-up;
// the right answer depends on the telegraph, so no single repeated answer can win. Losing is
// never final: Mijo cannot die, he is driven down, gets up and the fight resumes.

export type ThreatAnswer = 'parry' | 'evade' | 'hit';
export type OpeningAnswer = 'success' | 'fail';

export interface CombatAction {
  id: string;
  label: string;
  /** Keyboard shortcut shown on the button. */
  key: string;
}

export interface CombatThreat {
  id: string;
  /** Opponent pose during the wind-up and a short readable description of it. */
  cuePose: string;
  cueText: string;
  strikePose: string;
  answers: Partial<Record<string, ThreatAnswer>>;
  /** Player poses for each outcome. */
  parryPose?: string;
  evadePose?: string;
  hitPose?: string;
  goodText: string;
  hitText: string;
  /** Opening offered after a good answer. */
  opens?: string;
}

export interface CombatOpening {
  id: string;
  prompt: string;
  /** Opponent pose while the opening lasts. */
  pose: string;
  answers: Partial<Record<string, OpeningAnswer>>;
  successPose: string;
  successOpponentPose?: string;
  successText: string;
  failText: string;
}

export interface CombatDef {
  id: string;
  opponent: string;
  /** Actions offered during threats. */
  defense: CombatAction[];
  /** Actions offered during openings. */
  offense: CombatAction[];
  threats: CombatThreat[];
  openings: CombatOpening[];
  /** Threat orders; attempt n uses sequences[n % length]. The order repeats if exhausted. */
  sequences: string[][];
  /** Successful openings needed to win. */
  needed: number;
  /** Hits Mijo takes before he is driven down. */
  endurance: number;
  /** Decision time in seconds at normal pacing. */
  window: number;
  guardPose: string;
  opponentGuardPose: string;
  downPose: string;
  downText: string;
  riseLabel: string;
  wonText: string;
}

export type CombatPhase = 'ready' | 'cue' | 'resolve' | 'opening' | 'openingResolve' | 'down' | 'won';

export interface CombatSettings {
  relaxedCombat?: boolean;
  reducedMotion?: boolean;
}

export class CombatRuntime {
  phase: CombatPhase = 'ready';
  attempt = 0;
  hits = 0;
  progress = 0;
  /** Index in the current sequence. */
  step = 0;
  t = 0;
  threat: CombatThreat | null = null;
  opening: CombatOpening | null = null;
  message = '';
  playerPose: string;
  opponentPose: string;
  outcome: 'won' | 'yielded' | null = null;
  /** Full log of decisions for tests and debugging. */
  readonly history: { attempt: number; phase: string; id: string; action: string | null; result: string }[] = [];
  private lastAction: string | null = null;

  constructor(
    readonly def: CombatDef,
    private readonly settings: CombatSettings,
  ) {
    this.playerPose = def.guardPose;
    this.opponentPose = def.opponentGuardPose;
  }

  /** Decision time for the current attempt; grows after each defeat. Infinity when relaxed. */
  get window(): number {
    if (this.settings.relaxedCombat) return Infinity;
    return this.def.window * (1 + 0.25 * Math.min(this.attempt, 4));
  }

  get timeLeft(): number {
    return Math.max(0, this.window - this.t);
  }

  get actions(): CombatAction[] {
    if (this.phase === 'cue') return this.def.defense;
    if (this.phase === 'opening') return this.def.offense;
    if (this.phase === 'down') return [{ id: 'rise', label: this.def.riseLabel, key: '1' }];
    return [];
  }

  input(action: string): boolean {
    if (this.phase === 'cue' && this.threat) {
      if (!this.def.defense.some((a) => a.id === action)) return false;
      this.resolveThreat(action);
      return true;
    }
    if (this.phase === 'opening' && this.opening) {
      if (!this.def.offense.some((a) => a.id === action)) return false;
      this.resolveOpening(action);
      return true;
    }
    if (this.phase === 'down' && action === 'rise') {
      this.attempt++;
      this.hits = 0;
      this.progress = 0;
      this.step = 0;
      this.message = '';
      this.enter('ready');
      return true;
    }
    return false;
  }

  private enter(p: CombatPhase): void {
    this.phase = p;
    this.t = 0;
    if (p === 'ready') {
      this.playerPose = this.def.guardPose;
      this.opponentPose = this.def.opponentGuardPose;
    }
  }

  private nextThreat(): void {
    const seq = this.def.sequences[this.attempt % this.def.sequences.length];
    const id = seq[this.step % seq.length];
    this.step++;
    const th = this.def.threats.find((x) => x.id === id);
    if (!th) throw new Error(`combat ${this.def.id}: unknown threat ${id}`);
    this.threat = th;
    this.opening = null;
    this.opponentPose = th.cuePose;
    this.playerPose = this.def.guardPose;
    this.message = th.cueText;
    this.enter('cue');
  }

  private resolveThreat(action: string | null): void {
    const th = this.threat!;
    const ans: ThreatAnswer = action ? th.answers[action] ?? 'hit' : 'hit';
    this.lastAction = action;
    this.history.push({ attempt: this.attempt, phase: 'threat', id: th.id, action, result: ans });
    this.opponentPose = th.strikePose;
    if (ans === 'hit') {
      this.hits++;
      this.playerPose = th.hitPose ?? this.def.guardPose;
      this.message = th.hitText;
    } else {
      this.playerPose = (ans === 'parry' ? th.parryPose : th.evadePose) ?? this.def.guardPose;
      this.message = th.goodText;
    }
    this.enter('resolve');
  }

  private resolveOpening(action: string | null): void {
    const op = this.opening!;
    const ans: OpeningAnswer = action ? op.answers[action] ?? 'fail' : 'fail';
    this.history.push({ attempt: this.attempt, phase: 'opening', id: op.id, action, result: ans });
    if (ans === 'success') {
      this.progress++;
      this.playerPose = op.successPose;
      if (op.successOpponentPose) this.opponentPose = op.successOpponentPose;
      this.message = op.successText;
    } else {
      this.message = op.failText;
      this.playerPose = this.def.guardPose;
      this.opponentPose = this.def.opponentGuardPose;
    }
    this.enter('openingResolve');
  }

  /** instant: display phases end immediately (simulation); decisions still wait for input. */
  update(dt: number, instant: boolean): void {
    if (this.outcome) return;
    this.t += dt;
    const show = (s: number) => instant || this.t >= s * (this.settings.reducedMotion ? 1.2 : 1);
    switch (this.phase) {
      case 'ready':
        if (show(1.0)) this.nextThreat();
        break;
      case 'cue':
        if (!instant && this.t >= this.window) this.resolveThreat(null);
        break;
      case 'resolve': {
        if (!show(1.3)) break;
        const th = this.threat!;
        const lastGood = this.history.length && this.history[this.history.length - 1].result !== 'hit';
        if (this.hits >= this.def.endurance) {
          this.playerPose = this.def.downPose;
          this.opponentPose = this.def.opponentGuardPose;
          this.message = this.def.downText;
          this.enter('down');
        } else if (lastGood && th.opens) {
          const op = this.def.openings.find((o) => o.id === th.opens);
          if (!op) throw new Error(`combat ${this.def.id}: unknown opening ${th.opens}`);
          this.opening = op;
          this.opponentPose = op.pose;
          this.message = op.prompt;
          this.enter('opening');
        } else this.nextThreat();
        break;
      }
      case 'opening':
        if (!instant && this.t >= this.window) this.resolveOpening(null);
        break;
      case 'openingResolve':
        if (!show(1.4)) break;
        if (this.progress >= this.def.needed) {
          this.message = this.def.wonText;
          this.enter('won');
        } else this.nextThreat();
        break;
      case 'down':
        break;
      case 'won':
        if (show(0.8)) this.outcome = 'won';
        break;
    }
    void this.lastAction;
  }
}

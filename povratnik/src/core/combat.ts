// Sword fights as a sequence of readable decisions. Each step shows a telegraph – the opponent's
// painted wind-up and one sentence about what his body does – and offers a few answers. One answer
// is right for that telegraph and the steps differ, so repeating a single answer never wins. A wrong
// or missing answer is shown (a cut, a stagger), explained, and the same step comes again: Mijo
// cannot die here and nothing is lost but time. Decision time grows after every failure and is
// unlimited in the relaxed setting.

export interface CombatAction {
  id: string;
  label: string;
}

/** What the fighters show: a pair figure painted with both men, or one pose per fighter. A fighter
 * can also take a new place on the ground line (closing in for a lunge or a bind). */
export interface DuelPose {
  pair?: string;
  pc?: string;
  opp?: string;
  pcX?: number;
  oppX?: number;
}

export interface DuelStep {
  id: string;
  /** The telegraph while the decision is open. */
  cue: DuelPose;
  cueText: string;
  /** Answers offered (ids of CombatDef.actions) and the one that works here. */
  actions: string[];
  answer: string;
  success: DuelPose;
  successText: string;
  successTime?: number;
  fail: DuelPose;
  failText: string;
  failTime?: number;
  /** Explanations for particular wrong answers (otherwise failText). */
  wrong?: Partial<Record<string, string>>;
  /** Added after a failure at this step: something remembered that explains the right answer. */
  lesson?: string;
}

export interface CombatDef {
  id: string;
  /** Actor ids: the player, the opponent, and a pair figure showing both men at once (optional). */
  pc: string;
  opp?: string;
  pair?: string;
  actions: CombatAction[];
  /** Shown before the first decision (drawing swords). */
  intro?: { pose: DuelPose; text: string; time: number };
  steps: DuelStep[];
  /** Decision time in seconds at normal pacing. */
  window: number;
  /** Prefix when no answer came in time. */
  lateText: string;
  wonText: string;
}

export type CombatPhase = 'intro' | 'cue' | 'success' | 'fail' | 'won';

export interface CombatSettings {
  relaxedCombat?: boolean;
  reducedMotion?: boolean;
}

export class CombatRuntime {
  phase: CombatPhase;
  /** Index of the current step. */
  step = 0;
  t = 0;
  /** Failed answers in the whole fight and at the current step. */
  failures = 0;
  stepFailures = 0;
  message = '';
  pose: DuelPose;
  /** Changes whenever the pose is (re)set, so the view restarts the animations. */
  poseSeq = 0;
  outcome: 'won' | null = null;
  /** Every decision, for tests and debugging. */
  readonly history: { step: string; action: string | null; ok: boolean }[] = [];

  constructor(
    readonly def: CombatDef,
    private readonly settings: CombatSettings,
  ) {
    if (!def.steps.length) throw new Error(`combat ${def.id}: no steps`);
    for (const st of def.steps) {
      if (!st.actions.includes(st.answer)) throw new Error(`combat ${def.id}: step ${st.id} does not offer its answer`);
      for (const a of st.actions) if (!def.actions.some((x) => x.id === a)) throw new Error(`combat ${def.id}: unknown action ${a}`);
    }
    if (def.intro) {
      this.phase = 'intro';
      this.pose = def.intro.pose;
      this.message = def.intro.text;
    } else {
      this.phase = 'cue';
      this.pose = def.steps[0].cue;
      this.message = def.steps[0].cueText;
    }
  }

  get current(): DuelStep {
    return this.def.steps[Math.min(this.step, this.def.steps.length - 1)];
  }

  /** Decision time for the current step; grows after failures. Infinity when relaxed. */
  get window(): number {
    if (this.settings.relaxedCombat) return Infinity;
    return this.def.window * (1 + 0.35 * Math.min(this.failures, 4));
  }

  get timeLeft(): number {
    return Math.max(0, this.window - this.t);
  }

  get actions(): CombatAction[] {
    if (this.phase !== 'cue') return [];
    return this.current.actions.map((id) => this.def.actions.find((a) => a.id === id)!);
  }

  /** Steps completed (for the progress display). */
  get progress(): number {
    return this.phase === 'won' ? this.def.steps.length : this.step + (this.phase === 'success' ? 1 : 0);
  }

  input(action: string): boolean {
    if (this.phase !== 'cue') return false;
    if (!this.current.actions.includes(action)) return false;
    this.resolve(action);
    return true;
  }

  private setPose(p: DuelPose): void {
    this.pose = p;
    this.poseSeq++;
  }

  private enterCue(): void {
    const st = this.current;
    this.phase = 'cue';
    this.t = 0;
    this.setPose(st.cue);
    this.message = st.cueText;
  }

  private resolve(action: string | null): void {
    const st = this.current;
    const ok = action === st.answer;
    this.history.push({ step: st.id, action, ok });
    this.t = 0;
    if (ok) {
      this.phase = 'success';
      this.stepFailures = 0;
      this.setPose(st.success);
      this.message = st.successText;
      return;
    }
    this.failures++;
    this.stepFailures++;
    this.phase = 'fail';
    this.setPose(st.fail);
    const why = action ? st.wrong?.[action] ?? st.failText : `${this.def.lateText} ${st.failText}`;
    this.message = st.lesson ? `${why} ${st.lesson}` : why;
  }

  /** instant: display phases end immediately (simulation); decisions still wait for input. */
  update(dt: number, instant: boolean): void {
    if (this.outcome) return;
    this.t += dt;
    const shown = (s: number) => instant || this.t >= s * (this.settings.reducedMotion ? 1.15 : 1);
    switch (this.phase) {
      case 'intro':
        if (shown(this.def.intro?.time ?? 0)) this.enterCue();
        break;
      case 'cue':
        if (!instant && this.t >= this.window) this.resolve(null);
        break;
      case 'success':
        if (!shown(this.current.successTime ?? 1.6)) break;
        if (this.step + 1 >= this.def.steps.length) {
          this.phase = 'won';
          this.t = 0;
          this.message = this.def.wonText;
        } else {
          this.step++;
          this.enterCue();
        }
        break;
      case 'fail':
        if (shown(this.current.failTime ?? 1.9)) this.enterCue();
        break;
      case 'won':
        if (shown(0.9)) this.outcome = 'won';
        break;
    }
  }
}

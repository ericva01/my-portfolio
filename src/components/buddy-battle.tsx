"use client";

/* ─────────────────────────────────────────────────────────────
   BUG BOSS BATTLE — a tiny pixel fighting game for Pixel Eric.
   The engine is plain TypeScript (no React state per frame);
   the page renders a HUD snapshot ~10× per second and draws
   projectiles / effects on a single canvas.
   ───────────────────────────────────────────────────────────── */

export type Skill = "punch" | "orb" | "beam" | "shield" | "ultimate";
export type BattlePhase = "warning" | "enter" | "transform" | "fight" | "victory" | "defeat" | "flee";
export type HeroPose = "idle" | "step" | "pass" | "punch" | "cast" | "charge" | "wave";
export type HeroState = "battle" | "hurt" | "ko" | "air";

export const SKILLS: { id: Skill; key: string; name: string; desc: string; cd: number }[] = [
  { id: "punch", key: "1", name: "DOCKER PUNCH", desc: "Dash in, 3-hit combo", cd: 1100 },
  { id: "orb", key: "2", name: "PIPELINE BLAST", desc: "Fires 3 energy orbs", cd: 2600 },
  { id: "beam", key: "3", name: "KUBECTL DELETE", desc: "Charged mega beam", cd: 9000 },
  { id: "shield", key: "4", name: "ROLLBACK SHIELD", desc: "Blocks attacks, heals", cd: 7000 },
  { id: "ultimate", key: "5", name: "DEPLOY TO PROD", desc: "Ultimate · needs 100% energy", cd: 0 },
];

export const BOSS_MAX = 1400;
export const HERO_MAX = 100;
const HERO_GRAVITY = 2400;
const BOSS_GRAVITY = 2600;

/* ── Boss sprite (procedurally rastered 32×24 pixel bug) ───── */
const BW = 32;
const BH = 24;
export const BOSS_PALETTE: Record<string, string> = {
  K: "#16051b", A: "#5b1a6e", a: "#3e0f4c", L: "#9a3cb5", B: "#b0304a", b: "#7a1a30", G: "#2a0a33",
  E: "#ff3b3b", e: "#ffe0e0", M: "#e8dcb0", O: "#3a0010", T: "#c84ae8", X: "#4af0ff", Z: "#ff4af0",
};
export const BOSS_RAGE: Record<string, string> = { A: "#7a1a2a", a: "#4c0f1a", L: "#c0405a", B: "#e0a030", b: "#a06a10", E: "#ffde3b", T: "#ff5050" };

function rasterBoss(frame: number, mouthOpen: boolean): string[] {
  const g: string[][] = Array.from({ length: BH }, () => Array<string>(BW).fill("."));
  const put = (x: number, y: number, c: string) => { if (x >= 0 && x < BW && y >= 0 && y < BH) g[y][x] = c; };
  const ellipse = (cx: number, cy: number, rx: number, ry: number, c: string) => {
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) put(x, y, c);
  };
  const line = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, x = x0, y = y0;
    for (;;) { put(x, y, c); if (x === x1 && y === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x += sx; } if (e2 <= dx) { err += dx; y += sy; } }
  };
  const legs = frame === 0
    ? [[13, 16, 10, 20, 9, 23], [19, 17, 18, 21, 20, 23], [25, 16, 27, 20, 29, 23]]
    : [[13, 16, 11, 20, 12, 23], [19, 17, 17, 20, 16, 23], [25, 16, 26, 20, 27, 23]];
  for (const [a, b, c, d, e, f] of legs) { line(a, b, c, d, "G"); line(c, d, e, f, "G"); }
  ellipse(20, 11, 10, 7.5, "A");
  ellipse(21, 8, 6, 2.6, "L");
  for (const sx of [15, 20, 25]) for (let y = 5; y <= 17; y++) if (g[y][sx] === "A") put(sx, y, "a");
  ellipse(19, 15.5, 8, 2.6, "B");
  for (const sx of [14, 18, 22]) for (let y = 13; y <= 18; y++) if (g[y][sx] === "B") put(sx, y, "b");
  ellipse(8, 12, 5.5, 5, "A");
  ellipse(7, 10, 3, 1.5, "L");
  put(4, 10, "E"); put(5, 10, "E"); put(4, 11, "E"); put(5, 11, "e");
  put(8, 9, "E"); put(9, 9, "E"); put(8, 10, "e"); put(9, 10, "E");
  if (mouthOpen) {
    line(4, 15, 1, 17, "M"); line(1, 17, 2, 19, "M"); line(6, 16, 5, 19, "M"); line(5, 19, 7, 20, "M");
    put(3, 16, "O"); put(3, 17, "O"); put(4, 17, "O"); put(4, 18, "O");
  } else {
    line(4, 15, 2, 17, "M"); put(3, 18, "M"); line(6, 16, 6, 18, "M"); put(7, 19, "M");
  }
  line(7, 7, 3, 1, "T"); line(10, 7, 11, 1, "T"); put(2, 0, "T"); put(12, 0, "T");
  put(18, 6, "X"); put(26, 10, "Z"); put(13, 9, "X"); put(23, 14, "X");
  const out = g.map((row) => [...row]);
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
    if (g[y][x] !== ".") continue;
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oy]) => { const c = g[y + oy]?.[x + ox]; return c && c !== "."; });
    if (n) out[y][x] = "K";
  }
  return out.map((r) => r.join(""));
}

const BOSS_FRAMES = [0, 1].flatMap((f) => [false, true].map((m) => ({ key: `${f}${m ? 1 : 0}`, rows: rasterBoss(f, m) })));

function rowsToRects(rows: string[], palette: Record<string, string>, key: string) {
  const rects: React.ReactElement[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === c) end++;
      if (c !== ".") rects.push(<rect key={`${key}-${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={palette[c]} />);
      x = end;
    }
  });
  return rects;
}

/** All four frames are rendered once; the engine flips data-frame / data-mouth on the wrapper. */
export function BossSprite({ enraged }: { enraged: boolean }) {
  const palette = enraged ? { ...BOSS_PALETTE, ...BOSS_RAGE } : BOSS_PALETTE;
  return (
    <>
      {BOSS_FRAMES.map(({ key, rows }) => (
        <svg key={key} data-v={key} viewBox={`0 0 ${BW} ${BH}`} className="boss-sprite" shapeRendering="crispEdges" aria-hidden="true">
          {rowsToRects(rows, palette, key)}
        </svg>
      ))}
    </>
  );
}

/* ── Skill icons ───────────────────────────────────────────── */
const ICONS: Record<Skill, string> = {
  punch: "M3 6h8v2h1v5h-1v1H4v-1H3zM5 4h6v2H5z",
  orb: "M6 3h4v1h2v2h1v4h-1v2h-2v1H6v-1H4v-2H3V6h1V4h2zM7 6h2v1h1v2H9v1H7V9H6V7h1z",
  beam: "M1 6h3v4H1zM5 5h10v6H5zM5 7h10v2H5z",
  shield: "M3 2h10v2h1v5h-1v2h-2v2h-1v1H6v-1H5v-2H3V9H2V4h1zM6 5v5h4V5z",
  ultimate: "M7 1h2v2h1v3h1v4h1v2h-1v-1h-1v2H6v-2H5v1H4v-2h1V6h1V3h1zM7 13h2v2H7z",
};
function SkillIcon({ id }: { id: Skill }) {
  return <svg viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true"><path d={ICONS[id]} fill="currentColor" fillRule="evenodd" /></svg>;
}

/* ── HUD ───────────────────────────────────────────────────── */
export type HudSnapshot = {
  phase: BattlePhase; bossHP: number; heroHP: number; energy: number; enraged: boolean;
  cds: Record<Skill, number>; banner: string | null;
};

export function BattleHud({ hud, onSkill, onFlee, onRetry, onClose }: {
  hud: HudSnapshot; onSkill: (s: Skill) => void; onFlee: () => void; onRetry: () => void; onClose: () => void;
}) {
  const bossPct = Math.max(0, hud.bossHP / BOSS_MAX) * 100;
  const heroPct = Math.max(0, hud.heroHP / HERO_MAX) * 100;
  const fighting = hud.phase === "fight";
  const over = hud.phase === "victory" || hud.phase === "defeat";
  return (
    <div className={`battle-hud phase-${hud.phase}`}>
      {hud.phase === "warning" && (
        <div className="battle-warning" role="alert">
          <span className="warn-stripes" aria-hidden="true" />
          <strong>WARNING</strong>
          <span>A WILD BUG HAS APPEARED IN PRODUCTION</span>
          <span className="warn-stripes" aria-hidden="true" />
        </div>
      )}
      {hud.phase !== "warning" && (
        <div className={`boss-bar ${hud.enraged ? "is-enraged" : ""}`}>
          <div className="boss-bar-title"><span>FINAL BOSS · LV 99</span><strong>{hud.enraged ? "MUTATED PRODUCTION BUG" : "PRODUCTION BUG"}</strong></div>
          <div className="bar boss-hp" role="meter" aria-label="Boss health" aria-valuemin={0} aria-valuemax={BOSS_MAX} aria-valuenow={Math.max(0, Math.round(hud.bossHP))}>
            <i style={{ width: `${bossPct}%` }} /><b style={{ width: `${bossPct}%` }} />
          </div>
        </div>
      )}
      {(fighting || over || hud.phase === "transform") && (
        <div className="hero-bars">
          <div className="hero-name">PIXEL ERIC <small>DEVOPS MODE</small></div>
          <div className="bar hero-hp" role="meter" aria-label="Eric health" aria-valuemin={0} aria-valuemax={HERO_MAX} aria-valuenow={Math.max(0, Math.round(hud.heroHP))}><i style={{ width: `${heroPct}%` }} /></div>
          <div className={`bar hero-energy ${hud.energy >= 100 ? "is-full" : ""}`} role="meter" aria-label="Energy" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hud.energy)}><i style={{ width: `${hud.energy}%` }} /></div>
        </div>
      )}
      {hud.banner && <div className="battle-banner" key={hud.banner}>{hud.banner}</div>}
      {fighting && (
        <div className="skill-bar" role="toolbar" aria-label="Pixel Eric's skills">
          {SKILLS.map((s) => {
            const cd = hud.cds[s.id];
            const locked = s.id === "ultimate" && hud.energy < 100;
            return (
              <button key={s.id} type="button" className={`skill-btn skill-${s.id} ${locked ? "is-locked" : ""} ${cd > 0 ? "is-cooling" : ""}`}
                disabled={cd > 0 || locked} onClick={() => onSkill(s.id)} title={`${s.name} — ${s.desc} [${s.key}]`} aria-label={`${s.name}: ${s.desc}. Key ${s.key}`}>
                <SkillIcon id={s.id} />
                <span className="skill-name">{s.name}</span>
                <kbd>{s.key}</kbd>
                {cd > 0 && <span className="skill-cd" style={{ height: `${cd * 100}%` }} aria-hidden="true" />}
              </button>
            );
          })}
          <button type="button" className="skill-btn skill-flee" onClick={onFlee} title="Run away [Esc]"><span className="skill-name">RUN</span><kbd>ESC</kbd></button>
        </div>
      )}
      {over && (
        <div className={`battle-result ${hud.phase}`}>
          <strong>{hud.phase === "victory" ? "BUG SQUASHED!" : "GAME OVER"}</strong>
          <span>{hud.phase === "victory" ? "Hotfix deployed to production ✓" : "The bug crashed production..."}</span>
          <div>
            <button type="button" onClick={onRetry}>{hud.phase === "victory" ? "FIGHT AGAIN" : "RETRY"}</button>
            <button type="button" onClick={onClose}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Engine ────────────────────────────────────────────────── */
type Bullet = { x: number; h: number; vx: number; vh: number; g: number; size: number; kind: "err" | "orb" | "basic" | "meteor" | "wave"; dmg: number; from: "hero" | "boss"; dodgeRoll?: boolean; alive: boolean; spin: number };
type Fx = { x: number; h: number; vx: number; vh: number; g: number; life: number; max: number; color: string; size: number; kind: "px" | "text" | "ring" | "flash"; text?: string; big?: boolean };
type Action = { kind: Skill | "basic"; t0: number; stage: number; hits: number; next: number };
type BossAct = { kind: "spit" | "laser" | "stomp"; t0: number; fired: boolean; dodge: boolean; jumped: boolean; landed: boolean };

export type HeroView = { x: number; y: number; w: number; h: number; pose: HeroPose; facing: 1 | -1; state: HeroState };
export type BattleIO = {
  say: (text: string) => void;
  feel: (emotion: "fierce" | "happy" | "scared" | "dizzy" | "excited" | "neutral", ms: number) => void;
  bossSay: (text: string) => void;
  powered: (on: boolean) => void;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];

export class BossBattle {
  phase: BattlePhase = "warning";
  t0: number;
  vw: number;
  vh: number;
  k: number; // layout scale (1 desktop, ~0.66 mobile)
  bossW: number;
  bossH: number;
  bossX: number;
  bossY: number;
  bossVY = 0;
  bossHomeX: number;
  bossHP = BOSS_MAX;
  enraged = false;
  bossFrame = 0;
  mouth = false;
  bossHitUntil = 0;
  bossAct: BossAct | null = null;
  nextBossAct = 0;
  bossVisible = false;
  bossDead = false;
  heroHP = HERO_MAX;
  energy = 0;
  heroVY = 0;
  hurtUntil = 0;
  shieldUntil = 0;
  action: Action | null = null;
  queued: Skill | null = null;
  nextBasic = 0;
  readyAt: Record<Skill, number> = { punch: 0, orb: 0, beam: 0, shield: 0, ultimate: 0 };
  bullets: Bullet[] = [];
  fx: Fx[] = [];
  shake = 0;
  laser: { h: number; start: number; on: number; end: number } | null = null;
  beam: { until: number; nextTick: number } | null = null;
  banner: string | null = null;
  bannerUntil = 0;
  ended = false;
  private said = new Set<string>();
  private reduced: boolean;

  constructor(now: number, vw: number, vh: number, reduced: boolean) {
    this.t0 = now;
    this.vw = vw;
    this.vh = vh;
    this.reduced = reduced;
    this.k = vw < 768 ? 0.66 : 1;
    this.bossW = 192 * this.k;
    this.bossH = 144 * this.k;
    this.bossHomeX = Math.min(vw - this.bossW - 24, Math.max(vw * 0.62, 300 * this.k));
    this.bossX = this.bossHomeX;
    this.bossY = vh;
  }

  resize(vw: number, vh: number) {
    this.vw = vw; this.vh = vh;
    this.bossHomeX = Math.min(vw - this.bossW - 24, Math.max(vw * 0.62, 300 * this.k));
  }

  private once(key: string) { if (this.said.has(key)) return false; this.said.add(key); return true; }
  private setPhase(p: BattlePhase, now: number) { this.phase = p; this.t0 = now; }
  private showBanner(text: string, now: number, ms = 1600) { this.banner = text; this.bannerUntil = now + ms; }

  heroHome(w: number) { return Math.max(16, this.bossX - 270 * this.k - w); }

  /** Visitor pressed a skill. */
  use(skill: Skill, now: number) {
    if (this.phase !== "fight" || now < this.readyAt[skill]) return false;
    if (skill === "ultimate" && this.energy < 100) return false;
    this.queued = skill;
    return true;
  }

  /** Visitor clicked the boss directly. */
  poke(clientX: number, clientY: number, now: number) {
    if (this.phase !== "fight") return;
    const h = this.vh - 10 - clientY;
    for (let i = 0; i < 6; i++) this.spark(clientX, h, "#f6cf62");
    this.damageBoss(6, clientX, h, now);
  }

  /** A treat dropped mid-fight becomes a buff. */
  treat(kind: "coffee" | "beer", heroX: number, heroH: number, now: number) {
    if (kind === "coffee") {
      this.heroHP = Math.min(HERO_MAX, this.heroHP + 30);
      this.energy = Math.min(100, this.energy + 25);
      this.text(heroX, heroH + 30, "+30 HP", "#7ec860", true);
    } else {
      this.energy = Math.min(100, this.energy + 45);
      this.text(heroX, heroH + 30, "LIQUID COURAGE!", "#f6cf62", true);
    }
    for (let i = 0; i < 14; i++) this.spark(heroX, heroH, kind === "coffee" ? "#7ec860" : "#f6cf62");
    void now;
  }

  flee(now: number) {
    if (this.phase === "victory" || this.phase === "defeat") { this.ended = true; return; }
    this.setPhase("flee", now);
    this.bullets = [];
    this.laser = null;
    this.beam = null;
    this.action = null;
  }

  private spark(x: number, h: number, color: string, speed = 260) {
    const a = Math.random() * Math.PI * 2;
    const s = rand(speed * 0.4, speed);
    this.fx.push({ x, h, vx: Math.cos(a) * s, vh: Math.sin(a) * s, g: 600, life: 0, max: rand(0.25, 0.55), color, size: rand(3, 6), kind: "px" });
  }
  private text(x: number, h: number, text: string, color: string, big = false) {
    this.fx.push({ x, h, vx: rand(-20, 20), vh: 90, g: 0, life: 0, max: big ? 1.3 : 0.8, color, size: big ? 14 : 11, kind: "text", text, big });
  }
  private ring(x: number, h: number, color: string, size = 60) {
    this.fx.push({ x, h, vx: 0, vh: 0, g: 0, life: 0, max: 0.45, color, size, kind: "ring" });
  }
  private flash(color: string, max = 0.35) {
    this.fx.push({ x: 0, h: 0, vx: 0, vh: 0, g: 0, life: 0, max, color, size: 0, kind: "flash" });
  }
  private kick(n: number) { if (!this.reduced) this.shake = Math.max(this.shake, n); }

  private bossBox() {
    return { x0: this.bossX + 14 * this.k, x1: this.bossX + this.bossW - 10 * this.k, h0: this.bossY, h1: this.bossY + this.bossH * 0.85 };
  }

  private damageBoss(dmg: number, x: number, h: number, now: number) {
    if (this.phase !== "fight" || this.bossHP <= 0) return;
    const amount = Math.round(dmg * (this.enraged ? 0.9 : 1));
    this.bossHP -= amount;
    this.bossHitUntil = now + 90;
    this.energy = Math.min(100, this.energy + amount * 0.07);
    this.text(x + rand(-10, 10), h + rand(0, 20), `-${amount}`, amount >= 30 ? "#f6cf62" : "#ffffff", amount >= 30);
    if (!this.enraged && this.bossHP <= BOSS_MAX * 0.4) {
      this.enraged = true;
      this.kick(18);
      this.flash("#ff2a2a", 0.4);
      this.showBanner("ERROR 500 — THE BUG IS MUTATING!", now, 2000);
    }
    if (this.bossHP <= 0) {
      this.bossHP = 0;
      this.setPhase("victory", now);
      this.action = null;
      this.bullets = this.bullets.filter((b) => b.from === "hero");
      this.laser = null;
      this.beam = null;
      this.bossAct = null;
    }
  }

  private hurtHero(dmg: number, hero: HeroView, now: number, io: BattleIO) {
    const cx = hero.x + hero.w / 2;
    if (now < this.shieldUntil) {
      for (let i = 0; i < 8; i++) this.spark(cx + 20, hero.y + hero.h * 0.5, "#9ff0ff");
      this.text(cx, hero.y + hero.h, "BLOCKED", "#9ff0ff");
      return;
    }
    if (this.phase !== "fight") return;
    this.heroHP -= dmg;
    this.hurtUntil = now + 380;
    this.energy = Math.min(100, this.energy + 5);
    this.kick(8);
    this.text(cx, hero.y + hero.h, `-${dmg}`, "#ff5050");
    for (let i = 0; i < 8; i++) this.spark(cx, hero.y + hero.h * 0.5, "#ff5050");
    if (this.heroHP <= 0) {
      this.heroHP = 0;
      this.setPhase("defeat", now);
      this.action = null;
      this.beam = null;
      io.feel("dizzy", 600000);
      io.bossSay(pick(["HAHAHA! WORKS ON MY MACHINE!", "SEGFAULT! HAHA!", "YOUR PIPELINE FAILED!"]));
      return;
    }
    if (this.heroHP < 35 && this.once("lowhp")) io.say("I'm not giving up!");
  }

  private startAction(kind: Skill | "basic", now: number, io: BattleIO, hero: HeroView) {
    this.action = { kind, t0: now, stage: 0, hits: 0, next: now };
    if (kind !== "basic") {
      const s = SKILLS.find((x) => x.id === kind)!;
      this.readyAt[kind] = now + s.cd;
      if (kind !== "punch") io.say(`${s.name}!`);
    }
    if (kind === "shield") {
      this.shieldUntil = now + 3200;
      this.heroHP = Math.min(HERO_MAX, this.heroHP + 15);
      this.text(hero.x + hero.w / 2, hero.y + hero.h + 10, "+15 HP", "#7ec860");
      this.ring(hero.x + hero.w / 2, hero.y + hero.h / 2, "#9ff0ff", 90);
    }
    if (kind === "ultimate") {
      this.energy = 0;
      this.heroVY = 1150;
      this.flash("#7ec860", 0.4);
      this.showBanner("ULTIMATE: DEPLOY TO PROD!!", now, 1800);
      io.feel("fierce", 4000);
    }
  }

  private fire(from: "hero" | "boss", kind: Bullet["kind"], x: number, h: number, vx: number, vh: number, g: number, size: number, dmg: number) {
    this.bullets.push({ x, h, vx, vh, g, size, kind, dmg, from, alive: true, spin: Math.random() * 6 });
  }

  update(now: number, dt: number, hero: HeroView, io: BattleIO) {
    const t = (now - this.t0) / 1000;
    const cx = hero.x + hero.w / 2;
    if (this.banner && now > this.bannerUntil) this.banner = null;
    this.shake = Math.max(0, this.shake - dt * 40);
    hero.facing = 1;
    hero.state = "battle";

    // hero vertical motion
    if (hero.y > 0 || this.heroVY > 0) {
      this.heroVY -= HERO_GRAVITY * dt;
      hero.y = Math.max(0, hero.y + this.heroVY * dt);
      if (hero.y === 0) this.heroVY = 0;
    }

    // boss leg animation + idle drift
    this.bossFrame = Math.floor(now / 260) % 2;

    switch (this.phase) {
      case "warning": {
        hero.pose = "idle";
        if (this.once("warn")) { io.feel("scared", 1800); io.say("Wait... what's that noise?!"); }
        if (t > 2.1) { this.setPhase("enter", now); this.bossVisible = true; this.bossY = this.vh * 0.7; this.bossVY = 0; }
        break;
      }
      case "enter": {
        hero.pose = "idle";
        if (this.bossY > 0) {
          this.bossVY -= BOSS_GRAVITY * dt;
          this.bossY = Math.max(0, this.bossY + this.bossVY * dt);
          if (this.bossY === 0) {
            this.kick(22);
            for (let i = 0; i < 26; i++) this.spark(this.bossX + rand(0, this.bossW), 4, pick(["#5b1a6e", "#9a3cb5", "#3a433a"]), 360);
            io.bossSay("I AM THE PRODUCTION BUG!!");
            this.mouth = true;
            this.t0 = now; // restart timer for the roar
          }
        } else {
          if (t > 0.9) this.mouth = false;
          if (t > 1.5) {
            this.setPhase("transform", now);
            io.say("A bug in production?! Time to transform!");
            io.feel("fierce", 600000);
          }
        }
        break;
      }
      case "transform": {
        hero.pose = "charge";
        // energy gathering particles
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = rand(60, 120);
          this.fx.push({ x: cx + Math.cos(a) * r, h: hero.h * 0.5 + Math.sin(a) * r, vx: -Math.cos(a) * r * 2.4, vh: -Math.sin(a) * r * 2.4, g: 0, life: 0, max: 0.4, color: pick(["#7ec860", "#c8ffb0", "#ffffff"]), size: rand(3, 5), kind: "px" });
        }
        this.kick(t * 3);
        if (t > 1.3 && this.once("powered")) {
          io.powered(true);
          this.flash("#ffffff", 0.5);
          this.ring(cx, hero.h * 0.5, "#7ec860", 140);
          this.kick(16);
          this.showBanner("DEVOPS MODE: ACTIVATED!", now, 1500);
          io.say("DEVOPS MODE: ACTIVATED!");
        }
        if (t > 2.3) { this.setPhase("fight", now); this.nextBossAct = now + 1400; this.nextBasic = now + 900; }
        break;
      }
      case "fight": {
        this.updateHero(now, dt, hero, io);
        this.updateBoss(now, dt, hero, io);
        break;
      }
      case "victory": {
        hero.pose = t > 1.6 ? "wave" : "idle";
        if (t < 1.6) {
          if (Math.random() < 0.6) {
            const bx = this.bossX + rand(0, this.bossW), bh = this.bossY + rand(0, this.bossH);
            for (let i = 0; i < 5; i++) this.spark(bx, bh, pick(["#ff3b3b", "#f6cf62", "#ffffff", "#9a3cb5"]), 420);
            if (Math.random() < 0.3) this.ring(bx, bh, "#f6cf62", 50);
          }
          this.kick(6);
        } else if (this.once("boom")) {
          this.bossDead = true;
          this.flash("#ffffff", 0.5);
          for (let i = 0; i < 40; i++) this.spark(this.bossX + this.bossW / 2, this.bossH / 2, pick(["#ff3b3b", "#f6cf62", "#ffffff", "#9a3cb5", "#4af0ff"]), 600);
          this.kick(24);
          io.feel("happy", 5000);
          io.say("BUG SQUASHED! Hotfix deployed!");
        }
        if (t > 4 && this.once("detransform")) {
          io.powered(false);
          this.ring(cx, hero.h * 0.5, "#7ec860", 80);
          for (let i = 0; i < 16; i++) this.spark(cx, hero.h * 0.5, "#c8ffb0");
        }
        if (t > 12) this.ended = true;
        break;
      }
      case "defeat": {
        hero.pose = "idle";
        hero.state = "ko";
        this.mouth = Math.floor(now / 180) % 2 === 0 && t < 2;
        break;
      }
      case "flee": {
        hero.pose = t < 0.4 ? "idle" : "step";
        this.bossX += 260 * dt;
        if (t > 0.2 && this.once("fleeSay")) { io.powered(false); io.say("Phew... I'll fix it tomorrow."); io.feel("neutral", 10); }
        if (t > 1.4) this.ended = true;
        break;
      }
    }

    this.updateBullets(now, dt, hero, io);
    this.updateFx(dt);
    if (this.phase !== "defeat" && this.phase !== "victory" && now < this.hurtUntil) hero.state = "hurt";
    if (hero.y > 0 && hero.state === "battle") hero.state = "air";
  }

  private updateHero(now: number, dt: number, hero: HeroView, io: BattleIO) {
    const cx = hero.x + hero.w / 2;
    const handH = () => hero.y + hero.h * 0.5;
    const handX = () => hero.x + hero.w * 0.9;
    const home = this.heroHome(hero.w);
    const moveTo = (goal: number, speed: number) => {
      const d = goal - hero.x;
      hero.x += Math.sign(d) * Math.min(Math.abs(d), speed * dt);
      return Math.abs(goal - hero.x) < 2;
    };
    const runPose = () => { hero.pose = Math.floor(now / 80) % 2 ? "step" : "pass"; };

    // aura particles
    if (Math.random() < 0.7) this.fx.push({ x: cx + rand(-hero.w * 0.4, hero.w * 0.4), h: hero.y + rand(0, hero.h * 0.6), vx: rand(-10, 10), vh: rand(60, 140), g: 0, life: 0, max: rand(0.3, 0.6), color: pick(["#7ec860", "#c8ffb0", "#57d13f"]), size: rand(2, 4), kind: "px" });

    if (!this.action) {
      if (this.queued) { const q = this.queued; this.queued = null; this.startAction(q, now, io, hero); }
      else if (now > this.nextBasic && Math.abs(hero.x - home) < 40) { this.startAction("basic", now, io, hero); this.nextBasic = now + rand(1500, 2100); }
    }

    const a = this.action;
    if (!a) {
      if (moveTo(home, 520)) hero.pose = "idle"; else runPose();
      return;
    }
    const at = (now - a.t0) / 1000;
    switch (a.kind) {
      case "basic": {
        hero.pose = "cast";
        if (a.stage === 0) { a.stage = 1; this.fire("hero", "basic", handX(), handH(), 760, 0, 0, 8, 14); }
        if (at > 0.24) this.action = null;
        break;
      }
      case "punch": {
        const reach = this.bossX + 16 * this.k - hero.w * 0.62;
        if (a.stage === 0) { runPose(); if (moveTo(reach, 1300)) { a.stage = 1; a.next = now; } }
        else if (a.stage === 1) {
          hero.pose = Math.floor((now - a.next) / 70) % 2 ? "idle" : "punch";
          if (now >= a.next && a.hits < 3) {
            a.hits++;
            a.next = now + 140;
            const hx = this.bossX + 18 * this.k, hh = hero.y + hero.h * 0.55;
            for (let i = 0; i < 8; i++) this.spark(hx, hh, a.hits === 3 ? "#f6cf62" : "#ffffff", 340);
            if (a.hits === 3) this.ring(hx, hh, "#f6cf62", 50);
            this.kick(a.hits === 3 ? 9 : 4);
            this.damageBoss(a.hits === 3 ? 48 : 26, hx, hh, now);
          }
          if (a.hits >= 3 && now > a.next + 120) a.stage = 2;
        } else {
          hero.pose = Math.floor(now / 80) % 2 ? "step" : "pass";
          hero.facing = 1;
          if (moveTo(home, 900)) this.action = null;
        }
        break;
      }
      case "orb": {
        hero.pose = "cast";
        if (a.stage === 0) {
          for (let i = 0; i < 2; i++) {
            const ang = Math.random() * Math.PI * 2, r = rand(30, 50);
            this.fx.push({ x: handX() + Math.cos(ang) * r, h: handH() + Math.sin(ang) * r, vx: -Math.cos(ang) * r * 3, vh: -Math.sin(ang) * r * 3, g: 0, life: 0, max: 0.3, color: "#c8ffb0", size: 3, kind: "px" });
          }
          if (at > 0.35) { a.stage = 1; a.next = now; }
        } else {
          if (now >= a.next && a.hits < 3) {
            a.hits++;
            a.next = now + 120;
            this.fire("hero", "orb", handX(), handH() + (a.hits - 2) * 10, 640, (a.hits - 2) * 40, 0, 14, 42);
          }
          if (a.hits >= 3 && now > a.next + 150) this.action = null;
        }
        break;
      }
      case "beam": {
        if (a.stage === 0) {
          hero.pose = "charge";
          for (let i = 0; i < 4; i++) {
            const ang = Math.random() * Math.PI * 2, r = rand(50, 110);
            this.fx.push({ x: handX() + Math.cos(ang) * r, h: handH() + Math.sin(ang) * r, vx: -Math.cos(ang) * r * 2.2, vh: -Math.sin(ang) * r * 2.2, g: 0, life: 0, max: 0.45, color: pick(["#7ec860", "#ffffff", "#c8ffb0"]), size: rand(2, 5), kind: "px" });
          }
          this.kick(2 + at * 3);
          if (at > 0.9) { a.stage = 1; this.beam = { until: now + 1300, nextTick: now }; this.flash("#c8ffb0", 0.25); this.kick(12); }
        } else {
          hero.pose = "cast";
          if (this.beam && now >= this.beam.nextTick) {
            this.beam.nextTick = now + 80;
            const bx = this.bossX + rand(10, 40) * this.k;
            this.damageBoss(15, bx, handH(), now);
            for (let i = 0; i < 3; i++) this.spark(bx, handH(), pick(["#ffffff", "#c8ffb0", "#7ec860"]), 380);
            this.kick(6);
          }
          if (!this.beam || now > this.beam.until) { this.beam = null; this.action = null; }
        }
        break;
      }
      case "shield": {
        hero.pose = "cast";
        if (at > 0.3) this.action = null;
        break;
      }
      case "ultimate": {
        hero.pose = "charge";
        if (a.stage === 0 && at > 0.45) { a.stage = 1; a.next = now; this.heroVY = Math.max(this.heroVY, 200); }
        if (a.stage === 1) {
          hero.pose = "cast";
          if (now >= a.next && a.hits < 14) {
            a.hits++;
            a.next = now + 85;
            this.fire("hero", "meteor", this.bossX + rand(0, this.bossW), this.vh * 0.9, rand(-60, 60), -rand(800, 1000), 0, 20, 34);
          }
          if (a.hits >= 14 && at > 2.2) { this.action = null; io.feel("fierce", 600000); }
        }
        break;
      }
    }
    void dt;
  }

  private updateBoss(now: number, dt: number, hero: HeroView, io: BattleIO) {
    const b = this.bossAct;
    const mouthX = this.bossX + 18 * this.k;
    const mouthH = this.bossY + this.bossH * 0.3;
    if (!b) {
      this.mouth = false;
      const drift = this.bossHomeX + Math.sin(now / 900) * 30 * this.k;
      this.bossX += (drift - this.bossX) * Math.min(1, dt * 2);
      if (now > this.nextBossAct) {
        const r = Math.random();
        this.bossAct = { kind: r < 0.42 ? "spit" : r < 0.72 ? "laser" : "stomp", t0: now, fired: false, dodge: Math.random() < (this.enraged ? 0.55 : 0.7), jumped: false, landed: false };
        if (Math.random() < 0.35) io.bossSay(pick(["NULL POINTER!", "UNDEFINED IS NOT A FUNCTION!", "IT WORKS ON MY MACHINE!", "MERGE CONFLICT!", "TIMEOUT!!"]));
      }
      return;
    }
    const t = (now - b.t0) / 1000;
    const heroCx = hero.x + hero.w / 2;
    if (b.kind === "spit") {
      this.mouth = t < 0.75;
      if (t > 0.45 && !b.fired) {
        b.fired = true;
        const n = this.enraged ? 5 : 3;
        for (let i = 0; i < n; i++) {
          const T = 0.75 + i * 0.13;
          const gx = heroCx + rand(-30, 30) + (i - (n - 1) / 2) * 26;
          const gh = hero.h * 0.4;
          const g = 900;
          const vx = (gx - mouthX) / T;
          const vh = (gh - mouthH + 0.5 * g * T * T) / T;
          this.fire("boss", "err", mouthX, mouthH, vx, vh, g, 16, 10);
        }
      }
      if (t > 1.0) this.endBossAct(now);
    } else if (b.kind === "laser") {
      const h = hero.h * 0.42;
      if (!this.laser) this.laser = { h, start: now, on: now + 800, end: now + 1350 };
      if (b.dodge && !b.jumped && t > 0.62 && hero.y === 0 && !this.action) { b.jumped = true; this.heroVY = 860; }
      if (now > this.laser.on && !b.fired && now < this.laser.end) {
        if (hero.y < h - 6 && hero.y + hero.h > h) { b.fired = true; this.hurtHero(this.enraged ? 22 : 16, hero, now, io); }
      }
      if (now >= this.laser.on && Math.random() < 0.5) this.spark(rand(0, this.bossX), h, "#ff5050", 200);
      if (now > this.laser.end) { this.laser = null; this.endBossAct(now); }
    } else if (b.kind === "stomp") {
      if (!b.jumped) { b.jumped = true; this.bossVY = 980; }
      this.bossVY -= BOSS_GRAVITY * dt;
      this.bossY = Math.max(0, this.bossY + this.bossVY * dt);
      if (this.bossY === 0 && this.bossVY < 0 && !b.landed && t > 0.2) {
        b.landed = true;
        this.bossVY = 0;
        this.kick(20);
        for (let i = 0; i < 20; i++) this.spark(this.bossX + rand(0, this.bossW), 4, pick(["#9a3cb5", "#3a433a", "#ff5050"]), 380);
        this.fire("boss", "wave", this.bossX + 10, 0, -560, 0, 0, 30, this.enraged ? 18 : 14);
        if (this.enraged) this.fire("boss", "wave", this.bossX + 10, 0, -380, 0, 0, 30, 12);
      }
      if (b.landed && t > 0.9) this.endBossAct(now);
    }
  }

  private endBossAct(now: number) {
    this.bossAct = null;
    this.mouth = false;
    this.nextBossAct = now + (this.enraged ? rand(1300, 1900) : rand(2000, 2800));
  }

  private updateBullets(now: number, dt: number, hero: HeroView, io: BattleIO) {
    const box = this.bossBox();
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.vh -= b.g * dt;
      b.x += b.vx * dt;
      b.h += b.vh * dt;
      b.spin += dt * 8;
      if (b.from === "hero") {
        if (Math.random() < 0.6) this.fx.push({ x: b.x - b.vx * 0.02, h: b.h, vx: -b.vx * 0.1, vh: rand(-20, 20), g: 0, life: 0, max: 0.25, color: b.kind === "meteor" ? "#f6cf62" : "#c8ffb0", size: b.size * 0.4, kind: "px" });
        if (!this.bossDead && b.x > box.x0 && b.x < box.x1 && b.h > box.h0 && b.h < box.h1) {
          b.alive = false;
          for (let i = 0; i < 7; i++) this.spark(b.x, b.h, b.kind === "meteor" ? "#f6cf62" : "#c8ffb0", 300);
          if (b.kind !== "basic") this.ring(b.x, b.h, "#7ec860", b.kind === "meteor" ? 44 : 30);
          this.kick(b.kind === "meteor" ? 7 : b.kind === "orb" ? 5 : 2);
          this.damageBoss(b.dmg, b.x, b.h, now);
        }
      } else {
        const hx0 = hero.x + hero.w * 0.2, hx1 = hero.x + hero.w * 0.8;
        if (b.kind === "wave") {
          if (b.dodgeRoll === undefined && b.x - hx1 < 120 && b.x > hx0) {
            b.dodgeRoll = Math.random() < (this.enraged ? 0.6 : 0.75);
            if (b.dodgeRoll && hero.y === 0 && (!this.action || this.action.kind === "basic")) this.heroVY = 820;
          }
          if (Math.random() < 0.8) this.fx.push({ x: b.x + rand(0, 20), h: rand(0, 26), vx: 40, vh: rand(20, 60), g: 0, life: 0, max: 0.3, color: pick(["#9a3cb5", "#ff5050"]), size: rand(3, 6), kind: "px" });
        }
        const inX = b.x > hx0 && b.x < hx1;
        const inH = b.kind === "wave" ? hero.y < 26 : b.h > hero.y && b.h < hero.y + hero.h * 0.9;
        if (inX && inH && this.phase === "fight") {
          b.alive = false;
          this.hurtHero(b.dmg, hero, now, io);
        } else if (b.kind === "err" && b.h <= 0) {
          b.alive = false;
          for (let i = 0; i < 5; i++) this.spark(b.x, 2, "#ff5050", 160);
        }
      }
      if (b.x < -60 || b.x > this.vw + 60 || b.h < -40 || b.h > this.vh + 200) b.alive = false;
    }
    this.bullets = this.bullets.filter((b) => b.alive);
    if (this.fx.length > 500) this.fx.splice(0, this.fx.length - 500);
  }

  private updateFx(dt: number) {
    for (const f of this.fx) { f.life += dt; f.vh -= f.g * dt; f.x += f.vx * dt; f.h += f.vh * dt; }
    this.fx = this.fx.filter((f) => f.life < f.max);
  }

  snapshot(now: number): HudSnapshot {
    const cds = {} as Record<Skill, number>;
    for (const s of SKILLS) cds[s.id] = s.cd ? Math.max(0, Math.min(1, (this.readyAt[s.id] - now) / s.cd)) : 0;
    return { phase: this.phase, bossHP: this.bossHP, heroHP: this.heroHP, energy: this.energy, enraged: this.enraged, cds, banner: this.banner };
  }

  /* ── Canvas renderer ──────────────────────────────────────── */
  draw(ctx: CanvasRenderingContext2D, hero: HeroView, now: number, pixelFont: string) {
    const { vw, vh } = this;
    const floor = vh - 10;
    const Y = (h: number) => floor - h;
    ctx.save();
    ctx.clearRect(0, 0, vw, vh);
    ctx.imageSmoothingEnabled = false;
    const sx = this.shake ? rand(-this.shake, this.shake) : 0;
    const sy = this.shake ? rand(-this.shake, this.shake) * 0.6 : 0;
    ctx.translate(Math.round(sx), Math.round(sy));

    // boss laser (telegraph → fire)
    if (this.laser) {
      const ly = Y(this.laser.h);
      const eyeX = this.bossX + 8 * this.k;
      if (now < this.laser.on) {
        ctx.globalAlpha = 0.4 + 0.4 * Math.abs(Math.sin(now / 50));
        ctx.fillStyle = "#ff3b3b";
        for (let x = 0; x < eyeX; x += 16) ctx.fillRect(x, ly - 1, 9, 2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ff3b3b";
        ctx.font = `10px ${pixelFont}`;
        ctx.fillText("!", eyeX - 20, ly - 10);
      } else if (now < this.laser.end) {
        const th = 14 + Math.sin(now / 20) * 3;
        ctx.shadowColor = "#ff2a2a"; ctx.shadowBlur = 24;
        ctx.fillStyle = "#ff2a2a"; ctx.fillRect(0, ly - th / 2, eyeX, th);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffe0e0"; ctx.fillRect(0, ly - th / 5, eyeX, (th * 2) / 5);
      }
    }

    // hero beam
    if (this.beam && now < this.beam.until) {
      const bx = hero.x + hero.w * 0.85;
      const by = Y(hero.y + hero.h * 0.5);
      const th = 34 * this.k + Math.sin(now / 25) * 6;
      ctx.shadowColor = "#7ec860"; ctx.shadowBlur = 40;
      ctx.fillStyle = "#57d13f"; ctx.fillRect(bx, by - th / 2, vw - bx, th);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#c8ffb0"; ctx.fillRect(bx, by - th / 3, vw - bx, (th * 2) / 3);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(bx, by - th / 7, vw - bx, (th * 2) / 7);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(bx - 12, by - th * 0.7, 24, th * 1.4);
      ctx.font = `${Math.round(9 * Math.max(this.k, 0.8))}px ${pixelFont}`;
      ctx.fillStyle = "#0e110e";
      ctx.fillText("$ kubectl delete pod/production-bug --force", bx + 30, by + 4);
    }

    // shield
    if (now < this.shieldUntil) {
      const cx = hero.x + hero.w / 2, cy = Y(hero.y + hero.h * 0.5);
      const r = hero.h * 0.72;
      const left = (this.shieldUntil - now) / 1000;
      ctx.globalAlpha = left < 0.6 ? 0.4 + 0.4 * Math.abs(Math.sin(now / 40)) : 0.9;
      ctx.strokeStyle = "#9ff0ff"; ctx.lineWidth = 3;
      ctx.shadowColor = "#9ff0ff"; ctx.shadowBlur = 14;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) { const a = (Math.PI / 3) * i + now / 900; const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(159,240,255,0.12)"; ctx.fill();
      ctx.globalAlpha = 1;
    }

    // bullets
    for (const b of this.bullets) {
      const x = b.x, y = Y(b.h), s = b.size;
      if (b.kind === "err") {
        ctx.fillStyle = "#3a0010"; ctx.fillRect(x - s / 2 - 2, y - s / 2 - 2, s + 4, s + 4);
        ctx.fillStyle = "#ff3b3b"; ctx.fillRect(x - s / 2, y - s / 2, s, s);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 1, y - s / 2 + 3, 3, s - 9); ctx.fillRect(x - 1, y + s / 2 - 4, 3, 2);
      } else if (b.kind === "wave") {
        ctx.shadowColor = "#ff3b3b"; ctx.shadowBlur = 16;
        for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? "#9a3cb5" : "#ff5050"; ctx.fillRect(x + i * 7, y - 26 + i * 5, 7, 26 - i * 5); }
        ctx.shadowBlur = 0;
      } else if (b.kind === "meteor") {
        ctx.shadowColor = "#f6cf62"; ctx.shadowBlur = 18;
        ctx.fillStyle = "#2a6fd6"; ctx.fillRect(x - s / 2, y - s / 2, s, s);
        ctx.fillStyle = "#7ec860"; ctx.fillRect(x - s / 2, y - s / 2, s, 4);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(x - s / 2 + 3, y - 1, s - 6, 2); ctx.fillRect(x - s / 2 + 3, y + 4, s - 6, 2);
        ctx.shadowBlur = 0;
      } else {
        ctx.shadowColor = "#7ec860"; ctx.shadowBlur = b.kind === "orb" ? 22 : 10;
        ctx.fillStyle = "#57d13f"; ctx.fillRect(x - s / 2, y - s / 2, s, s);
        ctx.fillStyle = "#e6ffe0"; ctx.fillRect(x - s / 4, y - s / 4, s / 2, s / 2);
        ctx.shadowBlur = 0;
      }
    }

    // particles, rings, damage numbers
    for (const f of this.fx) {
      const p = f.life / f.max;
      if (f.kind === "flash") { ctx.globalAlpha = (1 - p) * 0.7; ctx.fillStyle = f.color; ctx.fillRect(-20, -20, vw + 40, vh + 40); continue; }
      ctx.globalAlpha = Math.max(0, 1 - p);
      if (f.kind === "px") { ctx.fillStyle = f.color; ctx.fillRect(Math.round(f.x - f.size / 2), Math.round(Y(f.h) - f.size / 2), Math.ceil(f.size), Math.ceil(f.size)); }
      else if (f.kind === "ring") { ctx.strokeStyle = f.color; ctx.lineWidth = 4 * (1 - p) + 1; ctx.beginPath(); ctx.arc(f.x, Y(f.h), f.size * (0.3 + p), 0, Math.PI * 2); ctx.stroke(); }
      else if (f.kind === "text" && f.text) {
        ctx.font = `${f.size}px ${pixelFont}`;
        ctx.textAlign = "center";
        ctx.lineWidth = 4; ctx.strokeStyle = "#000000"; ctx.strokeText(f.text, f.x, Y(f.h));
        ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, Y(f.h));
        ctx.textAlign = "start";
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    return { sx, sy };
  }
}

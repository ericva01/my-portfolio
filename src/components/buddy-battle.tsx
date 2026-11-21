"use client";

/* ─────────────────────────────────────────────────────────────
   BOSS BATTLE — a tiny pixel fighting game for Pixel Eric.
   A random boss is summoned each time. Every boss has its own
   sprite, move set, lines, colours and animated arena.
   The engine is plain TypeScript (no React state per frame);
   the page renders a HUD snapshot ~10× per second and draws
   projectiles / effects / arena backgrounds on two canvases.
   ───────────────────────────────────────────────────────────── */

export type Skill = "punch" | "orb" | "beam" | "shield" | "ultimate";
export type BossId = "bug" | "virus" | "hacker" | "ransom";
export type BattlePhase = "warning" | "enter" | "transform" | "fight" | "victory" | "defeat" | "flee";
export type HeroPose = "idle" | "step" | "pass" | "punch" | "cast" | "charge" | "wave";
export type HeroState = "battle" | "hurt" | "ko" | "air" | "poison";

export const SKILLS: { id: Skill; key: string; name: string; desc: string; cd: number }[] = [
  { id: "punch", key: "1", name: "DOCKER PUNCH", desc: "Dash in, 3-hit combo", cd: 1100 },
  { id: "orb", key: "2", name: "PIPELINE BLAST", desc: "Fires 3 energy orbs", cd: 2600 },
  { id: "beam", key: "3", name: "KUBECTL DELETE", desc: "Charged mega beam", cd: 9000 },
  { id: "shield", key: "4", name: "ROLLBACK SHIELD", desc: "Blocks attacks, heals", cd: 7000 },
  { id: "ultimate", key: "5", name: "DEPLOY TO PROD", desc: "Ultimate · needs 100% energy", cd: 0 },
];

export const HERO_MAX = 100;
const HERO_GRAVITY = 2400;
const BOSS_GRAVITY = 2600;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];

/* ── Pixel raster helpers ──────────────────────────────────── */
const GW = 32;
const GH = 24;
function grid() {
  const g: string[][] = Array.from({ length: GH }, () => Array<string>(GW).fill("."));
  const put = (x: number, y: number, c: string) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < GW && y >= 0 && y < GH) g[y][x] = c; };
  const ellipse = (cx: number, cy: number, rx: number, ry: number, c: string) => {
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) g[y][x] = c;
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c); };
  const line = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, x = x0, y = y0;
    for (;;) { put(x, y, c); if (x === x1 && y === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x += sx; } if (e2 <= dx) { err += dx; y += sy; } }
  };
  const at = (x: number, y: number) => g[y]?.[x];
  const done = () => {
    const out = g.map((row) => [...row]);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      if (g[y][x] !== ".") continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oy]) => { const c = g[y + oy]?.[x + ox]; return c && c !== "."; })) out[y][x] = "K";
    }
    return out.map((r) => r.join(""));
  };
  return { put, ellipse, rect, line, at, done };
}

function rasterBug(frame: number, mouth: boolean) {
  const r = grid();
  const legs = frame === 0
    ? [[13, 16, 10, 20, 9, 23], [19, 17, 18, 21, 20, 23], [25, 16, 27, 20, 29, 23]]
    : [[13, 16, 11, 20, 12, 23], [19, 17, 17, 20, 16, 23], [25, 16, 26, 20, 27, 23]];
  for (const [a, b, c, d, e, f] of legs) { r.line(a, b, c, d, "G"); r.line(c, d, e, f, "G"); }
  r.ellipse(20, 11, 10, 7.5, "A");
  r.ellipse(21, 8, 6, 2.6, "L");
  for (const sx of [15, 20, 25]) for (let y = 5; y <= 17; y++) if (r.at(sx, y) === "A") r.put(sx, y, "a");
  r.ellipse(19, 15.5, 8, 2.6, "B");
  for (const sx of [14, 18, 22]) for (let y = 13; y <= 18; y++) if (r.at(sx, y) === "B") r.put(sx, y, "b");
  r.ellipse(8, 12, 5.5, 5, "A");
  r.ellipse(7, 10, 3, 1.5, "L");
  r.put(4, 10, "E"); r.put(5, 10, "E"); r.put(4, 11, "E"); r.put(5, 11, "e");
  r.put(8, 9, "E"); r.put(9, 9, "E"); r.put(8, 10, "e"); r.put(9, 10, "E");
  if (mouth) {
    r.line(4, 15, 1, 17, "M"); r.line(1, 17, 2, 19, "M"); r.line(6, 16, 5, 19, "M"); r.line(5, 19, 7, 20, "M");
    r.put(3, 16, "O"); r.put(3, 17, "O"); r.put(4, 17, "O"); r.put(4, 18, "O");
  } else {
    r.line(4, 15, 2, 17, "M"); r.put(3, 18, "M"); r.line(6, 16, 6, 18, "M"); r.put(7, 19, "M");
  }
  r.line(7, 7, 3, 1, "T"); r.line(10, 7, 11, 1, "T"); r.put(2, 0, "T"); r.put(12, 0, "T");
  r.put(18, 6, "X"); r.put(26, 10, "Z"); r.put(13, 9, "X"); r.put(23, 14, "X");
  return r.done();
}

function rasterVirus(frame: number, mouth: boolean) {
  const r = grid();
  const cx = 16, cy = 11.5;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const len = 10.4 + (frame ? (i % 2 ? 1 : -0.4) : (i % 2 ? -0.4 : 1));
    const x1 = cx + Math.cos(a) * len, y1 = cy + Math.sin(a) * len * 0.92;
    r.line(cx + Math.cos(a) * 7, cy + Math.sin(a) * 6.5, x1, y1, "a");
    r.put(x1, y1, "L"); r.put(x1 + 1, y1, "L"); r.put(x1, y1 + 1, "L"); r.put(x1 + 1, y1 + 1, "L");
  }
  r.ellipse(cx, cy, 8.5, 8, "A");
  r.ellipse(13.5, 8, 4, 2.4, "L");
  r.ellipse(21, 15, 1.7, 1.4, "B"); r.ellipse(10.5, 15, 1.2, 1, "B"); r.put(21, 7, "B"); r.put(20, 6, "B");
  // angry eyes + brows
  r.rect(11, 10, 13, 11, "E"); r.put(12, 11, "e"); r.put(13, 11, "e");
  r.rect(19, 10, 21, 11, "E"); r.put(19, 11, "e"); r.put(20, 11, "e");
  r.line(10, 8, 13, 9, "a"); r.line(22, 8, 19, 9, "a");
  if (mouth) {
    r.ellipse(16, 15.2, 3.6, 2, "O");
    r.put(14, 14, "M"); r.put(16, 14, "M"); r.put(18, 14, "M"); r.put(15, 16, "M"); r.put(17, 16, "M");
  } else {
    r.line(13, 14, 19, 14, "O"); r.put(13, 13, "O"); r.put(19, 13, "O");
    r.put(14, 14, "M"); r.put(16, 14, "M"); r.put(18, 14, "M");
  }
  return r.done();
}

function rasterHacker(frame: number, mouth: boolean) {
  const r = grid();
  // robe
  for (let y = 13; y <= 23; y++) {
    const half = Math.round(5 + (y - 13) * 0.75);
    const sway = y >= 21 ? (frame ? 1 : -1) : 0;
    r.rect(16 - half + sway, y, 16 + half + sway, y, "A");
  }
  r.line(16, 15, 16, 23, "L");
  // hood with rim light
  r.ellipse(16, 9, 7.5, 8, "L");
  r.ellipse(16, 9.8, 6.8, 7.4, "A");
  r.ellipse(16, 10.5, 4.4, 4.8, "O");
  // glowing eyes (+ grin when attacking)
  r.rect(13, 10, 14, 10, "E"); r.rect(18, 10, 19, 10, "E");
  if (mouth) { r.rect(13, 11, 14, 11, "E"); r.rect(18, 11, 19, 11, "E"); r.line(14, 13, 18, 13, "E"); r.put(13, 12, "E"); r.put(19, 12, "E"); }
  // laptop
  r.rect(9, 15, 23, 19, "G");
  r.rect(10, 16, 22, 18, "g");
  r.rect(15, 17, 17, 17, "X");
  r.rect(8, 20, 24, 20, "M");
  r.put(8, 19, "S"); r.put(24, 19, "S");
  // glitch pixels
  r.put(5, 4, "X"); r.put(26, 6, "Z"); r.put(27, 15, "X"); r.put(4, 17, "Z");
  return r.done();
}

function rasterRansom(frame: number, mouth: boolean) {
  const r = grid();
  const sw = frame ? 1 : -1;
  // chains
  r.line(8, 9, 12 + sw, 18, "G"); r.line(24, 9, 20 + sw, 18, "G");
  for (let i = 0; i < 4; i++) { r.put(9 + i + (i > 1 ? sw : 0), 11 + i * 2, "g"); r.put(23 - i + (i > 1 ? sw : 0), 11 + i * 2, "g"); }
  // skull
  r.ellipse(16, 8, 8.5, 7.5, "M");
  r.ellipse(12.5, 4.5, 3, 1.8, "L");
  r.ellipse(16, 11.5, 6.5, 2, "m");
  r.ellipse(12.5, 8, 2.3, 2.1, "O"); r.ellipse(19.5, 8, 2.3, 2.1, "O");
  r.put(12, 8, "E"); r.put(13, 8, "E"); r.put(19, 8, "E"); r.put(20, 8, "E");
  r.put(16, 11, "O"); r.put(15, 12, "O"); r.put(16, 12, "O"); r.put(17, 12, "O");
  // jaw + teeth
  const jawY = mouth ? 15 : 13;
  r.rect(11, 13, 21, jawY + 1, "M");
  if (mouth) r.rect(12, 14, 20, 15, "O");
  for (let x = 12; x <= 20; x += 2) { r.put(x, 13, "O"); r.put(x, jawY + 1, mouth ? "O" : "M"); }
  // padlock
  r.rect(14, 17 + (mouth ? 1 : 0), 18, 17 + (mouth ? 1 : 0), "G");
  r.rect(13, 18, 13, 19, "G"); r.rect(19, 18, 19, 19, "G");
  r.rect(11, 19, 21, 23, "B");
  r.rect(11, 23, 21, 23, "b"); r.rect(21, 19, 21, 23, "b");
  r.put(16, 20, "O"); r.put(16, 21, "O"); r.put(15, 21, "O"); r.put(17, 21, "O"); r.put(16, 22, "O");
  return r.done();
}

/* ── Boss registry ─────────────────────────────────────────── */
type AttackKind = "spit" | "laser" | "stomp" | "rain" | "summon" | "infect" | "breach" | "teleport" | "lock";
type BossDef = {
  id: BossId; name: string; rageName: string; title: string;
  warn: string; warnSub: string; entry: string; heroLine: string; rageLine: string;
  taunts: string[]; laugh: string[]; winTitle: string; winSub: string; heroWin: string;
  maxHP: number; accent: string;
  attacks: Partial<Record<AttackKind, number>>; rageAttacks: Partial<Record<AttackKind, number>>;
  projectile: "err" | "spore" | "packet" | "skull"; rainGlyph: "spore" | "glyph";
  laser: [string, string]; wave: [string, string]; spark: string[];
  palette: Record<string, string>; rage: Record<string, string>;
  raster: (frame: number, mouth: boolean) => string[];
};

export const BOSSES: Record<BossId, BossDef> = {
  bug: {
    id: "bug", name: "PRODUCTION BUG", rageName: "MUTATED PRODUCTION BUG", title: "FINAL BOSS · LV 99",
    warn: "WARNING", warnSub: "A WILD BUG HAS APPEARED IN PRODUCTION", entry: "I AM THE PRODUCTION BUG!!",
    heroLine: "A bug in production?! Time to transform!", rageLine: "ERROR 500 — THE BUG IS MUTATING!",
    taunts: ["NULL POINTER!", "UNDEFINED IS NOT A FUNCTION!", "IT WORKS ON MY MACHINE!", "MERGE CONFLICT!", "TIMEOUT!!"],
    laugh: ["HAHAHA! WORKS ON MY MACHINE!", "SEGFAULT! HAHA!", "YOUR PIPELINE FAILED!"],
    winTitle: "BUG SQUASHED!", winSub: "Hotfix deployed to production ✓", heroWin: "BUG SQUASHED! Hotfix deployed!",
    maxHP: 1400, accent: "#c84ae8",
    attacks: { spit: 4, laser: 3, stomp: 3, summon: 2 }, rageAttacks: { summon: 2, stomp: 1 },
    projectile: "err", rainGlyph: "spore", laser: ["#ff2a2a", "#ffe0e0"], wave: ["#9a3cb5", "#ff5050"], spark: ["#5b1a6e", "#9a3cb5", "#ff5050"],
    palette: { K: "#16051b", A: "#5b1a6e", a: "#3e0f4c", L: "#9a3cb5", B: "#b0304a", b: "#7a1a30", G: "#2a0a33", E: "#ff3b3b", e: "#ffe0e0", M: "#e8dcb0", O: "#3a0010", T: "#c84ae8", X: "#4af0ff", Z: "#ff4af0" },
    rage: { A: "#7a1a2a", a: "#4c0f1a", L: "#c0405a", B: "#e0a030", b: "#a06a10", E: "#ffde3b", T: "#ff5050" },
    raster: rasterBug,
  },
  virus: {
    id: "virus", name: "MEGA VIRUS", rageName: "MEGA VIRUS · OUTBREAK", title: "MALWARE · LV 87",
    warn: "INFECTED", warnSub: "MALWARE DETECTED — SYSTEM COMPROMISED", entry: "YOUR SYSTEM IS MINE! *cough*",
    heroLine: "A virus?! Time to quarantine you!", rageLine: "OUTBREAK! THE VIRUS IS REPLICATING!",
    taunts: ["SPREADING...", "ACHOO!!", "SELF-REPLICATING!", "INFECTING NODE 3...", "NO PATCH FOR ME!"],
    laugh: ["FULLY INFECTED! HAHA!", "NO ANTIVIRUS CAN STOP ME!", "*evil coughing*"],
    winTitle: "VIRUS QUARANTINED!", winSub: "System cleaned · 0 threats found ✓", heroWin: "Quarantined! Scan complete!",
    maxHP: 1250, accent: "#ff4f9a",
    attacks: { spit: 3, rain: 3, infect: 3, summon: 3 }, rageAttacks: { summon: 2, infect: 2 },
    projectile: "spore", rainGlyph: "spore", laser: ["#ff4f9a", "#ffe0ef"], wave: ["#ff4f9a", "#7a1040"], spark: ["#c0306a", "#ff7ab0", "#ffd0e6"],
    palette: { K: "#1a0010", A: "#c0306a", a: "#7a1040", L: "#ff7ab0", B: "#ffd0e6", E: "#ffe040", e: "#1a0010", O: "#3a0010", M: "#ffffff" },
    rage: { A: "#e0402a", a: "#8a1a10", L: "#ff9a60", E: "#ffffff", B: "#ffe0a0" },
    raster: rasterVirus,
  },
  hacker: {
    id: "hacker", name: "BLACK HAT HACKER", rageName: "BLACK HAT · ROOT ACCESS", title: "INTRUDER · LV 95",
    warn: "INTRUSION", warnSub: "UNAUTHORIZED ACCESS — FIREWALL BREACHED", entry: "sudo rm -rf /your/portfolio",
    heroLine: "A hacker?! Not on my cluster!", rageLine: "ROOT ACCESS GRANTED — HE'S IN THE MAINFRAME!",
    taunts: ["PASSWORD123? REALLY?", "INJECTING SQL...", "BRUTE FORCING...", "I'M IN.", "PORT 22 IS OPEN!"],
    laugh: ["ACCESS GRANTED. HAHA!", "YOUR DATA IS MINE!", "SHOULD'VE USED 2FA!"],
    winTitle: "HACKER BLOCKED!", winSub: "Firewall restored · 2FA enabled ✓", heroWin: "Blocked! Rotating all the keys!",
    maxHP: 1300, accent: "#4af0ff",
    attacks: { spit: 3, rain: 3, laser: 2, breach: 2, teleport: 2 }, rageAttacks: { teleport: 2, breach: 1 },
    projectile: "packet", rainGlyph: "glyph", laser: ["#4af0ff", "#e8ffff"], wave: ["#4af0ff", "#1c1f26"], spark: ["#4af0ff", "#1c1f26", "#ff3b8a"],
    palette: { K: "#050608", A: "#1c1f26", L: "#3a4050", O: "#000000", E: "#4af0ff", G: "#2a2e36", g: "#14171c", M: "#8a909c", X: "#4af0ff", S: "#c8b8a8", Z: "#ff3b8a" },
    rage: { E: "#ff3b3b", X: "#ff3b3b", L: "#6a1a1a", g: "#2a0a0a" },
    raster: rasterHacker,
  },
  ransom: {
    id: "ransom", name: "RANSOMWARE SKULL", rageName: "RANSOMWARE · DEADLINE", title: "CRYPTO-LOCKER · LV 90",
    warn: "ENCRYPTED", warnSub: "YOUR FILES HAVE BEEN ENCRYPTED", entry: "PAY UP OR LOSE YOUR FILES!",
    heroLine: "Ransomware?! Good thing I have backups!", rageLine: "TIME'S UP — DELETING EVERYTHING!",
    taunts: ["TICK TOCK...", "PAY 99 COINS!", "ENCRYPTING /home...", "NO DECRYPTION KEY!", "YOUR SKILLS ARE MINE!"],
    laugh: ["FILES LOCKED FOREVER! HAHA!", "SHOULD'VE MADE BACKUPS!", "PAYMENT RECEIVED... NOT!"],
    winTitle: "FILES DECRYPTED!", winSub: "Restored from backup · 0 coins paid ✓", heroWin: "Restored from backup! Never pay!",
    maxHP: 1350, accent: "#ff5030",
    attacks: { spit: 3, stomp: 2, lock: 3, laser: 2 }, rageAttacks: { lock: 2, stomp: 1 },
    projectile: "skull", rainGlyph: "glyph", laser: ["#ff2a2a", "#ffd0c0"], wave: ["#8a8f98", "#ff5030"], spark: ["#e0a030", "#ff5030", "#e8dcb0"],
    palette: { K: "#120404", M: "#e8dcb0", m: "#b8a880", L: "#fff8e0", O: "#1a0000", E: "#ff2a2a", G: "#8a8f98", g: "#c8ccd4", B: "#e0a030", b: "#a06a10" },
    rage: { E: "#ffffff", M: "#f0c0b0", B: "#ff5030", b: "#a02010" },
    raster: rasterRansom,
  },
};
export const BOSS_IDS = Object.keys(BOSSES) as BossId[];

const FRAMES: Record<BossId, { key: string; rows: string[] }[]> = Object.fromEntries(
  BOSS_IDS.map((id) => [id, [0, 1].flatMap((f) => [false, true].map((m) => ({ key: `${f}${m ? 1 : 0}`, rows: BOSSES[id].raster(f, m) })))]),
) as Record<BossId, { key: string; rows: string[] }[]>;

function rowsToRects(rows: string[], palette: Record<string, string>, key: string) {
  const rects: React.ReactElement[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === c) end++;
      if (c !== ".") rects.push(<rect key={`${key}-${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={palette[c] ?? "#ff00ff"} />);
      x = end;
    }
  });
  return rects;
}

/** All four frames are rendered once; the engine flips data-v on the wrapper. */
export function BossSprite({ boss, enraged }: { boss: BossId; enraged: boolean }) {
  const def = BOSSES[boss];
  const palette = enraged ? { ...def.palette, ...def.rage } : def.palette;
  return (
    <>
      {FRAMES[boss].map(({ key, rows }) => (
        <svg key={key} data-v={key} viewBox={`0 0 ${GW} ${GH}`} className="boss-sprite" shapeRendering="crispEdges" aria-hidden="true">
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
function LockIcon() {
  return <svg className="skill-lock" viewBox="0 0 10 12" shapeRendering="crispEdges" aria-hidden="true"><path d="M3 0h4v1h1v4h1v7H1V5h1V1h1zM3 2v3h4V2zM4 7v3h2V7z" fill="#e0a030" fillRule="evenodd" /></svg>;
}

/* ── HUD ───────────────────────────────────────────────────── */
export type HudSnapshot = {
  boss: BossId; phase: BattlePhase; bossHP: number; bossMax: number; heroHP: number; energy: number; enraged: boolean;
  cds: Record<Skill, number>; locked: Record<Skill, boolean>; banner: string | null; poisoned: boolean;
};

export function BattleHud({ hud, onSkill, onFlee, onRetry, onClose }: {
  hud: HudSnapshot; onSkill: (s: Skill) => void; onFlee: () => void; onRetry: () => void; onClose: () => void;
}) {
  const def = BOSSES[hud.boss];
  const bossPct = Math.max(0, hud.bossHP / hud.bossMax) * 100;
  const heroPct = Math.max(0, hud.heroHP / HERO_MAX) * 100;
  const fighting = hud.phase === "fight";
  const over = hud.phase === "victory" || hud.phase === "defeat";
  return (
    <div className={`battle-hud phase-${hud.phase} hud-${hud.boss}`} style={{ ["--boss-accent" as string]: def.accent }}>
      {hud.phase === "warning" && (
        <div className="battle-warning" role="alert">
          <span className="warn-stripes" aria-hidden="true" />
          <strong>{def.warn}</strong>
          <span>{def.warnSub}</span>
          <span className="warn-stripes" aria-hidden="true" />
        </div>
      )}
      {hud.phase !== "warning" && (
        <div className={`boss-bar ${hud.enraged ? "is-enraged" : ""}`}>
          <div className="boss-bar-title"><span>{def.title}</span><strong>{hud.enraged ? def.rageName : def.name}</strong></div>
          <div className="bar boss-hp" role="meter" aria-label={`${def.name} health`} aria-valuemin={0} aria-valuemax={hud.bossMax} aria-valuenow={Math.max(0, Math.round(hud.bossHP))}>
            <i style={{ width: `${bossPct}%` }} /><b style={{ width: `${bossPct}%` }} />
          </div>
        </div>
      )}
      {(fighting || over || hud.phase === "transform") && (
        <div className="hero-bars">
          <div className="hero-name">PIXEL ERIC <small>{hud.poisoned ? "INFECTED!" : "DEVOPS MODE"}</small></div>
          <div className={`bar hero-hp ${hud.poisoned ? "is-poisoned" : ""}`} role="meter" aria-label="Eric health" aria-valuemin={0} aria-valuemax={HERO_MAX} aria-valuenow={Math.max(0, Math.round(hud.heroHP))}><i style={{ width: `${heroPct}%` }} /></div>
          <div className={`bar hero-energy ${hud.energy >= 100 ? "is-full" : ""}`} role="meter" aria-label="Energy" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hud.energy)}><i style={{ width: `${hud.energy}%` }} /></div>
        </div>
      )}
      {hud.banner && <div className="battle-banner" key={hud.banner}>{hud.banner}</div>}
      {fighting && (
        <div className="skill-bar" role="toolbar" aria-label="Pixel Eric's skills">
          {SKILLS.map((s) => {
            const cd = hud.cds[s.id];
            const locked = hud.locked[s.id];
            const noEnergy = s.id === "ultimate" && hud.energy < 100;
            return (
              <button key={s.id} type="button" className={`skill-btn skill-${s.id} ${noEnergy ? "is-locked" : ""} ${cd > 0 ? "is-cooling" : ""} ${locked ? "is-encrypted" : ""}`}
                disabled={cd > 0 || noEnergy || locked} onClick={() => onSkill(s.id)} title={`${s.name} — ${s.desc} [${s.key}]`} aria-label={`${s.name}: ${s.desc}. Key ${s.key}${locked ? ". Encrypted by ransomware" : ""}`}>
                <SkillIcon id={s.id} />
                <span className="skill-name">{s.name}</span>
                <kbd>{s.key}</kbd>
                {cd > 0 && !locked && <span className="skill-cd" style={{ height: `${cd * 100}%` }} aria-hidden="true" />}
                {locked && <LockIcon />}
              </button>
            );
          })}
          <button type="button" className="skill-btn skill-flee" onClick={onFlee} title="Run away [Esc]"><span className="skill-name">RUN</span><kbd>ESC</kbd></button>
        </div>
      )}
      {over && (
        <div className={`battle-result ${hud.phase}`}>
          <strong>{hud.phase === "victory" ? def.winTitle : "GAME OVER"}</strong>
          <span>{hud.phase === "victory" ? def.winSub : `${def.name} took over production...`}</span>
          <div>
            <button type="button" onClick={onRetry}>{hud.phase === "victory" ? "NEXT BOSS" : "RETRY"}</button>
            <button type="button" onClick={onClose}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Engine ────────────────────────────────────────────────── */
type BulletKind = "err" | "spore" | "packet" | "skull" | "glyph" | "lock" | "cloud" | "minion" | "orb" | "basic" | "meteor" | "wave";
type Bullet = { x: number; h: number; vx: number; vh: number; g: number; size: number; kind: BulletKind; dmg: number; from: "hero" | "boss"; dodgeRoll?: boolean; alive: boolean; spin: number; ch?: string };
type Fx = { x: number; h: number; vx: number; vh: number; g: number; life: number; max: number; color: string; size: number; kind: "px" | "text" | "ring" | "flash" | "mark"; text?: string; big?: boolean };
type Action = { kind: Skill | "basic"; t0: number; stage: number; hits: number; next: number };
type BossAct = { kind: AttackKind; t0: number; fired: boolean; dodge: boolean; jumped: boolean; landed: boolean; marks?: number[] };

export type HeroView = { x: number; y: number; w: number; h: number; pose: HeroPose; facing: 1 | -1; state: HeroState };
export type BattleIO = {
  say: (text: string) => void;
  feel: (emotion: "fierce" | "happy" | "scared" | "dizzy" | "excited" | "neutral", ms: number) => void;
  bossSay: (text: string) => void;
  powered: (on: boolean) => void;
};

const GLYPHS = "01ABCDEF<>{}#$%&*/=+;";

export class BossBattle {
  readonly boss: BossId;
  readonly def: BossDef;
  phase: BattlePhase = "warning";
  t0: number;
  vw: number;
  vh: number;
  k: number;
  bossW: number;
  bossH: number;
  bossX: number;
  bossY: number;
  bossVY = 0;
  bossHomeX: number;
  bossMax: number;
  bossHP: number;
  enraged = false;
  bossFrame = 0;
  mouth = false;
  bossHitUntil = 0;
  glitchUntil = 0;
  bossAct: BossAct | null = null;
  nextBossAct = 0;
  bossVisible = false;
  bossDead = false;
  heroHP = HERO_MAX;
  energy = 0;
  heroVY = 0;
  hurtUntil = 0;
  shieldUntil = 0;
  poisonUntil = 0;
  nextPoison = 0;
  sidestepUntil = 0;
  lockedUntil: Record<Skill, number> = { punch: 0, orb: 0, beam: 0, shield: 0, ultimate: 0 };
  action: Action | null = null;
  queued: Skill | null = null;
  nextBasic = 0;
  readyAt: Record<Skill, number> = { punch: 0, orb: 0, beam: 0, shield: 0, ultimate: 0 };
  bullets: Bullet[] = [];
  fx: Fx[] = [];
  shake = 0;
  laser: { h: number; start: number; on: number; end: number } | null = null;
  tether: { until: number; hit: number } | null = null;
  beam: { until: number; nextTick: number } | null = null;
  banner: string | null = null;
  bannerUntil = 0;
  rageFlashAt = 0;
  ended = false;
  private said = new Set<string>();
  private reduced: boolean;
  // arena background state
  private bg: { cols?: { y: number; speed: number; ch: string[] }[]; cells?: { x: number; y: number; r: number; vx: number; vy: number; p: number }[]; motes?: { x: number; y: number; vy: number; vx: number; s: number; c: string }[]; lastTick?: number } = {};

  constructor(now: number, vw: number, vh: number, reduced: boolean, boss: BossId) {
    this.boss = boss;
    this.def = BOSSES[boss];
    this.bossMax = this.def.maxHP;
    this.bossHP = this.bossMax;
    this.t0 = now;
    this.vw = vw;
    this.vh = vh;
    this.reduced = reduced;
    this.k = vw < 768 ? 0.66 : 1;
    this.bossW = 192 * this.k;
    this.bossH = 144 * this.k;
    this.bossHomeX = this.homeFor(vw);
    this.bossX = this.bossHomeX;
    this.bossY = vh;
  }

  private homeFor(vw: number) { return Math.min(vw - this.bossW - 24, Math.max(vw * 0.62, 300 * this.k)); }
  resize(vw: number, vh: number) { this.vw = vw; this.vh = vh; this.bossHomeX = this.homeFor(vw); this.bg = {}; }

  private once(key: string) { if (this.said.has(key)) return false; this.said.add(key); return true; }
  private setPhase(p: BattlePhase, now: number) { this.phase = p; this.t0 = now; }
  private showBanner(text: string, now: number, ms = 1600) { this.banner = text; this.bannerUntil = now + ms; }

  heroHome(w: number) { return Math.max(16, this.bossX - 270 * this.k - w); }

  use(skill: Skill, now: number) {
    if (this.phase !== "fight" || now < this.readyAt[skill] || now < this.lockedUntil[skill]) return false;
    if (skill === "ultimate" && this.energy < 100) return false;
    this.queued = skill;
    return true;
  }

  poke(clientX: number, clientY: number, now: number) {
    if (this.phase !== "fight") return;
    const h = this.vh - 10 - clientY;
    for (let i = 0; i < 6; i++) this.spark(clientX, h, "#f6cf62");
    this.damageBoss(6, clientX, h, now);
  }

  treat(kind: "coffee" | "beer", heroX: number, heroH: number) {
    if (kind === "coffee") {
      this.heroHP = Math.min(HERO_MAX, this.heroHP + 30);
      this.energy = Math.min(100, this.energy + 25);
      this.poisonUntil = 0;
      this.text(heroX, heroH + 30, "+30 HP", "#7ec860", true);
    } else {
      this.energy = Math.min(100, this.energy + 45);
      this.text(heroX, heroH + 30, "LIQUID COURAGE!", "#f6cf62", true);
    }
    for (let i = 0; i < 14; i++) this.spark(heroX, heroH, kind === "coffee" ? "#7ec860" : "#f6cf62");
  }

  flee(now: number) {
    if (this.phase === "victory" || this.phase === "defeat") { this.ended = true; return; }
    this.setPhase("flee", now);
    this.bullets = [];
    this.laser = null;
    this.tether = null;
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

  private heal(amount: number, now: number) {
    this.bossHP = Math.min(this.bossMax, this.bossHP + amount);
    this.text(this.bossX + this.bossW / 2, this.bossY + this.bossH, `+${amount}`, "#ff7ab0", true);
    void now;
  }

  private damageBoss(dmg: number, x: number, h: number, now: number) {
    if (this.phase !== "fight" || this.bossHP <= 0) return;
    const amount = Math.round(dmg * (this.enraged ? 0.9 : 1));
    this.bossHP -= amount;
    this.bossHitUntil = now + 90;
    this.energy = Math.min(100, this.energy + amount * 0.07);
    this.text(x + rand(-10, 10), h + rand(0, 20), `-${amount}`, amount >= 30 ? "#f6cf62" : "#ffffff", amount >= 30);
    if (!this.enraged && this.bossHP <= this.bossMax * 0.4) {
      this.enraged = true;
      this.rageFlashAt = now;
      this.kick(18);
      this.flash(this.def.laser[0], 0.45);
      this.showBanner(this.def.rageLine, now, 2200);
    }
    if (this.bossHP <= 0) {
      this.bossHP = 0;
      this.setPhase("victory", now);
      this.action = null;
      this.bullets = this.bullets.filter((b) => b.from === "hero");
      this.laser = null;
      this.tether = null;
      this.beam = null;
      this.bossAct = null;
      this.poisonUntil = 0;
    }
  }

  private hurtHero(dmg: number, hero: HeroView, now: number, io: BattleIO, label?: string) {
    const cx = hero.x + hero.w / 2;
    if (now < this.shieldUntil) {
      for (let i = 0; i < 8; i++) this.spark(cx + 20, hero.y + hero.h * 0.5, "#9ff0ff");
      this.text(cx, hero.y + hero.h, "BLOCKED", "#9ff0ff");
      return false;
    }
    if (this.phase !== "fight") return false;
    this.heroHP -= dmg;
    this.hurtUntil = now + 380;
    this.energy = Math.min(100, this.energy + 5);
    this.kick(8);
    this.text(cx, hero.y + hero.h, label ?? `-${dmg}`, "#ff5050");
    for (let i = 0; i < 8; i++) this.spark(cx, hero.y + hero.h * 0.5, "#ff5050");
    if (this.heroHP <= 0) {
      this.heroHP = 0;
      this.setPhase("defeat", now);
      this.action = null;
      this.beam = null;
      this.poisonUntil = 0;
      io.feel("dizzy", 600000);
      io.bossSay(pick(this.def.laugh));
      return true;
    }
    if (this.heroHP < 35 && this.once("lowhp")) io.say("I'm not giving up!");
    return true;
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
      this.poisonUntil = 0;
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

  private fire(from: "hero" | "boss", kind: BulletKind, x: number, h: number, vx: number, vh: number, g: number, size: number, dmg: number, ch?: string) {
    this.bullets.push({ x, h, vx, vh, g, size, kind, dmg, from, alive: true, spin: Math.random() * 6, ch });
  }

  update(now: number, dt: number, hero: HeroView, io: BattleIO) {
    const t = (now - this.t0) / 1000;
    const cx = hero.x + hero.w / 2;
    if (this.banner && now > this.bannerUntil) this.banner = null;
    this.shake = Math.max(0, this.shake - dt * 40);
    hero.facing = 1;
    hero.state = "battle";

    if (hero.y > 0 || this.heroVY > 0) {
      this.heroVY -= HERO_GRAVITY * dt;
      hero.y = Math.max(0, hero.y + this.heroVY * dt);
      if (hero.y === 0) this.heroVY = 0;
    }
    this.bossFrame = Math.floor(now / (this.boss === "virus" ? 320 : 260)) % 2;

    switch (this.phase) {
      case "warning": {
        hero.pose = "idle";
        if (this.once("warn")) { io.feel("scared", 1800); io.say("Wait... what's happening?!"); }
        if (t > 2.1) {
          this.setPhase("enter", now);
          this.bossVisible = true;
          this.bossVY = 0;
          this.bossY = this.boss === "hacker" ? 0 : this.vh * 0.7;
          if (this.boss === "hacker") { this.glitchUntil = now + 900; this.kick(10); this.flash("#4af0ff", 0.3); }
        }
        break;
      }
      case "enter": {
        hero.pose = "idle";
        const landed = this.bossY <= 0;
        if (!landed) {
          this.bossVY -= BOSS_GRAVITY * dt;
          this.bossY = Math.max(0, this.bossY + this.bossVY * dt);
        }
        if (this.bossY <= 0 && this.once("land")) {
          this.kick(22);
          for (let i = 0; i < 26; i++) this.spark(this.bossX + rand(0, this.bossW), 4, pick(this.def.spark), 360);
          io.bossSay(this.def.entry);
          this.mouth = true;
          this.t0 = now;
        }
        if (this.said.has("land")) {
          if (t > 0.9) this.mouth = false;
          if (t > 1.5) { this.setPhase("transform", now); io.say(this.def.heroLine); io.feel("fierce", 600000); }
        }
        break;
      }
      case "transform": {
        hero.pose = "charge";
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
        if (now < this.poisonUntil && now > this.nextPoison) {
          this.nextPoison = now + 500;
          this.hurtHero(3, hero, now, io, "-3");
        }
        if (this.boss === "virus" && this.enraged && this.bossHP > 0 && Math.random() < dt * 0.8) this.heal(6, now);
        break;
      }
      case "victory": {
        hero.pose = t > 1.6 ? "wave" : "idle";
        if (t < 1.6) {
          if (Math.random() < 0.6) {
            const bx = this.bossX + rand(0, this.bossW), bh = this.bossY + rand(0, this.bossH);
            for (let i = 0; i < 5; i++) this.spark(bx, bh, pick([...this.def.spark, "#f6cf62", "#ffffff"]), 420);
            if (Math.random() < 0.3) this.ring(bx, bh, "#f6cf62", 50);
          }
          this.kick(6);
        } else if (this.once("boom")) {
          this.bossDead = true;
          this.flash("#ffffff", 0.5);
          for (let i = 0; i < 40; i++) this.spark(this.bossX + this.bossW / 2, this.bossH / 2, pick([...this.def.spark, "#f6cf62", "#ffffff", "#4af0ff"]), 600);
          this.kick(24);
          io.feel("happy", 5000);
          io.say(this.def.heroWin);
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
        if (t > 0.2 && this.once("fleeSay")) { io.powered(false); io.say("Phew... I'll deal with it tomorrow."); io.feel("neutral", 10); }
        if (t > 1.4) this.ended = true;
        break;
      }
    }

    this.updateBullets(now, dt, hero, io);
    this.updateFx(dt);
    if (this.phase !== "defeat" && this.phase !== "victory") {
      if (now < this.hurtUntil) hero.state = "hurt";
      else if (now < this.poisonUntil) hero.state = "poison";
    }
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

    if (Math.random() < 0.7) this.fx.push({ x: cx + rand(-hero.w * 0.4, hero.w * 0.4), h: hero.y + rand(0, hero.h * 0.6), vx: rand(-10, 10), vh: rand(60, 140), g: 0, life: 0, max: rand(0.3, 0.6), color: pick(["#7ec860", "#c8ffb0", "#57d13f"]), size: rand(2, 4), kind: "px" });

    // side-step away from incoming rain
    if (now < this.sidestepUntil && (!this.action || this.action.kind === "basic")) {
      hero.x = Math.max(8, hero.x - 520 * dt);
      runPose();
      return;
    }

    const minionNear = this.bullets.some((b) => b.kind === "minion" && b.x - hero.x < 560);
    if (!this.action) {
      if (this.queued) { const q = this.queued; this.queued = null; this.startAction(q, now, io, hero); }
      else if (now > this.nextBasic && (Math.abs(hero.x - home) < 40 || minionNear)) { this.startAction("basic", now, io, hero); this.nextBasic = now + (minionNear ? rand(500, 700) : rand(1500, 2100)); }
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
        if (a.stage === 0) { a.stage = 1; this.fire("hero", "basic", handX(), minionNear ? 14 : handH(), 760, 0, 0, 8, 14); }
        if (at > 0.24) this.action = null;
        break;
      }
      case "punch": {
        const reach = this.bossX + 16 * this.k - hero.w * 0.62;
        if (a.stage === 0) {
          runPose();
          // trample minions on the way
          for (const b of this.bullets) if (b.kind === "minion" && Math.abs(b.x - (hero.x + hero.w * 0.7)) < 24) { b.alive = false; for (let i = 0; i < 6; i++) this.spark(b.x, 10, "#ffffff"); }
          if (moveTo(reach, 1300)) { a.stage = 1; a.next = now; }
        } else if (a.stage === 1) {
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
          runPose();
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
            for (const b of this.bullets) if (b.from === "boss" && Math.abs(b.h - handH()) < 40 && b.x > handX()) b.alive = false;
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
  }

  private chooseAttack(): AttackKind {
    const weights: Partial<Record<AttackKind, number>> = { ...this.def.attacks };
    if (this.enraged) for (const [k, v] of Object.entries(this.def.rageAttacks)) weights[k as AttackKind] = (weights[k as AttackKind] ?? 0) + (v ?? 0);
    const entries = Object.entries(weights) as [AttackKind, number][];
    let r = Math.random() * entries.reduce((s, [, w]) => s + w, 0);
    for (const [kind, w] of entries) { r -= w; if (r <= 0) return kind; }
    return entries[0][0];
  }

  private updateBoss(now: number, dt: number, hero: HeroView, io: BattleIO) {
    const b = this.bossAct;
    const mouthX = this.bossX + (this.boss === "bug" ? 18 : this.bossW * 0.45) * (this.boss === "bug" ? this.k : 1);
    const mouthH = this.bossY + this.bossH * (this.boss === "hacker" ? 0.35 : this.boss === "ransom" ? 0.45 : 0.3);
    const heroCx = hero.x + hero.w / 2;
    if (!b) {
      this.mouth = false;
      const drift = this.bossHomeX + Math.sin(now / 900) * 30 * this.k;
      this.bossX += (drift - this.bossX) * Math.min(1, dt * 2);
      if (this.boss === "virus" || this.boss === "ransom") this.bossY = 6 + Math.sin(now / 400) * 6; // floating bosses
      if (now > this.nextBossAct) {
        this.bossAct = { kind: this.chooseAttack(), t0: now, fired: false, dodge: Math.random() < (this.enraged ? 0.55 : 0.7), jumped: false, landed: false };
        if (Math.random() < 0.4) io.bossSay(pick(this.def.taunts));
      }
      return;
    }
    const t = (now - b.t0) / 1000;
    switch (b.kind) {
      case "spit": {
        this.mouth = t < 0.75;
        if (t > 0.45 && !b.fired) {
          b.fired = true;
          const n = this.enraged ? 5 : 3;
          if (this.def.projectile === "packet") {
            for (let i = 0; i < n + 1; i++) this.fire("boss", "packet", mouthX - i * 70, hero.h * (i % 2 ? 0.75 : 0.35), -760, 0, 0, 14, 8);
          } else {
            for (let i = 0; i < n; i++) {
              const T = 0.75 + i * 0.13;
              const gx = heroCx + rand(-30, 30) + (i - (n - 1) / 2) * 26;
              const gh = hero.h * 0.4;
              const g = 900;
              this.fire("boss", this.def.projectile, mouthX, mouthH, (gx - mouthX) / T, (gh - mouthH + 0.5 * g * T * T) / T, g, 16, 10);
            }
          }
        }
        if (t > 1.0) this.endBossAct(now);
        break;
      }
      case "laser": {
        const h = hero.h * 0.42;
        if (!this.laser) this.laser = { h, start: now, on: now + 800, end: now + 1350 };
        this.mouth = now > this.laser.on;
        if (b.dodge && !b.jumped && t > 0.62 && hero.y === 0 && !this.action) { b.jumped = true; this.heroVY = 860; }
        if (now > this.laser.on && !b.fired && now < this.laser.end && hero.y < h - 6 && hero.y + hero.h > h) {
          b.fired = true;
          this.hurtHero(this.enraged ? 22 : 16, hero, now, io);
        }
        if (now >= this.laser.on && Math.random() < 0.5) this.spark(rand(0, this.bossX), h, this.def.laser[0], 200);
        if (now > this.laser.end) { this.laser = null; this.endBossAct(now); }
        break;
      }
      case "stomp": {
        if (!b.jumped) { b.jumped = true; this.bossVY = 980; }
        this.bossVY -= BOSS_GRAVITY * dt;
        this.bossY = Math.max(0, this.bossY + this.bossVY * dt);
        if (this.bossY === 0 && this.bossVY < 0 && !b.landed && t > 0.2) {
          b.landed = true;
          this.bossVY = 0;
          this.kick(20);
          for (let i = 0; i < 20; i++) this.spark(this.bossX + rand(0, this.bossW), 4, pick(this.def.spark), 380);
          this.fire("boss", "wave", this.bossX + 10, 0, -560, 0, 0, 30, this.enraged ? 18 : 14);
          if (this.enraged) this.fire("boss", "wave", this.bossX + 10, 0, -380, 0, 0, 30, 12);
        }
        if (b.landed && t > 0.9) this.endBossAct(now);
        break;
      }
      case "rain": {
        this.mouth = t < 0.6;
        if (!b.marks) {
          const n = this.enraged ? 7 : 5;
          b.marks = Array.from({ length: n }, (_, i) => heroCx + (i - (n - 1) / 2) * 46 + rand(-12, 12));
          for (const m of b.marks) this.fx.push({ x: m, h: 0, vx: 0, vh: 0, g: 0, life: 0, max: 0.75, color: this.def.laser[0], size: 16, kind: "mark" });
          if (b.dodge && !this.action) this.sidestepUntil = now + 320;
        }
        if (t > 0.6 && !b.fired) {
          b.fired = true;
          for (const m of b.marks) this.fire("boss", this.def.rainGlyph, m + rand(-6, 6), this.vh * 0.85 + rand(0, 120), 0, -rand(560, 700), 0, 16, 8, pick(GLYPHS.split("")));
        }
        if (t > 1.6) this.endBossAct(now);
        break;
      }
      case "summon": {
        this.mouth = t < 0.5;
        if (t > 0.4 && !b.fired) {
          b.fired = true;
          const n = this.enraged ? 4 : 3;
          for (let i = 0; i < n; i++) this.fire("boss", "minion", this.bossX + 20 + i * 26, 9, -rand(120, 190), 0, 0, 18, 8);
          this.text(this.bossX + this.bossW / 2, this.bossY + this.bossH + 10, this.boss === "virus" ? "REPLICATING!" : "SPAWNING BUGS!", this.def.accent);
        }
        if (t > 0.9) this.endBossAct(now);
        break;
      }
      case "infect": {
        this.mouth = t < 1.2;
        if (t > 0.3 && t < 1.0 && Math.random() < dt * 14) this.fire("boss", "cloud", mouthX, mouthH - rand(0, 30), -rand(220, 300), rand(-40, 20), 0, rand(30, 44), 0);
        if (t > 1.3) this.endBossAct(now);
        break;
      }
      case "breach": {
        if (!this.tether) { this.tether = { until: now + 1200, hit: now + 700 }; this.mouth = true; }
        if (now > this.tether.hit && !b.fired) {
          b.fired = true;
          if (now < this.shieldUntil) {
            this.text(heroCx, hero.y + hero.h, "FIREWALL HELD!", "#9ff0ff");
          } else {
            const stolen = Math.min(this.energy, 35);
            this.energy -= stolen;
            this.hurtHero(10, hero, now, io, "DATA STOLEN!");
            this.heal(60, now);
          }
        }
        if (now > this.tether.until) { this.tether = null; this.endBossAct(now); }
        break;
      }
      case "teleport": {
        if (!b.fired) { b.fired = true; this.glitchUntil = now + 380; }
        if (t > 0.25 && !b.jumped) {
          b.jumped = true;
          for (let i = 0; i < 16; i++) this.spark(this.bossX + rand(0, this.bossW), rand(0, this.bossH), pick(["#4af0ff", "#ff3b8a", "#ffffff"]), 300);
          this.bossHomeX = rand(Math.max(this.vw * 0.45, heroCx + 220), this.vw - this.bossW - 24);
          this.bossX = this.bossHomeX;
          this.fire("boss", "packet", this.bossX, hero.h * 0.5, -820, 0, 0, 14, 8);
        }
        if (t > 0.6) this.endBossAct(now);
        break;
      }
      case "lock": {
        this.mouth = t < 0.6;
        if (t > 0.45 && !b.fired) { b.fired = true; this.fire("boss", "lock", mouthX, hero.h * 0.55, -540, 0, 0, 18, 6); }
        if (t > 0.9) this.endBossAct(now);
        break;
      }
    }
  }

  private endBossAct(now: number) {
    this.bossAct = null;
    this.mouth = false;
    this.nextBossAct = now + (this.enraged ? rand(1300, 1900) : rand(2000, 2800));
  }

  private onBossHit(b: Bullet, hero: HeroView, now: number, io: BattleIO) {
    if (b.kind === "cloud") {
      if (now < this.shieldUntil) { this.text(hero.x + hero.w / 2, hero.y + hero.h, "BLOCKED", "#9ff0ff"); return; }
      if (now > this.poisonUntil) { this.text(hero.x + hero.w / 2, hero.y + hero.h + 10, "INFECTED!", "#ff7ab0", true); io.say("Ugh... I feel sick!"); }
      this.poisonUntil = now + 3500;
      return;
    }
    if (b.kind === "lock") {
      if (now < this.shieldUntil) { this.text(hero.x + hero.w / 2, hero.y + hero.h, "BLOCKED", "#9ff0ff"); return; }
      const free = SKILLS.map((s) => s.id).filter((s) => s !== "ultimate" && now > this.lockedUntil[s]);
      if (free.length) {
        const s = pick(free);
        this.lockedUntil[s] = now + 5000;
        const name = SKILLS.find((x) => x.id === s)!.name;
        this.showBanner(`${name} ENCRYPTED!`, now, 1400);
        io.say("My skill got encrypted?!");
      }
      this.hurtHero(b.dmg, hero, now, io);
      return;
    }
    this.hurtHero(b.dmg, hero, now, io);
  }

  private updateBullets(now: number, dt: number, hero: HeroView, io: BattleIO) {
    const box = this.bossBox();
    const heroBullets = this.bullets.filter((b) => b.from === "hero" && b.alive);
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
        if (b.kind === "minion") {
          for (const hb of heroBullets) {
            if (hb.alive && Math.abs(hb.x - b.x) < 18 && Math.abs(hb.h - b.h) < 22) {
              b.alive = false;
              if (hb.kind === "basic") hb.alive = false;
              for (let i = 0; i < 8; i++) this.spark(b.x, b.h, pick(this.def.spark), 260);
              this.energy = Math.min(100, this.energy + 3);
              this.text(b.x, b.h + 20, "SQUASH!", "#ffffff");
              break;
            }
          }
          if (!b.alive) continue;
        }
        if (b.kind === "wave" || b.kind === "minion") {
          if (b.dodgeRoll === undefined && b.x - hx1 < 120 && b.x > hx0) {
            b.dodgeRoll = Math.random() < (this.enraged ? 0.6 : 0.75);
            if (b.dodgeRoll && hero.y === 0 && (!this.action || this.action.kind === "basic")) this.heroVY = 820;
          }
          if (b.kind === "wave" && Math.random() < 0.8) this.fx.push({ x: b.x + rand(0, 20), h: rand(0, 26), vx: 40, vh: rand(20, 60), g: 0, life: 0, max: 0.3, color: pick(this.def.wave), size: rand(3, 6), kind: "px" });
        }
        if (b.kind === "packet" && b.dodgeRoll === undefined && b.x - hx1 < 140 && b.x > hx0) {
          b.dodgeRoll = Math.random() < 0.5 && b.h < hero.h * 0.5;
          if (b.dodgeRoll && hero.y === 0 && !this.action) this.heroVY = 760;
        }
        const reach = b.kind === "cloud" ? b.size * 0.4 : 0;
        const inX = b.x + reach > hx0 && b.x - reach < hx1;
        const inH = b.kind === "wave" || b.kind === "minion" ? hero.y < 22 : b.h + reach > hero.y && b.h - reach < hero.y + hero.h * 0.9;
        if (inX && inH && this.phase === "fight") {
          b.alive = false;
          this.onBossHit(b, hero, now, io);
        } else if (b.h <= 0 && b.g > 0 || (b.kind === "spore" || b.kind === "glyph") && b.h <= 0) {
          b.alive = false;
          for (let i = 0; i < 5; i++) this.spark(b.x, 2, this.def.laser[0], 160);
        }
      }
      if (b.x < -80 || b.x > this.vw + 80 || b.h < -40 || b.h > this.vh + 300) b.alive = false;
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
    const locked = {} as Record<Skill, boolean>;
    for (const s of SKILLS) {
      cds[s.id] = s.cd ? Math.max(0, Math.min(1, (this.readyAt[s.id] - now) / s.cd)) : 0;
      locked[s.id] = now < this.lockedUntil[s.id];
    }
    return { boss: this.boss, phase: this.phase, bossHP: this.bossHP, bossMax: this.bossMax, heroHP: this.heroHP, energy: this.energy, enraged: this.enraged, cds, locked, banner: this.banner, poisoned: now < this.poisonUntil };
  }

  /* ── Arena background (behind the fighters) ───────────────── */
  drawBackground(ctx: CanvasRenderingContext2D, now: number, monoFont: string) {
    const { vw, vh } = this;
    const dt = Math.min(0.05, ((now - (this.bg.lastTick ?? now)) / 1000));
    this.bg.lastTick = now;
    const rage = this.enraged;
    const floor = vh - 10;
    ctx.imageSmoothingEnabled = false;

    if (this.boss === "hacker") {
      // Matrix-style code rain that fades instead of clearing.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(0, 0, vw, vh);
      ctx.globalCompositeOperation = "source-over";
      const size = 15;
      if (!this.bg.cols) this.bg.cols = Array.from({ length: Math.ceil(vw / size) }, () => ({ y: rand(-vh, 0), speed: rand(140, 380), ch: [] }));
      ctx.font = `${size - 1}px ${monoFont}`;
      this.bg.cols.forEach((c, i) => {
        const prev = Math.floor(c.y / size);
        c.y += c.speed * dt * (rage ? 1.6 : 1);
        const cur = Math.floor(c.y / size);
        if (cur !== prev) {
          ctx.fillStyle = rage ? "#ff5a5a" : "#4af0ff";
          ctx.fillText(pick(GLYPHS.split("")), i * size, cur * size);
          ctx.fillStyle = rage ? "#ffd0d0" : "#e8ffff";
          ctx.fillText(pick(GLYPHS.split("")), i * size, (cur + 1) * size);
        }
        if (c.y > vh + 40) { c.y = rand(-200, 0); c.speed = rand(140, 380); }
      });
      if (Math.random() < (rage ? 0.12 : 0.04)) {
        const y = rand(0, vh);
        ctx.fillStyle = rage ? "rgba(255,59,59,0.35)" : "rgba(74,240,255,0.25)";
        ctx.fillRect(0, y, vw, rand(2, 10));
      }
      return;
    }

    ctx.clearRect(0, 0, vw, vh);
    if (this.boss === "bug") {
      // synthwave floor grid
      const horizon = vh * 0.62;
      const col = rage ? "255,80,80" : "200,74,232";
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        const p = ((i + (now / 900) % 1) / 14) ** 2;
        const y = horizon + (floor - horizon) * p;
        ctx.strokeStyle = `rgba(${col},${0.08 + p * 0.45})`;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(vw, y); ctx.stroke();
      }
      for (let i = -12; i <= 12; i++) {
        ctx.strokeStyle = `rgba(${col},0.22)`;
        ctx.beginPath(); ctx.moveTo(vw / 2 + i * 22, horizon); ctx.lineTo(vw / 2 + i * vw * 0.12, floor); ctx.stroke();
      }
      if (!this.bg.motes) this.bg.motes = Array.from({ length: 40 }, () => ({ x: rand(0, vw), y: rand(0, vh), vy: -rand(10, 40), vx: rand(-6, 6), s: rand(2, 6), c: pick(["#9a3cb5", "#4af0ff", "#ff4af0"]) }));
      for (const m of this.bg.motes) {
        m.y += m.vy * dt * (rage ? 2 : 1); m.x += m.vx * dt;
        if (m.y < -10) { m.y = vh + 10; m.x = rand(0, vw); }
        ctx.globalAlpha = 0.5; ctx.fillStyle = rage ? "#ff5050" : m.c; ctx.fillRect(m.x, m.y, m.s, m.s);
      }
      ctx.globalAlpha = 1;
    } else if (this.boss === "virus") {
      if (!this.bg.cells) this.bg.cells = Array.from({ length: 16 }, () => ({ x: rand(0, vw), y: rand(0, vh), r: rand(18, 60), vx: rand(-14, 14), vy: rand(-10, 10), p: rand(0, 6) }));
      for (const c of this.bg.cells) {
        c.x += c.vx * dt * (rage ? 2 : 1); c.y += c.vy * dt * (rage ? 2 : 1); c.p += dt * (rage ? 4 : 1.6);
        if (c.x < -80) c.x = vw + 80; if (c.x > vw + 80) c.x = -80; if (c.y < -80) c.y = vh + 80; if (c.y > vh + 80) c.y = -80;
        const r = c.r * (1 + Math.sin(c.p) * 0.08);
        ctx.strokeStyle = rage ? "rgba(255,110,60,0.35)" : "rgba(255,79,154,0.3)";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + c.p * 0.2;
          ctx.fillStyle = rage ? "rgba(255,110,60,0.35)" : "rgba(255,79,154,0.3)";
          ctx.fillRect(c.x + Math.cos(a) * (r + 6) - 3, c.y + Math.sin(a) * (r + 6) - 3, 6, 6);
        }
        ctx.fillStyle = rage ? "rgba(255,160,80,0.25)" : "rgba(255,122,176,0.22)";
        ctx.beginPath(); ctx.arc(c.x + r * 0.2, c.y - r * 0.15, r * 0.35, 0, Math.PI * 2); ctx.fill();
      }
      // toxic mist on the floor
      ctx.fillStyle = rage ? "rgba(255,90,40,0.25)" : "rgba(255,79,154,0.2)";
      ctx.beginPath(); ctx.moveTo(0, vh);
      for (let x = 0; x <= vw; x += 20) ctx.lineTo(x, floor - 50 - Math.sin(x / 70 + now / 500) * 14 - Math.sin(x / 31 + now / 300) * 6);
      ctx.lineTo(vw, vh); ctx.fill();
    } else if (this.boss === "ransom") {
      // embers
      if (!this.bg.motes) this.bg.motes = Array.from({ length: 60 }, () => ({ x: rand(0, vw), y: rand(0, vh), vy: -rand(20, 70), vx: rand(-15, 15), s: rand(2, 5), c: pick(["#ff5030", "#e0a030", "#ff2a2a"]) }));
      for (const m of this.bg.motes) {
        m.y += m.vy * dt * (rage ? 1.8 : 1); m.x += m.vx * dt + Math.sin(now / 400 + m.y / 50) * 0.3;
        if (m.y < -10) { m.y = vh + 10; m.x = rand(0, vw); }
        ctx.globalAlpha = 0.7; ctx.fillStyle = m.c; ctx.fillRect(m.x, m.y, m.s, m.s);
      }
      ctx.globalAlpha = 1;
      // countdown
      const total = Math.max(0, 86399 - Math.floor(((now - this.t0) / 1000) * (rage ? 37 : 1)));
      const hh = String(Math.floor(total / 3600)).padStart(2, "0"), mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0"), ss = String(total % 60).padStart(2, "0");
      ctx.font = `${Math.round(Math.min(vw / 12, 90))}px ${monoFont}`;
      ctx.textAlign = "center";
      ctx.fillStyle = rage ? `rgba(255,60,40,${0.22 + 0.12 * Math.abs(Math.sin(now / 150))})` : "rgba(255,80,48,0.16)";
      ctx.fillText(`${hh}:${mm}:${ss}`, vw / 2, vh * 0.48);
      ctx.font = `${Math.round(Math.min(vw / 60, 16))}px ${monoFont}`;
      ctx.fillStyle = "rgba(255,180,160,0.28)";
      ctx.fillText(rage ? "DEADLINE PASSED · DELETING FILES..." : "YOUR FILES ARE ENCRYPTED · PAY BEFORE TIME RUNS OUT", vw / 2, vh * 0.48 + 34);
      ctx.textAlign = "start";
    }
  }

  /* ── Foreground effects (projectiles, beams, particles) ───── */
  draw(ctx: CanvasRenderingContext2D, hero: HeroView, now: number, pixelFont: string, monoFont: string) {
    const { vw, vh } = this;
    const floor = vh - 10;
    const Y = (h: number) => floor - h;
    ctx.save();
    ctx.clearRect(0, 0, vw, vh);
    ctx.imageSmoothingEnabled = false;
    const sx = this.shake ? rand(-this.shake, this.shake) : 0;
    const sy = this.shake ? rand(-this.shake, this.shake) * 0.6 : 0;
    ctx.translate(Math.round(sx), Math.round(sy));
    const [lc, lcore] = this.def.laser;

    if (this.laser) {
      const ly = Y(this.laser.h);
      const eyeX = this.bossX + (this.boss === "bug" ? 8 * this.k : this.bossW * 0.4);
      if (now < this.laser.on) {
        ctx.globalAlpha = 0.4 + 0.4 * Math.abs(Math.sin(now / 50));
        ctx.fillStyle = lc;
        for (let x = 0; x < eyeX; x += 16) ctx.fillRect(x, ly - 1, 9, 2);
        ctx.globalAlpha = 1;
        ctx.font = `10px ${pixelFont}`;
        ctx.fillText(this.boss === "hacker" ? "FIREWALL!" : "!", eyeX - 60, ly - 10);
      } else if (now < this.laser.end) {
        const th = 14 + Math.sin(now / 20) * 3;
        ctx.shadowColor = lc; ctx.shadowBlur = 24;
        ctx.fillStyle = lc; ctx.fillRect(0, ly - th / 2, eyeX, th);
        ctx.shadowBlur = 0;
        ctx.fillStyle = lcore; ctx.fillRect(0, ly - th / 5, eyeX, (th * 2) / 5);
      }
    }

    if (this.tether && hero) {
      const x0 = this.bossX + this.bossW * 0.45, y0 = Y(this.bossY + this.bossH * 0.5);
      const x1 = hero.x + hero.w / 2, y1 = Y(hero.y + hero.h * 0.55);
      ctx.strokeStyle = now > this.tether.hit ? "#ff3b8a" : "#4af0ff";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -now / 20;
      ctx.beginPath(); ctx.moveTo(x0, y0);
      for (let i = 1; i <= 8; i++) ctx.lineTo(x0 + (x1 - x0) * (i / 8) + rand(-6, 6), y0 + (y1 - y0) * (i / 8) + rand(-6, 6));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `8px ${pixelFont}`;
      ctx.fillStyle = "#4af0ff";
      ctx.fillText(now > this.tether.hit ? "EXFILTRATING DATA..." : "CONNECTING...", (x0 + x1) / 2 - 60, (y0 + y1) / 2 - 14);
    }

    if (this.beam && now < this.beam.until) {
      const bx = hero.x + hero.w * 0.85;
      const by = Y(hero.y + hero.h * 0.5);
      const th = 34 * this.k + Math.sin(now / 25) * 6;
      ctx.shadowColor = "#7ec860"; ctx.shadowBlur = 40;
      ctx.fillStyle = "#57d13f"; ctx.fillRect(bx, by - th / 2, vw - bx, th);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#c8ffb0"; ctx.fillRect(bx, by - th / 3, vw - bx, (th * 2) / 3);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(bx, by - th / 7, vw - bx, (th * 2) / 7);
      ctx.fillRect(bx - 12, by - th * 0.7, 24, th * 1.4);
      ctx.font = `${Math.round(9 * Math.max(this.k, 0.8))}px ${pixelFont}`;
      ctx.fillStyle = "#0e110e";
      const target = { bug: "pod/production-bug", virus: "deploy/mega-virus", hacker: "svc/black-hat", ransom: "job/ransomware" }[this.boss];
      ctx.fillText(`$ kubectl delete ${target} --force`, bx + 30, by + 4);
    }

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

    for (const b of this.bullets) {
      const x = b.x, y = Y(b.h), s = b.size;
      switch (b.kind) {
        case "err":
          ctx.fillStyle = "#3a0010"; ctx.fillRect(x - s / 2 - 2, y - s / 2 - 2, s + 4, s + 4);
          ctx.fillStyle = "#ff3b3b"; ctx.fillRect(x - s / 2, y - s / 2, s, s);
          ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 1, y - s / 2 + 3, 3, s - 9); ctx.fillRect(x - 1, y + s / 2 - 4, 3, 2);
          break;
        case "spore":
          ctx.fillStyle = this.enraged ? "#e0402a" : "#c0306a";
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
          ctx.fillStyle = "#ff9ac0";
          for (let i = 0; i < 4; i++) { const a = b.spin + (i * Math.PI) / 2; ctx.fillRect(x + Math.cos(a) * s * 0.7 - 2, y + Math.sin(a) * s * 0.7 - 2, 4, 4); }
          ctx.fillStyle = "#ffe040"; ctx.fillRect(x - 3, y - 3, 3, 3); ctx.fillRect(x + 2, y - 3, 3, 3);
          break;
        case "packet":
          ctx.shadowColor = "#4af0ff"; ctx.shadowBlur = 12;
          ctx.fillStyle = this.enraged ? "#ff3b3b" : "#4af0ff"; ctx.fillRect(x - 12, y - 6, 24, 12);
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#05060a"; ctx.font = `8px ${pixelFont}`; ctx.fillText("01", x - 8, y + 4);
          ctx.fillStyle = "rgba(74,240,255,0.35)"; ctx.fillRect(x + 12, y - 3, 30, 6);
          break;
        case "skull":
          ctx.fillStyle = "#e8dcb0"; ctx.fillRect(x - s / 2, y - s / 2, s, s * 0.8); ctx.fillRect(x - s / 3, y + s * 0.3, s * 0.66, s * 0.25);
          ctx.fillStyle = "#1a0000"; ctx.fillRect(x - s / 3, y - s / 6, s / 4, s / 4); ctx.fillRect(x + s / 10, y - s / 6, s / 4, s / 4);
          ctx.fillStyle = "#ff2a2a"; ctx.fillRect(x - s / 3 + 1, y - s / 6 + 1, 2, 2); ctx.fillRect(x + s / 10 + 1, y - s / 6 + 1, 2, 2);
          break;
        case "glyph":
          ctx.font = `18px ${monoFont}`;
          ctx.shadowColor = lc; ctx.shadowBlur = 10;
          ctx.fillStyle = this.boss === "hacker" ? (this.enraged ? "#ff5a5a" : "#4af0ff") : "#ff5030";
          ctx.fillText(b.ch ?? "0", x - 5, y + 6);
          ctx.shadowBlur = 0;
          break;
        case "lock":
          ctx.shadowColor = "#e0a030"; ctx.shadowBlur = 14;
          ctx.strokeStyle = "#c8ccd4"; ctx.lineWidth = 3; ctx.strokeRect(x - 5, y - 13, 10, 9);
          ctx.fillStyle = "#e0a030"; ctx.fillRect(x - 9, y - 5, 18, 14);
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#1a0000"; ctx.fillRect(x - 1, y, 3, 6);
          break;
        case "cloud":
          ctx.fillStyle = this.enraged ? "rgba(255,110,60,0.45)" : "rgba(255,79,154,0.42)";
          for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + Math.cos(b.spin + i * 1.6) * s * 0.3, y + Math.sin(b.spin * 0.7 + i) * s * 0.2, s * 0.42, 0, Math.PI * 2); ctx.fill(); }
          ctx.fillStyle = "rgba(255,224,64,0.6)"; ctx.fillRect(x - 2, y - 2, 4, 4);
          break;
        case "minion": {
          const step = Math.floor(b.spin * 2) % 2;
          if (this.boss === "virus") {
            ctx.fillStyle = "#c0306a"; ctx.fillRect(x - 8, y - 16, 16, 14);
            ctx.fillStyle = "#ff7ab0"; ctx.fillRect(x - 11, y - 12 - step, 3, 3); ctx.fillRect(x + 8, y - 12 + step, 3, 3); ctx.fillRect(x - 2, y - 20 + step, 4, 3);
            ctx.fillStyle = "#ffe040"; ctx.fillRect(x - 5, y - 12, 3, 3); ctx.fillRect(x + 2, y - 12, 3, 3);
          } else {
            ctx.fillStyle = "#2a0a33"; ctx.fillRect(x - 9, y - 3 - step, 3, 3); ctx.fillRect(x - 2, y - 3 + step, 3, 3); ctx.fillRect(x + 5, y - 3 - step, 3, 3);
            ctx.fillStyle = "#5b1a6e"; ctx.fillRect(x - 9, y - 13, 18, 10);
            ctx.fillStyle = "#9a3cb5"; ctx.fillRect(x - 6, y - 12, 10, 3);
            ctx.fillStyle = "#ff3b3b"; ctx.fillRect(x - 9, y - 10, 3, 3);
          }
          break;
        }
        case "wave": {
          const [c1, c2] = this.def.wave;
          ctx.shadowColor = c1; ctx.shadowBlur = 16;
          for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? c1 : c2; ctx.fillRect(x + i * 7, y - 26 + i * 5, 7, 26 - i * 5); }
          ctx.shadowBlur = 0;
          break;
        }
        case "meteor":
          ctx.shadowColor = "#f6cf62"; ctx.shadowBlur = 18;
          ctx.fillStyle = "#2a6fd6"; ctx.fillRect(x - s / 2, y - s / 2, s, s);
          ctx.fillStyle = "#7ec860"; ctx.fillRect(x - s / 2, y - s / 2, s, 4);
          ctx.fillStyle = "#ffffff"; ctx.fillRect(x - s / 2 + 3, y - 1, s - 6, 2); ctx.fillRect(x - s / 2 + 3, y + 4, s - 6, 2);
          ctx.shadowBlur = 0;
          break;
        default:
          ctx.shadowColor = "#7ec860"; ctx.shadowBlur = b.kind === "orb" ? 22 : 10;
          ctx.fillStyle = "#57d13f"; ctx.fillRect(x - s / 2, y - s / 2, s, s);
          ctx.fillStyle = "#e6ffe0"; ctx.fillRect(x - s / 4, y - s / 4, s / 2, s / 2);
          ctx.shadowBlur = 0;
      }
    }

    for (const f of this.fx) {
      const p = f.life / f.max;
      if (f.kind === "flash") { ctx.globalAlpha = (1 - p) * 0.7; ctx.fillStyle = f.color; ctx.fillRect(-20, -20, vw + 40, vh + 40); continue; }
      if (f.kind === "mark") {
        ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(now / 60));
        ctx.strokeStyle = f.color; ctx.lineWidth = 3;
        const y = Y(2);
        ctx.beginPath(); ctx.moveTo(f.x - 8, y - 6); ctx.lineTo(f.x + 8, y + 2); ctx.moveTo(f.x + 8, y - 6); ctx.lineTo(f.x - 8, y + 2); ctx.stroke();
        ctx.globalAlpha = 0.18; ctx.fillStyle = f.color; ctx.fillRect(f.x - 6, 0, 12, y);
        continue;
      }
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

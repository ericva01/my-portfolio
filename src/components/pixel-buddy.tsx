"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BOSS_IDS, BattleHud, BossBattle, BossSprite, type BossId, type HeroView, type HudSnapshot, type Skill } from "./buddy-battle";

/* ─────────────────────────────────────────────────────────────
   Pixel Eric — an 8-bit avatar that lives at the bottom of the
   page. He walks, runs, sits at his desk to code, talks, shows
   emotions, can be picked up and dropped with the cursor, gets
   angry when poked too much, and runs to grab dropped treats.
   ───────────────────────────────────────────────────────────── */

const BASE: Record<string, string> = {
  H: "#1c1714", h: "#3a2e26", S: "#d29a6e", s: "#b07a52", E: "#15110f", M: "#8a4b38", O: "#3b1610",
  R: "#e27d74", W: "#eef0ea", N: "#34476b", n: "#25334f", P: "#232c40", B: "#0d0f0d", C: "#6b4f3a", c: "#4a3527",
};
const ANGRY_SKIN = { S: "#e0806a", s: "#bf5d48", R: "#c94040" };
const POWER_UP = { H: "#57d13f", h: "#d4ffc4", E: "#f2fff0" };
const POWER_HAIR = ["...H..H..H..H...", "..HHhHHhHHhHHH..", ".HHHHHHhhHHHHHH."];

const HEAD = [
  ".....HHHHHH.....",
  "...HHHhhHHHHH...",
  "..HHHHHHhhHHHH..",
  "..HHHHHHHSSHHH..",
  "..HHSSSSSSSSHH..",
  "..HSSSSSSSSSSH..",
  "..SSEESSSSEESS..",
  "..SSSSSSSSSSSS..",
  "...SSSSssSSSS...",
  "...SSSMMMMSSS...",
  "....SSSSSSSS....",
  ".....sSSSSs.....",
];
const BODY = [
  "...NNNWWWWNNN...",
  "..NNNNnWWnNNNN..",
  "..NNNNNnnNNNNN..",
  "..NNNNNNNNNNNN..",
  "..NNNNNNNNNNNN..",
  "..nNNNNNNNNNNn..",
  "..SNNNNNNNNNNS..",
  "....nnnnnnnn....",
];
const BODY_CROSS = [
  "...NNNWWWWNNN...",
  "..NNNNnWWnNNNN..",
  "..NNNNNnnNNNNN..",
  "..NNSnnnnnnSNN..",
  "..NNNSnnnnSNNN..",
  "..nNNNNNNNNNNn..",
  "..nNNNNNNNNNNn..",
  "....nnnnnnnn....",
];
const LEGS: Record<string, string[]> = {
  idle: ["....PPP..PPP....", "....PPP..PPP....", "....PPP..PPP....", "...BBBB..BBBB..."],
  step: ["...PPP....PPP...", "..PPP......PPP..", "..PPP......PPP..", ".BBBB......BBBB."],
  pass: [".....PPPPPP.....", ".....PPPPPP.....", "....PPP.PPP.....", "...BBBB.BBBB...."],
  dangle1: ["....PPP..PPP....", "....PPP...PPP...", "...PPP....PPP...", "...BBB.....BBB.."],
  dangle2: ["....PPP..PPP....", "...PPP..PPP.....", "...PPP...PPP....", "..BBB....BBB...."],
};
const SIT_BODY = [
  "...NNNWWWWNNN...",
  "..NNNNnWWnNNNN..",
  "..NNNNNnnNNNNN..",
  "..NNNNNNNNNNNSS.",
  "..nnNNNNNNNNn...",
];
const SIT_LEGS = ["..nPPPPPPPPPPPP.", ".CCCCCCCC..PPP..", ".C.....C..BBBB.."];

type Pose = "idle" | "step" | "pass" | "wave" | "drink" | "held1" | "held2" | "fall" | "land" | "sit1" | "sit2" | "cross"
  | "punch" | "cast" | "charge" | "watch1" | "watch2";
type Emotion = "neutral" | "happy" | "excited" | "tipsy" | "angry" | "annoyed" | "dizzy" | "scared" | "fierce" | "watching";
type Treat = "coffee" | "beer";
type FloorItem = { id: number; kind: Treat; x: number; fall: number };
type Mode = "free" | "held" | "falling" | "working" | "watching" | "battle";

const WATCH_BODY = ["...NNNWWWWNNN...", "..NNNNnWWnNNNN..", "..NNNNNnnNNNNN..", "..nNNNNNNNNNNn.."];
const WATCH_LEGS = ["..PPPPPPPPPPPP..", ".BBPPPPPPPPPPBB."];

const setAt = (row: string, changes: Record<number, string>) => row.split("").map((c, i) => changes[i] ?? c).join("");

function face(emotion: Emotion, blink: boolean, talking: boolean, pose: Pose) {
  const r = [...HEAD];
  switch (emotion) {
    case "happy":
    case "tipsy":
      r[5] = setAt(r[5], { 4: "E", 5: "E", 10: "E", 11: "E" });
      r[6] = setAt(r[6], { 3: "E", 4: "S", 5: "S", 6: "E", 9: "E", 10: "S", 11: "S", 12: "E" });
      r[7] = setAt(r[7], { 3: "R", 4: "R", 11: "R", 12: "R" });
      r[9] = "...SSMSSSSMSS...";
      r[10] = "....SSMMMMSS....";
      break;
    case "excited":
      r[5] = setAt(r[5], { 4: "E", 5: "E", 10: "E", 11: "E" });
      r[9] = "...SSSOOOOSSS...";
      break;
    case "scared":
      r[4] = setAt(r[4], { 4: "E", 5: "E", 10: "E", 11: "E" });
      r[9] = "...SSSSOOSSSS...";
      r[10] = "....SSSOOSSS....";
      break;
    case "angry":
      r[4] = setAt(r[4], { 4: "E", 11: "E" });
      r[5] = setAt(r[5], { 5: "E", 6: "E", 9: "E", 10: "E" });
      r[7] = setAt(r[7], { 3: "R", 12: "R" });
      r[9] = "...SSSMMMMSSS...";
      r[10] = "....SMSSSSMS....";
      break;
    case "annoyed":
      r[5] = setAt(r[5], { 4: "E", 5: "E", 10: "E", 11: "E" });
      r[6] = setAt(r[6], { 4: "s", 10: "s" });
      r[9] = "...SSSSMMMSSS...";
      break;
    case "fierce":
      r[4] = setAt(r[4], { 4: "E", 11: "E" });
      r[5] = setAt(r[5], { 5: "E", 6: "E", 9: "E", 10: "E" });
      r[9] = "...SSSMMMMSSS...";
      break;
    case "watching":
      // eyes look up at the screen
      r[5] = setAt(r[5], { 4: "E", 5: "E", 10: "E", 11: "E" });
      r[6] = r[6].replace(/E/g, "S");
      if (blink) r[5] = r[5].replace(/E/g, "s");
      break;
    case "dizzy":
      r[5] = setAt(r[5], { 3: "E", 5: "E", 10: "E", 12: "E" });
      r[6] = setAt(r[6], { 4: "E", 5: "S", 10: "S", 11: "E" });
      r[7] = setAt(r[7], { 3: "E", 5: "E", 10: "E", 12: "E" });
      r[9] = "...SSMSMSMSSS...";
      break;
    default:
      if (blink) r[6] = r[6].replace(/E/g, "s");
  }
  if (talking || pose === "drink") r[9] = emotion === "angry" ? "...SSSOWWOSSS..." : "...SSSSOOSSSS...";
  return r;
}

function buildRows(pose: Pose, emotion: Emotion, blink: boolean, talking: boolean, powered: boolean) {
  const head = face(emotion, blink, talking || pose === "watch2", pose);
  if (powered) head.splice(0, 3, ...POWER_HAIR);
  if (pose === "watch1" || pose === "watch2") {
    const empty = "................";
    return [empty, empty, empty, empty, empty, empty, ...head, ...WATCH_BODY, ...WATCH_LEGS];
  }
  if (pose === "sit1" || pose === "sit2") {
    const body = [...SIT_BODY];
    if (pose === "sit2") body[3] = "..NNNNNNNNNNNNSS";
    const rows = ["................", "................", "................", "................", ...head, ...body, ...SIT_LEGS];
    for (let y = 13; y <= 20; y++) rows[y] = setAt(rows[y], { 1: "C" });
    return rows;
  }
  let body = BODY;
  if (pose === "cross") body = BODY_CROSS;
  else if (pose === "punch") body = BODY.map((row, y) => (y === 3 ? "..NNNNNNNNNNNNSS" : y === 6 ? "..SNNNNNNNNNNn.." : row));
  else if (pose === "cast") body = BODY.map((row, y) => (y === 3 || y === 4 ? "..NNNNNNNNNNNNSS" : y === 6 ? "..nNNNNNNNNNNn.." : row));
  else if (pose === "wave" || pose === "drink") body = BODY.map((row, y) => (y === 6 ? "..SNNNNNNNNNNn.." : row));
  else if (pose === "held1" || pose === "held2" || pose === "fall") body = BODY.map((row, y) => (y === 6 ? "..nNNNNNNNNNNn.." : row));
  const legs = pose === "step" || pose === "punch" || pose === "cast" || pose === "charge" ? LEGS.step : pose === "pass" ? LEGS.pass : pose === "held1" || pose === "fall" ? LEGS.dangle1 : pose === "held2" ? LEGS.dangle2 : LEGS.idle;
  return [...head, ...body, ...legs];
}

function pixels(rows: string[], palette: Record<string, string>, key = "p") {
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

/* ── Treat sprites (8×8) ───────────────────────────────────── */
const TREAT_PALETTE: Record<string, string> = { g: "#c8cfbe", W: "#f2f1ea", w: "#b9bcae", C: "#5a3420", F: "#fffbe8", Y: "#e3a21f", y: "#f6cf62", G: "#cfd6c6" };
const TREATS: Record<Treat, string[]> = {
  coffee: ["..g..g..", ".g..g...", "..g..g..", "WCCCCCW.", "WWWWWWWW", "WWWWWW.W", "WWWWWWWW", ".wwwww.."],
  beer: ["........", ".FFFFF..", "FFFFFFF.", "YYYYYYGG", "YyYYYY.G", "YYYyYYGG", "YYYYYY..", "GGGGGG.."],
};

function TreatSprite({ kind }: { kind: Treat }) {
  return (
    <svg viewBox="0 0 8 8" className={`treat-sprite treat-${kind}`} shapeRendering="crispEdges" aria-hidden="true">
      {pixels(TREATS[kind], TREAT_PALETTE, kind)}
    </svg>
  );
}

function Sprite({ pose, emotion, blink, talking, held, powered }: { pose: Pose; emotion: Emotion; blink: boolean; talking: boolean; held: Treat | null; powered: boolean }) {
  const palette = { ...BASE, ...(emotion === "angry" ? ANGRY_SKIN : {}), ...(powered ? POWER_UP : {}) };
  const armsUp = pose === "held1" || pose === "held2" || pose === "fall";
  const watching = pose === "watch1" || pose === "watch2";
  return (
    <svg viewBox="0 0 16 24" className="buddy-sprite" shapeRendering="crispEdges" aria-hidden="true">
      {pixels(buildRows(pose, emotion, blink, talking, powered), palette)}
      {watching && (
        <g className="buddy-popcorn">
          {/* hands holding the bucket */}
          <rect x="3" y="20" width="2" height="1" fill={palette.S} />
          <rect x="11" y="20" width="2" height="1" fill={palette.S} />
          {/* striped bucket */}
          <rect x="5" y="19" width="6" height="5" fill="#f4efe6" />
          <rect x="5" y="19" width="1" height="5" fill="#d23a3a" /><rect x="7" y="19" width="1" height="5" fill="#d23a3a" /><rect x="9" y="19" width="1" height="5" fill="#d23a3a" />
          <rect x="5" y="19" width="6" height="1" fill="#b02a2a" />
          {/* popcorn */}
          <rect x="5" y="18" width="6" height="1" fill="#fff3c4" /><rect x="6" y="17" width="1" height="1" fill="#fff3c4" />
          <rect x="8" y="17" width="2" height="1" fill="#fff3c4" /><rect x="7" y="18" width="1" height="1" fill="#f6cf62" /><rect x="9" y="17" width="1" height="1" fill="#f6cf62" />
          {pose === "watch2" && (
            <>
              <rect x="11" y="15" width="2" height="5" fill={BASE.N} />
              <rect x="9" y="14" width="3" height="2" fill={palette.S} />
              <rect x="9" y="15" width="1" height="1" fill="#fff3c4" />
            </>
          )}
        </g>
      )}
      {pose === "wave" && (
        <g className="buddy-wave-arm">
          <rect x="13" y="7" width="2" height="6" fill={BASE.N} />
          <rect x="13" y="7" width="1" height="6" fill={BASE.n} />
          <rect x="13" y="4" width="2" height="3" fill={palette.S} />
          <rect x="15" y="5" width="1" height="1" fill={palette.S} />
        </g>
      )}
      {armsUp && (
        <g className={pose === "fall" ? "buddy-flail" : "buddy-reach"}>
          <rect x="0" y="7" width="2" height="6" fill={BASE.N} />
          <rect x="0" y="5" width="2" height="2" fill={palette.S} />
          <rect x="14" y="7" width="2" height="6" fill={BASE.N} />
          <rect x="14" y="5" width="2" height="2" fill={palette.S} />
        </g>
      )}
      {pose === "drink" && held && (
        <g className="buddy-drink-arm">
          <rect x="13" y="11" width="2" height="3" fill={BASE.N} />
          <rect x="12" y="10" width="2" height="2" fill={palette.S} />
          <g transform="translate(9.5 6.5) scale(0.55)">{pixels(TREATS[held].slice(3), TREAT_PALETTE, "held")}</g>
        </g>
      )}
    </svg>
  );
}

/* ── Desk (24×16) ──────────────────────────────────────────── */
function Desk({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 16" className="buddy-desk-art" shapeRendering="crispEdges" aria-hidden="true">
      {/* plant */}
      <rect x="20" y="2" width="1" height="2" fill="#4f9a3c" /><rect x="21" y="1" width="1" height="4" fill="#7ec860" />
      <rect x="22" y="3" width="1" height="2" fill="#4f9a3c" /><rect x="19" y="4" width="1" height="1" fill="#7ec860" />
      <rect x="20" y="5" width="3" height="4" fill="#b0603a" /><rect x="20" y="5" width="3" height="1" fill="#8c4a2c" />
      {/* mug */}
      <rect x="16" y="6" width="3" height="3" fill="#eef0ea" /><rect x="16" y="6" width="3" height="1" fill="#5a3420" /><rect x="19" y="7" width="1" height="1" fill="#eef0ea" />
      {on && <><rect className="desk-steam" x="17" y="4" width="1" height="1" fill="#c8cfbe" /><rect className="desk-steam d2" x="16" y="3" width="1" height="1" fill="#c8cfbe" /></>}
      {/* laptop */}
      <rect x="3" y="0" width="11" height="8" fill="#2a302a" />
      <rect x="4" y="1" width="9" height="6" fill={on ? "#0b170b" : "#070a07"} />
      {on ? (
        <g className="desk-code">
          <rect className="code-line l1" x="5" y="2" width="5" height="0.6" fill="#7ec860" />
          <rect className="code-line l2" x="6" y="3.2" width="6" height="0.6" fill="#f6cf62" />
          <rect className="code-line l3" x="6" y="4.4" width="4" height="0.6" fill="#96a58f" />
          <rect className="code-line l4" x="5" y="5.6" width="6" height="0.6" fill="#7ec860" />
        </g>
      ) : (
        <rect className="desk-idle-cursor" x="5" y="5.4" width="1" height="0.8" fill="#7ec860" />
      )}
      <rect x="1" y="8" width="14" height="1" fill="#3a403a" />
      {/* table */}
      <rect x="0" y="9" width="24" height="2" fill="#8a6440" />
      <rect x="0" y="10" width="24" height="1" fill="#6b4a2e" />
      <rect x="1" y="11" width="2" height="5" fill="#5a3f28" />
      <rect x="21" y="11" width="2" height="5" fill="#5a3f28" />
      <rect x="3" y="13" width="18" height="1" fill="#4a3424" />
    </svg>
  );
}

/* ── Emotes ────────────────────────────────────────────────── */
function Emote({ emotion }: { emotion: Emotion }) {
  switch (emotion) {
    case "excited":
      return (
        <svg className="buddy-emote emote-bang" viewBox="0 0 3 7" shapeRendering="crispEdges" aria-hidden="true">
          <rect x="0" y="0" width="3" height="4" fill="#f6cf62" /><rect x="0" y="5" width="3" height="2" fill="#f6cf62" />
        </svg>
      );
    case "scared":
      return (
        <svg className="buddy-emote emote-bang emote-double" viewBox="0 0 7 7" shapeRendering="crispEdges" aria-hidden="true">
          <rect x="0" y="0" width="3" height="4" fill="#f6cf62" /><rect x="0" y="5" width="3" height="2" fill="#f6cf62" />
          <rect x="4" y="0" width="3" height="4" fill="#f6cf62" /><rect x="4" y="5" width="3" height="2" fill="#f6cf62" />
        </svg>
      );
    case "happy":
      return (
        <span className="buddy-emote emote-hearts" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <svg key={i} viewBox="0 0 7 6" shapeRendering="crispEdges" style={{ animationDelay: `${i * 0.45}s` }}>
              <path d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z" fill="#e27d74" />
            </svg>
          ))}
        </span>
      );
    case "tipsy":
      return <span className="buddy-emote emote-hic" aria-hidden="true">hic!</span>;
    case "angry":
      return (
        <span className="buddy-emote emote-angry" aria-hidden="true">
          <svg className="anger-mark" viewBox="0 0 7 7" shapeRendering="crispEdges">
            <path d="M2 0h1v2H2zM4 0h1v2H4zM0 2h2v1H0zM5 2h2v1H5zM0 4h2v1H0zM5 4h2v1H5zM2 5h1v2H2zM4 5h1v2H4z" fill="#ff4d4d" />
          </svg>
          <i className="steam s1" /><i className="steam s2" /><i className="steam s3" /><i className="steam s4" />
        </span>
      );
    case "annoyed":
      return (
        <svg className="buddy-emote emote-sweat" viewBox="0 0 3 4" shapeRendering="crispEdges" aria-hidden="true">
          <path d="M1 0h1v1h1v2H2v1H1V3H0V1h1z" fill="#7ec8e8" />
        </svg>
      );
    case "dizzy":
      return (
        <span className="buddy-emote emote-dizzy" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <svg key={i} viewBox="0 0 5 5" shapeRendering="crispEdges" style={{ animationDelay: `${-i * 0.33}s` }}>
              <path d="M2 0h1v2h2v1H3v2H2V3H0V2h2z" fill="#f6cf62" />
            </svg>
          ))}
        </span>
      );
    default:
      return null;
  }
}

/* ── Dialogue ──────────────────────────────────────────────── */
const SECTION_LINES: Record<string, string[]> = {
  home: ["Hi there! I'm Eric.", "Welcome to my little corner of the web!"],
  about: ["That's me! Developer by day, DevOps learner always.", "Always learning. Always building."],
  education: ["SETEC + ISTAD. Still learning every day!", "Scholarships, projects, late nights :)"],
  tech: ["My toolbox: Docker, K8s, ArgoCD and friends.", "Try aiming at the tech icons!"],
  projects: ["Some things I've built. Press play on the TV!", "Autonomous was a big one. Check it out!"],
  contact: ["Let's build something together!", "Send me a message, I'd love to hear from you."],
};
const IDLE_LINES = ["kubectl get coffee", "git commit -m \"just walking\"", "Deploying good vibes...", "Psst... drag me a coffee!", "Try picking me up!", "docker run -it eric:latest"];
const CLICK_LINES = ["Hello! Nice to meet you!", "Hehe, that tickles.", "Need a developer? Let's talk!", "Hi again!"];
const ANNOYED_LINES = ["Hey... easy there.", "Okay, that's enough clicking.", "Seriously?", "I can feel that, you know."];
const ANGRY_LINES = ["HEY! STOP CLICKING ME!!", "GRRR! I'm a person too! (kind of)", "That's it, I'm mad!", "Rage mode: ON"];
const STILL_ANGRY = ["GRRR!!", "STILL MAD!", "Hmph!!"];
const FORGIVE_LINES = ["...fine. I forgive you.", "Okay, I'm calm now.", "Deep breaths... we're good."];
const HELD_LINES = ["Whoa! Put me down!", "Wheee! Where are we going?", "Hey! My feet!", "I'm flying!"];
const SOFT_LAND = ["Nailed the landing!", "Phew, safe!", "Again! Again!"];
const HARD_LAND = ["Ouch!! My code!", "Ow... seeing stars...", "That was a hard deploy..."];
const WORK_START = ["Time to code!", "Back to work!", "Let's fix some bugs."];
const WORK_LINES = ["kubectl apply -f eric.yaml", "Fixing a bug...", "Writing a Dockerfile...", "git push --force? No no no.", "Pipeline is green!"];
const WORK_POKE = ["Shh, I'm coding!", "Busy deploying!", "One sec, almost done!"];
const WATCH_START = ["Ooh, movie time!", "Grab a seat, the demo's on!", "Popcorn ready!"];
const WATCH_LINES = ["*munch munch*", "Wait... I built this!", "Press play! I wanna watch!", "This part is my favourite.", "Best. Demo. Ever.", "Whoa, look at that deploy!"];
const WATCH_POKE = ["Shh! The movie's on!", "No spoilers please!", "Hey, I'm watching!"];
const WATCH_END = ["That was a good demo!", "Roll the credits!", "10/10 would watch again."];
const SPOT_LINES: Record<Treat, string[]> = {
  coffee: ["COFFEE?! Wait for me!", "Is that coffee?! Mine!", "Caffeine detected!"],
  beer: ["Ooh, a cold one!", "Is it Friday already?!", "Cheers incoming!"],
};
const AFTER_LINES: Record<Treat, string[]> = {
  coffee: ["Ahh! Now compiling at 2x speed!", "Coffee: the real CI/CD fuel.", "Fully caffeinated. Let's ship!"],
  beer: ["Cheers! Just one... hic!", "Deploying on Friday? Sure! hic!", "Everything is green... hic!"],
};
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const SPEED = 62; // walk px/s
const RUN_SPEED = 190; // run px/s
const GRAVITY = 2600; // px/s²
const FLOOR = 10; // px from the bottom of the viewport
const DRINK_MS = 1700;
const MAX_ITEMS = 5;

const buddyWidth = (el: HTMLElement | null) => el?.offsetWidth || 72;
const buddyHeight = (el: HTMLElement | null) => (el ? el.querySelector<HTMLElement>(".buddy-body")?.offsetHeight || 108 : 108);
const maxXFor = (el: HTMLElement | null) => Math.max(16, window.innerWidth - buddyWidth(el) - 16);
const deskXFor = () => Math.round(Math.min(Math.max(window.innerWidth * 0.6, 240), window.innerWidth - 230));

/** Center X of the project TV nearest the middle of the viewport, or null when none is on screen. */
function findTvCenter(): number | null {
  const vh = window.innerHeight;
  let best: { x: number; d: number } | null = null;
  document.querySelectorAll<HTMLElement>("#projects .tv").forEach((tv) => {
    const r = tv.getBoundingClientRect();
    if (r.height === 0 || r.top > vh * 0.72 || r.bottom < vh * 0.28) return;
    const d = Math.abs(r.top + r.height / 2 - vh / 2);
    if (!best || d < best.d) best = { x: r.left + r.width / 2, d };
  });
  return best ? (best as { x: number; d: number }).x : null;
}

export function PixelBuddy() {
  const [ready, setReady] = useState(false);
  const [nearRight, setNearRight] = useState(false);
  const [pose, setPose] = useState<Pose>("idle");
  const [running, setRunning] = useState(false);
  const [working, setWorking] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [blink, setBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [bubble, setBubble] = useState("");
  const [typedCount, setTypedCount] = useState(0);
  const [jump, setJump] = useState(0);
  const [emotion, setEmotionState] = useState<Emotion>("neutral");
  const [held, setHeld] = useState<Treat | null>(null);
  const [items, setItems] = useState<FloorItem[]>([]);
  const [drag, setDrag] = useState<{ kind: Treat; x: number; y: number } | null>(null);
  const [deskX, setDeskX] = useState(0);
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [powered, setPowered] = useState(false);
  const [bossLine, setBossLine] = useState("");
  const [bossEnraged, setBossEnraged] = useState(false);
  const [bossId, setBossId] = useState<BossId>("bug");
  const bgCanvas = useRef<HTMLCanvasElement>(null);
  const lastBoss = useRef<BossId | null>(null);

  const battle = useRef<BossBattle | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bossEl = useRef<HTMLDivElement>(null);
  const bossLineTimer = useRef(0);
  const tvTarget = useRef<number | null>(null);
  const goingToTv = useRef(false);
  const watchTalkAt = useRef(0);

  const root = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const mode = useRef<Mode>("free");
  const x = useRef(0);
  const y = useRef(0); // height above the floor
  const vx = useRef(0);
  const vy = useRef(0);
  const target = useRef<number | null>(null);
  const goingToDesk = useRef(false);
  const deskRef = useRef(0);
  const pauseUntil = useRef(0);
  const talkingUntil = useRef(0);
  const waveUntil = useRef(0);
  const drinkUntil = useRef(0);
  const landUntil = useRef(0);
  const angryUntil = useRef(0);
  const workUntil = useRef(0);
  const nextWorkAt = useRef(0);
  const boostUntil = useRef(0);
  const tipsyUntil = useRef(0);
  const itemsRef = useRef<FloorItem[]>([]);
  const nextId = useRef(1);
  const lastSection = useRef("");
  const bubbleTimer = useRef(0);
  const emotionTimer = useRef(0);
  const emotionRef = useRef<Emotion>("neutral");
  const reduced = useRef(false);
  const clickCount = useRef(0);
  const pokes = useRef<number[]>([]);
  const dragStart = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const grab = useRef<{ startX: number; startY: number; offY: number; offX: number; active: boolean; samples: { x: number; y: number; t: number }[] } | null>(null);

  const maxX = useCallback(() => maxXFor(root.current), []);

  const say = useCallback((text: string, wave = false) => {
    const now = performance.now();
    setBubble(text);
    setTypedCount(0);
    talkingUntil.current = now + Math.max(2600, text.length * 75 + 1800);
    if (wave) waveUntil.current = now + 1600;
    pauseUntil.current = Math.max(pauseUntil.current, talkingUntil.current);
    window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(""), talkingUntil.current - now);
  }, []);

  const feel = useCallback((next: Emotion, ms: number) => {
    emotionRef.current = next;
    setEmotionState(next);
    window.clearTimeout(emotionTimer.current);
    emotionTimer.current = window.setTimeout(() => { emotionRef.current = "neutral"; setEmotionState("neutral"); }, ms);
  }, []);

  const updateItems = useCallback((next: FloorItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const stopWorking = useCallback(() => {
    if (mode.current === "working") mode.current = "free";
    goingToDesk.current = false;
    nextWorkAt.current = performance.now() + 20000 + Math.random() * 20000;
  }, []);

  /* Drop a treat onto the floor. */
  const dropTreat = useCallback((kind: Treat, clientX: number, clientY: number) => {
    const b = battle.current;
    if (b) {
      // Mid-fight a treat is an instant power-up instead of a snack on the floor.
      const w = buddyWidth(root.current);
      b.treat(kind, x.current + w / 2, y.current + buddyHeight(root.current) * 0.6);
      say(kind === "coffee" ? "Coffee! HP restored!" : "Liquid courage!! Energy up!");
      return;
    }
    const floorTop = window.innerHeight - FLOOR - 32;
    const itemX = Math.min(Math.max(clientX, 24), window.innerWidth - 24);
    const item: FloorItem = { id: nextId.current++, kind, x: itemX, fall: Math.max(0, floorTop - (clientY - 16)) };
    updateItems([...itemsRef.current, item].slice(-MAX_ITEMS));
    if (drinkUntil.current < performance.now() && mode.current !== "held") {
      const wasAngry = performance.now() < angryUntil.current;
      angryUntil.current = 0;
      feel("excited", 2400);
      say(wasAngry ? "Is that... okay, you're forgiven!" : pick(SPOT_LINES[kind]));
    }
  }, [feel, say, updateItems]);

  // Appear only after the TV intro has finished.
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const enter = () => setReady(true);
    let raf = 0;
    if (document.documentElement.dataset.intro === "skip") raf = requestAnimationFrame(enter);
    else window.addEventListener("portfolio:entered", enter, { once: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("portfolio:entered", enter); };
  }, []);

  // Desk position follows the viewport.
  useEffect(() => {
    if (!ready) return;
    const place = () => { deskRef.current = deskXFor(); setDeskX(deskRef.current); };
    const raf = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", place); };
  }, [ready]);

  // Entrance: walk in from the left edge, then wave hello.
  useEffect(() => {
    if (!ready) return;
    x.current = reduced.current ? maxX() : -80;
    target.current = reduced.current ? null : Math.min(window.innerWidth * 0.12 + 40, maxX());
    nextWorkAt.current = performance.now() + 12000;
    const t = window.setTimeout(() => { say("Hi there! I'm Eric. Welcome!", true); feel("happy", 2200); }, reduced.current ? 400 : 1700);
    return () => window.clearTimeout(t);
  }, [ready, say, feel, maxX]);

  // Main loop.
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    let last = performance.now();
    let clock = 0;
    let lastPose: Pose = "idle";
    let lastNearRight = false;
    let lastRunning = false;
    let lastWorking = false;
    let lastState = "";
    let workTalkAt = 0;
    let nextTvScan = 0;
    let nextHud = 0;
    let lastEnraged = false;
    const pixelFont = getComputedStyle(document.body).getPropertyValue("--font-pixel").trim() || "monospace";
    const monoFont = getComputedStyle(document.body).getPropertyValue("--font-mono").trim() || "monospace";
    const battleIO = {
      say: (text: string) => say(text),
      feel: (e: "fierce" | "happy" | "scared" | "dizzy" | "excited" | "neutral", ms: number) => feel(e, ms),
      bossSay: (text: string) => {
        setBossLine(text);
        window.clearTimeout(bossLineTimer.current);
        bossLineTimer.current = window.setTimeout(() => setBossLine(""), 2200);
      },
      powered: (on: boolean) => setPowered(on),
    };
    const endBattle = (now: number) => {
      battle.current = null;
      setHud(null);
      setPowered(false);
      setBossLine("");
      setBossEnraged(false);
      lastEnraged = false;
      mode.current = "free";
      y.current = 0;
      target.current = null;
      pauseUntil.current = now + 1500;
      canvas.current?.getContext("2d")?.clearRect(0, 0, window.innerWidth, window.innerHeight);
      bgCanvas.current?.getContext("2d")?.clearRect(0, 0, window.innerWidth, window.innerHeight);
      document.documentElement.classList.remove("boss-active", "boss-rage", "boss-glitch", ...BOSS_IDS.map((id) => `boss-${id}`));
      document.documentElement.classList.add("boss-clear");
      window.setTimeout(() => document.documentElement.classList.remove("boss-clear"), 900);
      if (emotionRef.current === "dizzy" || emotionRef.current === "fierce") feel("neutral", 10);
    };
    const setPoseOnce = (p: Pose) => { if (p !== lastPose) { lastPose = p; setPose(p); } };
    const setRunningOnce = (r: boolean) => { if (r !== lastRunning) { lastRunning = r; setRunning(r); } };
    const setWorkingOnce = (w: boolean) => { if (w !== lastWorking) { lastWorking = w; setWorking(w); } };

    const consume = (item: FloorItem, now: number) => {
      updateItems(itemsRef.current.filter((i) => i.id !== item.id));
      drinkUntil.current = now + DRINK_MS;
      target.current = null;
      setHeld(item.kind);
      emotionRef.current = "neutral";
      setEmotionState("neutral");
      window.setTimeout(() => {
        setHeld(null);
        const after = performance.now();
        if (item.kind === "coffee") { boostUntil.current = after + 12000; feel("happy", 6000); }
        else { tipsyUntil.current = after + 9000; feel("tipsy", 9000); }
        setJump((j) => j + 1);
        say(pick(AFTER_LINES[item.kind]));
      }, DRINK_MS);
    };

    const walkTo = (goal: number, dt: number, speed: number) => {
      const diff = goal - x.current;
      const dir = Math.sign(diff) as 1 | -1;
      x.current += dir * Math.min(Math.abs(diff), speed * dt);
      if (dir) setFacing(dir);
      return Math.abs(goal - x.current) < 1;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      const el = root.current;
      const w = buddyWidth(el);
      const s = w / 16;
      const busy = now < talkingUntil.current;
      const boost = now < boostUntil.current ? 1.6 : 1;
      const tipsy = now < tipsyUntil.current;
      const angry = now < angryUntil.current;
      const pending = itemsRef.current;
      const seatX = deskRef.current - 12 * s;
      let isRunning = false;
      let state = "free";

      // Look for an on-screen project TV a few times per second.
      if (now > nextTvScan) { nextTvScan = now + 400; tvTarget.current = findTvCenter(); }
      const tvGoal = tvTarget.current === null ? null : Math.min(Math.max(tvTarget.current - w / 2, 0), maxX());

      /* ── Boss battle takes over the whole loop ── */
      const b = battle.current;
      if (b) {
        const h = buddyHeight(el);
        const hero: HeroView = { x: x.current, y: y.current, w, h, pose: "idle", facing: 1, state: "battle" };
        b.update(now, dt, hero, battleIO);
        x.current = hero.x;
        y.current = hero.y;
        setPoseOnce(hero.pose as Pose);
        setFacing(hero.facing);
        setRunningOnce(false);
        setWorkingOnce(false);
        const ctx = canvas.current?.getContext("2d");
        const bgCtx = bgCanvas.current?.getContext("2d");
        if (bgCtx) b.drawBackground(bgCtx, now, monoFont);
        const off = ctx ? b.draw(ctx, hero, now, pixelFont, monoFont) : { sx: 0, sy: 0 };
        if (el) {
          el.style.transform = `translate3d(${x.current + off.sx}px, ${-y.current + off.sy}px, 0)`;
          const st = `b-${hero.state}`;
          if (st !== lastState) { lastState = st; el.dataset.state = st; }
        }
        const be = bossEl.current;
        if (be) {
          be.style.transform = `translate3d(${b.bossX + off.sx}px, ${-b.bossY + off.sy}px, 0)`;
          be.dataset.v = `${b.bossFrame}${b.mouth ? 1 : 0}`;
          be.classList.toggle("is-hit", now < b.bossHitUntil);
          be.classList.toggle("is-glitch", now < b.glitchUntil);
          be.classList.toggle("is-visible", b.bossVisible && !b.bossDead);
          be.classList.toggle("is-dying", b.phase === "victory");
        }
        if (shadow.current) {
          const k = Math.max(0.25, 1 - y.current / 420);
          shadow.current.style.transform = `translate3d(${x.current + w / 2 - 26}px, 0, 0) scale(${k})`;
          shadow.current.style.opacity = String(0.2 + 0.35 * k);
        }
        if (now > nextHud) { nextHud = now + 90; setHud(b.snapshot(now)); }
        if (b.enraged !== lastEnraged) {
          lastEnraged = b.enraged;
          setBossEnraged(b.enraged);
          document.documentElement.classList.toggle("boss-rage", b.enraged);
          if (b.enraged) {
            document.documentElement.classList.add("boss-glitch");
            window.setTimeout(() => document.documentElement.classList.remove("boss-glitch"), 900);
          }
        }
        if (b.ended) endBattle(now);
        frame = requestAnimationFrame(tick);
        return;
      }

      if (mode.current === "held") {
        state = "held";
        setPoseOnce(Math.floor(clock / 0.16) % 2 ? "held1" : "held2");
      } else if (mode.current === "falling") {
        state = "fall";
        setPoseOnce("fall");
        vy.current -= GRAVITY * dt;
        y.current += vy.current * dt;
        x.current += vx.current * dt;
        vx.current *= 0.995;
        if (x.current < -10 || x.current > maxX() + 10) { vx.current = -vx.current * 0.6; x.current = Math.min(Math.max(x.current, -10), maxX() + 10); }
        if (y.current <= 0) {
          const impact = -vy.current;
          y.current = 0;
          if (impact > 900) {
            vy.current = impact * 0.28; // one small bounce
            vx.current *= 0.5;
            landUntil.current = now + 140;
          } else {
            mode.current = "free";
            vx.current = 0;
            landUntil.current = now + 420;
            target.current = null;
            pauseUntil.current = now + 1600;
            const hard = (el?.dataset.dropHeight ? Number(el.dataset.dropHeight) : 0) > 220;
            if (hard) { feel("dizzy", 2600); say(pick(HARD_LAND)); }
            else { feel("happy", 1800); say(pick(SOFT_LAND)); }
          }
        }
      } else if (now < landUntil.current) {
        state = "land";
        setPoseOnce("land");
      } else if (now < drinkUntil.current) {
        setPoseOnce("drink");
      } else if (pending.length > 0) {
        // Run to the nearest treat.
        if (mode.current === "working") stopWorking();
        goingToDesk.current = false;
        const half = w / 2;
        const nearest = pending.reduce((a, b) => (Math.abs(b.x - half - x.current) < Math.abs(a.x - half - x.current) ? b : a));
        const goal = Math.min(Math.max(nearest.x - half, -20), maxX() + 20);
        if (reduced.current || walkTo(goal, dt, RUN_SPEED * boost) || Math.abs(goal - x.current) < 4) {
          x.current = goal;
          consume(nearest, now);
        } else {
          setPoseOnce(Math.floor(clock / 0.08) % 2 === 0 ? "step" : "pass");
          isRunning = true;
        }
      } else if (angry) {
        state = "angry";
        setPoseOnce("cross");
      } else if (mode.current === "watching") {
        state = "watch";
        if (tvGoal === null) {
          mode.current = "free";
          setPoseOnce("idle");
          setJump((j) => j + 1);
          say(pick(WATCH_END));
          feel("happy", 1800);
          pauseUntil.current = now + 2500;
        } else if (Math.abs(tvGoal - x.current) > 150) {
          mode.current = "free";
          goingToTv.current = true;
          target.current = tvGoal;
          say("Next channel!");
        } else {
          const cycle = clock % 1.8;
          setPoseOnce(cycle < 0.45 ? "watch2" : "watch1");
          if (emotionRef.current === "neutral") { emotionRef.current = "watching"; setEmotionState("watching"); }
          if (now > watchTalkAt.current && !busy) {
            watchTalkAt.current = now + 6500 + Math.random() * 5000;
            if (Math.random() < 0.6) {
              const line = pick(WATCH_LINES);
              say(line);
              if (line.startsWith("Whoa") || line.startsWith("Wait")) feel("excited", 1600);
            }
          }
        }
      } else if (mode.current === "working" && tvGoal !== null && !reduced.current) {
        stopWorking();
        goingToTv.current = true;
        target.current = tvGoal;
        say("Ooh, a demo is on!");
      } else if (mode.current === "working") {
        state = "sit";
        setFacing(1);
        x.current = seatX;
        setPoseOnce(Math.floor(clock / 0.18) % 2 ? "sit1" : "sit2");
        if (now > workTalkAt && !busy) { workTalkAt = now + 6000 + Math.random() * 5000; if (Math.random() < 0.6) say(pick(WORK_LINES)); }
        if (now > workUntil.current) {
          stopWorking();
          setJump((j) => j + 1);
          say("Done! Stretch break.");
          feel("happy", 1800);
        }
      } else if (now < waveUntil.current) {
        setPoseOnce("wave");
      } else if (target.current !== null && (!busy || goingToDesk.current || goingToTv.current) && !reduced.current) {
        if (goingToTv.current) {
          if (tvGoal === null) { goingToTv.current = false; target.current = x.current; }
          else target.current = tvGoal;
        } else if (tvGoal !== null) {
          goingToDesk.current = false;
          goingToTv.current = true;
          target.current = tvGoal;
        }
        const far = Math.abs(target.current - x.current) > 380;
        const run = (goingToDesk.current || goingToTv.current) && far;
        const speed = run ? RUN_SPEED * 0.8 : SPEED * boost * (tipsy ? 0.7 : 1);
        isRunning = run;
        const cadence = run ? 0.08 : boost > 1 ? 0.1 : 0.14;
        setPoseOnce(Math.floor(clock / cadence) % 2 === 0 ? "step" : "pass");
        if (walkTo(target.current, dt, speed)) {
          target.current = null;
          setPoseOnce("idle");
          if (goingToTv.current) {
            goingToTv.current = false;
            mode.current = "watching";
            watchTalkAt.current = now + 4000;
            say(pick(WATCH_START));
          } else if (goingToDesk.current) {
            goingToDesk.current = false;
            mode.current = "working";
            workUntil.current = now + 9000 + Math.random() * 8000;
            workTalkAt = now + 3500;
            say(pick(WORK_START));
          } else {
            pauseUntil.current = now + (boost > 1 ? 600 : 1800) + Math.random() * 3800;
            if (Math.random() < 0.3) say(pick(IDLE_LINES));
          }
        }
      } else {
        setPoseOnce("idle");
        if (tvGoal !== null && target.current === null) {
          if (reduced.current) { x.current = tvGoal; mode.current = "watching"; watchTalkAt.current = now + 4000; }
          else { goingToTv.current = true; target.current = tvGoal; }
        } else if (!busy && !reduced.current && target.current === null && now > pauseUntil.current) {
          if (now > nextWorkAt.current && Math.random() < 0.6) {
            goingToDesk.current = true;
            target.current = seatX;
          } else {
            const span = maxX();
            let next = 16 + Math.random() * (span - 16);
            if (Math.abs(next - x.current) < 120) next = x.current > span / 2 ? next * 0.4 : Math.min(span, next + 200);
            target.current = next;
            if (now > nextWorkAt.current) nextWorkAt.current = now + 8000;
          }
        }
      }

      if (mode.current !== "watching" && emotionRef.current === "watching") { emotionRef.current = "neutral"; setEmotionState("neutral"); }
      setRunningOnce(isRunning);
      setWorkingOnce(mode.current === "working");
      if (mode.current !== "held" && mode.current !== "falling") x.current = Math.min(Math.max(x.current, -100), maxX() + 20);
      if (el) {
        el.style.transform = `translate3d(${x.current}px, ${-y.current}px, 0)`;
        if (state !== lastState) { lastState = state; el.dataset.state = state; }
      }
      if (shadow.current) {
        const k = Math.max(0.25, 1 - y.current / 420);
        shadow.current.style.transform = `translate3d(${x.current + w / 2 - 26}px, 0, 0) scale(${k})`;
        shadow.current.style.opacity = String(0.2 + 0.35 * k);
      }
      const near = x.current > window.innerWidth - 260;
      if (near !== lastNearRight) { lastNearRight = near; setNearRight(near); }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onResize = () => { if (x.current > maxX()) x.current = maxX(); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", onResize); };
  }, [ready, say, feel, maxX, updateItems, stopWorking]);

  // Blink every few seconds.
  useEffect(() => {
    if (!ready) return;
    let t = 0;
    const loop = () => {
      t = window.setTimeout(() => { setBlink(true); window.setTimeout(() => setBlink(false), 140); loop(); }, 2200 + Math.random() * 2600);
    };
    loop();
    return () => window.clearTimeout(t);
  }, [ready]);

  // Typewriter + mouth flap for the speech bubble.
  useEffect(() => {
    if (!bubble) return;
    let i = 0;
    const typing = window.setInterval(() => {
      i++;
      setTypedCount(i);
      setMouthOpen(i < bubble.length && i % 2 === 1);
      if (i >= bubble.length) window.clearInterval(typing);
    }, 38);
    return () => { window.clearInterval(typing); setMouthOpen(false); };
  }, [bubble]);

  // Comment on the section that scrolls into view.
  useEffect(() => {
    if (!ready) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main section[id]"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        if (!entry.isIntersecting || id === lastSection.current || !SECTION_LINES[id]) return;
        const first = lastSection.current === "";
        lastSection.current = id;
        const now = performance.now();
        if (first || battle.current || itemsRef.current.length > 0 || now < drinkUntil.current || now < angryUntil.current || mode.current !== "free" && mode.current !== "working") return;
        say(pick(SECTION_LINES[id]));
      });
    }, { rootMargin: "-40% 0px -40% 0px" });
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [ready, say]);

  // Turn to look at the cursor while standing still.
  useEffect(() => {
    if (!ready) return;
    const onMove = (event: PointerEvent) => {
      if (target.current !== null || itemsRef.current.length > 0 || mode.current !== "free") return;
      const center = x.current + buddyWidth(root.current) / 2;
      const angry = performance.now() < angryUntil.current;
      if (Math.abs(event.clientX - center) > 30 && window.innerHeight - event.clientY < 320) {
        const toward = event.clientX > center ? 1 : -1;
        setFacing(angry ? (-toward as 1 | -1) : toward); // angry: turn his back on you
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [ready]);

  /* Clicking (poking) him — too many pokes make him angry. */
  const poke = () => {
    const now = performance.now();
    if (now < drinkUntil.current || battle.current) return;
    pokes.current = [...pokes.current.filter((t) => now - t < 2600), now];
    const count = pokes.current.length;
    setJump((j) => j + 1);

    if (now < angryUntil.current) {
      angryUntil.current = now + 4500;
      feel("angry", 4500);
      say(pick(STILL_ANGRY));
      return;
    }
    if (count >= 6) {
      pokes.current = [];
      target.current = null;
      if (mode.current === "working") stopWorking();
      angryUntil.current = now + 5000;
      feel("angry", 5000);
      say(pick(ANGRY_LINES));
      window.setTimeout(() => {
        if (performance.now() >= angryUntil.current - 50 && emotionRef.current === "neutral") { feel("happy", 1800); say(pick(FORGIVE_LINES)); }
      }, 5100);
      return;
    }
    if (count >= 3) {
      feel("annoyed", 2200);
      say(ANNOYED_LINES[Math.min(count - 3, ANNOYED_LINES.length - 1)]);
      return;
    }
    if (mode.current === "working") { feel("annoyed", 1400); say(pick(WORK_POKE)); return; }
    if (mode.current === "watching") { feel("annoyed", 1400); say(pick(WATCH_POKE)); return; }
    target.current = null;
    feel("happy", 2000);
    say(CLICK_LINES[clickCount.current % CLICK_LINES.length], true);
    clickCount.current++;
  };

  /* Picking him up with the cursor. */
  const onBuddyDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || performance.now() < drinkUntil.current || battle.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = root.current?.getBoundingClientRect();
    grab.current = {
      startX: event.clientX, startY: event.clientY,
      offX: rect ? event.clientX - rect.left : 36, offY: rect ? event.clientY - rect.top : 30,
      active: false, samples: [{ x: event.clientX, y: event.clientY, t: performance.now() }],
    };
  };
  const onBuddyMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const g = grab.current;
    if (!g) return;
    const now = performance.now();
    if (!g.active && Math.hypot(event.clientX - g.startX, event.clientY - g.startY) > 6) {
      g.active = true;
      if (mode.current === "working") { stopWorking(); say("Hey! I was working!"); }
      else if (mode.current === "watching") say("Noo, the movie!");
      else say(pick(HELD_LINES));
      mode.current = "held";
      target.current = null;
      goingToDesk.current = false;
      angryUntil.current = 0;
      feel("scared", 600000);
      document.documentElement.classList.add("buddy-grabbing");
    }
    if (!g.active) return;
    const h = buddyHeight(root.current);
    x.current = Math.min(Math.max(event.clientX - g.offX, -20), window.innerWidth - buddyWidth(root.current) + 20);
    const bottomFromViewportBottom = window.innerHeight - (event.clientY - g.offY + h);
    y.current = Math.min(Math.max(bottomFromViewportBottom - FLOOR, 0), window.innerHeight - h - 20);
    g.samples = [...g.samples.filter((s) => now - s.t < 90), { x: event.clientX, y: event.clientY, t: now }];
    const first = g.samples[0];
    const dx = event.clientX - first.x;
    const tilt = Math.max(-25, Math.min(25, dx * 0.5));
    root.current?.style.setProperty("--tilt", `${tilt}deg`);
  };
  const release = (event: React.PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const g = grab.current;
    grab.current = null;
    if (!g) return;
    if (!g.active) { if (!cancelled) poke(); return; }
    document.documentElement.classList.remove("buddy-grabbing");
    root.current?.style.setProperty("--tilt", "0deg");
    const now = performance.now();
    const first = g.samples[0];
    const span = Math.max(16, now - first.t);
    vx.current = Math.max(-900, Math.min(900, ((event.clientX - first.x) / span) * 1000));
    vy.current = Math.max(-400, Math.min(700, (-(event.clientY - first.y) / span) * 1000));
    if (root.current) root.current.dataset.dropHeight = String(Math.round(y.current));
    feel("scared", 3000);
    if (reduced.current) { y.current = 0; vx.current = 0; mode.current = "free"; feel("happy", 1200); return; }
    mode.current = "falling";
  };
  const onBuddyKey = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0) poke(); // keyboard activation
  };

  /* ── Boss battle controls ── */
  const summonBoss = useCallback(() => {
    if (battle.current || !ready) return;
    const now = performance.now();
    if (mode.current === "working") stopWorking();
    mode.current = "battle";
    goingToTv.current = false;
    goingToDesk.current = false;
    target.current = null;
    angryUntil.current = 0;
    updateItems([]);
    document.documentElement.classList.remove("buddy-grabbing");
    const c = canvas.current;
    if (c) { c.width = window.innerWidth; c.height = window.innerHeight; }
    const options = BOSS_IDS.filter((id) => id !== lastBoss.current);
    const id = options[Math.floor(Math.random() * options.length)];
    lastBoss.current = id;
    setBossId(id);
    const html = document.documentElement;
    html.classList.remove("boss-clear", "boss-rage", ...BOSS_IDS.map((b) => `boss-${b}`));
    html.classList.add("boss-active", `boss-${id}`, "boss-glitch");
    window.setTimeout(() => html.classList.remove("boss-glitch"), 1000);
    battle.current = new BossBattle(now, window.innerWidth, window.innerHeight, reduced.current, id);
    setHud(battle.current.snapshot(now));
  }, [ready, stopWorking, updateItems]);
  const castSkill = useCallback((skill: Skill) => { battle.current?.use(skill, performance.now()); }, []);
  const flee = useCallback(() => { battle.current?.flee(performance.now()); }, []);
  const closeBattle = useCallback(() => { if (battle.current) battle.current.ended = true; }, []);
  const retryBattle = useCallback(() => {
    if (battle.current) battle.current.ended = true;
    window.setTimeout(summonBoss, 80);
  }, [summonBoss]);
  const onBossClick = (event: React.MouseEvent<HTMLDivElement>) => { battle.current?.poke(event.clientX, event.clientY, performance.now()); };

  // Keyboard: 1–5 skills, Esc to run away.
  useEffect(() => {
    if (!hud) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const map: Record<string, Skill> = { "1": "punch", "2": "orb", "3": "beam", "4": "shield", "5": "ultimate" };
      if (map[event.key]) { event.preventDefault(); castSkill(map[event.key]); }
      else if (event.key === "Escape") flee();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hud !== null, castSkill, flee]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the effects canvas sized to the viewport during a fight.
  useEffect(() => {
    if (!hud) return;
    const fit = () => {
      for (const c of [canvas.current, bgCanvas.current]) if (c) { c.width = window.innerWidth; c.height = window.innerHeight; }
      battle.current?.resize(window.innerWidth, window.innerHeight);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [hud !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Drag & drop treats from the snack tray (mouse + touch). */
  const onTreatDown = (kind: Treat) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY, moved: false };
    setDrag({ kind, x: event.clientX, y: event.clientY });
  };
  const onTreatMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = dragStart.current;
    if (!start || !drag) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) start.moved = true;
    setDrag({ ...drag, x: event.clientX, y: event.clientY });
  };
  const dropAwayFromBuddy = useCallback((kind: Treat) => {
    const center = x.current + buddyWidth(root.current) / 2;
    const w = window.innerWidth;
    const away = center > w / 2 ? w * (0.15 + Math.random() * 0.2) : w * (0.6 + Math.random() * 0.25);
    dropTreat(kind, away, window.innerHeight * 0.5);
  }, [dropTreat]);
  const onTreatUp = (kind: Treat) => (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = dragStart.current;
    dragStart.current = null;
    setDrag(null);
    if (!start) return;
    if (start.moved) dropTreat(kind, event.clientX, event.clientY);
    else dropAwayFromBuddy(kind);
  };
  const onTreatKey = (kind: Treat) => (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0) dropAwayFromBuddy(kind);
  };

  if (!ready) return null;

  const typed = bubble.slice(0, typedCount);
  const talking = mouthOpen && typed.length < bubble.length;

  return (
    <>
      <div className="snack-tray" aria-label="Snack bar: drag a treat onto the page for Pixel Eric">
        <span className="snack-tray-label" aria-hidden="true">SNACK BAR</span>
        {(["coffee", "beer"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            className="snack-item"
            aria-label={`Give Pixel Eric a ${kind}`}
            title={`Drag the ${kind} onto the page`}
            onPointerDown={onTreatDown(kind)}
            onPointerMove={onTreatMove}
            onPointerUp={onTreatUp(kind)}
            onPointerCancel={() => { dragStart.current = null; setDrag(null); }}
            onClick={onTreatKey(kind)}
          >
            <TreatSprite kind={kind} />
          </button>
        ))}
        <span className="snack-tray-hint" aria-hidden="true">DRAG ME ↙</span>
        <span className="snack-tray-divider" aria-hidden="true" />
        <button type="button" className="summon-btn" onClick={summonBoss} disabled={!!hud} aria-label="Summon the final boss bug and fight it" title="Summon the final boss!">
          <svg viewBox="0 0 12 10" shapeRendering="crispEdges" aria-hidden="true">
            <path d="M3 0h1v1h1v1h2V1h1V0h1v1H8v1h1v1h1v1h2v1h-2v1h2v1h-2v1H9v1H8v1H4V9H3V8H2V7H0V6h2V5H0V4h2V3h1V2h1V1H3z" fill="#9a3cb5" />
            <path d="M4 3h1v1H4zM7 3h1v1H7z" fill="#ff3b3b" />
          </svg>
          <span>BOSS</span>
        </button>
      </div>

      {hud && (
        <>
          <div className={`battle-arena arena-${bossId} ${bossEnraged ? "is-enraged" : ""}`} aria-hidden="true"><i className="arena-vignette" /><i className="arena-scan" /></div>
          <canvas ref={bgCanvas} className="battle-bg-canvas" aria-hidden="true" />
          <canvas ref={canvas} className="battle-canvas" aria-hidden="true" />
          <div ref={bossEl} className={`boss boss-${bossId} ${bossEnraged ? "is-enraged" : ""}`} onClick={onBossClick} role="presentation" title="Click to hit the bug!">
            {bossLine && <div className="boss-bubble">{bossLine}</div>}
            <BossSprite boss={bossId} enraged={bossEnraged} />
          </div>
          <BattleHud hud={hud} onSkill={castSkill} onFlee={flee} onRetry={retryBattle} onClose={closeBattle} />
        </>
      )}

      {drag && (
        <div className="treat-ghost" style={{ transform: `translate3d(${drag.x - 18}px, ${drag.y - 18}px, 0)` }} aria-hidden="true">
          <TreatSprite kind={drag.kind} />
        </div>
      )}

      <div className={`buddy-desk ${working ? "is-on" : ""} ${hud ? "is-hidden" : ""}`} style={{ left: deskX }} aria-hidden="true">
        <Desk on={working} />
      </div>

      <div className="treat-floor" aria-hidden="true">
        {items.map((item) => (
          <div key={item.id} className="floor-treat" style={{ left: item.x - 16, ["--fall" as string]: `${-item.fall}px` }}>
            <TreatSprite kind={item.kind} />
          </div>
        ))}
      </div>

      <div ref={shadow} className="buddy-ground-shadow" aria-hidden="true" />

      <div ref={root} className={`pixel-buddy mood-${emotion} ${powered ? "is-powered" : ""}`}>
        {powered && <span className="buddy-aura" aria-hidden="true"><i /><i /><i /></span>}
        {bubble && (
          <div className={`buddy-bubble ${nearRight ? "align-right" : ""} ${emotion === "angry" ? "is-angry" : ""}`} role="status" aria-live="polite">
            <span aria-hidden="true">{typed}</span>
            <span className="sr-only">{bubble}</span>
            {typed.length < bubble.length && <i className="buddy-caret" aria-hidden="true" />}
          </div>
        )}
        <Emote emotion={emotion} />
        <button
          type="button"
          className="buddy-body"
          aria-label="Pixel Eric. Click to say hi, or drag to pick him up"
          onPointerDown={onBuddyDown}
          onPointerMove={onBuddyMove}
          onPointerUp={(e) => release(e)}
          onPointerCancel={(e) => release(e, true)}
          onClick={onBuddyKey}
        >
          <span className="buddy-tilt">
            <span key={jump} className={`buddy-jump ${jump ? "is-jumping" : ""}`}>
              <span className="buddy-mood">
                <span className={`buddy-flip ${pose === "step" && !running ? "is-bob" : ""} ${running ? "is-running" : ""}`} style={{ transform: `scaleX(${facing})` }}>
                  <Sprite pose={pose} emotion={emotion} blink={blink} talking={talking} held={held} powered={powered} />
                </span>
              </span>
            </span>
          </span>
        </button>
      </div>
    </>
  );
}

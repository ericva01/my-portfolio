"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   Pixel Eric — a tiny 8-bit avatar that walks along the bottom
   of the page, talks, shows emotions, and runs to grab any
   coffee or beer the visitor drops onto the page.
   ───────────────────────────────────────────────────────────── */

const PALETTE: Record<string, string> = {
  H: "#1c1714", // hair
  h: "#3a2e26", // hair highlight
  S: "#d29a6e", // skin
  s: "#b07a52", // skin shadow
  E: "#15110f", // eyes
  M: "#8a4b38", // mouth
  O: "#3b1610", // mouth (open)
  R: "#e27d74", // blush
  W: "#eef0ea", // shirt
  N: "#34476b", // suit
  n: "#25334f", // suit shadow
  P: "#232c40", // trousers
  B: "#0d0f0d", // shoes
};

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
const LEGS_IDLE = ["....PPP..PPP....", "....PPP..PPP....", "....PPP..PPP....", "...BBBB..BBBB..."];
const LEGS_STEP = ["...PPP....PPP...", "..PPP......PPP..", "..PPP......PPP..", ".BBBB......BBBB."];
const LEGS_PASS = [".....PPPPPP.....", ".....PPPPPP.....", "....PPP.PPP.....", "...BBBB.BBBB...."];

type Pose = "idle" | "step" | "pass" | "wave" | "drink";
type Emotion = "neutral" | "happy" | "excited" | "tipsy";
type Treat = "coffee" | "beer";
type FloorItem = { id: number; kind: Treat; x: number; fall: number };

const setAt = (row: string, changes: Record<number, string>) =>
  row.split("").map((c, i) => changes[i] ?? c).join("");

function buildRows(pose: Pose, blink: boolean, talking: boolean, emotion: Emotion) {
  const happyFace = emotion === "happy" || emotion === "excited" || emotion === "tipsy";
  const head = HEAD.map((row, y) => {
    if (happyFace && emotion !== "excited") {
      // ^ ^ eyes
      if (y === 5) return setAt(row, { 4: "E", 5: "E", 10: "E", 11: "E" });
      if (y === 6) return setAt(row, { 3: "E", 4: "S", 5: "S", 6: "E", 9: "E", 10: "S", 11: "S", 12: "E" });
    } else if (y === 6 && blink) {
      return row.replace(/E/g, "s");
    }
    if (emotion === "excited" && y === 5) return setAt(row, { 4: "E", 5: "E", 10: "E", 11: "E" }); // wide eyes
    if (y === 7 && (emotion === "tipsy" || emotion === "happy")) return setAt(row, { 3: "R", 4: "R", 11: "R", 12: "R" });
    if (y === 9 && talking) return "...SSSSOOSSSS...";
    if (y === 9 && pose === "drink") return "...SSSSOOSSSS...";
    if (y === 9 && emotion === "excited") return "...SSSOOOOSSS...";
    if (happyFace && emotion !== "excited") {
      if (y === 9) return "...SSMSSSSMSS...";
      if (y === 10) return "....SSMMMMSS....";
    }
    return row;
  });
  const armUp = pose === "wave" || pose === "drink";
  const body = BODY.map((row, y) => (armUp && y === 6 ? "..SNNNNNNNNNNn.." : row));
  const legs = pose === "step" ? LEGS_STEP : pose === "pass" ? LEGS_PASS : LEGS_IDLE;
  return [...head, ...body, ...legs];
}

function pixels(rows: string[], palette: Record<string, string>, ox = 0, oy = 0) {
  const rects: React.ReactElement[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === c) end++;
      if (c !== ".") rects.push(<rect key={`${ox}-${oy}-${x}-${y}`} x={ox + x} y={oy + y} width={end - x} height={1} fill={palette[c]} />);
      x = end;
    }
  });
  return rects;
}

/* ── Treat sprites (8×8) ───────────────────────────────────── */
const TREAT_PALETTE: Record<string, string> = {
  g: "#c8cfbe", W: "#f2f1ea", w: "#b9bcae", C: "#5a3420",
  F: "#fffbe8", Y: "#e3a21f", y: "#f6cf62", G: "#cfd6c6",
};
const TREATS: Record<Treat, string[]> = {
  coffee: [
    "..g..g..",
    ".g..g...",
    "..g..g..",
    "WCCCCCW.",
    "WWWWWWWW",
    "WWWWWW.W",
    "WWWWWWWW",
    ".wwwww..",
  ],
  beer: [
    "........",
    ".FFFFF..",
    "FFFFFFF.",
    "YYYYYYGG",
    "YyYYYY.G",
    "YYYyYYGG",
    "YYYYYY..",
    "GGGGGG..",
  ],
};

function TreatSprite({ kind, className = "" }: { kind: Treat; className?: string }) {
  return (
    <svg viewBox="0 0 8 8" className={`treat-sprite treat-${kind} ${className}`} shapeRendering="crispEdges" aria-hidden="true">
      {pixels(TREATS[kind], TREAT_PALETTE)}
    </svg>
  );
}

function Sprite({ pose, blink, talking, emotion, held }: { pose: Pose; blink: boolean; talking: boolean; emotion: Emotion; held: Treat | null }) {
  return (
    <svg viewBox="0 0 16 24" className="buddy-sprite" shapeRendering="crispEdges" aria-hidden="true">
      <ellipse cx="8" cy="23.6" rx="5.5" ry="0.7" fill="#000" opacity="0.35" />
      {pixels(buildRows(pose, blink, talking, emotion), PALETTE)}
      {pose === "wave" && (
        <g className="buddy-wave-arm">
          <rect x="13" y="7" width="2" height="6" fill={PALETTE.N} />
          <rect x="13" y="7" width="1" height="6" fill={PALETTE.n} />
          <rect x="13" y="4" width="2" height="3" fill={PALETTE.S} />
          <rect x="15" y="5" width="1" height="1" fill={PALETTE.S} />
        </g>
      )}
      {pose === "drink" && held && (
        <g className="buddy-drink-arm">
          <rect x="13" y="11" width="2" height="3" fill={PALETTE.N} />
          <rect x="12" y="10" width="2" height="2" fill={PALETTE.S} />
          <g transform="translate(9.5 6.5) scale(0.55)">{pixels(TREATS[held].slice(3), TREAT_PALETTE)}</g>
        </g>
      )}
    </svg>
  );
}

function Emote({ emotion }: { emotion: Emotion }) {
  if (emotion === "excited") {
    return (
      <svg className="buddy-emote emote-bang" viewBox="0 0 3 7" shapeRendering="crispEdges" aria-hidden="true">
        <rect x="0" y="0" width="3" height="4" fill="#f6cf62" /><rect x="0" y="5" width="3" height="2" fill="#f6cf62" />
      </svg>
    );
  }
  if (emotion === "happy") {
    return (
      <span className="buddy-emote emote-hearts" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <svg key={i} viewBox="0 0 7 6" shapeRendering="crispEdges" style={{ animationDelay: `${i * 0.45}s` }}>
            <path d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z" fill="#e27d74" />
          </svg>
        ))}
      </span>
    );
  }
  if (emotion === "tipsy") return <span className="buddy-emote emote-hic" aria-hidden="true">hic!</span>;
  return null;
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
const IDLE_LINES = [
  "kubectl get coffee",
  "git commit -m \"just walking\"",
  "Deploying good vibes...",
  "Psst... drag me a coffee!",
  "Thanks for stopping by!",
  "docker run -it eric:latest",
];
const CLICK_LINES = ["Hello! Nice to meet you!", "Hehe, that tickles.", "Need a developer? Let's talk!", "Hi again!"];
const SPOT_LINES: Record<Treat, string[]> = {
  coffee: ["COFFEE?! Wait for me!", "Is that coffee?! Mine!", "Caffeine detected!"],
  beer: ["Ooh, a cold one!", "Is it Friday already?!", "Cheers incoming!"],
};
const AFTER_LINES: Record<Treat, string[]> = {
  coffee: ["Ahh! Now compiling at 2x speed!", "Coffee: the real CI/CD fuel.", "Fully caffeinated. Let's ship!"],
  beer: ["Cheers! Just one... hic!", "Deploying on Friday? Sure! hic!", "Everything is green... hic!"],
};
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const SPEED = 62; // walking px/s
const RUN_SPEED = 190; // running px/s
const DRINK_MS = 1700;
const MAX_ITEMS = 5;

const buddyWidth = (el: HTMLElement | null) => el?.offsetWidth || 72;
const maxXFor = (el: HTMLElement | null) => Math.max(16, window.innerWidth - buddyWidth(el) - 16);

export function PixelBuddy() {
  const [ready, setReady] = useState(false);
  const [nearRight, setNearRight] = useState(false);
  const [pose, setPose] = useState<Pose>("idle");
  const [running, setRunning] = useState(false);
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

  const root = useRef<HTMLDivElement>(null);
  const x = useRef(0);
  const target = useRef<number | null>(null);
  const pauseUntil = useRef(0);
  const talkingUntil = useRef(0);
  const waveUntil = useRef(0);
  const drinkUntil = useRef(0);
  const boostUntil = useRef(0);
  const tipsyUntil = useRef(0);
  const itemsRef = useRef<FloorItem[]>([]);
  const nextId = useRef(1);
  const lastSection = useRef("");
  const bubbleTimer = useRef(0);
  const emotionTimer = useRef(0);
  const reduced = useRef(false);
  const clickCount = useRef(0);
  const dragStart = useRef<{ x: number; y: number; moved: boolean } | null>(null);

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
    setEmotionState(next);
    window.clearTimeout(emotionTimer.current);
    emotionTimer.current = window.setTimeout(() => setEmotionState("neutral"), ms);
  }, []);

  const updateItems = useCallback((next: FloorItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  /* Drop a treat onto the floor. */
  const dropTreat = useCallback((kind: Treat, clientX: number, clientY: number) => {
    const floorTop = window.innerHeight - 10 - 32;
    const itemX = Math.min(Math.max(clientX, 24), window.innerWidth - 24);
    const item: FloorItem = { id: nextId.current++, kind, x: itemX, fall: Math.max(0, floorTop - (clientY - 16)) };
    updateItems([...itemsRef.current, item].slice(-MAX_ITEMS));
    if (drinkUntil.current < performance.now()) {
      feel("excited", 2400);
      say(pick(SPOT_LINES[kind]));
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

  // Entrance: walk in from the left edge, then wave hello.
  useEffect(() => {
    if (!ready) return;
    x.current = reduced.current ? maxX() : -80;
    target.current = reduced.current ? null : Math.min(window.innerWidth * 0.12 + 40, maxX());
    const t = window.setTimeout(() => { say("Hi there! I'm Eric. Welcome!", true); feel("happy", 2200); }, reduced.current ? 400 : 1700);
    return () => window.clearTimeout(t);
  }, [ready, say, feel, maxX]);

  // Main loop: chasing treats, walking, pausing, wandering.
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    let last = performance.now();
    let stepClock = 0;
    let lastPose: Pose = "idle";
    let lastNearRight = false;
    let lastRunning = false;
    const setPoseOnce = (p: Pose) => { if (p !== lastPose) { lastPose = p; setPose(p); } };
    const setRunningOnce = (r: boolean) => { if (r !== lastRunning) { lastRunning = r; setRunning(r); } };

    const consume = (item: FloorItem, now: number) => {
      updateItems(itemsRef.current.filter((i) => i.id !== item.id));
      drinkUntil.current = now + DRINK_MS;
      target.current = null;
      setHeld(item.kind);
      setEmotionState("neutral");
      window.setTimeout(() => {
        setHeld(null);
        const after = performance.now();
        if (item.kind === "coffee") {
          boostUntil.current = after + 12000;
          feel("happy", 6000);
        } else {
          tipsyUntil.current = after + 9000;
          feel("tipsy", 9000);
        }
        setJump((j) => j + 1);
        say(pick(AFTER_LINES[item.kind]));
      }, DRINK_MS);
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const el = root.current;
      const busy = now < talkingUntil.current;
      const boost = now < boostUntil.current ? 1.6 : 1;
      const tipsy = now < tipsyUntil.current;
      const pending = itemsRef.current;
      let isRunning = false;

      if (now < drinkUntil.current) {
        setPoseOnce("drink");
      } else if (pending.length > 0) {
        // Run to the nearest treat.
        const half = buddyWidth(el) / 2;
        const nearest = pending.reduce((a, b) => (Math.abs(b.x - half - x.current) < Math.abs(a.x - half - x.current) ? b : a));
        const goal = Math.min(Math.max(nearest.x - half, -20), maxX() + 20);
        const diff = goal - x.current;
        if (reduced.current || Math.abs(diff) < 4) {
          x.current = goal;
          consume(nearest, now);
        } else {
          const dir = Math.sign(diff) as 1 | -1;
          x.current += dir * Math.min(Math.abs(diff), RUN_SPEED * boost * dt);
          setFacing(dir);
          stepClock += dt;
          setPoseOnce(Math.floor(stepClock / 0.08) % 2 === 0 ? "step" : "pass");
          isRunning = true;
        }
      } else if (now < waveUntil.current) {
        setPoseOnce("wave");
      } else if (target.current !== null && !busy && !reduced.current) {
        const dir = Math.sign(target.current - x.current) as 1 | -1;
        x.current += dir * SPEED * boost * (tipsy ? 0.7 : 1) * dt;
        setFacing(dir);
        stepClock += dt;
        const phase = Math.floor(stepClock / (boost > 1 ? 0.1 : 0.14)) % 4;
        setPoseOnce(phase % 2 === 0 ? "step" : "pass");
        if ((dir > 0 && x.current >= target.current) || (dir < 0 && x.current <= target.current)) {
          x.current = target.current;
          target.current = null;
          pauseUntil.current = now + (boost > 1 ? 600 : 1800) + Math.random() * 3800;
          setPoseOnce("idle");
          if (Math.random() < 0.3) say(pick(IDLE_LINES));
        }
      } else {
        setPoseOnce("idle");
        if (!busy && !reduced.current && target.current === null && now > pauseUntil.current) {
          const span = maxX();
          let next = 16 + Math.random() * (span - 16);
          if (Math.abs(next - x.current) < 120) next = x.current > span / 2 ? next * 0.4 : Math.min(span, next + 200);
          target.current = next;
        }
      }

      setRunningOnce(isRunning);
      x.current = Math.min(Math.max(x.current, -100), maxX() + 20);
      if (el) el.style.transform = `translate3d(${x.current}px, 0, 0)`;
      const near = x.current > window.innerWidth - 260;
      if (near !== lastNearRight) { lastNearRight = near; setNearRight(near); }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onResize = () => { if (x.current > maxX()) x.current = maxX(); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", onResize); };
  }, [ready, say, feel, maxX, updateItems]);

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
        if (first || itemsRef.current.length > 0 || performance.now() < drinkUntil.current) return;
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
      if (target.current !== null || itemsRef.current.length > 0) return;
      const center = x.current + buddyWidth(root.current) / 2;
      if (Math.abs(event.clientX - center) > 30 && window.innerHeight - event.clientY < 320) setFacing(event.clientX > center ? 1 : -1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [ready]);

  const onPoke = () => {
    if (performance.now() < drinkUntil.current) return;
    target.current = null;
    setJump((j) => j + 1);
    feel("happy", 2000);
    say(CLICK_LINES[clickCount.current % CLICK_LINES.length], true);
    clickCount.current++;
  };

  /* Drag & drop from the snack tray (mouse + touch). */
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
    if (event.detail === 0) dropAwayFromBuddy(kind); // keyboard activation
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
      </div>

      {drag && (
        <div className="treat-ghost" style={{ transform: `translate3d(${drag.x - 18}px, ${drag.y - 18}px, 0)` }} aria-hidden="true">
          <TreatSprite kind={drag.kind} />
        </div>
      )}

      <div className="treat-floor" aria-hidden="true">
        {items.map((item) => (
          <div key={item.id} className="floor-treat" style={{ left: item.x - 16, ["--fall" as string]: `${-item.fall}px` }}>
            <TreatSprite kind={item.kind} />
          </div>
        ))}
      </div>

      <div ref={root} className={`pixel-buddy mood-${emotion}`}>
        {bubble && (
          <div className={`buddy-bubble ${nearRight ? "align-right" : ""}`} role="status" aria-live="polite">
            <span aria-hidden="true">{typed}</span>
            <span className="sr-only">{bubble}</span>
            {typed.length < bubble.length && <i className="buddy-caret" aria-hidden="true" />}
          </div>
        )}
        <Emote emotion={emotion} />
        <button type="button" className="buddy-body" onClick={onPoke} aria-label="Say hi to Pixel Eric">
          <span key={jump} className={`buddy-jump ${jump ? "is-jumping" : ""}`}>
            <span className="buddy-mood">
              <span className={`buddy-flip ${pose === "step" && !running ? "is-bob" : ""} ${running ? "is-running" : ""}`} style={{ transform: `scaleX(${facing})` }}>
                <Sprite pose={pose} blink={blink} talking={talking} emotion={emotion} held={held} />
              </span>
            </span>
          </span>
        </button>
      </div>
    </>
  );
}

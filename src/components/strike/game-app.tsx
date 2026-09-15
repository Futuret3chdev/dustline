import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Arena, type Hud } from "./arena";
import { bindKeyboard, input } from "@/lib/strike/input";
import { unlockAudio } from "@/lib/strike/audio";

const BEST = "dustline-best";

export function GameApp() {
  const [started, setStarted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [best, setBest] = useState(0);
  const [hud, setHud] = useState<Hud>({
    hp: 100,
    armor: 50,
    ammo: 30,
    reserve: 90,
    kills: 0,
    deaths: 0,
    hit: 0,
    hurt: 0,
    feed: "",
    alive: 5,
  });
  const lookTouch = useRef<{ id: number; x: number; y: number } | null>(null);
  const moveTouch = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem(BEST) || 0) || 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => bindKeyboard(), []);

  useEffect(() => {
    const onLock = () => setLocked(Boolean(document.pointerLockElement));
    document.addEventListener("pointerlockchange", onLock);
    return () => document.removeEventListener("pointerlockchange", onLock);
  }, []);

  useEffect(() => {
    if (!started) return;
    const move = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      input.lookX += e.movementX;
      input.lookY += e.movementY;
    };
    const down = (e: MouseEvent) => {
      if (e.button === 0) input.fire = true;
    };
    const up = (e: MouseEvent) => {
      if (e.button === 0) input.fire = false;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [started]);

  const onHud = useCallback((h: Hud) => {
    setHud(h);
    if (h.kills) {
      setBest((b) => {
        if (h.kills <= b) return b;
        try {
          localStorage.setItem(BEST, String(h.kills));
        } catch {
          /* ignore */
        }
        return h.kills;
      });
    }
  }, []);

  const requestLock = () => {
    unlockAudio();
    const canvas = document.querySelector("canvas");
    canvas
      ?.requestPointerLock?.({ unadjustedMovement: true } as PointerLockOptions)
      .catch(() => canvas.requestPointerLock());
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      {started ? (
        <>
          <Arena onHud={onHud} paused={false} />
          <Hud hud={hud} />
          {hud.hit > 0.2 ? <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-2xl text-fg">+</div> : null}
          {hud.hurt > 0 ? (
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{ boxShadow: `inset 0 0 80px rgb(180 40 30 / ${0.35 * hud.hurt})` }}
            />
          ) : null}
          <TouchLayer lookTouch={lookTouch} moveTouch={moveTouch} />
          {!locked ? (
            <button
              type="button"
              className="absolute inset-x-0 bottom-[max(5rem,env(safe-area-inset-bottom))] z-30 mx-auto hidden h-12 w-56 rounded-xl bg-primary text-sm font-medium text-primary-foreground md:block"
              onClick={requestLock}
            >
              Click to aim
            </button>
          ) : null}
        </>
      ) : (
        <Title best={best} onPlay={() => { unlockAudio(); setStarted(true); }} />
      )}
    </div>
  );
}

function Hud({ hud }: { hud: Hud }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute left-1/2 top-0 h-1.5 w-px -translate-x-1/2 bg-hud" />
        <span className="absolute bottom-0 left-1/2 h-1.5 w-px -translate-x-1/2 bg-hud" />
        <span className="absolute left-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-hud" />
        <span className="absolute right-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-hud" />
      </div>
      <header className="flex justify-between px-4 pt-[max(0.7rem,env(safe-area-inset-top))]">
        <p className="font-display text-lg tracking-wide">DUSTLINE</p>
        <p className="font-mono text-sm tabular-nums text-hud">
          {hud.kills} / {hud.deaths}
        </p>
      </header>
      {hud.feed ? (
        <p className="absolute left-1/2 top-16 -translate-x-1/2 rounded bg-surface/80 px-3 py-1 text-sm">{hud.feed}</p>
      ) : null}
      <div className="absolute bottom-[max(6.8rem,calc(env(safe-area-inset-bottom)+5.2rem))] left-3">
        <p className="font-display text-3xl leading-none text-hud">{hud.hp}</p>
        <p className="text-[11px] uppercase tracking-widest text-muted">HP · {hud.armor} kevlar</p>
      </div>
      <div className="absolute bottom-[max(6.8rem,calc(env(safe-area-inset-bottom)+5.2rem))] right-3 text-right">
        <p className="font-display text-3xl leading-none">
          {hud.ammo}
          <span className="text-base text-muted">/{hud.reserve}</span>
        </p>
        <p className="text-[11px] uppercase tracking-widest text-muted">rifle · {hud.alive} live</p>
      </div>
    </div>
  );
}

function TouchLayer({
  lookTouch,
  moveTouch,
}: {
  lookTouch: React.MutableRefObject<{ id: number; x: number; y: number } | null>;
  moveTouch: React.MutableRefObject<{ id: number; x: number; y: number } | null>;
}) {
  return (
    <div className="absolute inset-0 z-20 md:pointer-events-none">
      <div
        className="absolute bottom-0 left-0 h-1/2 w-1/2 touch-none md:hidden"
        onPointerDown={(e) => {
          moveTouch.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const t = moveTouch.current;
          if (!t || t.id !== e.pointerId) return;
          input.stickX = Math.max(-1, Math.min(1, (e.clientX - t.x) / 60));
          input.stickY = Math.max(-1, Math.min(1, (e.clientY - t.y) / 60));
        }}
        onPointerUp={() => {
          moveTouch.current = null;
          input.stickX = 0;
          input.stickY = 0;
        }}
      />
      <div
        className="absolute bottom-0 right-0 h-1/2 w-1/2 touch-none md:hidden"
        onPointerDown={(e) => {
          lookTouch.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const t = lookTouch.current;
          if (!t || t.id !== e.pointerId) return;
          input.lookX += e.clientX - t.x;
          input.lookY += e.clientY - t.y;
          t.x = e.clientX;
          t.y = e.clientY;
        }}
        onPointerUp={() => {
          lookTouch.current = null;
        }}
      />
      <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 flex gap-2 md:hidden">
        <button
          type="button"
          className="h-14 rounded-xl bg-elevated px-4 text-sm pointer-events-auto"
          onPointerDown={() => input.keys.add("KeyR")}
          onPointerUp={() => input.keys.delete("KeyR")}
        >
          R
        </button>
        <button
          type="button"
          className="h-16 w-16 rounded-full bg-primary text-sm font-medium text-primary-foreground pointer-events-auto"
          onPointerDown={() => {
            input.fire = true;
          }}
          onPointerUp={() => {
            input.fire = false;
          }}
          onPointerCancel={() => {
            input.fire = false;
          }}
        >
          Fire
        </button>
      </div>
    </div>
  );
}

function Title({ best, onPlay }: { best: number; onPlay: () => void }) {
  return (
    <div className="flex h-full flex-col justify-between px-5 pb-[max(1.2rem,env(safe-area-inset-bottom))] pt-[max(1.4rem,env(safe-area-inset-top))]">
      <header>
        <p className="text-xs uppercase tracking-widest text-subtle">MT World operators · dusty rail</p>
        <h1 className="font-display mt-2 text-5xl leading-none">Dustline</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          First person. Real faces from MT World, tactical kits, a sandy two-site map. No stick figures.
        </p>
      </header>
      <div className="w-full max-w-sm rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="text-center text-xs uppercase tracking-widest text-subtle">Best score</p>
        <p className="font-display text-center text-4xl tabular-nums">{best}</p>
        <Button className="mt-4 h-12 w-full rounded-xl" onClick={onPlay}>
          Enter the dust
        </Button>
        <p className="mt-3 text-center text-xs text-muted">
          Move left · look right · fire. WASD + mouse on desktop.
        </p>
      </div>
    </div>
  );
}

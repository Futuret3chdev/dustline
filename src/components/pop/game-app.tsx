import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { unlockAudio } from "@/lib/pop/audio";
import { Playfield, type HudSnap, type PlayHandle } from "./playfield";

const BEST_KEY = "glimmer-pop-best";

function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

function saveBest(n: number) {
  try {
    localStorage.setItem(BEST_KEY, String(n));
  } catch {
    /* ignore */
  }
}

export function GameApp() {
  const play = useRef<PlayHandle>(null);
  const [started, setStarted] = useState(false);
  const [best, setBest] = useState(0);
  const [hud, setHud] = useState<HudSnap>({
    screen: "play",
    score: 0,
    level: 1,
    chain: 0,
    drops: 6,
  });

  useEffect(() => {
    setBest(loadBest());
  }, []);

  const onHud = useCallback((snap: HudSnap) => {
    setHud(snap);
    if (snap.score) {
      setBest((b) => {
        if (snap.score <= b) return b;
        saveBest(snap.score);
        return snap.score;
      });
    }
  }, []);

  const overlay = hud.screen === "win" || hud.screen === "lose";

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-bg text-fg">
      {started ? (
        <>
          <header className="pointer-events-none z-10 flex items-end justify-between px-4 pb-1 pt-[max(0.7rem,env(safe-area-inset-top))]">
            <div>
              <p className="font-display text-xl leading-none">Glimmer Pop</p>
              <p className="mt-1 text-xs text-muted">Level {hud.level}</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-subtle">Score</p>
              <p className="font-display text-3xl leading-none tabular-nums">{hud.score.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs uppercase tracking-widest text-subtle">Drop</p>
              <p className="font-mono text-lg tabular-nums text-accent">{hud.drops}</p>
            </div>
          </header>
          <div className="relative min-h-0 flex-1">
            <Playfield ref={play} onHud={onHud} paused={overlay} />
          </div>
          <p className="pointer-events-none px-4 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-1 text-center text-xs text-muted">
            Drag to aim · tap to fire
          </p>
        </>
      ) : (
        <Title best={best} onPlay={() => { unlockAudio(); setStarted(true); }} />
      )}

      {started && overlay ? (
        <div className="absolute inset-0 z-20 flex items-end justify-center bg-bg/55 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="text-xs uppercase tracking-widest text-subtle">
              {hud.screen === "win" ? "Cabinet clear" : "The line"}
            </p>
            <h2 className="font-display mt-1 text-3xl leading-none">
              {hud.screen === "win" ? "All gone." : "Too close."}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {hud.screen === "win"
                ? `Level ${hud.level} is dust. Score ${hud.score.toLocaleString()}.`
                : `The orbs kissed the rail. Score ${hud.score.toLocaleString()}.`}
            </p>
            <div className="mt-4 grid gap-2">
              {hud.screen === "win" ? (
                <Button
                  className="h-12 rounded-xl"
                  onClick={() => {
                    unlockAudio();
                    play.current?.nextLevel();
                  }}
                >
                  Next cabinet
                </Button>
              ) : (
                <Button
                  className="h-12 rounded-xl"
                  onClick={() => {
                    unlockAudio();
                    play.current?.retry();
                  }}
                >
                  Try again
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setStarted(false);
                  setHud({ screen: "play", score: 0, level: 1, chain: 0, drops: 6 });
                }}
              >
                Title
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Title({ best, onPlay }: { best: number; onPlay: () => void }) {
  return (
    <div className="relative flex h-full flex-col justify-between px-5 pb-[max(1.2rem,env(safe-area-inset-bottom))] pt-[max(1.2rem,env(safe-area-inset-top))]">
      <img
        src="/pop/cabinet.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-bg/55" />
      <header className="relative z-10 max-w-md">
        <p className="text-xs uppercase tracking-widest text-subtle">Arcade cabinet · match three</p>
        <h1 className="font-display mt-2 text-5xl leading-none text-fg sm:text-6xl">Glimmer Pop</h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
          Aim the glass orbs. Match three of a kind. Hang a cluster and watch it fall.
        </p>
      </header>
      <div className="relative z-10 mx-auto w-full max-w-sm rounded-2xl bg-surface/95 p-4 shadow-[var(--shadow-border)]">
        <p className="text-center text-xs uppercase tracking-widest text-subtle">Best</p>
        <p className="font-display text-center text-4xl tabular-nums">{best.toLocaleString()}</p>
        <Button className="mt-4 h-12 w-full rounded-xl" onClick={onPlay}>
          Play
        </Button>
        <p className="mt-3 text-center text-xs text-muted">Drag to aim. Tap to fire. Walls bounce.</p>
      </div>
    </div>
  );
}

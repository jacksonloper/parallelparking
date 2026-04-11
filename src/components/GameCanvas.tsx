import { useRef, useEffect, useState, useCallback } from "react";
import {
  createGameWorld,
  applyDrive,
  stepWorld,
  checkWin,
} from "../physics";
import type { GameWorld } from "../physics";
import { render } from "../renderer/renderer";
import type { LevelDef } from "../physics";

export interface TouchInput {
  throttle: number;
  steering: number;
}

interface GameCanvasProps {
  level: LevelDef;
  /** Mutable ref shared with TouchControls so touch input reaches the game loop without re-renders */
  touchInputRef: React.RefObject<TouchInput>;
}

function initWorld(level: LevelDef): GameWorld {
  return createGameWorld(level);
}

export default function GameCanvas({ level, touchInputRef }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameWorldRef = useRef<GameWorld>(initWorld(level));
  const keysRef = useRef<Set<string>>(new Set());
  const wonRef = useRef(false);
  const animFrameRef = useRef(0);
  const [won, setWon] = useState(false);

  const resetGame = useCallback(() => {
    wonRef.current = false;
    setWon(false);
    gameWorldRef.current = createGameWorld(level);
  }, [level]);

  // Listen for reset from touch controls
  useEffect(() => {
    const onReset = () => resetGame();
    window.addEventListener("game-reset", onReset);
    return () => window.removeEventListener("game-reset", onReset);
  }, [resetGame]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "r" || e.key === "R") {
        resetGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [level, resetGame]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      const gw = gameWorldRef.current;

      const keys = keysRef.current;
      let throttle = 0;
      let steering = 0;

      // Keyboard
      if (keys.has("ArrowUp") || keys.has("w")) throttle += 1;
      if (keys.has("ArrowDown") || keys.has("s")) throttle -= 1;
      if (keys.has("ArrowLeft") || keys.has("a")) steering -= 1;
      if (keys.has("ArrowRight") || keys.has("d")) steering += 1;

      // Touch (override when active)
      const ti = touchInputRef.current;
      if (ti.throttle !== 0) throttle = ti.throttle;
      if (ti.steering !== 0) steering = ti.steering;

      applyDrive(gw.vehicle, throttle, steering);
      stepWorld(gw);

      if (!wonRef.current && checkWin(gw)) {
        wonRef.current = true;
        setWon(true);
      }

      const ppm = Math.min(
        canvas.width / gw.levelDef.bounds.width,
        canvas.height / gw.levelDef.bounds.height,
      );

      render(ctx, gw, wonRef.current, {
        showGrid: true,
        pixelsPerMeter: ppm,
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [touchInputRef]);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    });

    resizeObserver.observe(canvas);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      data-testid="game-container"
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          borderRadius: "8px",
          border: "2px solid #374151",
          touchAction: "none",
        }}
      />
      {won && (
        <div
          data-testid="win-overlay"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(34, 197, 94, 0.95)",
            color: "white",
            padding: "24px 48px",
            borderRadius: "12px",
            fontSize: "28px",
            fontWeight: "bold",
            textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            pointerEvents: "none",
          }}
        >
          🎉 Level Complete!
        </div>
      )}
      <button
        onClick={resetGame}
        data-testid="reset-button"
        className="desktop-only"
        style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          padding: "6px 14px",
          background: "#374151",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        Reset (R)
      </button>
    </div>
  );
}

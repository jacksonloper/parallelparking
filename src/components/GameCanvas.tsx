import { useRef, useEffect, useState, useCallback } from "react";
import {
  createGameWorld,
  applyDrive,
  stepWorld,
  checkWin,
} from "../physics";
import type { GameWorld } from "../physics";
import { ThreeRenderer } from "../renderer/ThreeRenderer";
import type { LevelDef } from "../physics";

export interface TouchInput {
  throttle: number;   // -1 to 1 (continuous)
  steering: number;   // -1 to 1 (continuous)
  go: boolean;        // true while Go button is held
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
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);
  const gameWorldRef = useRef<GameWorld>(initWorld(level));
  const keysRef = useRef<Set<string>>(new Set());
  const wonRef = useRef(false);
  const animFrameRef = useRef(0);
  const [won, setWon] = useState(false);

  const resetGame = useCallback(() => {
    wonRef.current = false;
    setWon(false);
    const gw = createGameWorld(level);
    gameWorldRef.current = gw;
    rendererRef.current?.setupScene(gw);
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

  // Three.js setup + game loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const threeRenderer = new ThreeRenderer(container);
    rendererRef.current = threeRenderer;
    threeRenderer.setupScene(gameWorldRef.current);

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
      threeRenderer.resize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    const loop = () => {
      const gw = gameWorldRef.current;

      const keys = keysRef.current;
      let throttle = 0;
      let steering = 0;
      let hasKeyboard = false;

      // Keyboard
      if (keys.has("ArrowUp") || keys.has("w")) { throttle += 1; hasKeyboard = true; }
      if (keys.has("ArrowDown") || keys.has("s")) { throttle -= 1; hasKeyboard = true; }
      if (keys.has("ArrowLeft") || keys.has("a")) { steering -= 1; hasKeyboard = true; }
      if (keys.has("ArrowRight") || keys.has("d")) { steering += 1; hasKeyboard = true; }

      // Touch (steering slider + forward/reverse buttons)
      const ti = touchInputRef.current;
      if (!hasKeyboard && ti.go) {
        throttle = ti.throttle;
        steering = ti.steering;
      }

      applyDrive(gw.vehicle, throttle, steering);
      stepWorld(gw);

      if (!wonRef.current && checkWin(gw)) {
        wonRef.current = true;
        setWon(true);
      }

      threeRenderer.render(gw, wonRef.current);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      threeRenderer.dispose();
      rendererRef.current = null;
    };
  }, [touchInputRef, level]);

  return (
    <div
      data-testid="game-container"
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          border: "2px solid #374151",
          borderRadius: "8px",
          overflow: "hidden",
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

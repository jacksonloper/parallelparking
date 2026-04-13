import { useState, useRef } from "react";
import type { TouchInput } from "./GameCanvas";

interface TouchControlsProps {
  touchInputRef: React.RefObject<TouchInput>;
}

/**
 * Mobile touch controls — two-thumb layout:
 * - Left: tall steering touch zone (horizontal position = steering)
 * - Right: Forward, Reverse, Reset buttons stacked vertically
 */
export default function TouchControls({ touchInputRef }: TouchControlsProps) {
  const [steering, setSteering] = useState(0);
  const [activeDir, setActiveDir] = useState<"fwd" | "rev" | null>(null);
  const steerZoneRef = useRef<HTMLDivElement>(null);

  const updateRef = (patch: Partial<TouchInput>) => {
    const cur = touchInputRef.current;
    touchInputRef.current = { ...cur, ...patch };
  };

  /** Map a horizontal pixel position within the steering zone to -1…1 */
  const steerFromX = (clientX: number) => {
    const zone = steerZoneRef.current;
    if (!zone) return;
    const rect = zone.getBoundingClientRect();
    // clamp to zone bounds
    const x = Math.max(rect.left, Math.min(rect.right, clientX));
    const ratio = (x - rect.left) / rect.width; // 0…1
    const val = ratio * 2 - 1; // -1…1
    setSteering(val);
    updateRef({ steering: val });
  };

  const handleSteerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    steerFromX(e.clientX);
  };
  const handleSteerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.pressure === 0) return; // not pressed
    steerFromX(e.clientX);
  };
  const handleSteerUp = () => {
    setSteering(0);
    updateRef({ steering: 0 });
  };

  const handleDriveDown = (dir: "fwd" | "rev") => {
    setActiveDir(dir);
    updateRef({ throttle: dir === "fwd" ? 1 : -1, go: true });
  };

  const handleDriveUp = () => {
    setActiveDir(null);
    updateRef({ throttle: 0, go: false });
  };

  const driveButton = (dir: "fwd" | "rev"): React.CSSProperties => {
    const isActive = activeDir === dir;
    const isFwd = dir === "fwd";
    return {
      flex: 1,
      borderRadius: 12,
      border: "none",
      background: isActive
        ? (isFwd ? "#16a34a" : "#b45309")
        : (isFwd ? "#166534" : "#78350f"),
      color: isFwd ? "#86efac" : "#fde68a",
      fontSize: 16,
      fontWeight: "bold",
      userSelect: "none",
      WebkitUserSelect: "none",
      touchAction: "none",
      cursor: "pointer",
      boxShadow: isActive
        ? `0 0 12px ${isFwd ? "rgba(34,197,94,0.6)" : "rgba(180,83,9,0.6)"}`
        : `0 2px 8px ${isFwd ? "rgba(22,101,52,0.4)" : "rgba(120,53,15,0.4)"}`,
      transition: "background 0.1s, box-shadow 0.1s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };
  };

  /** Steering indicator position (0–100 %) */
  const indicatorPct = ((steering + 1) / 2) * 100;

  return (
    <div
      data-testid="touch-controls"
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 8,
        padding: "8px 8px 12px",
        height: 140,
      }}
    >
      {/* ── Left: tall steering touch zone ── */}
      <div
        ref={steerZoneRef}
        role="slider"
        aria-label="Steering"
        aria-valuemin={-100}
        aria-valuemax={100}
        aria-valuenow={Math.round(steering * 100)}
        aria-orientation="horizontal"
        data-testid="touch-steer-zone"
        onPointerDown={handleSteerDown}
        onPointerMove={handleSteerMove}
        onPointerUp={handleSteerUp}
        onPointerCancel={handleSteerUp}
        style={{
          flex: 1,
          borderRadius: 12,
          background: "#1e293b",
          border: "2px solid #374151",
          position: "relative",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        {/* centre marker */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 1,
            background: "#4b5563",
          }}
        />
        {/* live indicator */}
        <div
          style={{
            position: "absolute",
            left: `${indicatorPct}%`,
            top: 0,
            bottom: 0,
            width: 4,
            marginLeft: -2,
            background: "#60a5fa",
            borderRadius: 2,
            transition: "left 0.05s",
          }}
        />
        {/* label */}
        <span
          style={{
            position: "absolute",
            bottom: 6,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 11,
            color: "#6b7280",
            pointerEvents: "none",
          }}
        >
          ◀ steer ▶
        </span>
      </div>

      {/* ── Right: Forward / Reverse / Reset stacked ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          width: 80,
          flexShrink: 0,
        }}
      >
        <button
          aria-label="Forward"
          data-testid="touch-forward"
          onPointerDown={() => handleDriveDown("fwd")}
          onPointerUp={handleDriveUp}
          onPointerCancel={handleDriveUp}
          onPointerLeave={handleDriveUp}
          style={driveButton("fwd")}
        >
          {activeDir === "fwd" ? "🚗" : "▲"}<br />FWD
        </button>

        <button
          aria-label="Reverse"
          data-testid="touch-reverse"
          onPointerDown={() => handleDriveDown("rev")}
          onPointerUp={handleDriveUp}
          onPointerCancel={handleDriveUp}
          onPointerLeave={handleDriveUp}
          style={driveButton("rev")}
        >
          {activeDir === "rev" ? "🔙" : "▼"}<br />REV
        </button>

        <button
          aria-label="Reset level"
          data-testid="touch-reset"
          onClick={() => window.dispatchEvent(new CustomEvent("game-reset"))}
          style={{
            height: 36,
            borderRadius: 12,
            border: "none",
            background: "#7f1d1d",
            color: "#fca5a5",
            fontSize: 16,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
            WebkitUserSelect: "none",
            touchAction: "none",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(127,29,29,0.4)",
            flexShrink: 0,
          }}
        >
          ↻
        </button>
      </div>
    </div>
  );
}

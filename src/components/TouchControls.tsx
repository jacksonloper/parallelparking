import { useState } from "react";
import type { TouchInput } from "./GameCanvas";

interface TouchControlsProps {
  touchInputRef: React.RefObject<TouchInput>;
}

/**
 * Mobile touch controls:
 * - Steering slider (left ↔ right)
 * - Forward button (hold to drive forward)
 * - Reverse button (hold to drive in reverse)
 * - Reset button
 */
export default function TouchControls({ touchInputRef }: TouchControlsProps) {
  const [steering, setSteering] = useState(0);
  const [activeDir, setActiveDir] = useState<"fwd" | "rev" | null>(null);

  const updateRef = (patch: Partial<TouchInput>) => {
    const cur = touchInputRef.current;
    touchInputRef.current = { ...cur, ...patch };
  };

  const handleSteeringChange = (val: number) => {
    setSteering(val);
    updateRef({ steering: val });
  };

  const handleDriveDown = (dir: "fwd" | "rev") => {
    setActiveDir(dir);
    updateRef({ throttle: dir === "fwd" ? 1 : -1, go: true });
  };

  const handleDriveUp = () => {
    setActiveDir(null);
    updateRef({ throttle: 0, go: false });
  };

  const sliderTrack: React.CSSProperties = {
    width: "100%",
    height: 8,
    appearance: "none",
    WebkitAppearance: "none",
    background: "#374151",
    borderRadius: 4,
    outline: "none",
    cursor: "pointer",
  };

  const driveButton = (dir: "fwd" | "rev"): React.CSSProperties => {
    const isActive = activeDir === dir;
    const isFwd = dir === "fwd";
    return {
      flex: 1,
      maxWidth: 200,
      padding: "14px 0",
      borderRadius: 12,
      border: "none",
      background: isActive
        ? (isFwd ? "#16a34a" : "#b45309")
        : (isFwd ? "#166534" : "#78350f"),
      color: isFwd ? "#86efac" : "#fde68a",
      fontSize: 18,
      fontWeight: "bold",
      userSelect: "none",
      WebkitUserSelect: "none",
      touchAction: "none",
      cursor: "pointer",
      boxShadow: isActive
        ? `0 0 12px ${isFwd ? "rgba(34,197,94,0.6)" : "rgba(180,83,9,0.6)"}`
        : `0 2px 8px ${isFwd ? "rgba(22,101,52,0.4)" : "rgba(120,53,15,0.4)"}`,
      transition: "background 0.1s, box-shadow 0.1s",
    };
  };

  return (
    <div
      data-testid="touch-controls"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "8px 16px 12px",
      }}
    >
      {/* Steering slider */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18, minWidth: 24, textAlign: "center" }}>◀</span>
        <div style={{ flex: 1 }}>
          <label
            style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 2 }}
          >
            Steering ({steering > 0 ? "R" : steering < 0 ? "L" : "center"})
          </label>
          <input
            type="range"
            aria-label="Steering"
            min={-100}
            max={100}
            value={steering * 100}
            onChange={(e) => handleSteeringChange(Number(e.target.value) / 100)}
            style={sliderTrack}
          />
        </div>
        <span style={{ fontSize: 18, minWidth: 24, textAlign: "center" }}>▶</span>
      </div>

      {/* Forward / Reverse / Reset row */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 4 }}>
        <button
          aria-label="Reverse"
          data-testid="touch-reverse"
          onPointerDown={() => handleDriveDown("rev")}
          onPointerUp={handleDriveUp}
          onPointerCancel={handleDriveUp}
          onPointerLeave={handleDriveUp}
          style={driveButton("rev")}
        >
          {activeDir === "rev" ? "🔙 REV" : "⬅ REV"}
        </button>

        <button
          aria-label="Forward"
          data-testid="touch-forward"
          onPointerDown={() => handleDriveDown("fwd")}
          onPointerUp={handleDriveUp}
          onPointerCancel={handleDriveUp}
          onPointerLeave={handleDriveUp}
          style={driveButton("fwd")}
        >
          {activeDir === "fwd" ? "🚗 FWD" : "➡ FWD"}
        </button>

        <button
          aria-label="Reset level"
          data-testid="touch-reset"
          onClick={() => window.dispatchEvent(new CustomEvent("game-reset"))}
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            border: "none",
            background: "#7f1d1d",
            color: "#fca5a5",
            fontSize: 22,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
            WebkitUserSelect: "none",
            touchAction: "none",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(127,29,29,0.4)",
          }}
        >
          ↻
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import type { TouchInput } from "./GameCanvas";

interface TouchControlsProps {
  touchInputRef: React.RefObject<TouchInput>;
}

/**
 * Mobile touch controls:
 * - Steering slider (left ↔ right)
 * - Speed slider (reverse ↔ forward)
 * - GO button (hold to drive)
 * - Reset button
 */
export default function TouchControls({ touchInputRef }: TouchControlsProps) {
  const [steering, setSteering] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [goActive, setGoActive] = useState(false);

  const updateRef = (patch: Partial<TouchInput>) => {
    const cur = touchInputRef.current;
    touchInputRef.current = { ...cur, ...patch };
  };

  const handleSteeringChange = (val: number) => {
    setSteering(val);
    updateRef({ steering: val });
  };

  const handleSpeedChange = (val: number) => {
    setSpeed(val);
    updateRef({ throttle: val });
  };

  const handleGoDown = () => {
    setGoActive(true);
    updateRef({ go: true });
  };

  const handleGoUp = () => {
    setGoActive(false);
    updateRef({ go: false });
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

      {/* Speed slider */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, minWidth: 24, textAlign: "center", color: "#fde68a" }}>REV</span>
        <div style={{ flex: 1 }}>
          <label
            style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 2 }}
          >
            Speed ({speed > 0 ? "fwd" : speed < 0 ? "rev" : "stop"})
          </label>
          <input
            type="range"
            aria-label="Speed"
            min={-100}
            max={100}
            value={speed * 100}
            onChange={(e) => handleSpeedChange(Number(e.target.value) / 100)}
            style={sliderTrack}
          />
        </div>
        <span style={{ fontSize: 14, minWidth: 24, textAlign: "center", color: "#86efac" }}>FWD</span>
      </div>

      {/* GO + Reset row */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 4 }}>
        <button
          aria-label="Go"
          data-testid="touch-go"
          onPointerDown={handleGoDown}
          onPointerUp={handleGoUp}
          onPointerCancel={handleGoUp}
          onPointerLeave={handleGoUp}
          style={{
            flex: 1,
            maxWidth: 200,
            padding: "14px 0",
            borderRadius: 12,
            border: "none",
            background: goActive ? "#16a34a" : "#166534",
            color: "#86efac",
            fontSize: 20,
            fontWeight: "bold",
            userSelect: "none",
            WebkitUserSelect: "none",
            touchAction: "none",
            cursor: "pointer",
            boxShadow: goActive
              ? "0 0 12px rgba(34, 197, 94, 0.6)"
              : "0 2px 8px rgba(22, 101, 52, 0.4)",
            transition: "background 0.1s, box-shadow 0.1s",
          }}
        >
          {goActive ? "🚗 DRIVING" : "GO"}
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

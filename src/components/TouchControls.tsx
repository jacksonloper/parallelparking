import type { TouchInput } from "./GameCanvas";

interface TouchControlsProps {
  touchInputRef: React.RefObject<TouchInput>;
}

/**
 * On-screen touch controls for mobile devices.
 * Left side: steering (left / right)
 * Right side: throttle (forward / reverse)
 * Center: reset
 */
export default function TouchControls({ touchInputRef }: TouchControlsProps) {
  const update = (patch: Partial<TouchInput>) => {
    const cur = touchInputRef.current;
    touchInputRef.current = { ...cur, ...patch };
  };

  const btnBase: React.CSSProperties = {
    width: 62,
    height: 62,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 24,
    border: "none",
  };

  const steerBtn: React.CSSProperties = {
    ...btnBase,
    background: "#1e40af",
    color: "#93c5fd",
    boxShadow: "0 2px 8px rgba(30,64,175,0.4)",
  };

  const fwdBtn: React.CSSProperties = {
    ...btnBase,
    background: "#166534",
    color: "#86efac",
    boxShadow: "0 2px 8px rgba(22,101,52,0.4)",
  };

  const revBtn: React.CSSProperties = {
    ...btnBase,
    background: "#92400e",
    color: "#fde68a",
    boxShadow: "0 2px 8px rgba(146,64,14,0.4)",
  };

  const resetBtn: React.CSSProperties = {
    ...btnBase,
    width: 46,
    height: 46,
    borderRadius: 8,
    background: "#7f1d1d",
    color: "#fca5a5",
    fontSize: 20,
    boxShadow: "0 2px 8px rgba(127,29,29,0.4)",
  };

  return (
    <div
      data-testid="touch-controls"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 12px",
        gap: 8,
      }}
    >
      {/* Steering */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          aria-label="Steer left"
          style={steerBtn}
          onPointerDown={() => update({ steering: -1 })}
          onPointerUp={() => update({ steering: 0 })}
          onPointerCancel={() => update({ steering: 0 })}
          onPointerLeave={() => update({ steering: 0 })}
        >
          ◀
        </button>
        <button
          aria-label="Steer right"
          style={steerBtn}
          onPointerDown={() => update({ steering: 1 })}
          onPointerUp={() => update({ steering: 0 })}
          onPointerCancel={() => update({ steering: 0 })}
          onPointerLeave={() => update({ steering: 0 })}
        >
          ▶
        </button>
      </div>

      {/* Reset */}
      <button
        aria-label="Reset level"
        data-testid="touch-reset"
        style={resetBtn}
        onClick={() => window.dispatchEvent(new CustomEvent("game-reset"))}
      >
        ↻
      </button>

      {/* Throttle */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          aria-label="Reverse"
          style={revBtn}
          onPointerDown={() => update({ throttle: -1 })}
          onPointerUp={() => update({ throttle: 0 })}
          onPointerCancel={() => update({ throttle: 0 })}
          onPointerLeave={() => update({ throttle: 0 })}
        >
          ▼
        </button>
        <button
          aria-label="Drive forward"
          style={fwdBtn}
          onPointerDown={() => update({ throttle: 1 })}
          onPointerUp={() => update({ throttle: 0 })}
          onPointerCancel={() => update({ throttle: 0 })}
          onPointerLeave={() => update({ throttle: 0 })}
        >
          ▲
        </button>
      </div>
    </div>
  );
}

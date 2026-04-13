import type { LevelDef } from "../physics";

interface LevelSelectorProps {
  levels: LevelDef[];
  currentLevel: number;
  onSelectLevel: (index: number) => void;
}

export default function LevelSelector({
  levels,
  currentLevel,
  onSelectLevel,
}: LevelSelectorProps) {
  return (
    <>
      {/* Mobile: compact dropdown */}
      <div className="mobile-only">
        <select
          value={currentLevel}
          onChange={(e) => onSelectLevel(Number(e.target.value))}
          aria-label="Select level"
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: "15px",
            background: "#374151",
            color: "#f9fafb",
            border: "1px solid #4b5563",
            borderRadius: "8px",
            appearance: "auto",
          }}
        >
          {levels.map((level, i) => (
            <option key={i} value={i}>
              Level {i + 1}: {level.name}
              {level.trailerCount > 0
                ? ` (${level.trailerCount} trailer${level.trailerCount > 1 ? "s" : ""})`
                : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: horizontal scrollable row of buttons */}
      <div
        className="desktop-only"
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          justifyContent: "center",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {levels.map((level, i) => (
          <button
            key={i}
            onClick={() => onSelectLevel(i)}
            style={{
              padding: "8px 16px",
              background: i === currentLevel ? "#2563eb" : "#f3f4f6",
              color: i === currentLevel ? "white" : "#374151",
              border: i === currentLevel ? "2px solid #1d4ed8" : "2px solid #d1d5db",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: i === currentLevel ? "bold" : "normal",
              transition: "all 0.15s ease",
              minWidth: "100px",
              flexShrink: 0,
            }}
            title={level.description}
          >
            <div style={{ fontSize: "11px", opacity: 0.7 }}>Level {i + 1}</div>
            <div>{level.name}</div>
            {level.trailerCount > 0 && (
              <div style={{ fontSize: "10px", marginTop: "2px", opacity: 0.6 }}>
                {level.trailerCount} trailer{level.trailerCount > 1 ? "s" : ""}
              </div>
            )}
          </button>
        ))}
      </div>
    </>
  );
}

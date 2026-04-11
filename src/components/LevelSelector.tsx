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
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        justifyContent: "center",
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
  );
}

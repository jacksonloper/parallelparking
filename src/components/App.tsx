import { useState, useRef } from "react";
import GameCanvas from "./GameCanvas";
import type { TouchInput } from "./GameCanvas";
import LevelSelector from "./LevelSelector";
import Controls from "./Controls";
import TouchControls from "./TouchControls";
import { levels } from "../levels";

export default function App() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const touchInputRef = useRef<TouchInput>({ throttle: 0, steering: 0, go: false });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#111827",
        color: "#f9fafb",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <header
        style={{
          padding: "12px 20px",
          background: "#1f2937",
          borderBottom: "1px solid #374151",
          textAlign: "center",
        }}
      >
        <h1
          data-testid="app-title"
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: "bold",
            letterSpacing: "-0.02em",
          }}
        >
          🚗 Parallel Parking Simulator
        </h1>
        <p
          data-testid="level-description"
          style={{
            margin: "4px 0 0",
            fontSize: "13px",
            color: "#9ca3af",
          }}
        >
          {levels[currentLevel].description}
        </p>
      </header>

      <nav
        style={{
          padding: "6px 12px",
          background: "#1f2937",
          borderBottom: "1px solid #374151",
        }}
      >
        <LevelSelector
          levels={levels}
          currentLevel={currentLevel}
          onSelectLevel={setCurrentLevel}
        />
      </nav>

      <main
        style={{
          flex: 1,
          padding: "12px",
          minHeight: 0,
        }}
      >
        <GameCanvas
          key={currentLevel}
          level={levels[currentLevel]}
          touchInputRef={touchInputRef}
        />
      </main>

      {/* Desktop: keyboard help; Mobile: touch controls */}
      <footer
        style={{
          background: "#1f2937",
          borderTop: "1px solid #374151",
        }}
      >
        <div className="desktop-only" style={{ padding: "10px 20px" }}>
          <Controls />
        </div>
        <div className="mobile-only">
          <TouchControls touchInputRef={touchInputRef} />
        </div>
      </footer>
    </div>
  );
}

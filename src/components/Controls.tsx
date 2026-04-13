export default function Controls() {
  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        fontSize: "13px",
        color: "#6b7280",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#374151" }}>
          Drive
        </div>
        <div>
          <kbd>↑</kbd> / <kbd>W</kbd> Forward
        </div>
        <div>
          <kbd>↓</kbd> / <kbd>S</kbd> Reverse
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#374151" }}>
          Steer
        </div>
        <div>
          <kbd>←</kbd> / <kbd>A</kbd> Left
        </div>
        <div>
          <kbd>→</kbd> / <kbd>D</kbd> Right
        </div>
      </div>
      <div
        style={{
          background: "#fef3c7",
          border: "1px solid #fbbf24",
          borderRadius: "6px",
          padding: "8px 12px",
          maxWidth: "200px",
          fontSize: "12px",
          color: "#92400e",
        }}
      >
        💡 <strong>Tip:</strong> Reversing with trailers causes jackknifing.
        Use small steering adjustments!
      </div>
    </div>
  );
}

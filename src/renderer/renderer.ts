import type { GameWorld } from "../physics/types";
import type { Body } from "planck-js";

const COLORS = {
  car: "#2563eb",
  trailer: "#7c3aed",
  immovable: "#4b5563",
  movable: "#d97706",
  wall: "#1f2937",
  goal: "rgba(34, 197, 94, 0.3)",
  goalBorder: "#22c55e",
  background: "#e5e7eb",
  grid: "#d1d5db",
  winGoal: "rgba(34, 197, 94, 0.6)",
};

export interface RenderOptions {
  showGrid: boolean;
  pixelsPerMeter: number;
}

function getBodyVertices(body: Body): { x: number; y: number }[] {
  const fixture = body.getFixtureList();
  if (!fixture) return [];

  const shape = fixture.getShape() as { m_vertices?: { x: number; y: number }[] };
  if (!shape.m_vertices) return [];

  const pos = body.getPosition();
  const angle = body.getAngle();
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return shape.m_vertices.map((v: { x: number; y: number }) => ({
    x: pos.x + v.x * cos - v.y * sin,
    y: pos.y + v.x * sin + v.y * cos,
  }));
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  vertices: { x: number; y: number }[],
  fill: string,
  stroke: string,
  ppm: number
): void {
  if (vertices.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(vertices[0].x * ppm, vertices[0].y * ppm);
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i].x * ppm, vertices[i].y * ppm);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawDirectionIndicator(
  ctx: CanvasRenderingContext2D,
  body: Body,
  ppm: number
): void {
  const pos = body.getPosition();
  const angle = body.getAngle();
  const len = 1.5;

  ctx.beginPath();
  ctx.moveTo(pos.x * ppm, pos.y * ppm);
  ctx.lineTo(
    (pos.x + len * Math.cos(angle)) * ppm,
    (pos.y + len * Math.sin(angle)) * ppm
  );
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Arrow head
  const headLen = 0.4;
  const headAngle = 0.5;
  ctx.beginPath();
  ctx.moveTo(
    (pos.x + len * Math.cos(angle)) * ppm,
    (pos.y + len * Math.sin(angle)) * ppm
  );
  ctx.lineTo(
    (pos.x + (len - headLen) * Math.cos(angle - headAngle)) * ppm,
    (pos.y + (len - headLen) * Math.sin(angle - headAngle)) * ppm
  );
  ctx.moveTo(
    (pos.x + len * Math.cos(angle)) * ppm,
    (pos.y + len * Math.sin(angle)) * ppm
  );
  ctx.lineTo(
    (pos.x + (len - headLen) * Math.cos(angle + headAngle)) * ppm,
    (pos.y + (len - headLen) * Math.sin(angle + headAngle)) * ppm
  );
  ctx.stroke();
}

export function render(
  ctx: CanvasRenderingContext2D,
  gameWorld: GameWorld,
  won: boolean,
  options: RenderOptions
): void {
  const { world, vehicle, goalRegion } = gameWorld;
  const ppm = options.pixelsPerMeter;
  const canvas = ctx.canvas;

  // Clear
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  if (options.showGrid) {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    const gridSize = 1; // 1 meter grid
    for (let x = 0; x < canvas.width; x += gridSize * ppm) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize * ppm) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  // Goal region
  {
    const gAngle = goalRegion.angle ?? 0;
    ctx.save();
    ctx.translate(goalRegion.x * ppm, goalRegion.y * ppm);
    ctx.rotate(gAngle);
    ctx.fillStyle = won ? COLORS.winGoal : COLORS.goal;
    ctx.fillRect(
      (-goalRegion.width / 2) * ppm,
      (-goalRegion.height / 2) * ppm,
      goalRegion.width * ppm,
      goalRegion.height * ppm
    );
    ctx.strokeStyle = COLORS.goalBorder;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(
      (-goalRegion.width / 2) * ppm,
      (-goalRegion.height / 2) * ppm,
      goalRegion.width * ppm,
      goalRegion.height * ppm
    );
    ctx.setLineDash([]);
    ctx.restore();

    // "PARK HERE" text
    ctx.save();
    ctx.translate(goalRegion.x * ppm, goalRegion.y * ppm);
    ctx.rotate(gAngle);
    ctx.fillStyle = won ? "#166534" : "#15803d";
    ctx.font = `bold ${Math.max(12, ppm * 0.6)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(won ? "PARKED!" : "PARK HERE", 0, 0);
    ctx.restore();
  }

  // Draw all bodies from the world
  for (let body = world.getBodyList(); body; body = body.getNext()) {
    const userData = body.getUserData() as
      | { type: string; index?: number }
      | null;
    if (!userData) continue;

    const verts = getBodyVertices(body);

    switch (userData.type) {
      case "car":
        drawPolygon(ctx, verts, COLORS.car, "#1d4ed8", ppm);
        drawDirectionIndicator(ctx, body, ppm);
        break;
      case "trailer":
        drawPolygon(ctx, verts, COLORS.trailer, "#5b21b6", ppm);
        drawDirectionIndicator(ctx, body, ppm);
        break;
      case "immovable":
        drawPolygon(ctx, verts, COLORS.immovable, "#374151", ppm);
        break;
      case "movable":
        drawPolygon(ctx, verts, COLORS.movable, "#b45309", ppm);
        break;
      case "wall":
        drawPolygon(ctx, verts, COLORS.wall, "#111827", ppm);
        break;
    }
  }

  // Draw hitch connections
  ctx.strokeStyle = "#6b7280";
  ctx.lineWidth = 3;
  const carPos = vehicle.car.body.getPosition();
  const carAngle = vehicle.car.body.getAngle();

  if (vehicle.trailers.length > 0) {
    // Draw line from rear of car to first trailer joint
    const rearX = carPos.x - 2.0 * Math.cos(carAngle);
    const rearY = carPos.y - 2.0 * Math.sin(carAngle);

    const t0Pos = vehicle.trailers[0].body.getPosition();
    const t0Angle = vehicle.trailers[0].body.getAngle();
    const frontX = t0Pos.x + 1.75 * Math.cos(t0Angle);
    const frontY = t0Pos.y + 1.75 * Math.sin(t0Angle);

    ctx.beginPath();
    ctx.moveTo(rearX * ppm, rearY * ppm);
    ctx.lineTo(frontX * ppm, frontY * ppm);
    ctx.stroke();
  }

  for (let i = 1; i < vehicle.trailers.length; i++) {
    const prevPos = vehicle.trailers[i - 1].body.getPosition();
    const prevAngle = vehicle.trailers[i - 1].body.getAngle();
    const rearX = prevPos.x - 1.75 * Math.cos(prevAngle);
    const rearY = prevPos.y - 1.75 * Math.sin(prevAngle);

    const curPos = vehicle.trailers[i].body.getPosition();
    const curAngle = vehicle.trailers[i].body.getAngle();
    const frontX = curPos.x + 1.75 * Math.cos(curAngle);
    const frontY = curPos.y + 1.75 * Math.sin(curAngle);

    ctx.beginPath();
    ctx.moveTo(rearX * ppm, rearY * ppm);
    ctx.lineTo(frontX * ppm, frontY * ppm);
    ctx.stroke();
  }

  // Steering wheel indicator (top-right corner)
  {
    const steerAngle = vehicle.car.steeringAngle;
    const cx = canvas.width - 50;
    const cy = 50;
    const radius = 30;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Steering wheel position
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + radius * 0.8 * Math.sin(steerAngle * 2),
      cy - radius * 0.8 * Math.cos(steerAngle * 2)
    );
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#374151";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Steering", cx, cy + radius + 14);
  }
}

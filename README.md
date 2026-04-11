# 🚗 Parallel Parking Simulator

A lightweight web-based game built with **React**, **TypeScript**, **Vite**, and **Planck.js** (2D physics) that teaches steering concepts through parking challenges.

## Features

- **Ackermann steering** simulation for realistic car turning behavior
- **Trailers** that attach via revolute joints and realistically jackknife when reversing
- **6 levels** of increasing difficulty:
  1. Simple parallel park (no trailers)
  2. Tight squeeze parking
  3. Single trailer backup
  4. Obstacle course with trailer
  5. Double trailer challenge
  6. Triple trailer road train
- **Immovable** obstacles (walls, parked cars) and **movable** objects (cones, crates)
- **Win detection** when the car is fully inside the goal region
- Navigate to any level freely

## Controls

| Key | Action |
|-----|--------|
| ↑ / W | Drive forward |
| ↓ / S | Reverse |
| ← / A | Steer left |
| → / D | Steer right |

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Tech Stack

- **React 19** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool
- **Planck.js** — 2D physics engine (Box2D port)

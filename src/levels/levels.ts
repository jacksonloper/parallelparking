import type { LevelDef } from "../physics/types";

const levels: LevelDef[] = [
  // Level 1: Simple parallel park (no trailers)
  {
    name: "Parallel Park",
    description: "Park the car in the highlighted space. No trailers!",
    carStart: { x: 15, y: 12, angle: 0 },
    trailerCount: 0,
    bounds: { width: 30, height: 20 },
    goal: { x: 7, y: 2.5, width: 5.5, height: 2.5, angle: 0 },
    obstacles: [
      // Row of parked cars along bottom wall forming parking spaces
      { x: 2, y: 2.5, width: 4, height: 1.8, movable: false },   // parked car left
      { x: 12, y: 2.5, width: 4, height: 1.8, movable: false },   // parked car right
      // Curb on the bottom
      { x: 15, y: 0.3, width: 30, height: 0.6, movable: false },
    ],
  },

  // Level 2: Parallel park - tighter space
  {
    name: "Tight Squeeze",
    description: "A tighter parking space. Precision required!",
    carStart: { x: 18, y: 10, angle: 0 },
    trailerCount: 0,
    bounds: { width: 30, height: 20 },
    goal: { x: 8, y: 2.5, width: 5.0, height: 2.3, angle: 0 },
    obstacles: [
      { x: 2.5, y: 2.5, width: 5, height: 1.8, movable: false },
      { x: 13.5, y: 2.5, width: 5, height: 1.8, movable: false },
      { x: 15, y: 0.3, width: 30, height: 0.6, movable: false },
      // Traffic cone
      { x: 20, y: 6, width: 0.5, height: 0.5, movable: true },
      { x: 22, y: 8, width: 0.5, height: 0.5, movable: true },
    ],
  },

  // Level 3: One trailer backing
  {
    name: "Trailer Backup",
    description:
      "Back a single trailer into the bay. Watch for jackknife!",
    carStart: { x: 20, y: 15, angle: Math.PI },
    trailerCount: 1,
    bounds: { width: 35, height: 25 },
    goal: { x: 8, y: 3.5, width: 5.5, height: 3.0, angle: 0 },
    obstacles: [
      { x: 2, y: 3.5, width: 4, height: 2.5, movable: false },
      { x: 14, y: 3.5, width: 4, height: 2.5, movable: false },
      { x: 17.5, y: 0.3, width: 35, height: 0.6, movable: false },
    ],
  },

  // Level 4: Obstacle course with one trailer
  {
    name: "Obstacle Course",
    description: "Navigate around cones and barriers with a trailer.",
    carStart: { x: 5, y: 20, angle: 0 },
    trailerCount: 1,
    bounds: { width: 40, height: 25 },
    goal: { x: 35, y: 3, width: 6, height: 3, angle: 0 },
    obstacles: [
      // Walls forming a chicane
      { x: 15, y: 6, width: 1, height: 12, movable: false },
      { x: 25, y: 18, width: 1, height: 14, movable: false },
      // Cones
      { x: 10, y: 15, width: 0.5, height: 0.5, movable: true },
      { x: 20, y: 10, width: 0.5, height: 0.5, movable: true },
      { x: 30, y: 8, width: 0.5, height: 0.5, movable: true },
      // Boundary
      { x: 20, y: 0.3, width: 40, height: 0.6, movable: false },
    ],
  },

  // Level 5: Two trailers
  {
    name: "Double Trouble",
    description: "Two trailers! Good luck backing this up.",
    carStart: { x: 25, y: 18, angle: Math.PI },
    trailerCount: 2,
    bounds: { width: 40, height: 25 },
    goal: { x: 8, y: 3.5, width: 6, height: 3.5, angle: 0 },
    obstacles: [
      { x: 2, y: 3.5, width: 3, height: 3, movable: false },
      { x: 15, y: 3.5, width: 3, height: 3, movable: false },
      { x: 20, y: 0.3, width: 40, height: 0.6, movable: false },
    ],
  },

  // Level 6: Three trailers - road train
  {
    name: "Road Train",
    description: "Three trailers! The ultimate challenge.",
    carStart: { x: 35, y: 20, angle: Math.PI },
    trailerCount: 3,
    bounds: { width: 50, height: 30 },
    goal: { x: 10, y: 4, width: 7, height: 4, angle: 0 },
    obstacles: [
      { x: 3, y: 4, width: 4, height: 3, movable: false },
      { x: 18, y: 4, width: 4, height: 3, movable: false },
      { x: 25, y: 0.3, width: 50, height: 0.6, movable: false },
      // Some movable crates
      { x: 25, y: 15, width: 1.5, height: 1.5, movable: true },
      { x: 30, y: 12, width: 1.5, height: 1.5, movable: true },
    ],
  },
];

export default levels;

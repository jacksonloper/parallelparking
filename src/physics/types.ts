import type { Body, World, RevoluteJoint } from "planck-js";

export interface CarConfig {
  /** Distance between front and rear axles */
  wheelbase: number;
  /** Width of the car body */
  width: number;
  /** Length of the car body */
  length: number;
}

export interface TrailerConfig {
  /** Length of the hitch bar from pivot to trailer axle */
  hitchLength: number;
  /** Width of the trailer body */
  width: number;
  /** Length of the trailer body */
  length: number;
}

export interface CarState {
  body: Body;
  /** Current steering angle in radians */
  steeringAngle: number;
}

export interface TrailerState {
  body: Body;
  joint: RevoluteJoint;
}

export interface GameVehicle {
  car: CarState;
  trailers: TrailerState[];
}

export interface ObstacleDef {
  x: number;
  y: number;
  width: number;
  height: number;
  movable: boolean;
  angle?: number;
}

export interface GoalRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
}

export interface LevelDef {
  name: string;
  description: string;
  carStart: { x: number; y: number; angle: number };
  trailerCount: number;
  obstacles: ObstacleDef[];
  goal: GoalRegion;
  /** World bounds */
  bounds: { width: number; height: number };
}

export interface GameWorld {
  world: World;
  vehicle: GameVehicle;
  obstacles: Body[];
  goalRegion: GoalRegion;
  levelDef: LevelDef;
}

import planck from "planck-js";
import type {
  CarConfig,
  TrailerConfig,
  GameVehicle,
  GameWorld,
  LevelDef,
  ObstacleDef,
} from "./types";

const CAR_CONFIG: CarConfig = {
  wheelbase: 2.5,
  width: 1.8,
  length: 4.0,
};

const TRAILER_CONFIG: TrailerConfig = {
  hitchLength: 3.0,
  width: 1.8,
  length: 3.5,
};

const MAX_STEER_ANGLE = Math.PI / 4; // 45 degrees

/**
 * Create the car body in the physics world.
 */
function createCar(
  world: planck.World,
  x: number,
  y: number,
  angle: number
): planck.Body {
  const body = world.createDynamicBody({
    position: planck.Vec2(x, y),
    angle,
    linearDamping: 3.0,
    angularDamping: 5.0,
  });

  body.createFixture(
    planck.Box(CAR_CONFIG.length / 2, CAR_CONFIG.width / 2),
    {
      density: 1.0,
      friction: 0.3,
      restitution: 0.1,
    }
  );

  body.setUserData({ type: "car" });

  return body;
}

/**
 * Create a trailer body and attach it via a revolute joint.
 */
function createTrailer(
  world: planck.World,
  parentBody: planck.Body,
  _parentConfig: { length: number },
  index: number
): { body: planck.Body; joint: planck.RevoluteJoint } {
  const parentPos = parentBody.getPosition();
  const parentAngle = parentBody.getAngle();

  // Hitch point is at the back of the parent
  const hitchOffsetX = index === 0 ? -CAR_CONFIG.length / 2 : -TRAILER_CONFIG.length / 2;
  const hitchWorldX =
    parentPos.x + hitchOffsetX * Math.cos(parentAngle);
  const hitchWorldY =
    parentPos.y + hitchOffsetX * Math.sin(parentAngle);

  // Trailer center is behind the hitch point
  const trailerCenterX =
    hitchWorldX - (TRAILER_CONFIG.length / 2) * Math.cos(parentAngle);
  const trailerCenterY =
    hitchWorldY - (TRAILER_CONFIG.length / 2) * Math.sin(parentAngle);

  const body = world.createDynamicBody({
    position: planck.Vec2(trailerCenterX, trailerCenterY),
    angle: parentAngle,
    linearDamping: 3.0,
    angularDamping: 5.0,
  });

  body.createFixture(
    planck.Box(TRAILER_CONFIG.length / 2, TRAILER_CONFIG.width / 2),
    {
      density: 0.8,
      friction: 0.3,
      restitution: 0.1,
    }
  );

  body.setUserData({ type: "trailer", index });

  // Joint at the hitch point
  const anchorWorld = planck.Vec2(hitchWorldX, hitchWorldY);
  const joint = world.createJoint(
    planck.RevoluteJoint(
      {
        collideConnected: false,
      },
      parentBody,
      body,
      anchorWorld
    )
  ) as planck.RevoluteJoint;

  return { body, joint };
}

/**
 * Create an obstacle (wall, barrier, etc).
 */
function createObstacle(
  world: planck.World,
  def: ObstacleDef
): planck.Body {
  const bodyDef = def.movable
    ? {
        type: "dynamic" as const,
        position: planck.Vec2(def.x, def.y),
        angle: def.angle ?? 0,
        linearDamping: 5.0,
        angularDamping: 5.0,
      }
    : {
        type: "static" as const,
        position: planck.Vec2(def.x, def.y),
        angle: def.angle ?? 0,
      };

  const body = world.createBody(bodyDef);

  body.createFixture(planck.Box(def.width / 2, def.height / 2), {
    density: def.movable ? 2.0 : 0,
    friction: 0.5,
    restitution: 0.2,
  });

  body.setUserData({
    type: def.movable ? "movable" : "immovable",
  });

  return body;
}

/**
 * Create boundary walls around the world.
 */
function createBoundaries(
  world: planck.World,
  width: number,
  height: number
): planck.Body[] {
  const walls: planck.Body[] = [];
  const thickness = 0.5;

  const wallDefs: { x: number; y: number; w: number; h: number }[] = [
    { x: width / 2, y: -thickness / 2, w: width / 2, h: thickness / 2 }, // bottom
    { x: width / 2, y: height + thickness / 2, w: width / 2, h: thickness / 2 }, // top
    { x: -thickness / 2, y: height / 2, w: thickness / 2, h: height / 2 }, // left
    { x: width + thickness / 2, y: height / 2, w: thickness / 2, h: height / 2 }, // right
  ];

  for (const w of wallDefs) {
    const body = world.createBody({
      type: "static",
      position: planck.Vec2(w.x, w.y),
    });
    body.createFixture(planck.Box(w.w, w.h), {
      friction: 0.5,
    });
    body.setUserData({ type: "wall" });
    walls.push(body);
  }

  return walls;
}

/**
 * Set up the full game world for a level.
 */
export function createGameWorld(level: LevelDef): GameWorld {
  const world = planck.World({
    gravity: planck.Vec2(0, 0), // top-down view, no gravity
  });

  // Boundaries
  const wallBodies = createBoundaries(world, level.bounds.width, level.bounds.height);

  // Car
  const carBody = createCar(
    world,
    level.carStart.x,
    level.carStart.y,
    level.carStart.angle
  );

  // Trailers
  const trailers: { body: planck.Body; joint: planck.RevoluteJoint }[] = [];
  let prevBody = carBody;
  let prevConfig = { length: CAR_CONFIG.length };

  for (let i = 0; i < level.trailerCount; i++) {
    const trailer = createTrailer(world, prevBody, prevConfig, i);
    trailers.push(trailer);
    prevBody = trailer.body;
    prevConfig = { length: TRAILER_CONFIG.length };
  }

  // Obstacles
  const obstacles: planck.Body[] = [...wallBodies];
  for (const obsDef of level.obstacles) {
    obstacles.push(createObstacle(world, obsDef));
  }

  const vehicle: GameVehicle = {
    car: {
      body: carBody,
      steeringAngle: 0,
    },
    trailers,
  };

  return {
    world,
    vehicle,
    obstacles,
    goalRegion: level.goal,
    levelDef: level,
  };
}

/**
 * Apply Ackermann-style steering: set the velocity of the car
 * based on steering angle and throttle.
 */
export function applyDrive(
  vehicle: GameVehicle,
  throttle: number, // positive = forward, negative = reverse
  steeringInput: number // -1 to 1
): void {
  const car = vehicle.car;
  car.steeringAngle = steeringInput * MAX_STEER_ANGLE;

  const body = car.body;
  const angle = body.getAngle();
  const speed = throttle * 8.0; // max speed

  if (Math.abs(throttle) < 0.01) {
    // Apply extra damping when not driving
    body.setLinearVelocity(planck.Vec2(0, 0));
    body.setAngularVelocity(0);
    return;
  }

  // Ackermann steering: turning radius = wheelbase / tan(steeringAngle)
  const steerAngle = car.steeringAngle;

  if (Math.abs(steerAngle) < 0.001) {
    // Straight driving
    const vx = speed * Math.cos(angle);
    const vy = speed * Math.sin(angle);
    body.setLinearVelocity(planck.Vec2(vx, vy));
    body.setAngularVelocity(0);
  } else {
    // Curved driving
    const turningRadius = CAR_CONFIG.wheelbase / Math.tan(steerAngle);
    const angularVel = -speed / turningRadius;

    const vx = speed * Math.cos(angle);
    const vy = speed * Math.sin(angle);
    body.setLinearVelocity(planck.Vec2(vx, vy));
    body.setAngularVelocity(angularVel);
  }
}

/**
 * Kill lateral velocity on trailers to simulate tire friction
 * (they resist sliding sideways).
 */
export function applyLateralFriction(vehicle: GameVehicle): void {
  // Apply to car
  killLateralVelocity(vehicle.car.body, 0.9);

  // Apply to trailers
  for (const trailer of vehicle.trailers) {
    killLateralVelocity(trailer.body, 0.85);
  }
}

function killLateralVelocity(body: planck.Body, factor: number): void {
  const vel = body.getLinearVelocity();
  const angle = body.getAngle();

  // Forward direction
  const forwardX = Math.cos(angle);
  const forwardY = Math.sin(angle);

  // Project velocity onto forward direction
  const forwardSpeed = vel.x * forwardX + vel.y * forwardY;

  // Lateral component
  const lateralX = vel.x - forwardSpeed * forwardX;
  const lateralY = vel.y - forwardSpeed * forwardY;

  // Kill lateral velocity
  body.setLinearVelocity(
    planck.Vec2(
      vel.x - lateralX * factor,
      vel.y - lateralY * factor
    )
  );
}

/**
 * Check if the car body is entirely within the goal region.
 */
export function checkWin(gameWorld: GameWorld): boolean {
  const car = gameWorld.vehicle.car.body;
  const goal = gameWorld.goalRegion;
  const goalAngle = goal.angle ?? 0;

  const pos = car.getPosition();

  // Get car corners in world space
  const carAngle = car.getAngle();
  const hw = CAR_CONFIG.length / 2;
  const hh = CAR_CONFIG.width / 2;

  const corners = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];

  // Transform to world coords, then to goal-local coords
  const goalCos = Math.cos(-goalAngle);
  const goalSin = Math.sin(-goalAngle);

  for (const c of corners) {
    // Rotate by car angle
    const wx = pos.x + c.x * Math.cos(carAngle) - c.y * Math.sin(carAngle);
    const wy = pos.y + c.x * Math.sin(carAngle) + c.y * Math.cos(carAngle);

    // Transform to goal-local coords
    const dx = wx - goal.x;
    const dy = wy - goal.y;
    const lx = dx * goalCos - dy * goalSin;
    const ly = dx * goalSin + dy * goalCos;

    if (
      Math.abs(lx) > goal.width / 2 ||
      Math.abs(ly) > goal.height / 2
    ) {
      return false;
    }
  }

  return true;
}

export function stepWorld(gameWorld: GameWorld): void {
  applyLateralFriction(gameWorld.vehicle);
  gameWorld.world.step(1 / 60);
}

export { CAR_CONFIG, TRAILER_CONFIG, MAX_STEER_ANGLE };

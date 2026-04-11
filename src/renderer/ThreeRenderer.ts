import * as THREE from "three";
import type { GameWorld } from "../physics/types";
import type { Body } from "planck-js";

const COLORS = {
  car: 0x2563eb,
  trailer: 0x7c3aed,
  immovable: 0x4b5563,
  movable: 0xd97706,
  wall: 0x1f2937,
  goal: 0x22c55e,
  background: 0xe5e7eb,
  grid: 0xd1d5db,
  winGoal: 0x22c55e,
  hitch: 0x6b7280,
  directionArrow: 0xffffff,
  steeringRing: 0x374151,
  steeringNeedle: 0xef4444,
};

interface BodyMesh {
  mesh: THREE.Mesh;
  body: Body;
}

export class ThreeRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private bodyMeshes: BodyMesh[] = [];
  private goalMesh: THREE.Mesh | null = null;
  private goalOutline: THREE.LineLoop | null = null;
  private goalLabel: THREE.Sprite | null = null;
  private hitchLines: THREE.Line[] = [];
  private directionArrows: THREE.Line[] = [];
  private gridGroup: THREE.Group | null = null;

  // HUD (rendered in a separate overlay scene with a fixed camera)
  private hudScene: THREE.Scene;
  private hudCamera: THREE.OrthographicCamera;
  private steeringRing: THREE.LineLoop | null = null;
  private steeringNeedle: THREE.Line | null = null;

  private zoom = 1;
  private readonly MIN_ZOOM = 0.3;
  private readonly MAX_ZOOM = 5;
  private readonly BASE_VIEW = 15; // meters visible at zoom=1

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.borderRadius = "8px";
    this.renderer.domElement.style.touchAction = "none";
    this.renderer.domElement.setAttribute("data-testid", "game-canvas");
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.background);

    // Main orthographic camera (world coords)
    const aspect = container.clientWidth / container.clientHeight;
    const viewH = this.BASE_VIEW / this.zoom;
    const viewW = viewH * aspect;
    this.camera = new THREE.OrthographicCamera(
      -viewW / 2, viewW / 2, viewH / 2, -viewH / 2, 0.1, 100
    );
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);

    // HUD scene + camera (screen pixels)
    this.hudScene = new THREE.Scene();
    this.hudCamera = new THREE.OrthographicCamera(
      0, container.clientWidth, container.clientHeight, 0, 0.1, 100
    );
    this.hudCamera.position.set(0, 0, 10);
    this.hudCamera.lookAt(0, 0, 0);

    this.setupZoomHandlers(container);
  }

  get domElement(): HTMLElement {
    return this.renderer.domElement;
  }

  /* ---- Zoom ---- */

  private setupZoomHandlers(container: HTMLElement): void {
    // Mouse wheel
    container.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.zoom * delta));
    }, { passive: false });

    // Pinch
    let lastPinchDist = 0;
    container.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });
    container.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastPinchDist > 0) {
          const scale = dist / lastPinchDist;
          this.zoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.zoom * scale));
        }
        lastPinchDist = dist;
      }
    }, { passive: true });
    container.addEventListener("touchend", () => { lastPinchDist = 0; }, { passive: true });
  }

  /* ---- Scene setup ---- */

  setupScene(gameWorld: GameWorld): void {
    this.clearScene();

    // Grid
    this.gridGroup = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({ color: COLORS.grid });
    const bounds = gameWorld.levelDef.bounds;
    for (let x = 0; x <= bounds.width; x++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, 0),
        new THREE.Vector3(x, bounds.height, 0),
      ]);
      this.gridGroup.add(new THREE.Line(geo, gridMat));
    }
    for (let y = 0; y <= bounds.height; y++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, y, 0),
        new THREE.Vector3(bounds.width, y, 0),
      ]);
      this.gridGroup.add(new THREE.Line(geo, gridMat));
    }
    this.scene.add(this.gridGroup);

    // Goal region
    this.createGoalMesh(gameWorld);

    // Create meshes for all physics bodies
    for (let body = gameWorld.world.getBodyList(); body; body = body.getNext()) {
      const userData = body.getUserData() as { type: string; index?: number } | null;
      if (!userData) continue;

      const verts = this.getBodyLocalVerts(body);
      if (verts.length < 3) continue;

      let color: number;
      switch (userData.type) {
        case "car": color = COLORS.car; break;
        case "trailer": color = COLORS.trailer; break;
        case "immovable": color = COLORS.immovable; break;
        case "movable": color = COLORS.movable; break;
        case "wall": color = COLORS.wall; break;
        default: color = 0x888888;
      }

      const shape = new THREE.Shape(verts.map(v => new THREE.Vector2(v.x, v.y)));
      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = 1; // above grid & goal
      this.scene.add(mesh);
      this.bodyMeshes.push({ mesh, body });

      // Direction arrows for car and trailers
      if (userData.type === "car" || userData.type === "trailer") {
        const arrowGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(1.5, 0, 0),
        ]);
        const arrowMat = new THREE.LineBasicMaterial({ color: COLORS.directionArrow, linewidth: 2 });
        const arrowLine = new THREE.Line(arrowGeo, arrowMat);
        arrowLine.position.z = 2;
        this.scene.add(arrowLine);
        this.directionArrows.push(arrowLine);
      }
    }

    // Steering HUD
    this.createSteeringHUD();
  }

  private createGoalMesh(gameWorld: GameWorld): void {
    const goal = gameWorld.goalRegion;
    const goalGeo = new THREE.PlaneGeometry(goal.width, goal.height);
    const goalMat = new THREE.MeshBasicMaterial({
      color: COLORS.goal,
      transparent: true,
      opacity: 0.3,
    });
    this.goalMesh = new THREE.Mesh(goalGeo, goalMat);
    this.goalMesh.position.set(goal.x, goal.y, 0.5);
    this.goalMesh.rotation.z = goal.angle ?? 0;
    this.scene.add(this.goalMesh);

    // Dashed outline
    const outlineShape = [
      new THREE.Vector3(-goal.width / 2, -goal.height / 2, 0),
      new THREE.Vector3(goal.width / 2, -goal.height / 2, 0),
      new THREE.Vector3(goal.width / 2, goal.height / 2, 0),
      new THREE.Vector3(-goal.width / 2, goal.height / 2, 0),
    ];
    const outlineGeo = new THREE.BufferGeometry().setFromPoints(outlineShape);
    const outlineMat = new THREE.LineDashedMaterial({
      color: COLORS.goal,
      dashSize: 0.3,
      gapSize: 0.15,
    });
    this.goalOutline = new THREE.LineLoop(outlineGeo, outlineMat);
    this.goalOutline.computeLineDistances();
    this.goalOutline.position.set(goal.x, goal.y, 0.6);
    this.goalOutline.rotation.z = goal.angle ?? 0;
    this.scene.add(this.goalOutline);

    // "PARK HERE" label as sprite
    this.goalLabel = this.createTextSprite("PARK HERE", "#15803d");
    this.goalLabel.position.set(goal.x, goal.y, 0.7);
    this.goalLabel.scale.set(goal.width * 0.8, goal.height * 0.3, 1);
    this.scene.add(this.goalLabel);
  }

  private createTextSprite(text: string, color: string): THREE.Sprite {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    return new THREE.Sprite(mat);
  }

  private createSteeringHUD(): void {
    // Ring
    const ringGeo = new THREE.BufferGeometry();
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 30, Math.sin(a) * 30, 0));
    }
    ringGeo.setFromPoints(pts);
    const ringMat = new THREE.LineBasicMaterial({ color: COLORS.steeringRing });
    this.steeringRing = new THREE.LineLoop(ringGeo, ringMat);
    this.steeringRing.position.set(0, 0, 5); // placeholder, updated in render
    this.hudScene.add(this.steeringRing);

    // Needle
    const needleGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 24, 0),
    ]);
    const needleMat = new THREE.LineBasicMaterial({ color: COLORS.steeringNeedle });
    this.steeringNeedle = new THREE.Line(needleGeo, needleMat);
    this.steeringNeedle.position.set(0, 0, 5);
    this.hudScene.add(this.steeringNeedle);
  }

  /* ---- Frame update ---- */

  render(gameWorld: GameWorld, won: boolean): void {
    const car = gameWorld.vehicle.car;
    const carPos = car.body.getPosition();

    // Update camera to follow car
    this.updateCamera(carPos.x, carPos.y);

    // Update goal appearance
    if (this.goalMesh) {
      const mat = this.goalMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = won ? 0.6 : 0.3;
    }
    if (this.goalLabel) {
      const canvas = (this.goalLabel.material as THREE.SpriteMaterial).map!.image as HTMLCanvasElement;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, 256, 64);
      ctx.fillStyle = won ? "#166534" : "#15803d";
      ctx.font = "bold 36px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(won ? "PARKED!" : "PARK HERE", 128, 32);
      ((this.goalLabel.material as THREE.SpriteMaterial).map as THREE.CanvasTexture).needsUpdate = true;
    }

    // Update body meshes
    let arrowIdx = 0;
    for (const bm of this.bodyMeshes) {
      const pos = bm.body.getPosition();
      const angle = bm.body.getAngle();
      bm.mesh.position.set(pos.x, pos.y, bm.mesh.position.z);
      bm.mesh.rotation.z = angle;

      const userData = bm.body.getUserData() as { type: string } | null;
      if (userData && (userData.type === "car" || userData.type === "trailer")) {
        if (arrowIdx < this.directionArrows.length) {
          const arrow = this.directionArrows[arrowIdx];
          arrow.position.set(pos.x, pos.y, 2);
          arrow.rotation.z = angle;
          arrowIdx++;
        }
      }
    }

    // Hitch lines
    this.updateHitchLines(gameWorld);

    // Steering HUD
    this.updateSteeringHUD(car.steeringAngle);

    // Render
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.render(this.hudScene, this.hudCamera);
  }

  private updateCamera(cx: number, cy: number): void {
    const el = this.renderer.domElement;
    const aspect = el.clientWidth / el.clientHeight;
    const viewH = this.BASE_VIEW / this.zoom;
    const viewW = viewH * aspect;

    this.camera.left = -viewW / 2;
    this.camera.right = viewW / 2;
    this.camera.top = viewH / 2;
    this.camera.bottom = -viewH / 2;
    this.camera.position.set(cx, cy, 10);
    this.camera.updateProjectionMatrix();
  }

  private updateHitchLines(gameWorld: GameWorld): void {
    // Remove old lines
    for (const line of this.hitchLines) {
      this.scene.remove(line);
      line.geometry.dispose();
    }
    this.hitchLines = [];

    const vehicle = gameWorld.vehicle;
    const mat = new THREE.LineBasicMaterial({ color: COLORS.hitch });
    const carPos = vehicle.car.body.getPosition();
    const carAngle = vehicle.car.body.getAngle();

    if (vehicle.trailers.length > 0) {
      const rearX = carPos.x - 2.0 * Math.cos(carAngle);
      const rearY = carPos.y - 2.0 * Math.sin(carAngle);

      const t0Pos = vehicle.trailers[0].body.getPosition();
      const t0Angle = vehicle.trailers[0].body.getAngle();
      const frontX = t0Pos.x + 1.75 * Math.cos(t0Angle);
      const frontY = t0Pos.y + 1.75 * Math.sin(t0Angle);

      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(rearX, rearY, 1.5),
        new THREE.Vector3(frontX, frontY, 1.5),
      ]);
      const line = new THREE.Line(geo, mat);
      this.scene.add(line);
      this.hitchLines.push(line);
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

      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(rearX, rearY, 1.5),
        new THREE.Vector3(frontX, frontY, 1.5),
      ]);
      const line = new THREE.Line(geo, mat);
      this.scene.add(line);
      this.hitchLines.push(line);
    }
  }

  private updateSteeringHUD(steeringAngle: number): void {
    const el = this.renderer.domElement;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const cx = w - 50;
    const cy = h - 50;

    // Update HUD camera to match screen size
    this.hudCamera.right = w;
    this.hudCamera.top = h;
    this.hudCamera.updateProjectionMatrix();

    if (this.steeringRing) {
      this.steeringRing.position.set(cx, cy, 5);
    }
    if (this.steeringNeedle) {
      this.steeringNeedle.position.set(cx, cy, 5);
      this.steeringNeedle.rotation.z = -steeringAngle * 2;
    }
  }

  /* ---- Resize ---- */

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    // Camera updated in render() via updateCamera()
  }

  /* ---- Helpers ---- */

  private getBodyLocalVerts(body: Body): { x: number; y: number }[] {
    const fixture = body.getFixtureList();
    if (!fixture) return [];
    const shape = fixture.getShape() as { m_vertices?: { x: number; y: number }[] };
    if (!shape.m_vertices) return [];
    return shape.m_vertices.map((v: { x: number; y: number }) => ({ x: v.x, y: v.y }));
  }

  private clearScene(): void {
    // Dispose all children of scenes
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      this.scene.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    while (this.hudScene.children.length > 0) {
      const child = this.hudScene.children[0];
      this.hudScene.remove(child);
    }
    this.bodyMeshes = [];
    this.goalMesh = null;
    this.goalOutline = null;
    this.goalLabel = null;
    this.hitchLines = [];
    this.directionArrows = [];
    this.gridGroup = null;
    this.steeringRing = null;
    this.steeringNeedle = null;
  }

  dispose(): void {
    this.clearScene();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

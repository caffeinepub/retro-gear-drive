import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSubmitScore } from "../hooks/useQueries";

interface GamePageProps {
  onExit: (score: bigint) => void;
}

// ---- INDIAN CAR DEFINITIONS ----
interface CarDef {
  id: string;
  name: string;
  brand: string;
  color: string;
  roofColor: string;
  maxSpeed: number; // km/h at gear 5
  accelMult: number; // multiplier on accel force
  handling: number; // steer speed px/s
  durability: number; // max health
  w: number;
  h: number;
  isBike?: boolean;
  description: string;
}

const INDIAN_CARS: CarDef[] = [
  {
    id: "swift",
    name: "Swift",
    brand: "Maruti Suzuki",
    color: "#C0392B",
    roofColor: "#E74C3C",
    maxSpeed: 180,
    accelMult: 1.4,
    handling: 200,
    durability: 60,
    w: 28,
    h: 48,
    description: "Light & fast. Low durability but great acceleration.",
  },
  {
    id: "nexon",
    name: "Nexon",
    brand: "Tata",
    color: "#1A3A6E",
    roofColor: "#2255A4",
    maxSpeed: 160,
    accelMult: 1.0,
    handling: 160,
    durability: 100,
    w: 34,
    h: 54,
    description: "Balanced SUV. Good all-rounder for beginners.",
  },
  {
    id: "thar",
    name: "Thar",
    brand: "Mahindra",
    color: "#4A5A2A",
    roofColor: "#5D7035",
    maxSpeed: 140,
    accelMult: 0.8,
    handling: 130,
    durability: 150,
    w: 36,
    h: 56,
    description: "Tough off-roader. Slow but can take many hits.",
  },
  {
    id: "creta",
    name: "Creta",
    brand: "Hyundai",
    color: "#D0D0D0",
    roofColor: "#F0F0F0",
    maxSpeed: 165,
    accelMult: 1.1,
    handling: 185,
    durability: 90,
    w: 33,
    h: 52,
    description: "Smooth handling SUV. Great for tight maneuvers.",
  },
  {
    id: "enfield",
    name: "Bullet 350",
    brand: "Royal Enfield",
    color: "#C05000",
    roofColor: "#E06010",
    maxSpeed: 200,
    accelMult: 1.6,
    handling: 220,
    durability: 40,
    w: 16,
    h: 56,
    isBike: true,
    description: "Bike mode! Ultra fast and nimble but very fragile.",
  },
];

// ---- GAME CONSTANTS ----
const CANVAS_W = 800;
const CANVAS_H = 600;
const HUD_H = 150;
const GAME_H = CANVAS_H - HUD_H;
const ROAD_W = 220;
const ROAD_X = (CANVAS_W - ROAD_W) / 2;
const PLAYER_Y_BASE = GAME_H - 100;

// Gear configs
const GEAR_RPM_RANGES: Record<number, [number, number]> = {
  1: [1000, 3500],
  2: [1500, 4000],
  3: [2000, 5000],
  4: [2500, 5500],
  5: [3000, 6000],
};
const BASE_GEAR_MAX_SPEED: Record<number, number> = {
  0: 0,
  1: 30,
  2: 60,
  3: 95,
  4: 140,
  5: 200,
};

const STALL_RPM = 800;
const IDLE_RPM = 950;
const HEALTH_REGEN_RATE = 2; // % per second
const COLLISION_DAMAGE = 25; // % per collision
const COLLISION_COOLDOWN = 0.8; // seconds between damage ticks

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  bodyColor: string;
  speed: number;
  label: string;
}

interface GameState {
  // Engine
  engineOn: boolean;
  stalled: boolean;
  rpm: number;

  // Transmission
  gear: number;
  clutchPressed: boolean;

  // Movement
  speed: number;
  distance: number;

  // Car
  carX: number;
  carTilt: number;
  carW: number;
  carH: number;

  // Health
  health: number; // 0-100
  maxHealth: number;
  collisionCooldown: number;
  isColliding: boolean;
  repairPulse: number; // 0-1 animation

  // Road
  roadOffset: number;
  dashOffset: number;

  // Obstacles
  obstacles: Obstacle[];
  obstacleTimer: number;

  // Input
  keys: Set<string>;

  // Status
  gameOver: boolean;
  gameOverReason: string;
  statusMsg: string;
  statusTimer: number;

  // Shift hints
  shiftNowTimer: number;

  // Selected car
  car: CarDef;
  gearMaxSpeed: Record<number, number>;
}

const INDIAN_OBSTACLE_TYPES = [
  { label: "Alto", color: "#555", bodyColor: "#444", w: 26, h: 44 },
  { label: "Innova", color: "#445566", bodyColor: "#334455", w: 32, h: 52 },
  { label: "Bus", color: "#664400", bodyColor: "#553300", w: 36, h: 70 },
  { label: "Auto", color: "#FFAA00", bodyColor: "#DD8800", w: 24, h: 38 },
];

function createObstacle(speed: number): Obstacle {
  const t =
    INDIAN_OBSTACLE_TYPES[
      Math.floor(Math.random() * INDIAN_OBSTACLE_TYPES.length)
    ];
  const lane = Math.random() < 0.5 ? 0 : 1;
  const x = ROAD_X + 10 + lane * (ROAD_W / 2 - 14);
  return {
    x,
    y: -80,
    w: t.w,
    h: t.h,
    color: t.color,
    bodyColor: t.bodyColor,
    speed,
    label: t.label,
  };
}

function buildGearMaxSpeed(car: CarDef): Record<number, number> {
  const ratio = car.maxSpeed / 200;
  return {
    0: 0,
    1: Math.round(BASE_GEAR_MAX_SPEED[1] * ratio),
    2: Math.round(BASE_GEAR_MAX_SPEED[2] * ratio),
    3: Math.round(BASE_GEAR_MAX_SPEED[3] * ratio),
    4: Math.round(BASE_GEAR_MAX_SPEED[4] * ratio),
    5: car.maxSpeed,
  };
}

function initState(car: CarDef): GameState {
  return {
    engineOn: false,
    stalled: true,
    rpm: 0,
    gear: 0,
    clutchPressed: false,
    speed: 0,
    distance: 0,
    carX: CANVAS_W / 2 - car.w / 2,
    carTilt: 0,
    carW: car.w,
    carH: car.h,
    health: car.durability,
    maxHealth: car.durability,
    collisionCooldown: 0,
    isColliding: false,
    repairPulse: 0,
    roadOffset: 0,
    dashOffset: 0,
    obstacles: [],
    obstacleTimer: 3,
    keys: new Set(),
    gameOver: false,
    gameOverReason: "",
    statusMsg: "",
    statusTimer: 0,
    shiftNowTimer: 0,
    car,
    gearMaxSpeed: buildGearMaxSpeed(car),
  };
}

// ---- DRAWING HELPERS ----
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawGauge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  value: number,
  maxVal: number,
  label: string,
  valueStr: string,
  redZoneStart?: number,
) {
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const sweep = endAngle - startAngle;
  const pct = Math.min(value / maxVal, 1);

  ctx.strokeStyle = "#2B3645";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.stroke();

  if (redZoneStart !== undefined) {
    const redStart = startAngle + sweep * (redZoneStart / maxVal);
    ctx.strokeStyle = "rgba(200,50,50,0.4)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, redStart, endAngle);
    ctx.stroke();
  }

  const valEnd = startAngle + sweep * pct;
  const isRed = redZoneStart !== undefined && value > redZoneStart;
  ctx.strokeStyle = isRed ? "#E04040" : "#C56A2C";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, valEnd);
  ctx.stroke();

  const needleAngle = startAngle + sweep * pct;
  const nx = cx + Math.cos(needleAngle) * (radius - 4);
  const ny = cy + Math.sin(needleAngle) * (radius - 4);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(nx, ny);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#C56A2C";
  ctx.font = "bold 9px 'Bricolage Grotesque', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, cy + radius + 14);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px 'Bricolage Grotesque', sans-serif";
  ctx.fillText(valueStr, cx, cy + 6);
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  roofColor: string,
  bodyColor: string,
  tilt = 0,
  isBike = false,
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (tilt !== 0) ctx.rotate(tilt * 0.06);
  ctx.translate(-w / 2, -h / 2);

  if (isBike) {
    // Bike shape
    ctx.fillStyle = bodyColor;
    drawRoundRect(ctx, w * 0.2, h * 0.1, w * 0.6, h * 0.8, 3);
    ctx.fillStyle = roofColor;
    drawRoundRect(ctx, 0, h * 0.2, w, h * 0.2, 2);
    // Wheels
    ctx.fillStyle = "#111";
    drawRoundRect(ctx, w * 0.1, h * 0.0, w * 0.8, h * 0.18, 3);
    drawRoundRect(ctx, w * 0.1, h * 0.82, w * 0.8, h * 0.18, 3);
    // Exhaust
    ctx.fillStyle = "#888";
    drawRoundRect(ctx, w * 0.6, h * 0.55, w * 0.5, h * 0.08, 2);
  } else {
    // Car body
    ctx.fillStyle = bodyColor;
    drawRoundRect(ctx, 0, h * 0.3, w, h * 0.7, 4);
    // Roof
    ctx.fillStyle = roofColor;
    drawRoundRect(ctx, w * 0.12, 0, w * 0.76, h * 0.42, 3);
    // Windshield
    ctx.fillStyle = "rgba(135,206,235,0.55)";
    drawRoundRect(ctx, w * 0.15, h * 0.08, w * 0.7, h * 0.25, 2);
    // Rear window
    ctx.fillStyle = "rgba(100,160,200,0.35)";
    drawRoundRect(ctx, w * 0.15, h * 0.32, w * 0.7, h * 0.12, 2);
    // Wheels
    const ww = w * 0.22;
    const wh = h * 0.2;
    ctx.fillStyle = "#111";
    drawRoundRect(ctx, -ww * 0.4, h * 0.32, ww, wh, 2);
    drawRoundRect(ctx, w - ww * 0.6, h * 0.32, ww, wh, 2);
    drawRoundRect(ctx, -ww * 0.4, h * 0.72, ww, wh, 2);
    drawRoundRect(ctx, w - ww * 0.6, h * 0.72, ww, wh, 2);
    // Headlights
    ctx.fillStyle = "#FFEE88";
    drawRoundRect(ctx, w * 0.1, h - 8, w * 0.28, 6, 1);
    drawRoundRect(ctx, w * 0.62, h - 8, w * 0.28, 6, 1);
  }

  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle) {
  drawCar(ctx, o.x, o.y, o.w, o.h, o.color, o.bodyColor);
  // Label
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "bold 8px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 3);
}

function gameUpdate(state: GameState, dt: number): GameState {
  if (state.gameOver) return state;

  const s = { ...state };
  const keys = s.keys;

  const accelerate = keys.has("KeyW") || keys.has("ArrowUp");
  const brake = keys.has("KeyS") || keys.has("ArrowDown");
  const steerLeft = keys.has("KeyA") || keys.has("ArrowLeft");
  const steerRight = keys.has("KeyD") || keys.has("ArrowRight");
  s.clutchPressed =
    keys.has("ShiftLeft") || keys.has("ShiftRight") || keys.has("KeyC");

  if ((keys.has("Enter") || keys.has("Space")) && s.stalled) {
    s.engineOn = true;
    s.stalled = false;
    s.rpm = IDLE_RPM;
    s.statusMsg = "ENGINE STARTED!";
    s.statusTimer = 2;
  }

  if (!s.engineOn) return s;

  if (!s.stalled) {
    if (s.clutchPressed) {
      if (accelerate) {
        s.rpm = Math.min(s.rpm + 2200 * dt, 7000);
      } else {
        s.rpm = Math.max(s.rpm - 1500 * dt, IDLE_RPM);
      }
    } else if (s.gear === 0) {
      if (accelerate) {
        s.rpm = Math.min(s.rpm + 1800 * dt, 5000);
      } else {
        s.rpm = Math.max(s.rpm - 1200 * dt, IDLE_RPM);
      }
    } else {
      const [rpmMin, rpmMax] = GEAR_RPM_RANGES[s.gear];
      const speedPct = s.speed / s.gearMaxSpeed[s.gear];
      const targetRpm = rpmMin + (rpmMax - rpmMin) * speedPct;

      if (accelerate) {
        s.rpm = Math.min(s.rpm + 1800 * dt, 7000);
      } else {
        s.rpm += (targetRpm - s.rpm) * Math.min(dt * 3, 1);
        if (!brake) s.rpm = Math.max(s.rpm - 400 * dt, IDLE_RPM);
      }

      if (s.rpm < STALL_RPM && s.gear > 0) {
        s.stalled = true;
        s.engineOn = false;
        s.rpm = 0;
        s.speed = 0;
      }
    }
  }

  const accelMult = s.car.accelMult;
  const steerSpeed = s.car.handling;

  if (!s.stalled && s.gear > 0 && !s.clutchPressed) {
    const [rpmMin, rpmMax] = GEAR_RPM_RANGES[s.gear];
    const maxS = s.gearMaxSpeed[s.gear];
    const rpmPct = Math.max(0, (s.rpm - rpmMin) / (rpmMax - rpmMin));

    if (accelerate) {
      const accelForce = rpmPct * 35 * accelMult * dt;
      s.speed = Math.min(s.speed + accelForce, maxS);
    } else if (brake) {
      s.speed = Math.max(0, s.speed - 55 * dt);
    } else {
      s.speed = Math.max(0, s.speed - 12 * dt);
    }
  } else if (brake && s.speed > 0) {
    s.speed = Math.max(0, s.speed - 55 * dt);
  } else if (!accelerate || s.clutchPressed) {
    s.speed = Math.max(0, s.speed - 12 * dt);
  }

  const minX = ROAD_X + 6;
  const maxX = ROAD_X + ROAD_W - s.carW - 6;
  if (steerLeft) {
    s.carX = Math.max(minX, s.carX - steerSpeed * dt);
    s.carTilt = -1;
  } else if (steerRight) {
    s.carX = Math.min(maxX, s.carX + steerSpeed * dt);
    s.carTilt = 1;
  } else {
    s.carTilt = 0;
  }

  s.distance += (s.speed / 3.6) * dt;

  const scrollSpeed = (s.speed / 3.6) * 0.8;
  s.roadOffset = (s.roadOffset + scrollSpeed * dt * 60) % 60;
  s.dashOffset = (s.dashOffset + scrollSpeed * dt * 60) % 100;

  s.obstacleTimer -= dt;
  const spawnInterval = Math.max(1.2, 4 - s.distance / 400);
  if (s.obstacleTimer <= 0 && s.speed > 5) {
    s.obstacles = [...s.obstacles, createObstacle(s.speed * 0.3)];
    s.obstacleTimer = spawnInterval + Math.random() * 1.5;
  }

  const relSpeed = scrollSpeed * dt * 60;
  s.obstacles = s.obstacles
    .map((o) => ({ ...o, y: o.y + relSpeed + o.speed * dt * 10 }))
    .filter((o) => o.y < GAME_H + 80);

  // Collision detection with health system
  const playerY = PLAYER_Y_BASE;
  const px = s.carX;
  const py = playerY;
  const pw = s.carW;
  const ph = s.carH;

  let colliding = false;
  if (s.collisionCooldown > 0) s.collisionCooldown -= dt;

  for (const o of s.obstacles) {
    if (
      px < o.x + o.w - 4 &&
      px + pw - 4 > o.x &&
      py < o.y + o.h - 4 &&
      py + ph - 4 > o.y
    ) {
      colliding = true;
      if (s.collisionCooldown <= 0) {
        s.health -= COLLISION_DAMAGE;
        s.collisionCooldown = COLLISION_COOLDOWN;
        s.statusMsg = "COLLISION!";
        s.statusTimer = 0.8;
        if (s.health <= 0) {
          s.health = 0;
          s.gameOver = true;
          s.gameOverReason = `Wrecked at ${Math.floor(s.distance)}m!`;
          return s;
        }
      }
      break;
    }
  }

  s.isColliding = colliding;

  // Health regen when not colliding
  if (!colliding && s.health < s.maxHealth) {
    s.health = Math.min(s.maxHealth, s.health + HEALTH_REGEN_RATE * dt);
    s.repairPulse = (s.repairPulse + dt * 3) % (Math.PI * 2);
  }

  // Shift hints
  if (!s.stalled && s.gear > 0 && s.gear < 5 && !s.clutchPressed) {
    const [, rpmMax] = GEAR_RPM_RANGES[s.gear];
    if (s.rpm > rpmMax * 0.9) {
      s.shiftNowTimer = 1;
    }
  }
  if (s.shiftNowTimer > 0) s.shiftNowTimer -= dt;

  if (s.statusTimer > 0) s.statusTimer -= dt;
  else s.statusMsg = "";

  return s;
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  health: number,
  maxHealth: number,
  isColliding: boolean,
  repairPulse: number,
) {
  const pct = Math.max(0, health / maxHealth);

  // Background
  ctx.fillStyle = "#1A1A1A";
  drawRoundRect(ctx, x, y, w, h, 3);

  // Color gradient: green -> yellow -> red based on health
  let barColor: string;
  if (pct > 0.6) barColor = "#40E080";
  else if (pct > 0.3) barColor = "#E0A040";
  else barColor = "#E04040";

  ctx.fillStyle = barColor;
  drawRoundRect(ctx, x + 1, y + 1, Math.max(0, (w - 2) * pct), h - 2, 2);

  // Label
  ctx.fillStyle = "#C56A2C";
  ctx.font = "bold 8px 'Bricolage Grotesque', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("HP", x, y - 3);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 8px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${Math.floor(health)}/${maxHealth}`, x + w, y - 3);

  // Repair pulse indicator
  if (!isColliding && health < maxHealth) {
    const alpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(repairPulse));
    ctx.fillStyle = `rgba(64, 224, 128, ${alpha})`;
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚡ REPAIR", x + w / 2, y + h + 11);
  }
}

function drawGame(ctx: CanvasRenderingContext2D, state: GameState) {
  const {
    speed,
    rpm,
    gear,
    clutchPressed,
    distance,
    stalled,
    engineOn,
    carX,
    carTilt,
    carW,
    carH,
    roadOffset,
    dashOffset,
    obstacles,
    gameOver,
    gameOverReason,
    statusMsg,
    shiftNowTimer,
    health,
    maxHealth,
    isColliding,
    repairPulse,
    car,
  } = state;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Grass background
  ctx.fillStyle = "#1F2E1F";
  ctx.fillRect(0, 0, CANVAS_W, GAME_H);

  ctx.strokeStyle = "#263326";
  ctx.lineWidth = 1;
  for (let y = 0; y < GAME_H; y += 20) {
    const yy = (y + roadOffset * 0.3) % GAME_H;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(ROAD_X - 10, yy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ROAD_X + ROAD_W + 10, yy);
    ctx.lineTo(CANVAS_W, yy);
    ctx.stroke();
  }

  ctx.fillStyle = "#5A4A2A";
  ctx.fillRect(ROAD_X - 12, 0, 12, GAME_H);
  ctx.fillRect(ROAD_X + ROAD_W, 0, 12, GAME_H);

  ctx.fillStyle = "#383838";
  ctx.fillRect(ROAD_X, 0, ROAD_W, GAME_H);

  const centerX = ROAD_X + ROAD_W / 2;
  ctx.setLineDash([28, 20]);
  ctx.lineDashOffset = -dashOffset;
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, GAME_H);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;

  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ROAD_X + 2, 0);
  ctx.lineTo(ROAD_X + 2, GAME_H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ROAD_X + ROAD_W - 2, 0);
  ctx.lineTo(ROAD_X + ROAD_W - 2, GAME_H);
  ctx.stroke();

  for (const o of obstacles) {
    drawObstacle(ctx, o);
  }

  if (!gameOver) {
    drawCar(
      ctx,
      carX,
      PLAYER_Y_BASE,
      carW,
      carH,
      car.roofColor,
      car.color,
      carTilt,
      car.isBike,
    );
  }

  // Collision flash
  if (isColliding) {
    ctx.fillStyle = "rgba(224, 64, 64, 0.15)";
    ctx.fillRect(0, 0, CANVAS_W, GAME_H);
  }

  if (!engineOn && stalled) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(ROAD_X, GAME_H / 2 - 30, ROAD_W, 54);
    ctx.fillStyle = "#E04040";
    ctx.font = "bold 14px 'Bricolage Grotesque', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ENGINE STALLED", CANVAS_W / 2, GAME_H / 2 - 8);
    ctx.fillStyle = "#C9D2DC";
    ctx.font = "11px sans-serif";
    ctx.fillText("Press ENTER to start", CANVAS_W / 2, GAME_H / 2 + 12);
  } else if (statusMsg) {
    ctx.fillStyle =
      statusMsg === "COLLISION!"
        ? "rgba(224,64,64,0.9)"
        : "rgba(197,106,44,0.85)";
    ctx.font = "bold 13px 'Bricolage Grotesque', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(statusMsg, CANVAS_W / 2, 30);
  }

  if (shiftNowTimer > 0) {
    ctx.fillStyle = "rgba(255,220,50,0.9)";
    ctx.font = "bold 15px 'Bricolage Grotesque', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⬆ SHIFT UP!", CANVAS_W / 2, 55);
  }

  // ---- HUD ----
  const hudY = GAME_H;
  ctx.fillStyle = "#161E2A";
  ctx.fillRect(0, hudY, CANVAS_W, HUD_H);
  ctx.strokeStyle = "#4A5667";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, hudY);
  ctx.lineTo(CANVAS_W, hudY);
  ctx.stroke();

  // Gear display
  const gearLabel = gear === 0 ? "N" : String(gear);
  const gearX = 80;
  const gearCY = hudY + 55;

  ctx.fillStyle = "#2B3645";
  drawRoundRect(ctx, 20, hudY + 12, 120, HUD_H - 24, 8);
  ctx.textAlign = "center";
  ctx.fillStyle = "#C56A2C";
  ctx.font = "bold 9px 'Bricolage Grotesque', sans-serif";
  ctx.fillText("GEAR", gearX, hudY + 28);
  ctx.fillStyle = gear === 0 ? "#6E7C8A" : "#fff";
  ctx.font = `bold 56px 'Bricolage Grotesque', sans-serif`;
  ctx.fillText(gearLabel, gearX, gearCY + 26);

  ctx.fillStyle = clutchPressed ? "#C56A2C" : "#2B3645";
  drawRoundRect(ctx, 20, hudY + HUD_H - 30, 120, 16, 4);
  ctx.fillStyle = clutchPressed ? "#fff" : "#4A5667";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CLUTCH", gearX, hudY + HUD_H - 18);

  // Speedometer
  drawGauge(
    ctx,
    CANVAS_W / 2 - 70,
    hudY + 56,
    44,
    speed,
    car.maxSpeed,
    "SPEED",
    `${Math.floor(speed)}km/h`,
  );

  // RPM gauge
  drawGauge(
    ctx,
    CANVAS_W / 2 + 70,
    hudY + 56,
    44,
    rpm,
    7000,
    "RPM",
    `${Math.floor(rpm / 100) * 100}`,
    6000,
  );

  // Health bar (below gauges, centered)
  const hbW = 200;
  const hbH = 10;
  const hbX = CANVAS_W / 2 - hbW / 2;
  const hbY = hudY + 112;
  drawHealthBar(
    ctx,
    hbX,
    hbY,
    hbW,
    hbH,
    health,
    maxHealth,
    isColliding,
    repairPulse,
  );

  // Right panel: distance + engine
  const rightX = CANVAS_W - 160;
  ctx.fillStyle = "#2B3645";
  drawRoundRect(ctx, rightX - 10, hudY + 12, 150, HUD_H - 24, 8);

  ctx.fillStyle = "#C56A2C";
  ctx.font = "bold 9px 'Bricolage Grotesque', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DISTANCE", rightX + 55, hudY + 28);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px 'Bricolage Grotesque', sans-serif";
  ctx.fillText(`${Math.floor(distance)}m`, rightX + 55, hudY + 52);

  const engineColor = !engineOn ? "#E04040" : stalled ? "#E04040" : "#40E080";
  ctx.fillStyle = engineColor;
  ctx.beginPath();
  ctx.arc(rightX + 35, hudY + 72, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#C9D2DC";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    engineOn && !stalled ? "ENGINE ON" : "STALLED",
    rightX + 48,
    hudY + 76,
  );

  // Car name in HUD
  ctx.fillStyle = car.color;
  ctx.font = "bold 10px 'Bricolage Grotesque', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${car.brand} ${car.name}`, rightX + 55, hudY + 95);

  ctx.fillStyle = "#4A5667";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  const legends = ["W=Gas", "S=Brake", "A/D=Steer", "C=Clutch", "E/Q=Gear"];
  legends.forEach((l, i) => {
    ctx.fillText(l, rightX - 20 + i * 30, hudY + HUD_H - 14);
  });

  // GAME OVER overlay
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, CANVAS_W, GAME_H);
    ctx.fillStyle = "#E04040";
    ctx.font = "bold 36px 'Bricolage Grotesque', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", CANVAS_W / 2, GAME_H / 2 - 40);
    ctx.fillStyle = "#C56A2C";
    ctx.font = "bold 18px 'Bricolage Grotesque', sans-serif";
    ctx.fillText(gameOverReason, CANVAS_W / 2, GAME_H / 2);
    ctx.fillStyle = "#C9D2DC";
    ctx.font = "14px sans-serif";
    ctx.fillText(
      `Distance: ${Math.floor(distance)}m`,
      CANVAS_W / 2,
      GAME_H / 2 + 30,
    );
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(
      "Score submitted! Press ESC to return home.",
      CANVAS_W / 2,
      GAME_H / 2 + 60,
    );
  }
}

// ---- CAR SELECTION SCREEN (React UI) ----
interface CarSelectProps {
  onSelect: (car: CarDef) => void;
  onBack: () => void;
}

function StatBar({
  value,
  max,
  color,
}: { value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div
      style={{
        height: 6,
        background: "#1A2535",
        borderRadius: 3,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 3,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

function CarSelectScreen({ onSelect, onBack }: CarSelectProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0D1520",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Bricolage Grotesque', sans-serif",
      }}
    >
      <div
        style={{
          marginBottom: 8,
          color: "#C56A2C",
          fontSize: 12,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
        }}
      >
        🏎 Retro Gear Drive
      </div>
      <h2
        style={{
          color: "#fff",
          fontSize: 28,
          fontWeight: 800,
          marginBottom: 6,
          textAlign: "center",
          letterSpacing: "0.05em",
        }}
      >
        Choose Your Ride
      </h2>
      <p
        style={{
          color: "#6E7C8A",
          fontSize: 13,
          marginBottom: 28,
          textAlign: "center",
        }}
      >
        Each car has unique stats. Pick wisely!
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          maxWidth: 860,
          width: "100%",
        }}
      >
        {INDIAN_CARS.map((car) => (
          <button
            key={car.id}
            type="button"
            data-ocid={`car_select.${car.id}.button`}
            onClick={() => onSelect(car)}
            onMouseEnter={() => setHovered(car.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === car.id ? "#1E2D42" : "#161E2A",
              border: `2px solid ${hovered === car.id ? car.color : "#2B3645"}`,
              borderRadius: 12,
              padding: "16px 14px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s ease",
              transform: hovered === car.id ? "translateY(-3px)" : "none",
              boxShadow:
                hovered === car.id ? `0 8px 24px ${car.color}33` : "none",
            }}
          >
            {/* Pixel car preview */}
            <div
              style={{
                width: "100%",
                height: 72,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <div style={{ position: "relative" }}>
                {/* Pixel car rectangle */}
                <div
                  style={{
                    width: car.isBike ? 22 : 44,
                    height: car.isBike ? 72 : 60,
                    background: car.color,
                    borderRadius: car.isBike ? 4 : 6,
                    position: "relative",
                    boxShadow: `0 0 12px ${car.color}88`,
                  }}
                >
                  {!car.isBike && (
                    <div
                      style={{
                        position: "absolute",
                        top: 4,
                        left: 6,
                        right: 6,
                        height: 22,
                        background: car.roofColor,
                        borderRadius: 4,
                      }}
                    />
                  )}
                  {!car.isBike && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 6,
                        left: -6,
                        right: -6,
                        height: 14,
                        background: "rgba(255,238,136,0.6)",
                        borderRadius: 2,
                      }}
                    />
                  )}
                  {car.isBike && (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          top: 2,
                          left: 2,
                          right: 2,
                          height: 12,
                          background: "#111",
                          borderRadius: 3,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 2,
                          left: 2,
                          right: 2,
                          height: 12,
                          background: "#111",
                          borderRadius: 3,
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                color: car.color,
                fontWeight: 800,
                fontSize: 13,
                marginBottom: 2,
              }}
            >
              {car.brand}
            </div>
            <div
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 6,
              }}
            >
              {car.name}
            </div>

            <div
              style={{
                fontSize: 10,
                color: "#6E7C8A",
                marginBottom: 10,
                lineHeight: 1.4,
              }}
            >
              {car.description}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                {
                  label: "MAX SPEED",
                  value: car.maxSpeed,
                  max: 200,
                  color: "#C56A2C",
                },
                {
                  label: "ACCEL",
                  value: car.accelMult * 62.5,
                  max: 100,
                  color: "#40A0E0",
                },
                {
                  label: "HANDLING",
                  value: car.handling,
                  max: 220,
                  color: "#40E080",
                },
                {
                  label: "DURABILITY",
                  value: car.durability,
                  max: 150,
                  color: "#E04040",
                },
              ].map(({ label, value, max, color }) => (
                <div key={label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        color: "#6E7C8A",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {label}
                    </span>
                    <span style={{ color: "#C9D2DC", fontSize: 9 }}>
                      {Math.round((value / max) * 10)}/10
                    </span>
                  </div>
                  <StatBar value={value} max={max} color={color} />
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 12,
                background: car.color,
                color: "#fff",
                textAlign: "center",
                borderRadius: 6,
                padding: "8px 0",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: "0.1em",
              }}
            >
              SELECT
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        data-ocid="car_select.back.button"
        onClick={onBack}
        style={{
          marginTop: 24,
          background: "transparent",
          color: "#4A5667",
          border: "1px solid #2B3645",
          borderRadius: 6,
          padding: "8px 20px",
          cursor: "pointer",
          fontSize: 12,
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        ← Back to Menu
      </button>
    </div>
  );
}

// ---- MAIN GAME COMPONENT ----
export default function GamePage({ onExit }: GamePageProps) {
  const [screen, setScreen] = useState<"select" | "playing">("select");
  const [selectedCar, setSelectedCar] = useState<CarDef | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initState(INDIAN_CARS[0]));
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const submitScore = useSubmitScore();
  const [uiGear, setUiGear] = useState(0);
  const [uiStalled, setUiStalled] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [distance, setDistance] = useState(0);
  const scoreSubmittedRef = useRef(false);

  const handleCarSelect = useCallback((car: CarDef) => {
    setSelectedCar(car);
    stateRef.current = initState(car);
    scoreSubmittedRef.current = false;
    setUiGear(0);
    setUiStalled(true);
    setGameOver(false);
    setDistance(0);
    setScreen("playing");
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Space",
          "ShiftLeft",
          "ShiftRight",
        ].includes(e.code)
      ) {
        e.preventDefault();
      }

      stateRef.current.keys.add(e.code);

      const s = stateRef.current;

      if (e.code === "KeyE" && s.clutchPressed && !s.stalled) {
        const newGear = Math.min(s.gear + 1, 5);
        stateRef.current = { ...s, gear: newGear };
        setUiGear(newGear);
      }
      if (e.code === "KeyQ" && s.clutchPressed && !s.stalled) {
        const newGear = Math.max(s.gear - 1, 0);
        stateRef.current = { ...s, gear: newGear };
        setUiGear(newGear);
      }

      if (e.code === "Escape") {
        const finalDist = stateRef.current.distance;
        onExit(BigInt(Math.floor(finalDist)));
      }
    },
    [onExit],
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    stateRef.current.keys.delete(e.code);
  }, []);

  useEffect(() => {
    if (screen !== "playing") return;
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp, screen]);

  useEffect(() => {
    if (screen !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function loop(timestamp: number) {
      if (!ctx) return;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const prev = stateRef.current;
      const next = gameUpdate(prev, dt);
      stateRef.current = next;

      drawGame(ctx, next);

      if (next.gear !== prev.gear) setUiGear(next.gear);
      if (next.stalled !== prev.stalled) setUiStalled(next.stalled);

      if (next.gameOver && !prev.gameOver) {
        setGameOver(true);
        setDistance(next.distance);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame((t) => {
      lastTimeRef.current = t;
      rafRef.current = requestAnimationFrame(loop);
    });

    canvas.focus();

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [screen]);

  useEffect(() => {
    if (gameOver && distance > 0 && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      submitScore.mutate(BigInt(Math.floor(distance)), {
        onSuccess: () => toast.success("Score submitted!"),
        onError: () => toast.error("Could not submit score"),
      });
    }
  }, [gameOver, distance, submitScore]);

  if (screen === "select") {
    return (
      <CarSelectScreen onSelect={handleCarSelect} onBack={() => onExit(0n)} />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#161E2A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: CANVAS_W,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px",
          maxWidth: "100%",
        }}
      >
        <span
          style={{
            color: selectedCar?.color ?? "#C56A2C",
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          🏎{" "}
          {selectedCar
            ? `${selectedCar.brand} ${selectedCar.name}`
            : "RETRO GEAR DRIVE"}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            data-ocid="game.change_car_button"
            onClick={() => {
              cancelAnimationFrame(rafRef.current);
              setScreen("select");
            }}
            style={{
              background: "#2B3645",
              color: "#C9D2DC",
              border: "1px solid #4A5667",
              borderRadius: 6,
              padding: "6px 14px",
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            🚗 Change Car
          </button>
          <button
            type="button"
            data-ocid="game.exit_button"
            onClick={() =>
              onExit(BigInt(Math.floor(stateRef.current.distance)))
            }
            style={{
              background: "#2B3645",
              color: "#C9D2DC",
              border: "1px solid #4A5667",
              borderRadius: 6,
              padding: "6px 14px",
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            ← EXIT
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        tabIndex={0}
        data-ocid="game.canvas_target"
        style={{
          display: "block",
          border: `2px solid ${selectedCar?.color ?? "#4A5667"}44`,
          borderRadius: 12,
          boxShadow: `0 0 40px ${selectedCar?.color ?? "#C56A2C"}22, 0 8px 40px rgba(0,0,0,0.8)`,
          outline: "none",
          maxWidth: "100%",
          cursor: "crosshair",
        }}
      />

      <div
        style={{
          width: CANVAS_W,
          display: "flex",
          gap: 8,
          maxWidth: "100%",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            background: "#2B3645",
            color: uiStalled ? "#E04040" : "#40E080",
            border: `1px solid ${uiStalled ? "#E04040" : "#40E080"}`,
            borderRadius: 4,
            padding: "3px 10px",
            fontSize: 11,
            fontFamily: "sans-serif",
            fontWeight: 700,
          }}
        >
          {uiStalled ? "STALLED" : "RUNNING"}
        </span>
        <span
          style={{
            background: "#2B3645",
            color: "#C56A2C",
            border: "1px solid #C56A2C",
            borderRadius: 4,
            padding: "3px 10px",
            fontSize: 11,
            fontFamily: "sans-serif",
            fontWeight: 700,
          }}
        >
          GEAR: {uiGear === 0 ? "N" : uiGear}
        </span>
        {gameOver && (
          <span
            data-ocid="game.game_over_state"
            style={{
              background: "rgba(224,64,64,0.15)",
              color: "#E04040",
              border: "1px solid #E04040",
              borderRadius: 4,
              padding: "3px 10px",
              fontSize: 11,
              fontFamily: "sans-serif",
              fontWeight: 700,
            }}
          >
            GAME OVER — Press ESC to return
          </span>
        )}
      </div>
    </div>
  );
}

// level.js — the Meridian Gallery floor plan: walls, cases, pillars, the vent
// route, loot placement, guard patrols and camera mounts. All coordinates are
// in playfield space: x 0..1024, y 0..640. The canvas HUD occupies the strip
// above the playfield; render.js adds the vertical offset when drawing.

export const PLAY_W = 1024;
export const PLAY_H = 640;
export const WALL = 16;

// A solid rectangle: { x, y, w, h }. Walls and pillars block movement and
// sight; glass display cases block movement only (you can see through them).
export function createLevel() {
  const walls = [
    // Outer shell.
    { x: 0, y: 0, w: PLAY_W, h: WALL },
    { x: 0, y: PLAY_H - WALL, w: PLAY_W, h: WALL },
    { x: 0, y: 0, w: WALL, h: PLAY_H },
    { x: PLAY_W - WALL, y: 0, w: WALL, h: PLAY_H },
    // Interior wing walls: they split the gallery into three lanes — the
    // west corridor, the grand hall, and the east service vent.
    { x: 232, y: 96, w: 24, h: 220 },
    { x: 232, y: 400, w: 24, h: 144 },
    { x: 768, y: 96, w: 24, h: 220 },
    { x: 768, y: 400, w: 24, h: 144 },
    // A low partition guarding the north side of the sapphire plinth.
    { x: 420, y: 168, w: 184, h: 20 },
  ];

  const pillars = [
    { x: 288, y: 300, w: 26, h: 40 },
    { x: 710, y: 300, w: 26, h: 40 },
    { x: 470, y: 470, w: 26, h: 40 },
  ];

  // Glass display cases: solid to walk through, transparent to sight.
  const cases = [
    { x: 340, y: 150, w: 120, h: 28 },
    { x: 564, y: 150, w: 120, h: 28 },
    { x: 340, y: 462, w: 120, h: 28 },
    { x: 564, y: 462, w: 120, h: 28 },
  ];

  // The vent shaft: a narrow service run down the east wall. Inside it the
  // thief moves slower, but no guard or camera can spot them.
  const vent = { x: 824, y: 160, w: 136, h: 320 };

  // The prize: the Starlight Sapphire on its plinth at the gallery's heart.
  const sapphire = { x: 512, y: 320, taken: false };

  const plinth = { x: 480, y: 296, w: 64, h: 48 };

  const coins = [
    { x: 90, y: 120, taken: false }, { x: 90, y: 300, taken: false },
    { x: 90, y: 470, taken: false }, { x: 300, y: 90, taken: false },
    { x: 700, y: 90, taken: false }, { x: 512, y: 130, taken: false },
    { x: 300, y: 560, taken: false }, { x: 700, y: 560, taken: false },
    { x: 880, y: 200, taken: false }, { x: 880, y: 440, taken: false },
    { x: 512, y: 560, taken: false }, { x: 150, y: 560, taken: false },
  ];

  const gems = [
    { x: 150, y: 200, color: '#ff5d8f', taken: false },
    { x: 874, y: 320, color: '#4dd8ff', taken: false },
    { x: 512, y: 420, color: '#b388ff', taken: false },
  ];

  const start = { x: 90, y: 560 };
  const exit = { x: 920, y: 560, w: 88, h: 64 };

  const guardPatrols = [
    { waypoints: [{ x: 320, y: 220 }, { x: 704, y: 220 }], speed: 72 },
    // North corridor patrol: kept clear of the partition wall (y 168-188)
    // and the plinth, so the guard never walks through solid stone.
    { waypoints: [{ x: 320, y: 110 }, { x: 704, y: 110 }], speed: 66 },
    { waypoints: [{ x: 300, y: 540 }, { x: 724, y: 540 }], speed: 78 },
  ];

  const cameraMounts = [
    // Mounted just east of the west wing wall (which ends at x=256) so the
    // camera's own sight-line never grazes the wall's edge.
    { x: 270, y: 24, baseAngle: Math.PI / 2, sweep: 0.9, range: 240 },
    { x: 1000, y: 320, baseAngle: Math.PI, sweep: 0.8, range: 250 },
    { x: 700, y: 616, baseAngle: -Math.PI / 2, sweep: 0.9, range: 230 },
  ];

  return {
    walls, pillars, cases, vent, sapphire, plinth,
    coins, gems, start, exit, guardPatrols, cameraMounts,
  };
}

export function rectsCollideCircle(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// Push a circle out of a rectangle it overlaps; returns true on a hit.
export function pushCircleOutOfRect(circle, rect) {
  const nx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  let dx = circle.x - nx;
  let dy = circle.y - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= circle.r * circle.r) return false;
  if (d2 === 0) {
    // Centre is inside the rectangle: shove out along the smallest overlap.
    const left = circle.x - rect.x;
    const right = rect.x + rect.w - circle.x;
    const top = circle.y - rect.y;
    const bottom = rect.y + rect.h - circle.y;
    const m = Math.min(left, right, top, bottom);
    if (m === left) circle.x = rect.x - circle.r;
    else if (m === right) circle.x = rect.x + rect.w + circle.r;
    else if (m === top) circle.y = rect.y - circle.r;
    else circle.y = rect.y + rect.h + circle.r;
    return true;
  }
  const d = Math.sqrt(d2);
  dx /= d;
  dy /= d;
  circle.x = nx + dx * circle.r;
  circle.y = ny + dy * circle.r;
  return true;
}

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

// Slab test: does the segment (x1,y1)-(x2,y2) cross the rectangle?
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

export function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  const ddx = px - cx;
  const ddy = py - cy;
  return ddx * ddx + ddy * ddy < r * r;
}

// True when a wall or pillar stands between two points. Glass cases never
// block sight, and neither does the thief's own smoke — that is handled by
// the caller, which also tests smoke circles.
export function sightBlocked(level, x1, y1, x2, y2) {
  for (const w of level.walls) {
    if (segmentHitsRect(x1, y1, x2, y2, w)) return true;
  }
  for (const p of level.pillars) {
    if (segmentHitsRect(x1, y1, x2, y2, p)) return true;
  }
  return false;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

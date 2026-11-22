// thief.js — Wren, the cat-burglar: movement, the two tools (smoke pellet and
// camera loop, both bought with credits found in the gallery), and pickups.

import {
  PLAY_W, PLAY_H, WALL, pointInRect, pushCircleOutOfRect,
} from './level.js';

export const THIEF_RADIUS = 13;
export const THIEF_SPEED = 178;
export const VENT_SPEED_FACTOR = 0.6;
export const SMOKE_COST = 15;
export const LOOP_COST = 20;
export const SMOKE_RADIUS = 95;
export const SMOKE_DURATION = 6;
export const LOOP_DURATION = 8;

export function createThief(x, y) {
  return {
    x, y, r: THIEF_RADIUS,
    face: -Math.PI / 2, // facing north to start
    moving: false,
    smokeLeft: 1,
    loopLeft: 1,
  };
}

export function thiefInVent(level, thief) {
  return pointInRect(thief.x, thief.y, level.vent);
}

function resolveCollisions(level, thief) {
  for (const w of level.walls) pushCircleOutOfRect(thief, w);
  for (const p of level.pillars) pushCircleOutOfRect(thief, p);
  for (const c of level.cases) pushCircleOutOfRect(thief, c);
  pushCircleOutOfRect(thief, level.plinth);
  thief.x = Math.max(WALL + thief.r, Math.min(PLAY_W - WALL - thief.r, thief.x));
  thief.y = Math.max(WALL + thief.r, Math.min(PLAY_H - WALL - thief.r, thief.y));
}

export function updateThief(game, input, dt) {
  const thief = game.thief;
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  thief.moving = dx !== 0 || dy !== 0;
  if (!thief.moving) return;
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  const inVent = thiefInVent(game.level, thief);
  const speed = THIEF_SPEED * (inVent ? VENT_SPEED_FACTOR : 1);
  thief.x += dx * speed * dt;
  thief.y += dy * speed * dt;
  thief.face = Math.atan2(dy, dx);
  resolveCollisions(game.level, thief);
}

// Spend credits on a smoke pellet: a grey cloud that blinds every cone
// whose line of sight crosses it. One free pellet is in the kit bag.
export function useSmoke(game) {
  if (game.state !== 'playing') return false;
  const thief = game.thief;
  if (thief.smokeLeft <= 0 && game.credits < SMOKE_COST) {
    game.flash = 'Not enough credits for smoke — grab coins first!';
    game.flashTimer = 2;
    return false;
  }
  if (thief.smokeLeft > 0) thief.smokeLeft -= 1;
  else game.credits -= SMOKE_COST;
  game.smoke.push({ x: thief.x, y: thief.y, r: SMOKE_RADIUS, t: SMOKE_DURATION });
  game.audio.playSmoke();
  return true;
}

// Spend credits on a camera loop: every camera freezes on a still frame
// and stops watching while the loop runs.
export function useLoop(game) {
  if (game.state !== 'playing') return false;
  const thief = game.thief;
  if (thief.loopLeft <= 0 && game.credits < LOOP_COST) {
    game.flash = 'Not enough credits for a camera loop — grab coins first!';
    game.flashTimer = 2;
    return false;
  }
  if (thief.loopLeft > 0) thief.loopLeft -= 1;
  else game.credits -= LOOP_COST;
  game.loopTimer = LOOP_DURATION;
  game.audio.playLoop();
  return true;
}

export function collectPickups(game) {
  const thief = game.thief;
  for (const coin of game.level.coins) {
    if (coin.taken) continue;
    const dx = coin.x - thief.x;
    const dy = coin.y - thief.y;
    if (dx * dx + dy * dy < 26 * 26) {
      coin.taken = true;
      game.credits += 10;
      game.score += 25;
      game.audio.playCoin();
    }
  }
  for (const gem of game.level.gems) {
    if (gem.taken) continue;
    const dx = gem.x - thief.x;
    const dy = gem.y - thief.y;
    if (dx * dx + dy * dy < 28 * 28) {
      gem.taken = true;
      game.credits += 20;
      game.score += 100;
      game.audio.playGem();
    }
  }
  const sap = game.level.sapphire;
  if (!sap.taken) {
    const dx = sap.x - thief.x;
    const dy = sap.y - thief.y;
    if (dx * dx + dy * dy < 44 * 44) {
      sap.taken = true;
      game.score += 500;
      game.flash = 'THE STARLIGHT SAPPHIRE IS YOURS — reach the GETAWAY door!';
      game.flashTimer = 3.5;
      game.audio.playSapphire();
    }
  }
}

export function thiefReachedExit(game) {
  const e = game.level.exit;
  const t = game.thief;
  return t.x > e.x - 6 && t.x < e.x + e.w + 6 && t.y > e.y - 6 && t.y < e.y + e.h + 6;
}

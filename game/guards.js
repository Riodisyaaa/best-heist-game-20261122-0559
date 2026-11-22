// guards.js — the gallery's night guards: fixed patrol routes, sweeping
// vision cones, suspicion that builds while they watch you, and a chase when
// they are sure. A guard only raises the alarm while it can actually see the
// thief: in range, inside its cone, with no wall, pillar or smoke in between.

import { angleDiff, segmentHitsCircle, sightBlocked } from './level.js';
import { thiefInVent } from './thief.js';

export const GUARD_RANGE = 210;
export const GUARD_HALF_ANGLE = 0.62; // about 35 degrees each side
export const GUARD_SUSPICION_RATE = 55; // per second of being watched
export const SUSPICION_DECAY = 22;
export const CHASE_SPEED = 132;
export const CHASE_SUSPICION = 55;
export const CATCH_DISTANCE = 26;

export function createGuards(level) {
  return level.guardPatrols.map((patrol) => ({
    x: patrol.waypoints[0].x,
    y: patrol.waypoints[0].y,
    r: 14,
    waypoints: patrol.waypoints,
    target: 1,
    speed: patrol.speed,
    face: 0,
    suspicion: 0,
    chasing: false,
    pause: 0,
  }));
}

// Can this guard see the thief right now? The vent hides the thief, and a
// smoke cloud on the sight-line blinds the guard.
export function guardSeesThief(game, guard) {
  const thief = game.thief;
  if (thiefInVent(game.level, thief)) return false;
  const dx = thief.x - guard.x;
  const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_RANGE) return false;
  const angle = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(angle, guard.face)) > GUARD_HALF_ANGLE) return false;
  if (sightBlocked(game.level, guard.x, guard.y, thief.x, thief.y)) return false;
  for (const cloud of game.smoke) {
    if (segmentHitsCircle(guard.x, guard.y, thief.x, thief.y, cloud.x, cloud.y, cloud.r)) {
      return false;
    }
  }
  return true;
}

export function updateGuards(game, dt) {
  for (const guard of game.guards) {
    const seen = guardSeesThief(game, guard);
    if (seen) {
      guard.suspicion = Math.min(100, guard.suspicion + GUARD_SUSPICION_RATE * dt);
    } else {
      guard.suspicion = Math.max(0, guard.suspicion - SUSPICION_DECAY * dt);
    }
    guard.chasing = guard.suspicion >= CHASE_SUSPICION;

    if (guard.chasing && game.state === 'playing') {
      // Close in on the thief, a touch slower than the thief can run, and
      // never overshoot: stop on the thief instead of orbiting past them.
      const dx = game.thief.x - guard.x;
      const dy = game.thief.y - guard.y;
      const dist = Math.hypot(dx, dy) || 1;
      guard.face = Math.atan2(dy, dx);
      const step = Math.min(CHASE_SPEED * dt, dist);
      guard.x += (dx / dist) * step;
      guard.y += (dy / dist) * step;
    } else if (guard.suspicion >= 40) {
      // Unsure but alert: the guard stops and stares toward the thief.
      guard.face = Math.atan2(game.thief.y - guard.y, game.thief.x - guard.x);
    } else {
      // Walk the patrol route, pausing a beat at each waypoint to look around.
      if (guard.pause > 0) {
        guard.pause -= dt;
        guard.face += dt * 0.9; // scan the room while waiting
      } else {
        const wp = guard.waypoints[guard.target];
        const dx = wp.x - guard.x;
        const dy = wp.y - guard.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) {
          guard.target = (guard.target + 1) % guard.waypoints.length;
          guard.pause = 1.4;
        } else {
          guard.face = Math.atan2(dy, dx);
          guard.x += (dx / dist) * guard.speed * dt;
          guard.y += (dy / dist) * guard.speed * dt;
        }
      }
    }
  }
}

// A guard close enough to grab the thief ends the run — but only once the
// alarm is already hot, so a brush in the dark is a scare, not a sentence.
export function guardCaughtThief(game) {
  for (const guard of game.guards) {
    const dx = game.thief.x - guard.x;
    const dy = game.thief.y - guard.y;
    if (dx * dx + dy * dy < CATCH_DISTANCE * CATCH_DISTANCE) {
      if (game.alarm >= 60 || guard.chasing) return guard;
    }
  }
  return null;
}

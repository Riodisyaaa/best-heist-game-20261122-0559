// cameras.js — the wall cameras: each sweeps a fixed arc on its mount, and
// while its red eye is on the thief the alarm climbs fast. A camera loop
// freezes every camera on a still frame, and smoke on the sight-line blinds it.

import { angleDiff, segmentHitsCircle, sightBlocked } from './level.js';
import { thiefInVent } from './thief.js';

export const CAMERA_HALF_ANGLE = 0.42; // about 24 degrees each side
export const CAMERA_SUSPICION_RATE = 85; // cameras are quicker than guards

export function createCameras(level) {
  return level.cameraMounts.map((mount) => ({
    x: mount.x,
    y: mount.y,
    baseAngle: mount.baseAngle,
    sweep: mount.sweep,
    range: mount.range,
    angle: mount.baseAngle,
    phase: Math.random() * Math.PI * 2,
    watching: false,
  }));
}

export function cameraSeesThief(game, camera) {
  if (game.loopTimer > 0) return false; // the loop holds a frozen frame
  const thief = game.thief;
  if (thiefInVent(game.level, thief)) return false;
  const dx = thief.x - camera.x;
  const dy = thief.y - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > camera.range) return false;
  const angle = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(angle, camera.angle)) > CAMERA_HALF_ANGLE) return false;
  if (sightBlocked(game.level, camera.x, camera.y, thief.x, thief.y)) return false;
  for (const cloud of game.smoke) {
    if (segmentHitsCircle(camera.x, camera.y, thief.x, thief.y, cloud.x, cloud.y, cloud.r)) {
      return false;
    }
  }
  return true;
}

export function updateCameras(game, dt) {
  for (const camera of game.cameras) {
    if (game.loopTimer <= 0) {
      // Sweep the arc back and forth, slow and readable.
      camera.phase += dt * 0.55;
      camera.angle = camera.baseAngle + Math.sin(camera.phase) * camera.sweep;
    }
    camera.watching = cameraSeesThief(game, camera);
  }
}

// render.js — every pixel of The Starlight Job is drawn here in code: the
// gallery floor, the three lanes, the guards and their red vision cones, the
// sweeping cameras, the gold loot, and the HUD with its alarm meter. Nothing
// is loaded from a file; there are no images.

import { PLAY_W, PLAY_H } from './level.js';
import { GUARD_RANGE, GUARD_HALF_ANGLE } from './guards.js';
import { CAMERA_HALF_ANGLE } from './cameras.js';
import { SMOKE_COST, LOOP_COST, SMOKE_DURATION } from './thief.js';

export const HUD_H = 60;
export const CANVAS_W = 1024;
export const CANVAS_H = 700;

// The two clickable tool buttons, in canvas coordinates (HUD row 2).
export function toolButtonRects() {
  return {
    smoke: { x: 300, y: 36, w: 168, h: 20 },
    loop: { x: 478, y: 36, w: 190, h: 20 },
  };
}

function conePath(ctx, x, y, angle, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawFloor(ctx, game) {
  const tile = 64;
  for (let ty = 0; ty < PLAY_H / tile; ty++) {
    for (let tx = 0; tx < PLAY_W / tile; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#171724' : '#1a1a29';
      ctx.fillRect(tx * tile, HUD_H + ty * tile, tile, tile);
    }
  }
  // Warm amber carpet runners mark the three lanes through the gallery.
  ctx.fillStyle = 'rgba(201, 162, 39, 0.10)';
  ctx.fillRect(36, HUD_H + 36, 156, PLAY_H - 72); // west corridor
  ctx.fillRect(300, HUD_H + 268, 424, 104); // grand hall, past the plinth
  ctx.fillRect(824, HUD_H + 160, 136, 320); // the vent run
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(36.5, HUD_H + 36.5, 156, PLAY_H - 72);
  ctx.strokeRect(300.5, HUD_H + 268.5, 424, 104);
}

function drawVent(ctx, level) {
  const v = level.vent;
  ctx.fillStyle = '#101019';
  ctx.fillRect(v.x, HUD_H + v.y, v.w, v.h);
  ctx.strokeStyle = '#3a3a52';
  ctx.lineWidth = 2;
  ctx.strokeRect(v.x, HUD_H + v.y, v.w, v.h);
  ctx.strokeStyle = 'rgba(120, 120, 150, 0.5)';
  ctx.lineWidth = 1;
  for (let y = v.y + 18; y < v.y + v.h - 6; y += 16) {
    ctx.beginPath();
    ctx.moveTo(v.x + 8, HUD_H + y);
    ctx.lineTo(v.x + v.w - 8, HUD_H + y);
    ctx.stroke();
  }
  ctx.fillStyle = '#8f8875';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VENT — HIDDEN · SLOW', v.x + v.w / 2, HUD_H + v.y + v.h - 10);
}

function drawWallsAndCases(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = '#262637';
    ctx.fillRect(w.x, HUD_H + w.y, w.w, w.h);
    ctx.strokeStyle = '#45455e';
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 0.5, HUD_H + w.y + 0.5, w.w, w.h);
  }
  for (const p of level.pillars) {
    ctx.fillStyle = '#3d3d55';
    ctx.fillRect(p.x, HUD_H + p.y, p.w, p.h);
    ctx.fillStyle = '#565678';
    ctx.fillRect(p.x + 3, HUD_H + p.y + 3, p.w - 6, 8);
    ctx.strokeStyle = '#23233a';
    ctx.strokeRect(p.x + 0.5, HUD_H + p.y + 0.5, p.w, p.h);
  }
  for (const c of level.cases) {
    ctx.fillStyle = 'rgba(90, 160, 220, 0.16)';
    ctx.fillRect(c.x, HUD_H + c.y, c.w, c.h);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, HUD_H + c.y, c.w, c.h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(c.x + 6, HUD_H + c.y + 4, c.w - 12, 3);
  }
}

function drawLoot(ctx, game) {
  const level = game.level;
  const t = game.time;
  for (const coin of level.coins) {
    if (coin.taken) continue;
    const bob = Math.sin(t * 3 + coin.x) * 2;
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(coin.x, HUD_H + coin.y + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe27a';
    ctx.beginPath();
    ctx.arc(coin.x - 2, HUD_H + coin.y + bob - 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const gem of level.gems) {
    if (gem.taken) continue;
    const bob = Math.sin(t * 2.4 + gem.y) * 2;
    ctx.save();
    ctx.translate(gem.x, HUD_H + gem.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = gem.color;
    ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(-8, -8, 16, 5);
    ctx.restore();
  }
  // The Starlight Sapphire on its plinth.
  const sap = level.sapphire;
  const p = level.plinth;
  ctx.fillStyle = '#2c2c40';
  ctx.fillRect(p.x, HUD_H + p.y, p.w, p.h);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x, HUD_H + p.y, p.w, p.h);
  if (!sap.taken) {
    const pulse = 1 + Math.sin(t * 4) * 0.12;
    ctx.save();
    ctx.translate(sap.x, HUD_H + sap.y);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = '#4dd8ff';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#4dd8ff';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 16);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(6, -4);
    ctx.lineTo(0, 2);
    ctx.lineTo(-6, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#bfefff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ STARLIGHT SAPPHIRE ★', sap.x, HUD_H + sap.y - 30);
  } else {
    ctx.fillStyle = '#8f8875';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMPTY PLINTH', sap.x, HUD_H + sap.y - 12);
  }
}

function drawDoors(ctx, game) {
  const exit = game.level.exit;
  const unlocked = game.level.sapphire.taken;
  ctx.fillStyle = unlocked ? '#0d5c33' : '#3a2a2a';
  ctx.fillRect(exit.x, HUD_H + exit.y, exit.w, exit.h);
  ctx.strokeStyle = unlocked ? '#39d98a' : '#8a5a5a';
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x, HUD_H + exit.y, exit.w, exit.h);
  if (unlocked) {
    ctx.shadowColor = '#39d98a';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#39d98a';
    ctx.strokeRect(exit.x, HUD_H + exit.y, exit.w, exit.h);
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = unlocked ? '#a9f5cd' : '#c99';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(unlocked ? 'GETAWAY →' : 'LOCKED', exit.x + exit.w / 2, HUD_H + exit.y + exit.h / 2 + 5);
  // Entrance, bottom-left.
  ctx.fillStyle = '#0f766e';
  ctx.fillRect(28, HUD_H + 560, 88, 64);
  ctx.strokeStyle = '#5eead4';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, HUD_H + 560, 88, 64);
  ctx.fillStyle = '#ccfbf1';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('← IN', 72, HUD_H + 560 + 37);
}

function drawGuards(ctx, game) {
  for (const guard of game.guards) {
    const gx = guard.x;
    const gy = HUD_H + guard.y;
    // Vision cone: deeper red as suspicion climbs.
    const alpha = guard.chasing ? 0.34 : 0.10 + (guard.suspicion / 100) * 0.22;
    ctx.fillStyle = guard.chasing ? `rgba(255, 40, 40, ${alpha})` : `rgba(255, 60, 60, ${alpha})`;
    conePath(ctx, gx, gy, guard.face, GUARD_HALF_ANGLE, GUARD_RANGE);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 80, 80, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Body: a night guard in a dark uniform with a gold badge.
    ctx.fillStyle = '#1c2333';
    ctx.beginPath();
    ctx.arc(gx, gy, guard.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = guard.chasing ? '#ff4040' : '#c9a227';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e8e2d0';
    ctx.beginPath();
    ctx.arc(gx + Math.cos(guard.face) * 6, gy + Math.sin(guard.face) * 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(gx - Math.cos(guard.face) * 4, gy - Math.sin(guard.face) * 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (guard.suspicion >= 40) {
      // "?" while the guard is unsure, "!" once the chase is on.
      ctx.fillStyle = guard.chasing ? '#ff4040' : '#ffb020';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(guard.chasing ? '!' : '?', gx, gy - 22);
    }
  }
}

function drawCameras(ctx, game) {
  for (const camera of game.cameras) {
    const cx = camera.x;
    const cy = HUD_H + camera.y;
    const looped = game.loopTimer > 0;
    const watching = camera.watching && !looped;
    const alpha = looped ? 0.06 : watching ? 0.38 : 0.12;
    ctx.fillStyle = looped
      ? `rgba(140, 140, 160, ${alpha})`
      : watching
        ? `rgba(255, 50, 50, ${alpha})`
        : `rgba(255, 200, 60, ${alpha})`;
    conePath(ctx, cx, cy, camera.angle, CAMERA_HALF_ANGLE, camera.range);
    ctx.fill();
    ctx.strokeStyle = watching ? 'rgba(255, 80, 80, 0.5)' : 'rgba(255, 200, 60, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Wall mount and lens.
    ctx.fillStyle = '#4a4a60';
    ctx.fillRect(cx - 9, cy - 9, 18, 18);
    ctx.strokeStyle = '#23233a';
    ctx.strokeRect(cx - 9, cy - 9, 18, 18);
    ctx.fillStyle = watching ? '#ff4040' : looped ? '#8a8aa0' : '#ffd23e';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(camera.angle) * 5, cy + Math.sin(camera.angle) * 5, 4, 0, Math.PI * 2);
    ctx.fill();
    if (looped) {
      ctx.fillStyle = '#c9c9d8';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOOPED', cx, cy - 16);
    }
  }
}

function drawThief(ctx, game) {
  const thief = game.thief;
  const tx = thief.x;
  const ty = HUD_H + thief.y;
  ctx.save();
  ctx.shadowColor = '#2dd4bf';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#0f766e';
  ctx.beginPath();
  ctx.arc(tx, ty, thief.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#5eead4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(tx, ty, thief.r, 0, Math.PI * 2);
  ctx.stroke();
  // Hood peak and mask: the thief faces where they move.
  ctx.fillStyle = '#134e4a';
  ctx.beginPath();
  ctx.arc(tx + Math.cos(thief.face) * 5, ty + Math.sin(thief.face) * 5, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8e2d0';
  ctx.beginPath();
  ctx.arc(tx + Math.cos(thief.face) * 8, ty + Math.sin(thief.face) * 8, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ccfbf1';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WREN', tx, ty - 20);
}

function drawSmoke(ctx, game) {
  for (const cloud of game.smoke) {
    const alpha = Math.min(0.55, (cloud.t / SMOKE_DURATION) * 0.55 + 0.15);
    ctx.fillStyle = `rgba(160, 160, 175, ${alpha})`;
    ctx.beginPath();
    ctx.arc(cloud.x, HUD_H + cloud.y, cloud.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(200, 200, 215, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(cloud.x - 18, HUD_H + cloud.y - 10, cloud.r * 0.45, 0, Math.PI * 2);
    ctx.arc(cloud.x + 22, HUD_H + cloud.y + 12, cloud.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = '#0d0d16';
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H - 0.5);
  ctx.lineTo(CANVAS_W, HUD_H - 0.5);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8c84a';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('THE STARLIGHT JOB', 16, 22);
  ctx.fillStyle = '#8f8875';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Meridian Gallery · night', 16, 52);

  // Alarm meter.
  const mx = 300;
  const mw = 320;
  ctx.fillStyle = '#8f8875';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', 232, 22);
  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(mx, 10, mw, 16);
  const alarmFrac = game.alarm / 100;
  const grad = ctx.createLinearGradient(mx, 0, mx + mw, 0);
  grad.addColorStop(0, '#ffb020');
  grad.addColorStop(1, '#ff3030');
  ctx.fillStyle = grad;
  ctx.fillRect(mx, 10, mw * alarmFrac, 16);
  ctx.strokeStyle = game.spotted ? '#ff3030' : '#55556a';
  ctx.lineWidth = game.spotted && Math.floor(game.time * 6) % 2 === 0 ? 3 : 1;
  ctx.strokeRect(mx, 10, mw, 16);
  if (game.spotted) {
    ctx.fillStyle = '#ff6060';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('SPOTTED!', mx + mw + 10, 23);
  }

  // Score, time, credits.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e8e2d0';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`SCORE ${game.score}`, 1008, 22);
  const mins = Math.floor(game.time / 60);
  const secs = Math.floor(game.time % 60);
  ctx.fillStyle = '#8f8875';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, 1008, 40);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffe27a';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`◉ ${game.credits} credits`, 180, 52);

  // Tool buttons (clickable with the mouse, or Q / E).
  const btns = toolButtonRects();
  const smokeFree = game.thief.smokeLeft > 0;
  const loopFree = game.thief.loopLeft > 0;
  drawToolButton(ctx, btns.smoke, `Q · SMOKE ${smokeFree ? '(FREE ×1)' : `(${SMOKE_COST})`}`, game.credits >= SMOKE_COST || smokeFree);
  drawToolButton(ctx, btns.loop, `E · CAM LOOP ${loopFree ? '(FREE ×1)' : `(${LOOP_COST})`}`, game.credits >= LOOP_COST || loopFree);
  if (game.loopTimer > 0) {
    ctx.fillStyle = '#a9f5cd';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(`LOOP ${Math.ceil(game.loopTimer)}s`, 680, 52);
  }

  // Objective line, right side of row 2.
  ctx.textAlign = 'right';
  ctx.fillStyle = game.level.sapphire.taken ? '#39d98a' : '#c9a227';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(
    game.level.sapphire.taken ? 'Sapphire secured — reach the GETAWAY door!' : 'Steal the Starlight Sapphire, then escape.',
    1008, 52,
  );

  // Transient flash message.
  if (game.flashTimer > 0 && game.flash) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(10, 10, 18, 0.75)';
    const w = ctx.measureText(game.flash).width + 28;
    ctx.fillRect((CANVAS_W - w) / 2, HUD_H + 8, w, 26);
    ctx.fillStyle = '#ffe27a';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(game.flash, CANVAS_W / 2, HUD_H + 26);
  }
}

function drawToolButton(ctx, rect, label, affordable) {
  ctx.fillStyle = affordable ? '#2c2c40' : '#1a1a26';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = affordable ? '#c9a227' : '#44445a';
  ctx.lineWidth = 1;
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w, rect.h);
  ctx.fillStyle = affordable ? '#e8e2d0' : '#77778a';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + 14);
}

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(8, 8, 16, 0.82)';
  ctx.fillRect(0, HUD_H, CANVAS_W, PLAY_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8c84a';
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.fillText('THE STARLIGHT JOB', CANVAS_W / 2, HUD_H + 150);
  ctx.fillStyle = '#4dd8ff';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('One thief. One sapphire. Three ways in.', CANVAS_W / 2, HUD_H + 190);
  ctx.fillStyle = '#d8d2c0';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Cross the Meridian Gallery at night. Read the red vision cones and the', CANVAS_W / 2, HUD_H + 250);
  ctx.fillText('sweeping cameras before you move — being seen fills the ALARM meter.', CANVAS_W / 2, HUD_H + 274);
  ctx.fillText('Grab the Starlight Sapphire, then slip out through the GETAWAY door.', CANVAS_W / 2, HUD_H + 298);
  ctx.fillStyle = '#ffe27a';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('Routes: west corridor · grand hall · the vent (hidden, but slow)', CANVAS_W / 2, HUD_H + 340);
  ctx.fillText('Tools cost credits: Q smoke pellet (15) · E camera loop (20) · coins pay for them', CANVAS_W / 2, HUD_H + 364);
  ctx.fillStyle = '#8f8875';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Move: WASD or arrows · Use tools: Q / E or click the buttons · M mute · R restart', CANVAS_W / 2, HUD_H + 406);
  const blink = Math.floor(game.time * 2) % 2 === 0;
  if (blink) {
    ctx.fillStyle = '#39d98a';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('CLICK OR PRESS ENTER TO START', CANVAS_W / 2, HUD_H + 470);
  }
}

function drawEnd(ctx, game) {
  const won = game.state === 'won';
  ctx.fillStyle = won ? 'rgba(6, 26, 14, 0.85)' : 'rgba(26, 6, 6, 0.85)';
  ctx.fillRect(0, HUD_H, CANVAS_W, PLAY_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#39d98a' : '#ff6060';
  ctx.font = 'bold 54px system-ui, sans-serif';
  ctx.fillText(won ? 'HEIST COMPLETE!' : 'CAUGHT!', CANVAS_W / 2, HUD_H + 180);
  ctx.fillStyle = '#e8e2d0';
  ctx.font = '19px system-ui, sans-serif';
  if (won) {
    ctx.fillText('Wren slips into the night with the Starlight Sapphire.', CANVAS_W / 2, HUD_H + 228);
  } else {
    ctx.fillText(game.caughtReason || 'The guards closed in.', CANVAS_W / 2, HUD_H + 228);
  }
  const mins = Math.floor(game.time / 60);
  const secs = Math.floor(game.time % 60);
  const loot = game.level.coins.filter((c) => c.taken).length;
  const gems = game.level.gems.filter((g) => g.taken).length;
  ctx.fillStyle = '#ffe27a';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`SCORE ${game.score}   ·   TIME ${mins}:${String(secs).padStart(2, '0')}   ·   COINS ${loot}/12   ·   GEMS ${gems}/3`, CANVAS_W / 2, HUD_H + 290);
  ctx.fillStyle = '#8f8875';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Press R or click to plan the next job', CANVAS_W / 2, HUD_H + 340);
}

export function drawGame(ctx, game) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawFloor(ctx, game);
  drawVent(ctx, game.level);
  drawWallsAndCases(ctx, game.level);
  drawLoot(ctx, game);
  drawDoors(ctx, game);
  drawGuards(ctx, game);
  drawCameras(ctx, game);
  drawSmoke(ctx, game);
  if (game.state !== 'title') drawThief(ctx, game);
  drawHud(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game);
  if (game.state === 'won' || game.state === 'lost') drawEnd(ctx, game);
}

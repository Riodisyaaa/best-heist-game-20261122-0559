// main.js — The Starlight Job: bootstrap, the game loop, keyboard and mouse
// input, the alarm meter and the fair "SPOTTED" grace moment, and the win /
// lose flow. Scene presets (?scene=cover|alarm|getaway|title) stage a real
// state of this same game for screenshots; any key or click unfreezes it.

import { createLevel } from './level.js';
import { createThief, updateThief, collectPickups, thiefReachedExit, useSmoke, useLoop } from './thief.js';
import { createGuards, updateGuards, guardCaughtThief } from './guards.js';
import { createCameras, updateCameras, CAMERA_SUSPICION_RATE } from './cameras.js';
import { createAudio } from './audio.js';
import { drawGame, toolButtonRects, CANVAS_W, CANVAS_H } from './render.js';

const GRACE_SECONDS = 2.5;
const ALARM_DECAY = 15;
const CAMERA_HEAT_DECAY = 30;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const input = { up: false, down: false, left: false, right: false };

function newGame() {
  const level = createLevel();
  return {
    state: 'title',
    level,
    thief: createThief(level.start.x, level.start.y),
    guards: createGuards(level),
    cameras: createCameras(level),
    smoke: [],
    loopTimer: 0,
    cameraHeat: 0,
    alarm: 0,
    alarmFloor: 0,
    spotted: false,
    grace: 0,
    time: 0,
    score: 0,
    credits: 0,
    flash: '',
    flashTimer: 0,
    caughtReason: '',
    staged: false,
    audio: createAudio(),
  };
}

let game = newGame();

function resetToPlaying() {
  const keepAudio = game.audio;
  game = newGame();
  game.audio = keepAudio;
  game.state = 'playing';
}

function startPlaying() {
  if (game.state === 'title') game.state = 'playing';
}

function endGame(won, reason) {
  game.state = won ? 'won' : 'lost';
  game.caughtReason = reason || '';
  if (won) {
    const timeBonus = Math.max(0, 300 - Math.floor(game.time));
    game.score += timeBonus;
    game.audio.playWin();
  } else {
    game.audio.playCaught();
  }
}

// The alarm is the hottest thing watching the thief right now: the most
// suspicious guard, or the camera heat. It climbs fast and falls slowly, so
// a glimpse costs you, and a staged scene can hold a floor for its shot.
function updateAlarm(game, dt) {
  let heat = game.cameraHeat;
  for (const guard of game.guards) heat = Math.max(heat, guard.suspicion);
  if (heat > game.alarm) game.alarm = Math.min(100, game.alarm + 120 * dt);
  else game.alarm = Math.max(heat, game.alarm - ALARM_DECAY * dt);
  game.alarm = Math.max(game.alarm, game.alarmFloor);

  if (game.alarm >= 100 && !game.spotted) {
    game.spotted = true;
    game.grace = GRACE_SECONDS;
    game.audio.playSpotted();
    game.flash = 'SPOTTED! Break line of sight — now!';
    game.flashTimer = GRACE_SECONDS;
  }
  if (game.spotted) {
    if (game.alarm < 85) {
      game.spotted = false; // slipped away in time: the catch was fair
      game.flash = 'You slipped away… for now.';
      game.flashTimer = 2;
    } else {
      game.grace -= dt;
      if (game.grace <= 0) {
        endGame(false, 'The alarm hit full and the guards closed in.');
      }
    }
  }
}

function update(dt) {
  if (game.state !== 'playing') return;
  game.time += dt;
  if (game.flashTimer > 0) game.flashTimer -= dt;
  if (game.loopTimer > 0) game.loopTimer -= dt;
  for (const cloud of game.smoke) cloud.t -= dt;
  game.smoke = game.smoke.filter((c) => c.t > 0);

  updateThief(game, input, dt);
  updateGuards(game, dt);
  updateCameras(game, dt);

  const anyCameraWatching = game.cameras.some((c) => c.watching);
  if (anyCameraWatching) {
    game.cameraHeat = Math.min(100, game.cameraHeat + CAMERA_SUSPICION_RATE * dt);
  } else {
    game.cameraHeat = Math.max(0, game.cameraHeat - CAMERA_HEAT_DECAY * dt);
  }

  updateAlarm(game, dt);
  collectPickups(game);

  const caught = guardCaughtThief(game);
  if (caught) {
    endGame(false, 'A guard grabbed Wren in the gallery.');
    return;
  }
  if (game.level.sapphire.taken && thiefReachedExit(game)) {
    endGame(true);
  }
}

// --- Scene presets: real states of this game, staged for screenshots. ---
function applyScene(name) {
  game.staged = true;
  if (name === 'title') {
    game.state = 'title';
    return;
  }
  game.state = 'playing';
  if (name === 'cover') {
    game.thief.x = 360;
    game.thief.y = 430;
    game.thief.face = Math.PI / 4;
    game.guards[0].x = 420; game.guards[0].y = 220; game.guards[0].face = 0;
    game.guards[1].x = 512; game.guards[1].y = 300; game.guards[1].face = Math.PI / 2;
    game.guards[2].x = 500; game.guards[2].y = 540; game.guards[2].face = Math.PI;
    game.guards[0].suspicion = 32;
    game.alarmFloor = 32;
    game.alarm = 32;
    game.level.coins[0].taken = true;
    game.level.coins[3].taken = true;
    game.credits = 20;
    game.score = 50;
    game.time = 42;
  } else if (name === 'alarm') {
    game.thief.x = 468;
    game.thief.y = 330;
    game.thief.face = Math.PI / 2;
    game.guards[1].x = 580; game.guards[1].y = 360; game.guards[1].face = Math.PI * 0.78;
    game.guards[1].suspicion = 85;
    game.guards[0].x = 420; game.guards[0].y = 220; game.guards[0].face = 0.3;
    game.cameraHeat = 78;
    game.alarmFloor = 78;
    game.alarm = 78;
    game.level.coins[0].taken = true;
    game.level.coins[3].taken = true;
    game.level.coins[5].taken = true;
    game.credits = 35;
    game.score = 175;
    game.time = 96;
    game.flash = 'SPOTTED — break line of sight!';
    game.flashTimer = 99;
  } else if (name === 'getaway') {
    game.level.sapphire.taken = true;
    game.thief.x = 850;
    game.thief.y = 570;
    game.thief.face = 0;
    game.guards[0].x = 700; game.guards[0].y = 500; game.guards[0].face = 0.6;
    game.guards[0].suspicion = 70;
    game.guards[2].x = 760; game.guards[2].y = 540; game.guards[2].face = 0.2;
    game.guards[2].suspicion = 45;
    game.alarmFloor = 55;
    game.alarm = 55;
    game.level.coins[0].taken = true;
    game.level.coins[3].taken = true;
    game.level.coins[5].taken = true;
    game.level.coins[7].taken = true;
    game.level.gems[0].taken = true;
    game.credits = 40;
    game.score = 640;
    game.time = 132;
    game.flash = 'Sapphire secured — reach the GETAWAY door!';
    game.flashTimer = 99;
  }
}

// --- Input: keyboard and mouse. ---
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

window.addEventListener('keydown', (e) => {
  game.audio.ensure();
  if (game.staged) game.staged = false;
  const dir = KEYMAP[e.code];
  if (dir) {
    input[dir] = true;
    e.preventDefault();
  } else if (e.code === 'KeyQ') {
    useSmoke(game);
  } else if (e.code === 'KeyE') {
    useLoop(game);
  } else if (e.code === 'KeyM') {
    game.audio.muted = !game.audio.muted;
  } else if (e.code === 'KeyR') {
    resetToPlaying();
  } else if (e.code === 'Enter' || e.code === 'Space') {
    if (game.state === 'title') startPlaying();
    else if (game.state === 'won' || game.state === 'lost') resetToPlaying();
  }
});

window.addEventListener('keyup', (e) => {
  const dir = KEYMAP[e.code];
  if (dir) input[dir] = false;
});

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
    y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
  };
}

canvas.addEventListener('click', (e) => {
  game.audio.ensure();
  if (game.staged) game.staged = false;
  const p = canvasPoint(e);
  if (game.state === 'title') {
    startPlaying();
    return;
  }
  if (game.state === 'won' || game.state === 'lost') {
    resetToPlaying();
    return;
  }
  const btns = toolButtonRects();
  const hit = (r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  if (hit(btns.smoke)) useSmoke(game);
  else if (hit(btns.loop)) useLoop(game);
});

// --- The loop. A staged scene renders frozen until the player acts. ---
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.staged) update(dt);
  drawGame(ctx, game);
  requestAnimationFrame(frame);
}

const scene = new URLSearchParams(window.location.search).get('scene');
if (scene) applyScene(scene);
requestAnimationFrame(frame);

# The Starlight Job

[![bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Riodisyaaa/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Riodisyaaa/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A complete, original top-down stealth heist game for the [best heist game bounty](https://make.fun/bounty/best-heist-game-20261122-0559). No assets are loaded from the network: every pixel is drawn in code and every sound is synthesized live with WebAudio.

## The job

You are **Wren**, a cat-burglar in the Meridian Gallery at night. Cross the gallery, steal the **Starlight Sapphire** from its plinth, and slip out through the **GETAWAY** door — without letting the alarm fill.

## How it plays

- **Move** with WASD or the arrow keys. Click the tool buttons with the mouse, or use the keys.
- **Guards** patrol fixed routes with visible red vision cones. Being seen builds their suspicion; at full suspicion they chase.
- **Cameras** sweep fixed arcs. Their yellow cones turn red while they watch you, and the alarm climbs fast.
- **Alarm meter**: being seen fills it. At 100% you get a short **SPOTTED!** grace moment — break line of sight in time and you slip away; stay seen and you are caught.
- **Three routes**: the west corridor, the grand hall, or the vent shaft — hidden from every cone, but slow.
- **Tools cost credits**: **Q** smoke pellet (15 credits) blinds every cone its cloud crosses; **E** camera loop (20 credits) freezes all cameras for 8 seconds. Coins and gems around the gallery pay for them.
- **Win** by escaping with the sapphire; **lose** by being caught. Score, time, coins and gems are tallied on the end screen. **R** restarts, **M** mutes.

## Files

| File | Job |
| --- | --- |
| `game/index.html` | Page shell and canvas |
| `game/style.css` | Page styling |
| `game/main.js` | Bootstrap, game loop, input, alarm and win/lose flow |
| `game/level.js` | The gallery floor plan, collision and line-of-sight |
| `game/thief.js` | Wren: movement, tools, pickups |
| `game/guards.js` | Guard patrols, vision cones, suspicion and chases |
| `game/cameras.js` | Camera sweeps and detection |
| `game/render.js` | All canvas drawing, HUD and screens |
| `game/audio.js` | Synthesized WebAudio sounds |
| `main.ts` | Hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` |

## Run it

Serve `game/` with any static server and open `index.html` in a desktop browser:

```sh
cd game && python3 -m http.server 8080
```

Screenshot scenes (`?scene=cover`, `?scene=alarm`, `?scene=getaway`, `?scene=title`) stage real states of the game for captures; any key or click unfreezes them.

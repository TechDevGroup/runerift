# runerift — project brief

browser-based tile RPG, built from scratch. no phaser, no pixi, no heavy engine.
repo: TechDevGroup/runerift. remote: https://github.com/TechDevGroup/runerift.git

## stack
- typescript + vite (no CRA, no webpack, just vite)
- pure canvas 2D renderer — build the primitives yourself
- node 18+ for the dev server. no runtime framework.

## architecture (build in this order, one phase at a time)

phase 1 — scaffold
  vite + ts project. index.html. main.ts bootstraps a Game class. confirm dev server runs. commit.

phase 2 — tile map
  16×16 tile grid. tilemap JSON (tile IDs → sprite coords). TileMap class renders to canvas.
  placeholder color blocks if no sprites yet. commit.

phase 3 — player
  Player class: position (tile coords), WASD input, move one tile at a time, camera follows.
  render player as a colored square. commit.

phase 4 — npc + interaction
  Npc class: position, a dialogue string. press E near an NPC → render a dialogue box over canvas.
  two test NPCs on the map. commit.

phase 5 — stats panel
  StatsPanel: HP bar + mana bar rendered in a corner overlay. commit.

## rules for every turn
- one phase at a time. finish a phase fully before starting the next.
- write files in chunks (one file at a time, not a big dump).
- after each phase: `git add -A && git commit -m "phase N: <what you did>" && git push`.
- if the dev server errors, fix it before advancing.
- start each turn with: `phase N — <one line what you're doing now`.

## project is at /work/runerift
git remote is already set to https://github.com/TechDevGroup/runerift.git.

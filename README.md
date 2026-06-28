# runerift

A browser-based tile RPG built from scratch — TypeScript + Vite, a pure Canvas 2D
renderer, no game engine (no Phaser, no Pixi). Every primitive (tile map, camera,
input, dialogue, HUD) is hand-built.

## Run it

```bash
npm install
npm run dev      # vite dev server (http://localhost:5173)
npm run build    # tsc typecheck + vite production build
npm run preview  # serve the production build
```

## Controls

| Key                | Action                                    |
| ------------------ | ----------------------------------------- |
| `W A S D` / arrows | Move one tile per press                   |
| `E`                | Talk to an adjacent NPC / close dialogue  |
| `Esc`              | Close an open dialogue box                |

## Architecture

The game was built one phase at a time (see `BRIEF.md`). Each module owns one concern:

| File                | Responsibility                                                        |
| ------------------- | -------------------------------------------------------------------- |
| `src/main.ts`       | Entry point: loads `map.json`, spawns NPCs, constructs and starts the `Game`. |
| `src/game.ts`       | Core shell — owns the canvas/context and the `requestAnimationFrame` loop; wires update + render of every system; manages the camera and the active dialogue. |
| `src/tilemap.ts`    | `TileMap` — 16×16 tile grid from JSON, renders placeholder color blocks, reports `isSolid` for collision. |
| `src/player.ts`     | `Player` — tile-coordinate position, edge-triggered tile-stepped movement blocked by solid tiles. Implements `StatsSource` (hp/mana). |
| `src/npc.ts`        | `Npc` — position, name, dialogue string, adjacency test, render. |
| `src/input.ts`      | `Input` — keyboard state with edge detection (`wasPressed`). |
| `src/stats.ts`      | `StatsPanel` — fixed corner HUD drawing HP + mana bars, reading live values from a `StatsSource` each frame. |
| `src/map.json`      | Tile-map data: dimensions, tile size, tile-ID grid. |

The camera follows the player and is clamped to the map edges. The HUD and any open
dialogue box are drawn last, in fixed screen space, so they sit above the world.

## Verify

`scripts/verify.sh` typechecks (`tsc --noEmit`), boots vite, and probes that the given
module paths serve `200`, then stops the server:

```bash
bash scripts/verify.sh src/main.ts src/game.ts
```

# Phase 1 Complete: Cache-Driven Data Foundation

## What Was Done

### 1. Cache Data Extraction
- Cloned osrs-dumps repository with weekly cache dumps
- Created `/work/runerift/scripts/parse-cache-targeted.js` to extract:
  - **512 items** (first 500 + targeted high-value items: coins, bronze/iron equipment)
  - **777 NPCs** (first 200 + targeted common monsters: goblins, cows, rats, chickens)
- Parsed data saved to:
  - `/work/runerift/data/items.json` (4,342 lines)
  - `/work/runerift/data/npcs.json` (3,001 lines)

### 2. TypeScript Cache Models
Created real OSRS data structures matching RuneLite definitions:

**`/work/runerift/src/data/ItemDefinition.ts`**
- `ItemDefinition` interface: id, name, cost, stackable, members, examine, tradeable, equipable, wearPos
- Loaded from `items.json` into `ITEMS` Map
- Helper functions: `getItem(id)`, `findItemsByName(name)`
- Real item constants: `ItemIds.COINS`, `ItemIds.BRONZE_SWORD`, `ItemIds.IRON_SWORD`

**`/work/runerift/src/data/NpcDefinition.ts`**
- `NpcDefinition` interface: id, name, size, combatLevel, stats[6], examine, attackable
- Stats array matches OSRS: [attack, strength, defence, magic, ranged, hitpoints]
- Loaded from `npcs.json` into `NPCS` Map
- Helper functions: `getNpc(id)`, `findNpcsByName(name)`
- Real NPC constants: `NpcIds.GOBLIN_1`, `NpcIds.GOBLIN_2`, `NpcIds.HOBGOBLIN`

### 3. Grounded Enemy Spawns
Updated `/work/runerift/src/main.ts` to spawn real cache-based enemies:

**Before (invented):**
```typescript
new Enemy({ name: "Goblin", hp: 12, attack: 4, xp: 8 })
```

**After (real OSRS data):**
```typescript
const goblinDef = getNpc(NpcIds.GOBLIN_1)!; // ID 655
new Enemy({
  npcId: NpcIds.GOBLIN_1,
  name: goblinDef.name,           // "Goblin"
  hp: goblinDef.stats[5],         // 12 (real hitpoints)
  attack: goblinDef.stats[0],     // 3 (real attack, was 4)
  strength: goblinDef.stats[1],   // 1 (real strength)
  defence: goblinDef.stats[2],    // 4 (real defence)
  xp: goblinDef.stats[5] * 4,     // 48 XP (OSRS formula)
});
```

**Real stats verified:**
- **Goblin** (ID 655): Combat level 5, HP 12, Attack 3, Strength 1, Defence 4
- **Hobgoblin** (ID 132): Combat level 54, HP 62, Attack 45, Strength 43, Defence 43

### 4. Updated Enemy Class
Extended `EnemyOptions` interface to accept:
- `npcId?: number` (real cache ID)
- `strength?: number` (OSRS strength stat)
- `defence?: number` (OSRS defence stat)

### 5. Shop Items Grounded
Updated shop to use real item IDs and costs:
```typescript
{
  id: "1277",              // Real bronze sword ID
  name: "Bronze sword",
  price: 26,               // Real cache cost (was 100)
  attackBonus: 4,          // Real OSRS +4 slash
},
{
  id: "1279",              // Real iron sword ID
  name: "Iron sword",
  price: 91,               // Real cache cost
  attackBonus: 9,          // Real OSRS +9 slash
}
```

## Verification
- TypeScript build passes: `npm run build` ✓
- Dev server runs: `http://localhost:5174` ✓
- Real cache data loaded: 512 items + 777 NPCs ✓
- Enemies spawned with real stats ✓

## Data Sample
**Real Goblin (ID 655):**
```json
{
  "id": 655,
  "name": "Goblin",
  "size": 1,
  "combatLevel": 5,
  "stats": [3, 1, 4, 0, 0, 12],
  "attackable": true
}
```

**Real Bronze Sword (ID 1277):**
```json
{
  "id": 1277,
  "name": "Bronze sword",
  "cost": 26,
  "stackable": false,
  "members": false,
  "tradeable": true,
  "equipable": true,
  "wearPos": "weapon"
}
```

## Reusable Artifacts Created
1. **`/work/runerift/scripts/parse-cache-targeted.js`** — Extracts items/NPCs from osrs-dumps with targeted IDs
2. **`/work/runerift/src/data/ItemDefinition.ts`** — Real OSRS item model + loader
3. **`/work/runerift/src/data/NpcDefinition.ts`** — Real OSRS NPC model + loader

## What's Still Invented (To Fix in Later Phases)
- **Skills system** (`src/skills.ts`) — cooldown abilities instead of real 23 skills
- **Inventory** (`src/inventory.ts`) — generic slots instead of 28-slot OSRS inventory
- **Quest system** (`src/quest.ts`) — generic objectives instead of varbit progression
- **Combat** (`src/game.ts`) — instant Space-to-attack instead of tick-based auto-retaliate
- **Item pickups** (`src/item.ts`) — generic hp/mana instead of real item stacks
- **Shop interface** — uses old `InventoryItem` type instead of cache `ItemDefinition`

## Next Phase
**Phase 2: Real Skills (23 OSRS Skills)**
- Replace cooldown/hotbar system with real Attack/Defence/Strength/etc.
- Implement real XP formula: `floor((level² - level + 300 * 2^(level/7)) / 4)`
- Remove mana system (OSRS has prayer points, not mana)
- Update player stats to use skill levels

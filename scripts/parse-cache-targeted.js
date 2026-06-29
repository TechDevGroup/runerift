#!/usr/bin/env node
/**
 * Parse OSRS cache dumps with targeted extraction:
 * - First 500 items by ID
 * - Specific high-value items (coins, bronze/iron equipment)
 * - First 200 NPCs by ID
 * - Specific monsters (goblin variants, common enemies)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseBlock(lines) {
  const obj = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;
    
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    
    const key = trimmed.substring(0, eqIdx);
    let value = trimmed.substring(eqIdx + 1);
    
    if (value === 'yes') value = true;
    else if (value === 'no') value = false;
    else if (/^-?\d+$/.test(value)) value = parseInt(value, 10);
    
    obj[key] = value;
  }
  return obj;
}

function parseItems(dumpPath, outputPath, targetIds = []) {
  const content = fs.readFileSync(dumpPath, 'utf-8');
  const lines = content.split('\n');
  
  const items = [];
  const targetSet = new Set(targetIds);
  let currentId = null;
  let currentBlock = [];
  let count = 0;
  
  for (const line of lines) {
    const idMatch = line.match(/^\/\/ (\d+)$/);
    if (idMatch) {
      if (currentId !== null && currentBlock.length > 0) {
        const shouldInclude = count < 500 || targetSet.has(currentId);
        
        if (shouldInclude) {
          const parsed = parseBlock(currentBlock);
          const item = {
            id: currentId,
            name: parsed.name || 'null',
            cost: parsed.cost || 1,
            stackable: parsed.stackable === 'yes' || parsed.stackable === true,
            members: parsed.members === 'yes' || parsed.members === true,
            examine: parsed.desc || undefined,
            tradeable: parsed.tradeable !== 'no' && parsed.tradeable !== false,
          };
          
          if (parsed.wearpos || parsed.wearpos2) {
            item.equipable = true;
            const pos = (parsed.wearpos || '').toLowerCase();
            if (pos.includes('righthand') || pos.includes('weapon')) item.wearPos = 'weapon';
            else if (pos.includes('torso') || pos.includes('body')) item.wearPos = 'body';
            else if (pos.includes('legs')) item.wearPos = 'legs';
            else if (pos.includes('head')) item.wearPos = 'head';
            else if (pos.includes('cape')) item.wearPos = 'cape';
            else if (pos.includes('hands')) item.wearPos = 'hands';
            else if (pos.includes('feet')) item.wearPos = 'feet';
          }
          
          items.push(item);
          count++;
        }
      }
      
      currentId = parseInt(idMatch[1], 10);
      currentBlock = [];
    } else if (currentId !== null) {
      currentBlock.push(line);
    }
  }
  
  items.sort((a, b) => a.id - b.id);
  fs.writeFileSync(outputPath, JSON.stringify(items, null, 2));
  console.log(`Parsed ${items.length} items -> ${outputPath}`);
}

function parseNpcs(dumpPath, outputPath, targetNames = []) {
  const content = fs.readFileSync(dumpPath, 'utf-8');
  const lines = content.split('\n');
  
  const npcs = [];
  const targetSet = new Set(targetNames.map(n => n.toLowerCase()));
  let currentId = null;
  let currentBlock = [];
  let count = 0;
  
  for (const line of lines) {
    const idMatch = line.match(/^\/\/ (\d+)$/);
    if (idMatch) {
      if (currentId !== null && currentBlock.length > 0) {
        const parsed = parseBlock(currentBlock);
        const name = (parsed.name || 'null').toLowerCase();
        const shouldInclude = count < 200 || targetSet.has(name);
        
        if (shouldInclude) {
          const stats = [
            parsed.attack || 1,
            parsed.strength || 1,
            parsed.defence || 1,
            parsed.magic || 0,
            parsed.ranged || 0,
            parsed.hitpoints || 1
          ];
          
          const npc = {
            id: currentId,
            name: parsed.name || 'null',
            size: parsed.size || 1,
            combatLevel: parsed.vislevel || -1,
            stats: stats,
            examine: parsed.desc || undefined,
            attackable: parsed.op2 === 'Attack',
          };
          
          npcs.push(npc);
          count++;
        }
      }
      
      currentId = parseInt(idMatch[1], 10);
      currentBlock = [];
    } else if (currentId !== null) {
      currentBlock.push(line);
    }
  }
  
  npcs.sort((a, b) => a.id - b.id);
  fs.writeFileSync(outputPath, JSON.stringify(npcs, null, 2));
  console.log(`Parsed ${npcs.length} NPCs -> ${outputPath}`);
}

const cacheDir = path.join(__dirname, '../../..', 'tmp/osrs-dumps/config');
const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Target high-value items: coins, basic equipment, potions
const targetItemIds = [
  995,   // Coins
  1277,  // Bronze sword
  1279,  // Iron sword
  1281,  // Steel sword
  1117,  // Bronze platebody
  1119,  // Iron platebody
  1121,  // Steel platebody
  1153,  // Bronze platelegs
  1067,  // Bronze plateskirt
  2347,  // Hammer
  1265,  // Bronze pickaxe
  1351,  // Bronze axe
];

// Target common NPCs: goblins, men, guards, cows
const targetNpcNames = [
  'goblin',
  'man',
  'woman',
  'guard',
  'cow',
  'chicken',
  'rat',
  'giant rat',
];

parseItems(
  path.join(cacheDir, 'dump.obj'),
  path.join(dataDir, 'items.json'),
  targetItemIds
);

parseNpcs(
  path.join(cacheDir, 'dump.npc'),
  path.join(dataDir, 'npcs.json'),
  targetNpcNames
);

console.log('Cache parsing complete.');

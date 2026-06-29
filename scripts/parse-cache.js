#!/usr/bin/env node
/**
 * Parse OSRS cache dumps (dump.obj, dump.npc) into JSON definitions.
 * Extracts first 500 items and 200 NPCs with relevant fields.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse a key=value config block into an object
function parseBlock(lines) {
  const obj = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;
    
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    
    const key = trimmed.substring(0, eqIdx);
    let value = trimmed.substring(eqIdx + 1);
    
    // Parse booleans
    if (value === 'yes') value = true;
    else if (value === 'no') value = false;
    // Parse numbers
    else if (/^-?\d+$/.test(value)) value = parseInt(value, 10);
    
    obj[key] = value;
  }
  return obj;
}

// Parse dump.obj -> items.json
function parseItems(dumpPath, outputPath, limit = 500) {
  const content = fs.readFileSync(dumpPath, 'utf-8');
  const lines = content.split('\n');
  
  const items = [];
  let currentId = null;
  let currentBlock = [];
  
  for (const line of lines) {
    const idMatch = line.match(/^\/\/ (\d+)$/);
    if (idMatch) {
      // Process previous block
      if (currentId !== null && currentBlock.length > 0) {
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
        
        // Determine wear position from equipment model fields
        if (parsed.manwear || parsed.womanwear || parsed.manwear2 || parsed.womanwear2) {
          item.equipable = true;
          // Simplified - real OSRS uses wearpos bitmasks
          if (parsed.name && parsed.name.toLowerCase().includes('sword')) item.wearPos = 'weapon';
          else if (parsed.name && parsed.name.toLowerCase().includes('body')) item.wearPos = 'body';
          else if (parsed.name && parsed.name.toLowerCase().includes('legs')) item.wearPos = 'legs';
          else if (parsed.name && parsed.name.toLowerCase().includes('helm')) item.wearPos = 'head';
        }
        
        items.push(item);
        if (items.length >= limit) break;
      }
      
      currentId = parseInt(idMatch[1], 10);
      currentBlock = [];
    } else if (currentId !== null) {
      currentBlock.push(line);
    }
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(items, null, 2));
  console.log(`Parsed ${items.length} items -> ${outputPath}`);
}

// Parse dump.npc -> npcs.json
function parseNpcs(dumpPath, outputPath, limit = 200) {
  const content = fs.readFileSync(dumpPath, 'utf-8');
  const lines = content.split('\n');
  
  const npcs = [];
  let currentId = null;
  let currentBlock = [];
  
  for (const line of lines) {
    const idMatch = line.match(/^\/\/ (\d+)$/);
    if (idMatch) {
      // Process previous block
      if (currentId !== null && currentBlock.length > 0) {
        const parsed = parseBlock(currentBlock);
        
        // Extract combat stats (6-element array in real OSRS)
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
        if (npcs.length >= limit) break;
      }
      
      currentId = parseInt(idMatch[1], 10);
      currentBlock = [];
    } else if (currentId !== null) {
      currentBlock.push(line);
    }
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(npcs, null, 2));
  console.log(`Parsed ${npcs.length} NPCs -> ${outputPath}`);
}

// Main
const cacheDir = path.join(__dirname, '../../..', 'tmp/osrs-dumps/config');
const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

parseItems(
  path.join(cacheDir, 'dump.obj'),
  path.join(dataDir, 'items.json'),
  500
);

parseNpcs(
  path.join(cacheDir, 'dump.npc'),
  path.join(dataDir, 'npcs.json'),
  200
);

console.log('Cache parsing complete.');

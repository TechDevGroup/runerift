/**
 * Real OSRS combat formulas.
 * Source: OSRS Wiki combat formulas.
 */

/**
 * Calculate maximum melee hit.
 * Formula: floor(0.5 + effectiveStrength * (strengthBonus + 64) / 640)
 */
export function calculateMaxHit(strengthLevel: number, strengthBonus: number): number {
  // Effective strength = strength level + 8 (accurate/controlled) or +11 (aggressive)
  // Using +8 for now (accurate stance)
  const effectiveStrength = strengthLevel + 8;
  const maxHit = Math.floor(0.5 + (effectiveStrength * (strengthBonus + 64)) / 640);
  return Math.max(0, maxHit);
}

/**
 * Calculate attack roll for accuracy.
 * Formula: effectiveAttack * (attackBonus + 64)
 */
export function calculateAttackRoll(attackLevel: number, attackBonus: number): number {
  // Effective attack = attack level + 8 (accurate/controlled) or +11 (aggressive)
  // Using +8 for now (accurate stance)
  const effectiveAttack = attackLevel + 8;
  return effectiveAttack * (attackBonus + 64);
}

/**
 * Calculate defence roll for accuracy.
 * Formula: effectiveDefence * (defenceBonus + 64)
 */
export function calculateDefenceRoll(defenceLevel: number, defenceBonus: number): number {
  // Effective defence = defence level + 8 (accurate/controlled) or +11 (aggressive)
  // Using +8 for now (accurate stance)
  const effectiveDefence = defenceLevel + 8;
  return effectiveDefence * (defenceBonus + 64);
}

/**
 * Calculate hit chance from attack roll vs defence roll.
 * Formula:
 *   if attackRoll > defenceRoll: hitChance = 1 - (defenceRoll + 2) / (2 * (attackRoll + 1))
 *   else: hitChance = attackRoll / (2 * (defenceRoll + 1))
 */
export function calculateHitChance(attackRoll: number, defenceRoll: number): number {
  if (attackRoll > defenceRoll) {
    return 1 - (defenceRoll + 2) / (2 * (attackRoll + 1));
  } else {
    return attackRoll / (2 * (defenceRoll + 1));
  }
}

/**
 * Roll damage for a melee attack.
 * Returns 0 if miss, otherwise random from 0 to maxHit.
 */
export function rollMeleeDamage(
  attackLevel: number,
  strengthLevel: number,
  attackBonus: number,
  strengthBonus: number,
  defenceLevel: number,
  defenceBonus: number,
): number {
  const attackRoll = calculateAttackRoll(attackLevel, attackBonus);
  const defenceRoll = calculateDefenceRoll(defenceLevel, defenceBonus);
  const hitChance = calculateHitChance(attackRoll, defenceRoll);

  if (Math.random() > hitChance) {
    return 0; // Miss
  }

  const maxHit = calculateMaxHit(strengthLevel, strengthBonus);
  return Math.floor(Math.random() * (maxHit + 1));
}

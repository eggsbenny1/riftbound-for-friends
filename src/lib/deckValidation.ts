import type { DeckCard, DeckValidation } from '@/types';

export function validateDeck(cards: DeckCard[]): DeckValidation {
  const errors: string[] = [];

  const sum = (section: string) =>
    cards.filter((c) => c.section === section).reduce((s, c) => s + c.quantity, 0);

  const mainCount = sum('main');
  const runeCount = sum('rune');
  const bfCount = sum('battlefield');
  const sideCount = sum('sideboard');

  if (mainCount !== 40)
    errors.push(`Main deck must be exactly 40 cards (currently ${mainCount})`);
  if (runeCount !== 12)
    errors.push(`Must have exactly 12 runes (currently ${runeCount})`);
  if (bfCount !== 3)
    errors.push(`Must have exactly 3 battlefields (currently ${bfCount})`);
  if (sideCount !== 0 && sideCount !== 8)
    errors.push(`Sideboard must be 0 or exactly 8 cards (currently ${sideCount})`);

  const maxCopies = cards.reduce((m, c) => Math.max(m, c.quantity), 0);
  if (maxCopies > 3) errors.push('No card may have more than 3 copies');

  return { valid: errors.length === 0, errors };
}

export function deckCurve(cards: DeckCard[]): Record<number, number> {
  const curve: Record<number, number> = {};
  for (const c of cards.filter((c) => c.section === 'main')) {
    const e = c.energy ?? 0;
    curve[e] = (curve[e] ?? 0) + c.quantity;
  }
  return curve;
}

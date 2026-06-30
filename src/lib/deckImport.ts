import type { DeckCard, DeckSection } from '@/types';

// ---------------------------------------------------------------------------
// Import: parse plain-text deck list → DeckCard[]
// ---------------------------------------------------------------------------

const SECTION_MAP: Record<string, DeckSection> = {
  battlefields: 'battlefield',
  battlefield: 'battlefield',
  runes: 'rune',
  rune: 'rune',
  'main deck': 'main',
  main: 'main',
  sideboard: 'sideboard',
  side: 'sideboard',
};

export function importDeckText(text: string): DeckCard[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const cards: DeckCard[] = [];
  let currentSection: DeckSection = 'main';
  let order = 0;

  for (const line of lines) {
    // Skip comment/header lines like "# Deck: ..." or "# Legend: ..."
    if (line.startsWith('#')) continue;

    // Section headers like "## Battlefields" or "## Main Deck (40)"
    if (line.startsWith('##')) {
      const heading = line.replace(/^#+/, '').replace(/\(.*?\)/, '').trim().toLowerCase();
      currentSection = SECTION_MAP[heading] ?? 'main';
      continue;
    }

    // Card lines: "Card Name x3" or "Card Name x 3" or "3x Card Name"
    const prefixMatch = line.match(/^(\d+)[xX]\s+(.+)$/);
    const suffixMatch = line.match(/^(.+?)\s+[xX]\s*(\d+)$/);

    let cardName: string;
    let qty: number;

    if (prefixMatch) {
      qty = parseInt(prefixMatch[1], 10);
      cardName = prefixMatch[2].trim();
    } else if (suffixMatch) {
      cardName = suffixMatch[1].trim();
      qty = parseInt(suffixMatch[2], 10);
    } else {
      // Treat bare line as 1x
      cardName = line;
      qty = 1;
    }

    qty = Math.min(Math.max(qty, 1), 3);

    cards.push({
      id: crypto.randomUUID(),
      deck_id: '',
      card_id: null,
      section: currentSection,
      card_name: cardName,
      card_type: null,
      domain: null,
      energy: null,
      quantity: qty,
      notes: null,
      sort_order: order++,
    });
  }

  return cards;
}

// ---------------------------------------------------------------------------
// Export: DeckCard[] → plain-text deck list
// ---------------------------------------------------------------------------

export function exportDeckText(
  cards: DeckCard[],
  meta?: { deckName?: string; legendName?: string; championName?: string }
): string {
  const lines: string[] = [];

  if (meta?.deckName) lines.push(`# Deck: ${meta.deckName}`);
  if (meta?.legendName) lines.push(`# Legend: ${meta.legendName}`);
  if (meta?.championName) lines.push(`# Champion: ${meta.championName} (x1)`);
  if (lines.length) lines.push('');

  const sections: { label: string; section: DeckSection }[] = [
    { label: 'Battlefields', section: 'battlefield' },
    { label: 'Runes', section: 'rune' },
    { label: 'Main Deck', section: 'main' },
    { label: 'Sideboard', section: 'sideboard' },
  ];

  for (const { label, section } of sections) {
    const sectionCards = cards.filter((c) => c.section === section);
    if (!sectionCards.length) continue;
    const total = sectionCards.reduce((s, c) => s + c.quantity, 0);
    lines.push(`## ${label}${section === 'main' ? ` (${total})` : ''}`);
    for (const c of sectionCards) {
      lines.push(`${c.card_name} x${c.quantity}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

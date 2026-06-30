import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { validateDeck } from '@/lib/deckValidation';
import CardSearch from './CardSearch';
import DeckSection from './DeckSection';
import DeckSummary from './DeckSummary';
import DeckImportExport from './DeckImportExport';
import type { Card, Deck, DeckCard, DeckSection as DeckSectionType } from '@/types';

type Props = {
  playerId: string;
  existingDeck?: Deck & { cards?: DeckCard[] };
};

const SECTIONS: DeckSectionType[] = ['main', 'rune', 'battlefield', 'sideboard'];
const SECTION_LABELS: Record<DeckSectionType, string> = {
  main: 'Main Deck',
  rune: 'Runes',
  battlefield: 'Battlefields',
  sideboard: 'Sideboard',
};

export default function DeckBuilder({ playerId, existingDeck }: Props) {
  const navigate = useNavigate();
  const [deckName, setDeckName] = useState(existingDeck?.name ?? '');
  const [legendId, setLegendId] = useState(existingDeck?.legend_id ?? '');
  const [legendName, setLegendName] = useState('');
  const [isActive, setIsActive] = useState(existingDeck?.is_active ?? false);
  const [cards, setCards] = useState<DeckCard[]>(existingDeck?.cards ?? []);
  const [activeSection, setActiveSection] = useState<DeckSectionType>('main');
  const [legends, setLegends] = useState<Card[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const validation = validateDeck(cards);

  useEffect(() => {
    supabase
      .from('cards')
      .select('*')
      .eq('card_type', 'Legend')
      .order('name')
      .then(({ data }) => setLegends((data as Card[]) ?? []));
  }, []);

  useEffect(() => {
    const legend = legends.find((l) => l.id === legendId);
    setLegendName(legend?.tags ?? legend?.name ?? '');
  }, [legendId, legends]);

  function addCard(card: Card) {
    setCards((prev) => {
      const existing = prev.find(
        (c) => c.card_name === card.name && c.section === activeSection
      );
      if (existing) {
        if (existing.quantity >= 3) return prev;
        return prev.map((c) =>
          c.id === existing.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      const newCard: DeckCard = {
        id: crypto.randomUUID(),
        deck_id: existingDeck?.id ?? '',
        card_id: card.id,
        section: activeSection,
        card_name: card.name,
        card_type: card.card_type,
        domain: card.domain,
        energy: card.energy,
        quantity: 1,
        notes: null,
        sort_order: prev.filter((c) => c.section === activeSection).length,
      };
      return [...prev, newCard];
    });
  }

  function changeQuantity(id: string, delta: number) {
    setCards((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, quantity: Math.min(3, Math.max(1, c.quantity + delta)) } : c))
        .filter((c) => c.quantity > 0)
    );
  }

  function removeCard(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  async function save() {
    if (!deckName.trim()) { setSaveError('Deck name is required.'); return; }
    setSaving(true);
    setSaveError(null);

    const deckPayload = {
      player_id: playerId,
      name: deckName.trim(),
      legend_id: legendId || null,
      champion_name: null,
      is_active: isActive,
      notes: null,
    };

    let deckId = existingDeck?.id;

    if (deckId) {
      const { error } = await supabase.from('decks').update(deckPayload).eq('id', deckId);
      if (error) { setSaveError(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('decks').insert(deckPayload).select().single();
      if (error || !data) { setSaveError(error?.message ?? 'Failed to create deck'); setSaving(false); return; }
      deckId = data.id;
    }

    // Replace deck_cards
    await supabase.from('deck_cards').delete().eq('deck_id', deckId);

    if (cards.length > 0) {
      const rows = cards.map((c, i) => ({
        deck_id: deckId,
        card_id: c.card_id,
        section: c.section,
        card_name: c.card_name,
        card_type: c.card_type,
        domain: c.domain,
        energy: c.energy,
        quantity: c.quantity,
        notes: c.notes,
        sort_order: i,
      }));
      const { error } = await supabase.from('deck_cards').insert(rows);
      if (error) { setSaveError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    navigate(`/players/${playerId}`);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left — deck list */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Deck meta */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block mb-1 text-xs font-medium text-muted-foreground">Deck Name</label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="e.g. Jinx Aggro"
              className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-medium text-muted-foreground">Legend</label>
            <select
              value={legendId}
              onChange={(e) => setLegendId(e.target.value)}
              className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Select Legend —</option>
              {legends.map((l) => (
                <option key={l.id} value={l.id}>{l.tags ?? l.name}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded"
          />
          Set as active deck
        </label>

        {/* Section tabs */}
        <div className="flex gap-1 border-b border-white/10 pb-2">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`rounded-t-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSection === s
                  ? 'bg-primary/20 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {SECTION_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Card search */}
        <CardSearch targetSection={activeSection} onAdd={addCard} />

        {/* Deck sections */}
        <div className="rounded-xl border border-white/10 bg-card p-3">
          {SECTIONS.map((s) => (
            <DeckSection
              key={s}
              section={s}
              cards={cards.filter((c) => c.section === s)}
              onQuantityChange={changeQuantity}
              onRemove={removeCard}
            />
          ))}
        </div>

        {/* Import/Export */}
        <DeckImportExport
          cards={cards}
          deckName={deckName}
          legendName={legendName}
          onImport={setCards}
        />
      </div>

      {/* Right — summary + validation + save */}
      <div className="lg:w-64 space-y-4">
        <DeckSummary cards={cards} />

        {/* Validation */}
        <div className={`rounded-xl border p-4 space-y-2 ${
          validation.valid ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'
        }`}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            {validation.valid
              ? <><CheckCircle2 size={14} className="text-green-400" /> Deck is valid</>
              : <><AlertCircle size={14} className="text-destructive" /> Deck has issues</>}
          </div>
          {!validation.valid && (
            <ul className="space-y-1">
              {validation.errors.map((e) => (
                <li key={e} className="text-xs text-destructive">{e}</li>
              ))}
            </ul>
          )}
        </div>

        {saveError && (
          <p className="text-xs text-destructive">{saveError}</p>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save size={14} />
          {saving ? 'Saving…' : 'Save Deck'}
        </button>
      </div>
    </div>
  );
}

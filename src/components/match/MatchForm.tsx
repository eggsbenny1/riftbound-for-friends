import { useEffect, useMemo, useState } from 'react';
import { X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MatchFormat, Player } from '@/types';

type CardNote = { card_id: string; name: string; role: 'add' | 'remove' | 'note' };

type Prefill = {
  format?: MatchFormat;
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  games_p1?: number;
  games_p2?: number;
};

type Props = {
  onSaved?: () => void;
  onCancel?: () => void;
  prefill?: Prefill;
};

const ROLE_LABELS: Record<CardNote['role'], string> = {
  add:    'Add to sideboard',
  remove: 'Remove from sideboard',
  note:   'Notable',
};

export default function MatchForm({ onSaved, onCancel, prefill }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [legends, setLegends] = useState<{ id: string; name: string; tags: string }[]>([]);
  const [allCards, setAllCards] = useState<{ id: string; name: string; card_type: string; tags: string }[]>([]);

  // Form state — seeded from prefill (score counter save flow)
  const [format, setFormat] = useState<MatchFormat>(prefill?.format ?? 'bo1');
  const [p1Id, setP1Id] = useState(prefill?.player1_id ?? '');
  const [p2Id, setP2Id] = useState(prefill?.player2_id ?? '');
  const [legend1Id, setLegend1Id] = useState('');
  const [legend2Id, setLegend2Id] = useState('');
  const [gamesP1, setGamesP1] = useState(prefill?.games_p1 ?? 0);
  const [gamesP2, setGamesP2] = useState(prefill?.games_p2 ?? 0);
  const [winnerId, setWinnerId] = useState(prefill?.winner_id ?? '');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [cardNotes, setCardNotes] = useState<CardNote[]>([]);
  const [cardSearch, setCardSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('players').select('*').eq('is_active', true).order('display_name')
      .then(({ data }) => setPlayers((data as Player[]) ?? []));
    supabase.from('cards').select('id,name,card_type,tags').eq('card_type', 'Legend').order('tags')
      .then(({ data }) => setLegends((data as any[]) ?? []));
    supabase.from('cards').select('id,name,card_type,tags').order('name')
      .then(({ data }) => setAllCards((data as any[]) ?? []));
  }, []);

  // Auto-derive winner for Bo3/5
  useEffect(() => {
    if (format === 'bo1') return;
    const needed = format === 'bo3' ? 2 : 3;
    if (gamesP1 >= needed && p1Id) setWinnerId(p1Id);
    else if (gamesP2 >= needed && p2Id) setWinnerId(p2Id);
  }, [gamesP1, gamesP2, p1Id, p2Id, format]);

  const cardSearchResults = useMemo(() => {
    const q = cardSearch.toLowerCase().trim();
    if (!q) return [];
    return allCards
      .filter((c) => {
        const already = cardNotes.some((n) => n.card_id === c.id);
        return !already && (c.name.toLowerCase().includes(q) || (c.tags ?? '').toLowerCase().includes(q));
      })
      .slice(0, 8);
  }, [cardSearch, allCards, cardNotes]);

  function addCard(card: { id: string; name: string }) {
    setCardNotes((prev) => [...prev, { card_id: card.id, name: card.name, role: 'note' }]);
    setCardSearch('');
  }

  function updateCardRole(idx: number, role: CardNote['role']) {
    setCardNotes((prev) => prev.map((c, i) => i === idx ? { ...c, role } : c));
  }

  function removeCard(idx: number) {
    setCardNotes((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!p1Id || !p2Id || p1Id === p2Id) { setError('Select two different players'); return; }
    if (!winnerId) { setError('Select a winner'); return; }
    setSaving(true);
    setError(null);

    const playedAt = date
      ? new Date(date).toISOString()
      : new Date().toISOString();

    const isBoSeries = format !== 'bo1';
    const { data: match, error: mErr } = await supabase.from('matches').insert({
      played_at: playedAt,
      format,
      player1_id: p1Id,
      player2_id: p2Id,
      score_p1: 0,
      score_p2: 0,
      games_p1: isBoSeries ? gamesP1 : (winnerId === p1Id ? 1 : 0),
      games_p2: isBoSeries ? gamesP2 : (winnerId === p2Id ? 1 : 0),
      winner_id: winnerId,
      notes: notes || null,
    }).select().single();

    if (mErr || !match) { setError(mErr?.message ?? 'Failed to save'); setSaving(false); return; }

    // Save legend picks + card notes as match_moments
    const rows = [
      ...(legend1Id ? [{ match_id: match.id, description: `LEGEND:p1:${legend1Id}:${legends.find(l => l.id === legend1Id)?.tags ?? ''}` }] : []),
      ...(legend2Id ? [{ match_id: match.id, description: `LEGEND:p2:${legend2Id}:${legends.find(l => l.id === legend2Id)?.tags ?? ''}` }] : []),
      ...cardNotes.map((c) => ({ match_id: match.id, description: `CARD:${c.role}:${c.card_id}:${c.name}` })),
    ];
    if (rows.length) await supabase.from('match_moments').insert(rows);

    setSaving(false);
    onSaved?.();
  }

  const needsWinner = format === 'bo1';
  const p1 = players.find((p) => p.id === p1Id);
  const p2 = players.find((p) => p.id === p2Id);

  return (
    <form onSubmit={onSubmit} className="space-y-5">

      {/* Format */}
      <div>
        <label className="label">Format</label>
        <div className="flex gap-1 mt-1 rounded-xl border border-border/60 bg-secondary p-1 w-fit">
          {(['bo1', 'bo3', 'bo5'] as MatchFormat[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setFormat(f); setGamesP1(0); setGamesP2(0); setWinnerId(''); }}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase transition-colors ${
                format === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Players + Legends */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Player 1 */}
        <div className="space-y-2">
          <div>
            <label className="label">Player 1</label>
            <select value={p1Id} onChange={(e) => setP1Id(e.target.value)} className="input w-full">
              <option value="">— Select —</option>
              {players.filter((p) => p.id !== p2Id).map((p) => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Legend</label>
            <select value={legend1Id} onChange={(e) => setLegend1Id(e.target.value)} className="input w-full" disabled={!p1Id}>
              <option value="">— Pick champion —</option>
              {legends.map((l) => (
                <option key={l.id} value={l.id}>{l.tags} ({l.name})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Player 2 */}
        <div className="space-y-2">
          <div>
            <label className="label">Player 2</label>
            <select value={p2Id} onChange={(e) => setP2Id(e.target.value)} className="input w-full">
              <option value="">— Select —</option>
              {players.filter((p) => p.id !== p1Id).map((p) => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Legend</label>
            <select value={legend2Id} onChange={(e) => setLegend2Id(e.target.value)} className="input w-full" disabled={!p2Id}>
              <option value="">— Pick champion —</option>
              {legends.map((l) => (
                <option key={l.id} value={l.id}>{l.tags} ({l.name})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Score */}
      {needsWinner ? (
        <div>
          <label className="label">Winner</label>
          <div className="flex gap-2 mt-1">
            {[p1, p2].map((p) => p && (
              <button
                key={p.id}
                type="button"
                onClick={() => setWinnerId(p.id)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                  winnerId === p.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.display_name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <label className="label">Score</label>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground mb-1">{p1?.display_name ?? 'Player 1'}</p>
              <div className="flex items-center justify-center gap-2">
                <button type="button" onClick={() => setGamesP1((n) => Math.max(0, n - 1))}
                  className="h-8 w-8 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-lg font-bold">−</button>
                <span className="text-3xl font-black w-8 text-center">{gamesP1}</span>
                <button type="button" onClick={() => setGamesP1((n) => Math.min(format === 'bo3' ? 2 : 3, n + 1))}
                  className="h-8 w-8 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-lg font-bold">+</button>
              </div>
            </div>
            <span className="text-muted-foreground font-bold text-lg">–</span>
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground mb-1">{p2?.display_name ?? 'Player 2'}</p>
              <div className="flex items-center justify-center gap-2">
                <button type="button" onClick={() => setGamesP2((n) => Math.max(0, n - 1))}
                  className="h-8 w-8 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-lg font-bold">−</button>
                <span className="text-3xl font-black w-8 text-center">{gamesP2}</span>
                <button type="button" onClick={() => setGamesP2((n) => Math.min(format === 'bo3' ? 2 : 3, n + 1))}
                  className="h-8 w-8 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-lg font-bold">+</button>
              </div>
            </div>
          </div>
          {winnerId && (
            <p className="mt-2 text-xs text-center text-primary font-medium">
              {players.find((p) => p.id === winnerId)?.display_name} wins
            </p>
          )}
        </div>
      )}

      {/* Date (optional) */}
      <div>
        <label className="label">Date <span className="text-muted-foreground font-normal">(optional — defaults to today)</span></label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-full" />
      </div>

      {/* Cards of note */}
      <div>
        <label className="label">Cards of Note</label>
        <div className="relative mt-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={cardSearch}
            onChange={(e) => setCardSearch(e.target.value)}
            placeholder="Search cards…"
            className="input w-full pl-8"
          />
          {cardSearchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-card shadow-modal overflow-hidden">
              {cardSearchResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => addCard(c)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 flex items-center justify-between"
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.card_type}{c.tags ? ` · ${c.tags}` : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {cardNotes.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {cardNotes.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary px-3 py-1.5">
                <span className="text-sm font-medium flex-1 truncate">{c.name}</span>
                <select
                  value={c.role}
                  onChange={(e) => updateCardRole(i, e.target.value as CardNote['role'])}
                  className="bg-transparent text-xs text-muted-foreground focus:outline-none"
                >
                  {(Object.entries(ROLE_LABELS) as [CardNote['role'], string][]).map(([r, label]) => (
                    <option key={r} value={r}>{label}</option>
                  ))}
                </select>
                <button type="button" onClick={() => removeCard(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Match notes, observations…"
          className="input w-full resize-none"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Match'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

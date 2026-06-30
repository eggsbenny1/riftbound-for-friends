import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Deck, MatchTag, Player } from '@/types';

const TAG_OPTIONS: MatchTag[] = [
  'close game', 'stomp', 'misplay', 'deck test', 'new legend', 'comeback', 'rematch',
];

const schema = z.object({
  played_at: z.string().min(1, 'Date required'),
  format: z.enum(['bo1', 'bo3', 'bo5']),
  player1_id: z.string().uuid('Select player 1'),
  player2_id: z.string().uuid('Select player 2'),
  deck1_id: z.string().optional(),
  deck2_id: z.string().optional(),
  score_p1: z.coerce.number().min(0).max(8),
  score_p2: z.coerce.number().min(0).max(8),
  games_p1: z.coerce.number().min(0),
  games_p2: z.coerce.number().min(0),
  winner_id: z.string().uuid('Select winner'),
  battlefield: z.string().optional(),
  notes: z.string().optional(),
}).refine((d) => d.player1_id !== d.player2_id, {
  message: 'Players must be different',
  path: ['player2_id'],
});

type FormValues = z.infer<typeof schema>;

type Props = {
  onSaved?: () => void;
  onCancel?: () => void;
  prefill?: Partial<FormValues & { tags?: MatchTag[] }>;
};

export default function MatchForm({ onSaved, onCancel, prefill }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [decks1, setDecks1] = useState<Deck[]>([]);
  const [decks2, setDecks2] = useState<Deck[]>([]);
  const [tags, setTags] = useState<MatchTag[]>(prefill?.tags ?? []);
  const [moments, setMoments] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const localNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      played_at: prefill?.played_at ?? localNow,
      format: prefill?.format ?? 'bo1',
      player1_id: prefill?.player1_id ?? '',
      player2_id: prefill?.player2_id ?? '',
      deck1_id: prefill?.deck1_id ?? '',
      deck2_id: prefill?.deck2_id ?? '',
      score_p1: prefill?.score_p1 ?? 0,
      score_p2: prefill?.score_p2 ?? 0,
      games_p1: prefill?.games_p1 ?? 0,
      games_p2: prefill?.games_p2 ?? 0,
      winner_id: prefill?.winner_id ?? '',
      battlefield: prefill?.battlefield ?? '',
      notes: prefill?.notes ?? '',
    },
  });

  const p1Id = watch('player1_id');
  const p2Id = watch('player2_id');
  const format = watch('format');

  useEffect(() => {
    supabase.from('players').select('*').eq('is_active', true).order('display_name')
      .then(({ data }) => setPlayers((data as Player[]) ?? []));
  }, []);

  useEffect(() => {
    if (!p1Id) { setDecks1([]); return; }
    supabase.from('decks').select('*').eq('player_id', p1Id).order('name')
      .then(({ data }) => setDecks1((data as Deck[]) ?? []));
  }, [p1Id]);

  useEffect(() => {
    if (!p2Id) { setDecks2([]); return; }
    supabase.from('decks').select('*').eq('player_id', p2Id).order('name')
      .then(({ data }) => setDecks2((data as Deck[]) ?? []));
  }, [p2Id]);

  function toggleTag(t: MatchTag) {
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setError(null);

    const { data: match, error: mErr } = await supabase.from('matches').insert({
      played_at: values.played_at,
      format: values.format,
      player1_id: values.player1_id,
      player2_id: values.player2_id,
      deck1_id: values.deck1_id || null,
      deck2_id: values.deck2_id || null,
      score_p1: values.score_p1,
      score_p2: values.score_p2,
      games_p1: values.games_p1,
      games_p2: values.games_p2,
      winner_id: values.winner_id,
      battlefield: values.battlefield || null,
      notes: values.notes || null,
      tags,
    }).select().single();

    if (mErr || !match) { setError(mErr?.message ?? 'Failed to save match'); setSaving(false); return; }

    const momentRows = moments.filter((m) => m.trim()).map((description) => ({
      match_id: match.id,
      description,
    }));
    if (momentRows.length) await supabase.from('match_moments').insert(momentRows);

    setSaving(false);
    onSaved?.();
  }

  const isBoSeries = format === 'bo3' || format === 'bo5';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Date + Format */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Date & Time</label>
          <input type="datetime-local" {...register('played_at')}
            className="input w-full" />
          {errors.played_at && <p className="err">{errors.played_at.message}</p>}
        </div>
        <div>
          <label className="label">Format</label>
          <select {...register('format')} className="input w-full">
            <option value="bo1">Bo1</option>
            <option value="bo3">Bo3</option>
            <option value="bo5">Bo5</option>
          </select>
        </div>
      </div>

      {/* Players */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Player 1</label>
          <select {...register('player1_id')} className="input w-full">
            <option value="">— Select —</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
          </select>
          {errors.player1_id && <p className="err">{errors.player1_id.message}</p>}
        </div>
        <div>
          <label className="label">Player 2</label>
          <select {...register('player2_id')} className="input w-full">
            <option value="">— Select —</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
          </select>
          {errors.player2_id && <p className="err">{errors.player2_id.message}</p>}
        </div>
      </div>

      {/* Decks */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">P1 Deck</label>
          <select {...register('deck1_id')} className="input w-full" disabled={!p1Id}>
            <option value="">— None —</option>
            {decks1.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">P2 Deck</label>
          <select {...register('deck2_id')} className="input w-full" disabled={!p2Id}>
            <option value="">— None —</option>
            {decks2.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Scores */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">P1 Score (0–8)</label>
          <input type="number" min={0} max={8} {...register('score_p1')} className="input w-full" />
        </div>
        <div>
          <label className="label">P2 Score (0–8)</label>
          <input type="number" min={0} max={8} {...register('score_p2')} className="input w-full" />
        </div>
      </div>

      {isBoSeries && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">P1 Game Wins</label>
            <input type="number" min={0} {...register('games_p1')} className="input w-full" />
          </div>
          <div>
            <label className="label">P2 Game Wins</label>
            <input type="number" min={0} {...register('games_p2')} className="input w-full" />
          </div>
        </div>
      )}

      {/* Winner */}
      <div>
        <label className="label">Winner</label>
        <select {...register('winner_id')} className="input w-full">
          <option value="">— Select winner —</option>
          {players.filter((p) => p.id === p1Id || p.id === p2Id).map((p) => (
            <option key={p.id} value={p.id}>{p.display_name}</option>
          ))}
        </select>
        {errors.winner_id && <p className="err">{errors.winner_id.message}</p>}
      </div>

      {/* Battlefield */}
      <div>
        <label className="label">Battlefield (optional)</label>
        <input type="text" {...register('battlefield')} placeholder="e.g. Reckoner's Arena" className="input w-full" />
      </div>

      {/* Tags */}
      <div>
        <label className="label">Tags</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {TAG_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                tags.includes(t)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes</label>
        <textarea {...register('notes')} rows={3} placeholder="Match notes…"
          className="input w-full resize-none" />
      </div>

      {/* Key moments */}
      <div>
        <label className="label">Key Moments</label>
        <div className="space-y-2">
          {moments.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={m}
                onChange={(e) => {
                  const next = [...moments];
                  next[i] = e.target.value;
                  setMoments(next);
                }}
                placeholder={`Moment ${i + 1}…`}
                className="input flex-1"
              />
              {moments.length > 1 && (
                <button type="button" onClick={() => setMoments((prev) => prev.filter((_, j) => j !== i))}
                  className="text-muted-foreground hover:text-destructive">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setMoments((prev) => [...prev, ''])}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus size={12} /> Add moment
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Match'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

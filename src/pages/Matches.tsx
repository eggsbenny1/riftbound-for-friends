import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { supabase } from '@/lib/supabase';
import MatchCard from '@/components/match/MatchCard';
import MatchForm from '@/components/match/MatchForm';
import type { Match, MatchFormat, Player } from '@/types';

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  // Filters
  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterFormat, setFilterFormat] = useState<MatchFormat | ''>('');

  useEffect(() => {
    loadPlayers();
    loadMatches();
  }, []);

  async function loadPlayers() {
    const { data } = await supabase.from('players').select('*').eq('is_active', true).order('display_name');
    setPlayers((data as Player[]) ?? []);
  }

  async function loadMatches() {
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select('*, player1:player1_id(*), player2:player2_id(*)')
      .order('played_at', { ascending: false })
      .limit(100);
    setMatches((data as Match[]) ?? []);
    setLoading(false);
  }

  const filtered = matches.filter((m) => {
    if (filterFormat && m.format !== filterFormat) return false;
    if (filterPlayer && m.player1_id !== filterPlayer && m.player2_id !== filterPlayer) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Match History</h1>
        <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-1 rounded-lg bg-primary/15 border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
              <Plus size={12} /> Add Match
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-x-4 top-[5%] z-50 mx-auto max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <Dialog.Title className="text-lg font-bold">Add Match</Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                </Dialog.Close>
              </div>
              <MatchForm onSaved={() => { setAddOpen(false); loadMatches(); }} onCancel={() => setAddOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filterPlayer}
          onChange={(e) => setFilterPlayer(e.target.value)}
          className="rounded-lg border border-input bg-secondary px-3 py-1.5 text-sm text-foreground focus:outline-none"
        >
          <option value="">All Players</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
        </select>
        <select
          value={filterFormat}
          onChange={(e) => setFilterFormat(e.target.value as MatchFormat | '')}
          className="rounded-lg border border-input bg-secondary px-3 py-1.5 text-sm text-foreground focus:outline-none"
        >
          <option value="">All Formats</option>
          <option value="bo1">Bo1</option>
          <option value="bo3">Bo3</option>
          <option value="bo5">Bo5</option>
        </select>
        {(filterPlayer || filterFormat) && (
          <button
            onClick={() => { setFilterPlayer(''); setFilterFormat(''); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg font-medium">No matches found.</p>
          <p className="text-sm mt-1">Add your first match above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  );
}

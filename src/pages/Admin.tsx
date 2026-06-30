import { useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PlayerForm from '@/components/player/PlayerForm';
import MatchCard from '@/components/match/MatchCard';
import type { Match, Player } from '@/types';

export default function Admin() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [cardCount, setCardCount] = useState<number | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [{ data: p }, { data: m }, { count }] = await Promise.all([
      supabase.from('players').select('*').order('display_name'),
      supabase.from('matches').select('*, player1:player1_id(*), player2:player2_id(*)').order('played_at', { ascending: false }).limit(50),
      supabase.from('cards').select('*', { count: 'exact', head: true }),
    ]);
    setPlayers((p as Player[]) ?? []);
    setMatches((m as Match[]) ?? []);
    setCardCount(count ?? 0);
  }

  async function deletePlayer(player: Player) {
    await supabase.from('players').delete().eq('id', player.id);
    setDeletingPlayer(null);
    loadAll();
  }

  async function deleteMatch(match: Match) {
    await supabase.from('matches').delete().eq('id', match.id);
    setDeletingMatch(null);
    loadAll();
  }

  async function toggleActive(player: Player) {
    await supabase.from('players').update({ is_active: !player.is_active }).eq('id', player.id);
    loadAll();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-4xl font-bold tracking-tight">Admin</h1>

      <Tabs.Root defaultValue="players">
        <Tabs.List className="flex gap-1 border-b border-white/10 mb-6">
          {['players', 'matches', 'database'].map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="px-4 py-2 text-sm font-medium capitalize text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors"
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Players tab */}
        <Tabs.Content value="players" className="space-y-3">
          <div className="flex justify-end">
            <Dialog.Root open={addPlayerOpen} onOpenChange={setAddPlayerOpen}>
              <Dialog.Trigger asChild>
                <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  <Plus size={14} /> Add Player
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
                <Dialog.Content className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-md rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <Dialog.Title className="text-lg font-bold">Add Player</Dialog.Title>
                    <Dialog.Close asChild>
                      <button className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                    </Dialog.Close>
                  </div>
                  <PlayerForm
                    onSaved={() => { setAddPlayerOpen(false); loadAll(); }}
                    onCancel={() => setAddPlayerOpen(false)}
                  />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>

          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-card px-4 py-3">
              <div
                className="h-10 w-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold text-white"
                style={{ background: p.color }}
              >
                {p.avatar_url
                  ? <img src={p.avatar_url} className="h-full w-full object-cover" alt="" />
                  : p.display_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{p.display_name}</p>
                <p className="text-xs text-muted-foreground">@{p.username}</p>
              </div>
              <button
                onClick={() => toggleActive(p)}
                className={`text-xs rounded-full px-2 py-0.5 font-medium ${p.is_active ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}
              >
                {p.is_active ? 'Active' : 'Inactive'}
              </button>
              <button
                onClick={() => { setEditingPlayer(p); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setDeletingPlayer(p)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {players.length === 0 && (
            <p className="text-sm text-muted-foreground italic py-8 text-center">No players yet.</p>
          )}
        </Tabs.Content>

        {/* Matches tab */}
        <Tabs.Content value="matches" className="space-y-2">
          {matches.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <MatchCard match={m} />
              </div>
              <button
                onClick={() => setDeletingMatch(m)}
                className="shrink-0 text-muted-foreground hover:text-destructive p-2"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {matches.length === 0 && (
            <p className="text-sm text-muted-foreground italic py-8 text-center">No matches yet.</p>
          )}
        </Tabs.Content>

        {/* Database tab */}
        <Tabs.Content value="database" className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-card p-6">
            <h3 className="font-semibold mb-2">Card Database</h3>
            {cardCount === null ? (
              <p className="text-muted-foreground text-sm">Checking…</p>
            ) : cardCount === 0 ? (
              <div className="space-y-2">
                <p className="text-destructive text-sm font-medium">⚠ Cards table is empty.</p>
                <p className="text-muted-foreground text-sm">Run <code className="bg-secondary px-1 rounded">npm run seed:cards</code> from your terminal to seed 766 cards.</p>
              </div>
            ) : (
              <p className="text-green-400 text-sm font-medium">✓ {cardCount} cards seeded</p>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Edit player modal */}
      <Dialog.Root open={!!editingPlayer} onOpenChange={(o) => { if (!o) setEditingPlayer(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-md rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-lg font-bold">Edit Player</Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </Dialog.Close>
            </div>
            {editingPlayer && (
              <PlayerForm
                existing={editingPlayer}
                onSaved={() => { setEditingPlayer(null); loadAll(); }}
                onCancel={() => setEditingPlayer(null)}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete player confirm */}
      <Dialog.Root open={!!deletingPlayer} onOpenChange={(o) => { if (!o) setDeletingPlayer(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-x-4 top-[30%] z-50 mx-auto max-w-sm rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
            <Dialog.Title className="text-lg font-bold mb-2">Delete Player?</Dialog.Title>
            <p className="text-sm text-muted-foreground mb-5">
              This will permanently delete <strong>{deletingPlayer?.display_name}</strong> and all their decks and match records.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deletingPlayer && deletePlayer(deletingPlayer)}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </button>
              <Dialog.Close asChild>
                <button className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete match confirm */}
      <Dialog.Root open={!!deletingMatch} onOpenChange={(o) => { if (!o) setDeletingMatch(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-x-4 top-[30%] z-50 mx-auto max-w-sm rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
            <Dialog.Title className="text-lg font-bold mb-2">Delete Match?</Dialog.Title>
            <p className="text-sm text-muted-foreground mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => deletingMatch && deleteMatch(deletingMatch)}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </button>
              <Dialog.Close asChild>
                <button className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

import type { MatchupStat, Player } from '@/types';

type Props = {
  stats: MatchupStat[];
  players: Player[];
  currentPlayerId?: string;
};

export default function MatchupTable({ stats, players }: Props) {
  const playerMap = new Map(players.map((p) => [p.id, p]));

  if (!stats.length) {
    return (
      <div className="flex flex-col items-center py-16 text-muted-foreground">
        <p className="text-sm">No matchup data yet.</p>
        <p className="text-xs mt-1 text-muted-foreground/60">Play some matches to see head-to-head stats.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/50">
            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Opponent
            </th>
            <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              W
            </th>
            <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              L
            </th>
            <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Win Rate
            </th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">
              Last Played
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {stats.map((s) => {
            const opponent = playerMap.get(s.opponent_id);
            const wr = s.win_rate_pct ?? 0;
            const positive = wr >= 50;
            return (
              <tr key={s.opponent_id} className="bg-card hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-4 font-semibold text-foreground">
                  {opponent?.display_name ?? 'Unknown'}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="tabular font-bold text-green-400">{s.wins}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="tabular font-bold text-red-400">{s.losses}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className="tabular font-bold"
                    style={{ color: positive ? '#4ade80' : '#f87171' }}
                  >
                    {wr}%
                  </span>
                </td>
                <td className="px-4 py-4 text-right text-xs text-muted-foreground tabular hidden sm:table-cell">
                  {s.last_played_at
                    ? new Date(s.last_played_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

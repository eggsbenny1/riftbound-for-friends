import type { MatchupStat, Player } from '@/types';

type Props = {
  stats: MatchupStat[];
  players: Player[];
  currentPlayerId?: string;
};

export default function MatchupTable({ stats, players }: Props) {
  const playerMap = new Map(players.map((p) => [p.id, p]));

  if (!stats.length) {
    return <p className="text-sm text-muted-foreground italic">No matchup data yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">Opponent</th>
            <th className="px-4 py-3 text-center">W</th>
            <th className="px-4 py-3 text-center">L</th>
            <th className="px-4 py-3 text-center">WR%</th>
            <th className="px-4 py-3 text-center hidden sm:table-cell">Last Played</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => {
            const opponent = playerMap.get(s.opponent_id);
            const wr = s.win_rate_pct ?? 0;
            return (
              <tr key={s.opponent_id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-medium">
                  {opponent?.display_name ?? 'Unknown'}
                </td>
                <td className="px-4 py-3 text-center text-green-400 font-semibold">{s.wins}</td>
                <td className="px-4 py-3 text-center text-destructive font-semibold">{s.losses}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-bold ${wr >= 50 ? 'text-green-400' : 'text-destructive'}`}>
                    {wr}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground hidden sm:table-cell">
                  {s.last_played_at
                    ? new Date(s.last_played_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
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

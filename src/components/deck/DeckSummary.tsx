import type { DeckCard } from '@/types';
import { deckCurve } from '@/lib/deckValidation';

type Props = { cards: DeckCard[] };

export default function DeckSummary({ cards }: Props) {
  const sum = (section: string) =>
    cards.filter((c) => c.section === section).reduce((s, c) => s + c.quantity, 0);

  const mainCount = sum('main');
  const runeCount = sum('rune');
  const bfCount = sum('battlefield');
  const sideCount = sum('sideboard');

  const curve = deckCurve(cards);
  const maxCurveCount = Math.max(...Object.values(curve), 1);
  const curveKeys = Array.from({ length: 9 }, (_, i) => i); // 0–8

  return (
    <div className="rounded-xl border border-white/10 bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Summary
      </h3>

      {/* Counts */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {[
          { label: 'Main', count: mainCount, target: 40 },
          { label: 'Runes', count: runeCount, target: 12 },
          { label: 'Battlefields', count: bfCount, target: 3 },
          { label: 'Sideboard', count: sideCount, target: 8 },
        ].map(({ label, count, target }) => (
          <div key={label} className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span
              className={
                count === target
                  ? 'text-green-400 font-semibold'
                  : count > target
                  ? 'text-destructive font-semibold'
                  : 'text-foreground'
              }
            >
              {count}/{target}
            </span>
          </div>
        ))}
      </div>

      {/* Energy curve */}
      {mainCount > 0 && (
        <div>
          <p className="mb-2 text-xs text-muted-foreground uppercase tracking-wide">Energy Curve</p>
          <div className="flex items-end gap-1 h-16">
            {curveKeys.map((e) => {
              const count = curve[e] ?? 0;
              const height = count === 0 ? 0 : Math.max((count / maxCurveCount) * 100, 8);
              return (
                <div key={e} className="flex flex-1 flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-t bg-primary/70 transition-all"
                    style={{ height: `${height}%` }}
                    title={`${e} energy: ${count} cards`}
                  />
                  <span className="text-[9px] text-muted-foreground">{e}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

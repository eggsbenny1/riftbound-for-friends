import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useScoreStore } from '@/stores/scoreStore';
import MatchForm from '@/components/match/MatchForm';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
};

export default function SaveMatchModal({ open, onOpenChange, onSaved }: Props) {
  const store = useScoreStore();

  const p1Id = store.player1.id ?? undefined;
  const p2Id = store.player2.id ?? undefined;
  const winnerId = store.winner === 'player1' ? p1Id : store.winner === 'player2' ? p2Id : undefined;

  const prefill = {
    format: store.format,
    player1_id: p1Id,
    player2_id: p2Id,
    winner_id: winnerId,
    score_p1: store.player1.score,
    score_p2: store.player2.score,
    games_p1: store.games_p1,
    games_p2: store.games_p2,
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-4 top-[5%] z-50 mx-auto max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-bold">Save Match</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>
          <MatchForm
            prefill={prefill}
            onSaved={() => { onOpenChange(false); onSaved(); }}
            onCancel={() => onOpenChange(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

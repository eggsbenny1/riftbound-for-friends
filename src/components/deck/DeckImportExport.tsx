import { useState } from 'react';
import { importDeckText, exportDeckText } from '@/lib/deckImport';
import type { DeckCard } from '@/types';

type Props = {
  cards: DeckCard[];
  deckName?: string;
  legendName?: string;
  onImport: (cards: DeckCard[]) => void;
};

export default function DeckImportExport({ cards, deckName, legendName, onImport }: Props) {
  const [mode, setMode] = useState<'import' | 'export' | null>(null);
  const [importText, setImportText] = useState('');

  const exportText = exportDeckText(cards, { deckName, legendName });

  function handleImport() {
    const parsed = importDeckText(importText);
    onImport(parsed);
    setMode(null);
    setImportText('');
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => setMode(mode === 'import' ? null : 'import')}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          Import list
        </button>
        <button
          onClick={() => setMode(mode === 'export' ? null : 'export')}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          Export list
        </button>
      </div>

      {mode === 'import' && (
        <div className="space-y-2">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste deck list here…"
            rows={10}
            className="w-full rounded-lg border border-input bg-secondary p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
            >
              Import
            </button>
            <button
              onClick={() => { setMode(null); setImportText(''); }}
              className="rounded-lg border border-white/10 px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'export' && (
        <div className="space-y-2">
          <textarea
            readOnly
            value={exportText}
            rows={12}
            className="w-full rounded-lg border border-input bg-secondary p-3 text-xs font-mono text-foreground focus:outline-none resize-none"
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
          <button
            onClick={() => navigator.clipboard.writeText(exportText)}
            className="rounded-lg border border-white/10 px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}

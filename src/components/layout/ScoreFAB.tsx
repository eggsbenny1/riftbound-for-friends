import { Link } from 'react-router-dom';
import { Swords } from 'lucide-react';

/**
 * Always-visible shortcut to the Score Counter, per UX Decisions
 * Addendum #6 — this is the most-used page at the table, so it
 * gets a dedicated FAB instead of being buried in standard nav.
 *
 * Positioned to clear the BottomNav on mobile (bottom-24) and sits
 * lower on desktop (md:bottom-6) since there's no bottom nav there.
 */
export default function ScoreFAB() {
  return (
    <Link
      to="/score"
      aria-label="Open Score Counter"
      className="fixed bottom-24 right-4 z-50 flex h-16 w-16 items-center justify-center
        rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30
        transition-transform hover:scale-105 active:scale-95 md:bottom-6"
    >
      <Swords className="h-7 w-7" />
    </Link>
  );
}

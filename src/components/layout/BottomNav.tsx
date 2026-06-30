import { NavLink } from 'react-router-dom';
import { Users, History, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

// Score is deliberately excluded here — it lives in the persistent
// ScoreFAB instead, since it's the most-used page at the table and
// deserves a faster, always-visible tap target (see UX Decisions Addendum #6).
const NAV_ITEMS = [
  { label: 'Players', to: '/', icon: Users },
  { label: 'Matches', to: '/matches', icon: History },
  { label: 'Admin', to: '/admin', icon: Shield },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border
        bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

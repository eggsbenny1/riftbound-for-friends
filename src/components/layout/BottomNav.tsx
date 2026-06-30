import { NavLink } from 'react-router-dom';
import { Users, History, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Players', to: '/', icon: Users },
  { label: 'Matches', to: '/matches', icon: History },
  { label: 'Admin', to: '/admin', icon: Shield },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around px-2">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium tracking-wide transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn(
                  'flex items-center justify-center rounded-xl p-1.5 transition-colors',
                  isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
                )}>
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

import { NavLink } from 'react-router-dom';
import { Users, Swords, History, Shield, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Players', to: '/', icon: Users },
  { label: 'Score', to: '/score', icon: Swords },
  { label: 'Matches', to: '/matches', icon: History },
  { label: 'Admin', to: '/admin', icon: Shield },
];

export default function NavBar() {
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <header className="hidden border-b border-border bg-card/50 backdrop-blur md:block">
      <div className="container flex h-16 items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">Riftbound Crew Tracker</span>
        </NavLink>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}

          <button
            onClick={() => signOut()}
            className="ml-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium
              text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}

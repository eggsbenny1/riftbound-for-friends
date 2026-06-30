import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Players', to: '/' },
  { label: 'Matches', to: '/matches' },
  { label: 'Admin', to: '/admin' },
];

export default function NavBar() {
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <header className="hidden md:block sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center gap-8">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 shrink-0 select-none">
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            Riftbound
          </span>
          <span className="text-[15px] font-light tracking-tight text-muted-foreground">
            for friends
          </span>
        </NavLink>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && (
                    <span className="absolute inset-x-3.5 -bottom-px h-px bg-primary rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium
              text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

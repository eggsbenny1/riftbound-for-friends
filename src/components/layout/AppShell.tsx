import { Outlet, useLocation } from 'react-router-dom';
import NavBar from './NavBar';
import BottomNav from './BottomNav';
import ScoreFAB from './ScoreFAB';

/**
 * Shared layout for every authenticated page.
 * - NavBar shows on desktop (md and up), hidden on mobile
 * - BottomNav shows on mobile, hidden on desktop
 * - ScoreFAB floats on every page except the Score page itself
 *   (no point floating a shortcut to the page you're already on)
 */
export default function AppShell() {
  const location = useLocation();
  const isOnScorePage = location.pathname === '/score';

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Bottom padding on mobile reserves space for BottomNav so content
          never sits underneath it */}
      <main className="pb-20 md:pb-0">
        <div className="container py-6">
          <Outlet />
        </div>
      </main>

      <BottomNav />

      {!isOnScorePage && <ScoreFAB />}
    </div>
  );
}

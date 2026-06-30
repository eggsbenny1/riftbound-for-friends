import { Outlet, useLocation } from 'react-router-dom';
import NavBar from './NavBar';
import BottomNav from './BottomNav';
import ScoreFAB from './ScoreFAB';

export default function AppShell() {
  const location = useLocation();
  const isOnScorePage = location.pathname === '/score';

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="pb-24 md:pb-0">
        <div className="container py-8 md:py-10">
          <Outlet />
        </div>
      </main>

      {!isOnScorePage && <BottomNav />}

      {!isOnScorePage && <ScoreFAB />}
    </div>
  );
}

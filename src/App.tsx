import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import PlayerProfile from '@/pages/PlayerProfile';
import DeckEdit from '@/pages/DeckEdit';
import DeckView from '@/pages/DeckView';
import Matches from '@/pages/Matches';
import ScorePage from '@/pages/ScorePage';
import Admin from '@/pages/Admin';

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <h1 className="text-2xl font-semibold text-muted-foreground">Page not found</h1>
    </div>
  );
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/players/:id" element={<PlayerProfile />} />
          <Route path="/players/:id/deck/new" element={<DeckEdit />} />
          <Route path="/players/:id/deck/:deckId" element={<DeckView />} />
          <Route path="/players/:id/deck/:deckId/edit" element={<DeckEdit />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/score" element={<ScorePage />} />
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

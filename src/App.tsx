import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import Login from '@/pages/Login';

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <h1 className="text-2xl font-semibold text-muted-foreground">{title}</h1>
    </div>
  );
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  // Restore session + subscribe to auth changes once, on app mount.
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Every route below shares the AppShell layout (nav + FAB)
            and requires the shared crew login */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Placeholder title="Home — Player Grid" />} />
          <Route path="/players/:id" element={<Placeholder title="Player Profile" />} />
          <Route path="/players/:id/deck/new" element={<Placeholder title="New Deck" />} />
          <Route path="/players/:id/deck/:deckId" element={<Placeholder title="Deck Viewer" />} />
          <Route path="/players/:id/deck/:deckId/edit" element={<Placeholder title="Edit Deck" />} />
          <Route path="/matches" element={<Placeholder title="Match History" />} />
          <Route path="/score" element={<Placeholder title="Score Counter" />} />
          <Route path="/admin" element={<Placeholder title="Admin" />} />
        </Route>

        <Route path="*" element={<Placeholder title="Not Found" />} />
      </Routes>
    </BrowserRouter>
  );
}

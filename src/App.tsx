import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
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

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Placeholder title="Home — Player Grid" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/players/:id"
          element={
            <ProtectedRoute>
              <Placeholder title="Player Profile" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/players/:id/deck/new"
          element={
            <ProtectedRoute>
              <Placeholder title="New Deck" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/players/:id/deck/:deckId"
          element={
            <ProtectedRoute>
              <Placeholder title="Deck Viewer" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/players/:id/deck/:deckId/edit"
          element={
            <ProtectedRoute>
              <Placeholder title="Edit Deck" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <Placeholder title="Match History" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/score"
          element={
            <ProtectedRoute>
              <Placeholder title="Score Counter" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Placeholder title="Admin" />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Placeholder title="Not Found" />} />
      </Routes>
    </BrowserRouter>
  );
}

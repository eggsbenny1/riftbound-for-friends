import { BrowserRouter, Routes, Route } from 'react-router-dom';

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <h1 className="text-2xl font-semibold text-muted-foreground">{title}</h1>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Placeholder title="Home — Player Grid" />} />
        <Route path="/login" element={<Placeholder title="Login" />} />
        <Route path="/players/:id" element={<Placeholder title="Player Profile" />} />
        <Route path="/players/:id/deck/new" element={<Placeholder title="New Deck" />} />
        <Route path="/players/:id/deck/:deckId" element={<Placeholder title="Deck Viewer" />} />
        <Route path="/players/:id/deck/:deckId/edit" element={<Placeholder title="Edit Deck" />} />
        <Route path="/matches" element={<Placeholder title="Match History" />} />
        <Route path="/score" element={<Placeholder title="Score Counter" />} />
        <Route path="/admin" element={<Placeholder title="Admin" />} />
        <Route path="*" element={<Placeholder title="Not Found" />} />
      </Routes>
    </BrowserRouter>
  );
}

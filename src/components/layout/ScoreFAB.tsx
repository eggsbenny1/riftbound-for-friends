import { Link } from 'react-router-dom';
import { Swords } from 'lucide-react';

export default function ScoreFAB() {
  return (
    <Link
      to="/score"
      aria-label="Open Score Counter"
      className="fixed bottom-[5.5rem] right-4 z-50 flex h-14 w-14 items-center justify-center
        rounded-2xl bg-primary text-primary-foreground shadow-fab
        transition-all duration-200 hover:scale-105 hover:shadow-primary active:scale-95
        md:bottom-6 md:right-6"
    >
      <Swords className="h-6 w-6" />
    </Link>
  );
}

import ScoreCounter from '@/components/score/ScoreCounter';

// ScoreCounter uses fixed positioning to escape the AppShell container.
// This page is just the mount point.
export default function ScorePage() {
  return <ScoreCounter />;
}

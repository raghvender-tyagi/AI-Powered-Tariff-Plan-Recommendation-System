import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Primitives';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-base-950 bg-grid">
      <p className="text-cyan-400 font-mono text-sm mb-3">404</p>
      <h1 className="text-3xl font-bold text-base-50 mb-2">This page drifted out of coverage</h1>
      <p className="text-base-400 max-w-md mb-6">
        The page you're looking for doesn't exist. Let's get you back to your dashboard.
      </p>
      <Button as={Link} to="/" icon={Home}>
        Back to home
      </Button>
    </div>
  );
}

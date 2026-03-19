import { Link } from 'react-router';
import { Button } from '../components/ui/button';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl mb-4 text-gray-900">404</h1>
        <h2 className="text-2xl mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="bg-amber-700 hover:bg-amber-800">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { Shield, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const ADMIN_EMAIL = 'vastram.pune2026@gmail.com';
const ADMIN_PASSWORD = '123456';

export function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    // Check if credentials match admin credentials
    if (formData.email === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD) {
      // Store admin session in localStorage
      localStorage.setItem('admin_session', JSON.stringify({
        email: ADMIN_EMAIL,
        loginTime: new Date().toISOString(),
      }));
      
      toast.success('Admin login successful!');
      navigate('/admin/dashboard');
    } else {
      toast.error('Invalid admin credentials. Access denied.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl md:text-4xl bg-gradient-to-r from-red-700 to-orange-700 bg-clip-text text-transparent">
            Admin Access
          </h2>
          <p className="mt-2 text-gray-600 font-semibold">
            VASTRAM Admin Panel
          </p>
          <div className="mt-4 bg-red-100 border-l-4 border-red-600 p-4 rounded">
            <p className="text-sm text-red-800 font-medium">
              🔒 Restricted Area - Authorized Personnel Only
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 border-2 border-red-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4" />
                Admin Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@vastram.com"
                className="mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div>
              <Label htmlFor="password" className="flex items-center gap-2 text-gray-700">
                <Lock className="w-4 h-4" />
                Admin Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="mt-1 border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-lg py-6"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Admin Login
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-3">
              Only authorized administrators can access this area.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to User Type Selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
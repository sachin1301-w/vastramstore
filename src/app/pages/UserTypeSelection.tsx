import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { ShoppingBag, Shield, User } from 'lucide-react';

export function UserTypeSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center px-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl mb-4 tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-transparent animate-pulse">
            VASTRAM
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 font-medium">
            Welcome! Please select how you'd like to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer/User Option */}
          <div 
            onClick={() => navigate('/signin')}
            className="bg-white rounded-2xl shadow-2xl p-10 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-transparent hover:border-amber-500 group"
          >
            <div className="text-center">
              <div className="inline-block p-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-6 group-hover:from-amber-200 group-hover:to-orange-200 transition-colors">
                <ShoppingBag className="w-16 h-16 text-amber-700 group-hover:scale-110 transition-transform" />
              </div>
              <h2 className="text-3xl mb-4 text-gray-900 group-hover:text-amber-700 transition-colors">
                Customer
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Browse our collection, shop for clothing, and manage your orders
              </p>
              <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg py-6 rounded-xl shadow-lg group-hover:shadow-xl transition-all">
                <User className="w-5 h-5 mr-2" />
                Continue as Customer
              </Button>
            </div>
          </div>

          {/* Admin Option */}
          <div 
            onClick={() => navigate('/admin/login')}
            className="bg-white rounded-2xl shadow-2xl p-10 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-3xl border-4 border-transparent hover:border-red-500 group"
          >
            <div className="text-center">
              <div className="inline-block p-6 bg-gradient-to-br from-red-100 to-orange-100 rounded-full mb-6 group-hover:from-red-200 group-hover:to-orange-200 transition-colors">
                <Shield className="w-16 h-16 text-red-700 group-hover:scale-110 transition-transform" />
              </div>
              <h2 className="text-3xl mb-4 text-gray-900 group-hover:text-red-700 transition-colors">
                Admin
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Manage orders, track inventory, and oversee operations
              </p>
              <Button className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-lg py-6 rounded-xl shadow-lg group-hover:shadow-xl transition-all">
                <Shield className="w-5 h-5 mr-2" />
                Continue as Admin
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
            <p className="text-gray-700 font-semibold mb-2">VASTRAM</p>
            <p className="text-sm text-gray-600">
              Alandi road, Vishrawadi, near fish market, bus stop, Pune (411015), Maharashtra
            </p>
            <p className="text-sm text-gray-600 mt-2">
              📞 9284631943 / 8669279635 • ✉️ vastram.pune2026@gmail.com
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Business Hours: 9 AM - 10 PM Daily
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
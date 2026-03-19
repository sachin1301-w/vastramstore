import { Link, useLocation } from 'react-router';
import { ShoppingCart, Search, Menu, User, LogIn, Home, Package, Info, Mail, X, UserPlus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';

export function Header() {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const navigation = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: Mail },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Don't show header on user type selection or admin pages
  const isUserTypeSelection = location.pathname === '/';
  const isAdminPage = location.pathname.startsWith('/admin');
  
  if (isUserTypeSelection || isAdminPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-orange-300 via-amber-300 to-orange-300 border-b border-orange-400 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/home" 
            className="flex items-center group"
          >
            <span className="text-2xl font-bold tracking-wide bg-gradient-to-r from-orange-700 via-amber-600 to-orange-700 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300 drop-shadow-lg">
              VASTRAM
            </span>
          </Link>

          {/* Desktop Navigation - Only show if user is authenticated */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="group flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:text-amber-700 hover:bg-amber-50 transition-all duration-200 font-medium text-base"
                  >
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user && (
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 hover:bg-amber-50 hover:text-amber-700 rounded-full transition-all duration-200"
              >
                {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>
            )}
            
            {/* User Profile/Sign In */}
            {user ? (
              <Link
                to="/profile"
                className="p-2.5 hover:bg-amber-50 rounded-full transition-all duration-200 relative group"
                title={`Signed in as ${user.name}`}
              >
                <User className="w-5 h-5 text-amber-700 group-hover:scale-110 transition-transform" />
              </Link>
            ) : (
              <Link
                to="/"
                className="p-2.5 hover:bg-amber-50 hover:text-amber-700 rounded-full transition-all duration-200 group"
                title="Sign In"
              >
                <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>
            )}
            
            {user && (
              <Link
                to="/cart"
                className="p-2.5 hover:bg-amber-50 hover:text-amber-700 rounded-full transition-all duration-200 relative group"
              >
                <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md animate-pulse">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile Menu - Only show if user is authenticated */}
            {user && (
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger className="md:hidden p-2.5 hover:bg-amber-50 hover:text-amber-700 rounded-full transition-all duration-200">
                  <Menu className="w-5 h-5" />
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <nav className="flex flex-col gap-2 mt-8">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 text-lg text-gray-700 hover:text-amber-700 hover:bg-amber-50 px-4 py-3 rounded-lg transition-all duration-200 font-medium"
                        >
                          <Icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                      );
                    })}
                    <div className="border-t pt-4 mt-4">
                      <Link
                        to="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 text-lg text-gray-700 hover:text-amber-700 hover:bg-amber-50 px-4 py-3 rounded-lg transition-all duration-200 font-medium"
                      >
                        <User className="w-5 h-5" />
                        My Account
                      </Link>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Search Bar - Only show if user is authenticated */}
        {user && searchOpen && (
          <div className="pb-4 px-2 animate-in slide-in-from-top duration-300">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-orange-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white text-gray-800 placeholder-gray-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-200"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
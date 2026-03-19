import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { User, Mail, Package, LogOut, ShoppingBag, Truck, MapPin, CheckCircle, Sparkles } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Order {
  orderId: string;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    size?: string;
  }>;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  total: number;
  status: string;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export function Profile() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Check for order success parameter
  useEffect(() => {
    const orderSuccess = searchParams.get('orderSuccess');
    const orderId = searchParams.get('orderId');
    
    if (orderSuccess === 'true' && orderId) {
      // Show success notification
      toast.success(`🎉 Order ${orderId} placed successfully! Thank you for your purchase.`, {
        duration: 5000,
      });
      
      // Remove the query parameters
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
    } else if (user) {
      fetchUserOrders();
    }
  }, [user, authLoading, navigate]);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/user/orders`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Filter orders by user email
        const userOrders = data.orders.filter(
          (order: Order) => order.customerInfo.email === user?.email
        );
        
        // Sort by creation date (newest first)
        const sortedOrders = userOrders.sort(
          (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setOrders(sortedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load your orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Package;
      case 'processing':
        return ShoppingBag;
      case 'shipped':
        return Truck;
      case 'delivered':
        return CheckCircle;
      default:
        return Package;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="h-16 w-16 bg-amber-700 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl mb-1">{user.name}</h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total Spent</p>
            <p className="text-3xl font-bold text-gray-900">₹{totalSpent.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Active Orders</p>
            <p className="text-3xl font-bold text-gray-900">
              {orders.filter(o => o.status !== 'delivered').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Delivered</p>
            <p className="text-3xl font-bold text-gray-900">
              {orders.filter(o => o.status === 'delivered').length}
            </p>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl mb-6">Your Orders</h2>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl text-gray-600 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
              <Button
                onClick={() => navigate('/products')}
                className="bg-amber-700 hover:bg-amber-800"
              >
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <div
                    key={order.orderId}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{order.orderId}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusBadgeColor(order.status)}`}>
                            <StatusIcon className="w-4 h-4" />
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="mt-4 lg:mt-0">
                        <p className="text-2xl font-bold text-gray-900">₹{order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-amber-700" />
                        Your Items:
                      </h4>
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-start border-b border-amber-200 pb-3 last:border-0 last:pb-0">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              {item.size && (
                                <p className="text-sm text-gray-600 mt-1">Size: {item.size}</p>
                              )}
                              <p className="text-sm text-amber-800 mt-1">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                              <p className="text-xs text-gray-600">₹{item.price.toFixed(2)} each</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tracking Number */}
                    {order.trackingNumber && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-900">
                          <strong>Tracking Number:</strong> {order.trackingNumber}
                        </p>
                      </div>
                    )}

                    {/* Shipping Address */}
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Shipping Address:
                      </h4>
                      <p className="text-sm text-gray-600">
                        {order.customerInfo.address}, {order.customerInfo.city}, {order.customerInfo.state} {order.customerInfo.zipCode}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
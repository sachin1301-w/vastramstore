import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { CheckCircle, Package, Truck, MapPin, Clock } from 'lucide-react';
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
  trackingUrl: string | null;
  trackingEvents: Array<{
    status: string;
    location: string;
    timestamp: string;
    description: string;
  }>;
  createdAt: string;
}

export function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/orders/${orderId}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setOrder(data.order);
        } else {
          console.error('Failed to fetch order:', data.error);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Package className="w-6 h-6 text-blue-600" />;
      case 'processing':
        return <Package className="w-6 h-6 text-yellow-600" />;
      case 'shipped':
        return <Truck className="w-6 h-6 text-green-600" />;
      case 'delivered':
        return <MapPin className="w-6 h-6 text-green-700" />;
      default:
        return <Package className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Received';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center mb-10 border border-green-100">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-20 h-20 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl mb-5 tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Order Successful!</h1>
          <p className="text-gray-600 text-lg mb-6 tracking-wide leading-relaxed">
            Thank you for your purchase! Your order has been placed successfully and we're excited to get it to you.
          </p>
          {orderId && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 mb-6 border border-amber-200">
              <p className="text-sm text-gray-600 mb-2 tracking-wide uppercase font-semibold">Order ID</p>
              <p className="text-2xl font-mono font-bold text-amber-700">{orderId}</p>
            </div>
          )}
          <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 px-6 py-3 rounded-full">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">Confirmation email sent!</span>
          </div>
        </div>

        {order && (
          <>
            {/* Order Status */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
              <h2 className="text-2xl mb-6 font-bold text-gray-800 tracking-tight">Order Status</h2>
              <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                {getStatusIcon(order.status)}
                <div className="flex-1">
                  <p className="font-bold text-xl text-gray-800 mb-1">{getStatusText(order.status)}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {order.trackingNumber 
                      ? `Tracking Number: ${order.trackingNumber}` 
                      : 'We will email you tracking information once your order ships.'}
                  </p>
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      <ExternalLink className="w-4 h-4 inline-block mr-1" />
                      Track Order
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
              <h2 className="text-2xl mb-6 font-bold text-gray-800 tracking-tight">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b last:border-b-0 hover:bg-gray-50 px-2 rounded transition-colors">
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">{item.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.size && `Size: ${item.size} • `}Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-700 text-lg">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-gray-200 mt-6 pt-6 flex justify-between text-xl font-bold">
                <span className="text-gray-800">Total</span>
                <span className="text-amber-700">₹{order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
              <h2 className="text-2xl mb-6 font-bold text-gray-800 tracking-tight">Shipping Information</h2>
              <div className="text-gray-700 leading-relaxed space-y-1 text-lg">
                <p className="font-bold text-gray-800">{order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                <p>{order.customerInfo.address}</p>
                <p>{order.customerInfo.city}, {order.customerInfo.state} {order.customerInfo.zipCode}</p>
                <p className="mt-3 text-amber-700 font-semibold">{order.customerInfo.email}</p>
                <p className="text-amber-700 font-semibold">{order.customerInfo.phone}</p>
              </div>
            </div>
          </>
        )}

        <div className="space-y-4">
          <Link to="/products">
            <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg py-6 rounded-xl shadow-lg">
              Continue Shopping
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full text-lg py-6 rounded-xl border-2">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
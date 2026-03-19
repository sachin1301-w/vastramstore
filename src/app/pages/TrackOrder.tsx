import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Package, Truck, MapPin, CheckCircle, Search, Clock, Calendar, User, Phone, Mail, Sparkles, Box, Navigation } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { motion } from 'motion/react';

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
  updatedAt: string;
}

export function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-load order if orderId is in URL
  useEffect(() => {
    const urlOrderId = searchParams.get('orderId');
    if (urlOrderId) {
      setOrderId(urlOrderId);
      fetchOrder(urlOrderId);
    }
  }, [searchParams]);

  const fetchOrder = async (orderIdToFetch: string) => {
    if (!orderIdToFetch.trim()) {
      setError('Please enter an order ID');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/orders/${orderIdToFetch}`,
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
        setError('Order not found. Please check your order ID and try again.');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to fetch order. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderId);
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: CheckCircle, color: 'from-blue-500 to-blue-600' },
      { key: 'processing', label: 'Processing', icon: Package, color: 'from-purple-500 to-purple-600' },
      { key: 'shipped', label: 'Shipped', icon: Truck, color: 'from-amber-500 to-orange-600' },
      { key: 'delivered', label: 'Delivered', icon: MapPin, color: 'from-green-500 to-green-600' },
    ];

    const currentStatusIndex = steps.findIndex(step => step.key === order?.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentStatusIndex,
      active: index === currentStatusIndex,
    }));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-700 to-orange-700 text-white px-6 py-2 rounded-full mb-4">
            <Navigation className="w-5 h-5" />
            <span className="text-sm font-medium">Real-Time Tracking</span>
          </div>
          <h1 className="text-4xl md:text-5xl bg-gradient-to-r from-amber-800 via-orange-700 to-amber-700 bg-clip-text text-transparent mb-3">
            Track Your Order
          </h1>
          <p className="text-gray-600 text-lg">Monitor your package journey in real-time</p>
        </motion.div>

        {/* Search Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8 mb-8 overflow-hidden relative"
        >
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full blur-3xl opacity-30 -z-0"></div>
          
          <form onSubmit={handleTrackOrder} className="relative z-10">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="orderId" className="text-gray-700 mb-2 flex items-center gap-2">
                  <Box className="w-4 h-4 text-amber-700" />
                  <span className="font-medium">Enter Your Order ID</span>
                </Label>
                <Input
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="ORD-1234567890-abc123"
                  className="w-full h-12 border-amber-200 focus:border-amber-700 focus:ring-amber-700 text-lg"
                />
              </div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="md:self-end"
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white h-12 px-8 text-base shadow-lg shadow-amber-200 border-0 relative overflow-hidden group"
                >
                  {/* Button Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Track Order
                    </span>
                  )}
                </Button>
              </motion.div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl"
              >
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </form>
        </motion.div>

        {order && (
          <div className="space-y-6">
            {/* Order Status Timeline */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-gradient-to-br from-amber-700 to-orange-700 p-3 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-800 to-orange-700 bg-clip-text text-transparent">
                    Order Status
                  </h2>
                  <p className="text-sm text-gray-600">Track your package in real-time</p>
                </div>
              </div>

              {/* Status Steps */}
              <div className="relative mb-8">
                <div className="hidden md:flex justify-between items-start">
                  {getStatusSteps().map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <motion.div 
                        key={step.key} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (index * 0.1) }}
                        className="flex flex-col items-center flex-1 relative"
                      >
                        {/* Connection Line */}
                        {index < getStatusSteps().length - 1 && (
                          <div
                            className={`absolute top-8 left-1/2 w-full h-1 transition-all duration-500 ${
                              step.completed 
                                ? 'bg-gradient-to-r from-green-400 to-green-500' 
                                : 'bg-gray-200'
                            }`}
                            style={{ zIndex: 0 }}
                          />
                        )}
                        
                        {/* Icon Circle */}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                            step.completed
                              ? `bg-gradient-to-br ${step.color} text-white shadow-${step.color.split('-')[1]}-300`
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Icon className="w-7 h-7" />
                          {step.active && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                            >
                              <motion.div
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-green-400 rounded-full opacity-75"
                              ></motion.div>
                            </motion.div>
                          )}
                        </motion.div>
                        
                        {/* Label */}
                        <p
                          className={`mt-3 text-sm text-center font-medium transition-all duration-300 ${
                            step.active 
                              ? 'text-gray-900 scale-105' 
                              : step.completed 
                                ? 'text-gray-700' 
                                : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {getStatusSteps().map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                            step.completed
                              ? `bg-gradient-to-br ${step.color} text-white`
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${step.active ? 'text-gray-900' : 'text-gray-600'}`}>
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracking Number */}
              {order.trackingNumber && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-700 p-2 rounded-lg">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-amber-800 font-medium mb-1">Tracking Number</p>
                      <p className="font-mono font-bold text-amber-900 text-lg">{order.trackingNumber}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Live Tracking Timeline */}
              {order.trackingEvents && order.trackingEvents.length > 0 && (
                <div className="mt-8 pt-8 border-t-2 border-amber-100">
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
                      Live Tracking Updates
                    </span>
                  </h3>
                  <div className="space-y-4">
                    {order.trackingEvents.map((event, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + (index * 0.1) }}
                        className="relative pl-8 pb-6 border-l-2 border-gradient-to-b from-amber-500 to-orange-600 last:border-transparent"
                      >
                        {/* Timeline Dot */}
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + (index * 0.1) }}
                          className="absolute -left-[9px] top-0 w-4 h-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full border-2 border-white shadow-md"
                        >
                          {index === 0 && (
                            <motion.div
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute inset-0 bg-amber-400 rounded-full opacity-75 -z-10"
                            ></motion.div>
                          )}
                        </motion.div>

                        {/* Event Card */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-gray-900 text-lg">{event.status}</p>
                              <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                                <MapPin className="w-4 h-4 text-amber-600" />
                                {event.location}
                              </p>
                            </div>
                            <div className="bg-white px-3 py-1 rounded-full border border-amber-200">
                              <span className="text-xs text-gray-600 font-medium">{formatDate(event.timestamp)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{event.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-amber-100 flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Last updated: {formatDate(order.updatedAt)}</span>
              </div>
            </motion.div>

            {/* Order Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Order Information */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-xs text-purple-700 font-medium mb-2">Order ID</p>
                    <p className="font-mono font-bold text-purple-900 break-all">{order.orderId}</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Order Date</p>
                      <p className="font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Shipping Address */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-green-600 to-teal-600 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <User className="w-5 h-5 text-green-700" />
                    <p className="font-semibold text-gray-900">
                      {order.customerInfo.firstName} {order.customerInfo.lastName}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 leading-relaxed">
                      {order.customerInfo.address}<br />
                      {order.customerInfo.city}, {order.customerInfo.state} {order.customerInfo.zipCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Phone className="w-4 h-4 text-blue-700" />
                    <p className="text-gray-900 font-medium">{order.customerInfo.phone}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Order Items */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-2 rounded-lg">
                  <Box className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Order Items</h2>
              </div>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + (index * 0.1) }}
                    className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.size && <span className="text-amber-700 font-medium">Size: {item.size}</span>}
                        {item.size && ' • '}
                        <span>Quantity: {item.quantity}</span>
                      </p>
                    </div>
                    <p className="font-bold text-xl bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </motion.div>
                ))}
              </div>
              
              {/* Total */}
              <div className="border-t-2 border-indigo-200 mt-6 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total Amount</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                    ₹{order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStock } from '../context/StockContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { CreditCard, Smartphone, Wallet, ShieldCheck, Sparkles, MapPin, Mail, Phone, User } from 'lucide-react';
import { motion } from 'motion/react';

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { getStock } = useStock();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Auto-fill user data if signed in
  useEffect(() => {
    if (user) {
      const nameParts = user.name.split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email,
      }));
    }
  }, [user]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch Razorpay configuration
  useEffect(() => {
    const fetchRazorpayConfig = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/payment/config`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        const data = await response.json();
        
        if (data.success && data.keyId) {
          setRazorpayKeyId(data.keyId);
          console.log('✅ Razorpay configured successfully');
        } else {
          console.log('ℹ️ Payment Gateway:', data.message || 'Razorpay not yet configured');
        }
      } catch (error) {
        console.log('ℹ️ Payment gateway will be available soon');
      }
    };

    fetchRazorpayConfig();
  }, []);

  // Redirect to cart if there are no items
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  const handlePayment = async (orderId: string, orderTotal: number) => {
    // If Razorpay is not configured, skip payment and place order directly
    if (!razorpayKeyId || !razorpayLoaded) {
      console.log('Razorpay not available - placing order without payment');
      
      // Create order in backend (without payment)
      const orderPayload = {
        orderId,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          image: item.image,
        })),
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        total: orderTotal,
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/orders/create-without-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(orderPayload),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/profile?orderSuccess=true&orderId=${orderId}`);
      return;
    }

    try {
      // Create Razorpay order
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/payment/create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            amount: orderTotal,
            currency: 'INR',
            receipt: orderId,
          }),
        }
      );

      const paymentData = await response.json();

      if (!response.ok) {
        throw new Error(paymentData.error || 'Failed to create payment order');
      }

      // Open Razorpay checkout
      const options = {
        key: razorpayKeyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'VASTRAM',
        description: `Order #${orderId}`,
        order_id: paymentData.orderId,
        handler: async function (response: any) {
          // Verify payment and create order
          const verifyResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/payment/verify`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
                orderData: {
                  items: items.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size,
                    image: item.image,
                  })),
                  customerInfo: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                  },
                  total: orderTotal,
                },
              }),
            }
          );

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            clearCart();
            toast.success('Payment successful!');
            navigate(`/profile?orderSuccess=true&orderId=${orderId}`);
          } else {
            setIsSubmitting(false);
            toast.error('❌ Payment Unsuccessful', {
              duration: 6000,
              description: 'Payment verification failed. Your order was not placed. Please try again.',
            });
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
        },
        theme: {
          color: '#b45309',
        },
        config: {
          display: {
            hide: [{ method: 'emi' }],
          },
        },
        modal: {
          ondismiss: function() {
            setIsSubmitting(false);
            toast.error('❌ Payment Cancelled', {
              duration: 5000,
              description: 'You cancelled the payment. Your order was not placed. You can try again anytime.',
            });
          },
          escape: false,
          animation: true,
          confirm_close: true,
        },
        retry: {
          enabled: true,
          max_count: 4,
        },
        timeout: 300, // 5 minutes timeout
        readonly: {
          contact: false,
          email: false,
          name: false,
        },
      };

      const razorpay = new window.Razorpay(options);
      
      // Handle payment failures
      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        setIsSubmitting(false);
        
        const errorCode = response.error.code;
        const errorDescription = response.error.description;
        const errorReason = response.error.reason;
        
        console.log('Error Code:', errorCode);
        console.log('Error Description:', errorDescription);
        console.log('Error Reason:', errorReason);
        
        // Show user-friendly error messages
        let errorMessage = '❌ Payment Unsuccessful';
        let errorDesc = 'Payment failed. Please try again.';
        
        if (errorCode === 'BAD_REQUEST_ERROR') {
          errorDesc = 'Invalid payment details. Please check and try again.';
        } else if (errorCode === 'GATEWAY_ERROR') {
          errorDesc = 'Payment gateway error. Please try a different payment method.';
        } else if (errorCode === 'NETWORK_ERROR') {
          errorDesc = 'Network error. Please check your connection and try again.';
        } else if (errorReason === 'payment_failed') {
          errorDesc = errorDescription || 'Payment could not be processed. Please try again or use a different payment method.';
        }
        
        toast.error(errorMessage, {
          duration: 6000,
          description: `${errorDesc} Your order was not placed. If money was deducted, it will be refunded within 5-7 business days.`,
        });
      });
      
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone ||
        !formData.address || !formData.city || !formData.state || !formData.zipCode) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate stock for all items in cart
    const outOfStockItems = items.filter(item => {
      const stock = getStock(item.id);
      return stock < item.quantity;
    });

    if (outOfStockItems.length > 0) {
      const itemNames = outOfStockItems.map(item => item.name).join(', ');
      toast.error(`Some items are out of stock: ${itemNames}`, {
        duration: 5000,
        description: 'Please remove out-of-stock items from your cart and try again.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const total = getTotalPrice();

      // Generate temporary order ID
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Open Razorpay payment (order will be created only after successful payment)
      await handlePayment(orderId, total);
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process order');
      setIsSubmitting(false);
    }
  };

  const subtotal = getTotalPrice();
  const shipping = 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-full mb-4">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-medium">Secure Checkout</span>
          </div>
          <h1 className="text-4xl md:text-5xl bg-gradient-to-r from-amber-800 via-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Complete Your Order
          </h1>
          <p className="text-gray-600">Fill in your details to proceed with your purchase</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6">
                <h2 className="text-2xl text-white flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  Shipping Information
                </h2>
                <p className="text-amber-100 text-sm mt-1">We'll deliver your order to this address</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-800 mb-4">
                    <User className="w-5 h-5" />
                    <h3 className="font-semibold">Personal Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div whileFocus={{ scale: 1.01 }}>
                      <Label htmlFor="firstName" className="text-gray-700">First Name *</Label>
                      <Input
                        id="firstName"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="mt-1 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                        placeholder="John"
                      />
                    </motion.div>
                    <motion.div whileFocus={{ scale: 1.01 }}>
                      <Label htmlFor="lastName" className="text-gray-700">Last Name *</Label>
                      <Input
                        id="lastName"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="mt-1 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                        placeholder="Doe"
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4 pt-4 border-t border-amber-100">
                  <div className="flex items-center gap-2 text-amber-800 mb-4">
                    <Mail className="w-5 h-5" />
                    <h3 className="font-semibold">Contact Details</h3>
                  </div>
                  <motion.div whileFocus={{ scale: 1.01 }}>
                    <Label htmlFor="email" className="text-gray-700">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                      placeholder="john.doe@example.com"
                    />
                  </motion.div>

                  <motion.div whileFocus={{ scale: 1.01 }}>
                    <Label htmlFor="phone" className="text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </motion.div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-4 pt-4 border-t border-amber-100">
                  <div className="flex items-center gap-2 text-amber-800 mb-4">
                    <MapPin className="w-5 h-5" />
                    <h3 className="font-semibold">Delivery Address</h3>
                  </div>
                  <motion.div whileFocus={{ scale: 1.01 }}>
                    <Label htmlFor="address" className="text-gray-700">Street Address *</Label>
                    <Input
                      id="address"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                      placeholder="123 Main Street, Apartment 4B"
                    />
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div whileFocus={{ scale: 1.01 }}>
                      <Label htmlFor="city" className="text-gray-700">City *</Label>
                      <Input
                        id="city"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="mt-1 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                        placeholder="Pune"
                      />
                    </motion.div>
                    <motion.div whileFocus={{ scale: 1.01 }}>
                      <Label htmlFor="state" className="text-gray-700">State *</Label>
                      <Input
                        id="state"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="mt-1 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                        placeholder="Maharashtra"
                      />
                    </motion.div>
                  </div>

                  <motion.div whileFocus={{ scale: 1.01 }} className="md:w-1/2">
                    <Label htmlFor="zipCode" className="text-gray-700">PIN Code *</Label>
                    <Input
                      id="zipCode"
                      required
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="mt-1 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                      placeholder="411015"
                    />
                  </motion.div>
                </div>

                {/* Payment Method */}
                <div className="pt-6 border-t border-amber-100">
                  <h3 className="text-xl mb-4 flex items-center gap-2 text-amber-800">
                    <Wallet className="w-6 h-6" />
                    Payment Method
                  </h3>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 overflow-hidden"
                  >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200 rounded-full blur-2xl opacity-20"></div>
                    
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                          <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-900">Razorpay Secure Payment</h4>
                          <p className="text-xs text-blue-700">Protected by industry-leading security</p>
                        </div>
                      </div>
                      <p className="text-sm text-blue-800 mb-4">
                        Choose from multiple payment options at checkout
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <motion.div 
                          whileHover={{ scale: 1.05, y: -2 }}
                          className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border-2 border-blue-200 shadow-sm"
                        >
                          <Smartphone className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">UPI</span>
                        </motion.div>
                        <motion.div 
                          whileHover={{ scale: 1.05, y: -2 }}
                          className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border-2 border-blue-200 shadow-sm"
                        >
                          <CreditCard className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Cards</span>
                        </motion.div>
                        <motion.div 
                          whileHover={{ scale: 1.05, y: -2 }}
                          className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border-2 border-blue-200 shadow-sm"
                        >
                          <Wallet className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">Wallets</span>
                        </motion.div>
                        <motion.div 
                          whileHover={{ scale: 1.05, y: -2 }}
                          className="bg-white px-4 py-3 rounded-lg border-2 border-blue-200 shadow-sm"
                        >
                          <span className="text-sm font-medium text-gray-700">Net Banking</span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Submit Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-200 border-0 h-14 text-lg relative overflow-hidden group"
                    size="lg"
                  >
                    {/* Button Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing Your Order...
                      </>
                    ) : razorpayKeyId ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Pay ₹{total.toFixed(2)}
                        <ShieldCheck className="w-5 h-5" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Place Order ₹{total.toFixed(2)}
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Payment Coming Soon</span>
                      </span>
                    )}
                  </Button>
                </motion.div>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>Your information is protected with SSL encryption</span>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Order Summary - Sticky */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden sticky top-24">
              {/* Summary Header */}
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-5">
                <h2 className="text-2xl text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Order Summary
                </h2>
              </div>

              <div className="p-6">
                {/* Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item, index) => (
                    <motion.div 
                      key={`${item.id}-${item.size}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4 p-3 bg-amber-50 rounded-lg border border-amber-100"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg shadow-sm"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 leading-tight">{item.name}</h3>
                        {item.size && (
                          <p className="text-sm text-amber-700 mt-1">Size: {item.size}</p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                          <span className="font-bold text-amber-700">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="border-t-2 border-amber-100 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-green-600 flex items-center gap-1">
                          FREE 🎉
                        </span>
                      ) : (
                        `₹${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xl pt-3 border-t-2 border-amber-200">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      ₹{total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-amber-100 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Quality Guaranteed</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
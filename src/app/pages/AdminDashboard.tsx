import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { 
  Download, 
  Package, 
  RefreshCw, 
  Search, 
  LogOut, 
  Shield, 
  User, 
  Mail, 
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  Eye,
  X,
  Plus,
  Trash2
} from 'lucide-react';
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
  updatedAt: string;
  paymentStatus?: string;
  orderSuccessful?: boolean;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewOrderDetails, setViewOrderDetails] = useState<Order | null>(null);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Check if admin is logged in
    const adminSession = localStorage.getItem('admin_session');
    if (!adminSession) {
      toast.error('Please login as admin');
      navigate('/admin/login');
      return;
    }

    fetchOrders();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/orders`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const sortedOrders = data.orders.sort(
          (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (orderId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/orders/${orderId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            status,
            trackingNumber,
            trackingUrl,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Order updated successfully');
        setSelectedOrder(null);
        setTrackingNumber('');
        setTrackingUrl('');
        setStatus('');
        fetchOrders();
      } else {
        toast.error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error updating order');
    }
  };

  const handleMarkAsSuccessful = async (orderId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/orders/${orderId}/mark-successful`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            orderSuccessful: !currentStatus,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(!currentStatus ? 'Order marked as successful!' : 'Order success status removed');
        fetchOrders();
      } else {
        toast.error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Error updating order');
    }
  };

  const handleExportToExcel = () => {
    window.open(
      `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/orders/export/csv`,
      '_blank'
    );
    toast.success('Downloading orders export...');
  };

  const handleQuickReset = async () => {
    // Calculate stats before showing confirmation
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalCustomers = new Set(orders.map(o => o.customerInfo.email)).size;
    const totalProducts = orders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0), 0);
    
    // Show summary before deletion
    const summary = `
📊 Current Dashboard Stats:
• Total Orders: ${orders.length}
• Total Revenue: ₹${totalRevenue.toFixed(2)}
• Total Customers: ${totalCustomers}
• Products Sold: ${totalProducts}

⚠️ ALL DATA WILL BE PERMANENTLY DELETED!
    `.trim();

    if (!confirm(`${summary}\n\n⚠️ DELETE ALL ORDERS?\n\nThis action CANNOT be undone!`)) {
      console.log('User cancelled deletion');
      return;
    }

    if (!confirm(`Are you ABSOLUTELY SURE?\n\nThis will reset EVERYTHING to 0!`)) {
      console.log('User cancelled final confirmation');
      return;
    }

    try {
      console.log('🗑️ Starting deletion of all orders...');
      console.log('📊 Current order count:', orders.length);
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/orders/delete-all`;
      console.log('🌐 Calling DELETE endpoint:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      const data = await response.json();
      console.log('📦 Response data:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        console.log(`✅ Successfully deleted ${data.count} orders`);
        
        // Immediately clear local state FIRST
        setOrders([]);
        setFilteredOrders([]);
        setSelectedOrder(null);
        setViewOrderDetails(null);
        
        toast.success(`✅ Dashboard Reset Complete! Deleted ${data.count} orders`);
        
        // Then fetch fresh data from server
        console.log('🔄 Fetching fresh data from server...');
        await fetchOrders();
        
        console.log('✅ Dashboard reset complete!');
      } else {
        const errorMsg = data.error || 'Failed to reset dashboard';
        toast.error(errorMsg);
        console.error('❌ Delete failed:', errorMsg);
        console.error('❌ Full response:', data);
      }
    } catch (error) {
      console.error('❌ Error resetting dashboard:', error);
      console.error('❌ Error details:', error.message, error.stack);
      toast.error(`Error resetting dashboard: ${error.message}`);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'shipped':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'delivered':
        return 'bg-purple-100 text-purple-800 border border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filterOrders = (query: string) => {
    if (!query) {
      setFilteredOrders(orders);
      return;
    }
    const lowerCaseQuery = query.toLowerCase();
    const filtered = orders.filter(order => {
      return (
        order.orderId.toLowerCase().includes(lowerCaseQuery) ||
        order.customerInfo.firstName.toLowerCase().includes(lowerCaseQuery) ||
        order.customerInfo.lastName.toLowerCase().includes(lowerCaseQuery) ||
        order.customerInfo.email.toLowerCase().includes(lowerCaseQuery) ||
        order.customerInfo.phone.includes(lowerCaseQuery) ||
        order.status.toLowerCase().includes(lowerCaseQuery)
      );
    });
    setFilteredOrders(filtered);
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalCustomers = new Set(orders.map(o => o.customerInfo.email)).size;
  const totalProducts = orders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">VASTRAM Admin</h1>
                <p className="text-sm text-red-100">Order Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50"
              >
                Switch User Type
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingBag className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Products Sold</p>
                <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Summary */}
        <div className="bg-white rounded-xl shadow-md mb-8 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Order Status Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-blue-900">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-sm text-yellow-600 mb-1">Processing</p>
              <p className="text-2xl font-bold text-yellow-900">
                {orders.filter(o => o.status === 'processing').length}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600 mb-1">Shipped</p>
              <p className="text-2xl font-bold text-green-900">
                {orders.filter(o => o.status === 'shipped').length}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-sm text-purple-600 mb-1">Delivered</p>
              <p className="text-2xl font-bold text-purple-900">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={fetchOrders}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Orders
            </Button>
            <Button
              onClick={handleExportToExcel}
              className="bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
            <Button
              onClick={() => navigate('/admin/add-product')}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Product
            </Button>
            <Button
              onClick={handleQuickReset}
              className="bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Quick Reset Dashboard
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by Order ID, Customer Name, Email, Phone, or Status..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                filterOrders(e.target.value);
              }}
              className="flex-1"
            />
            {searchQuery && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setFilteredOrders(orders);
                }}
                variant="outline"
                size="sm"
              >
                Clear
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredOrders.length} order(s) matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl text-gray-600 mb-2">No orders yet</h2>
            <p className="text-gray-500">Orders will appear here once customers start placing them.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl text-gray-600 mb-2">No orders found</h2>
            <p className="text-gray-500">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.orderId} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                  <div className="mb-4 lg:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-xl text-gray-900">{order.orderId}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{order.customerInfo.firstName} {order.customerInfo.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{order.customerInfo.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{order.customerInfo.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-3xl font-bold text-green-600">₹{order.total.toFixed(2)}</div>
                    <Button
                      onClick={() => setViewOrderDetails(order)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3 text-gray-800">Purchased Items ({order.items.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.size && `Size: ${item.size} • `}Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-bold text-amber-700">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder?.orderId === order.orderId ? (
                  <div className="border-t pt-4 mt-4 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-gray-800">Update Order Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label htmlFor={`status-${order.orderId}`}>Status</Label>
                        <select
                          id={`status-${order.orderId}`}
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select status</option>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor={`tracking-${order.orderId}`}>Tracking Number</Label>
                        <Input
                          id={`tracking-${order.orderId}`}
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="Enter tracking number"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`tracking-url-${order.orderId}`}>Tracking URL</Label>
                        <Input
                          id={`tracking-url-${order.orderId}`}
                          value={trackingUrl}
                          onChange={(e) => setTrackingUrl(e.target.value)}
                          placeholder="Enter tracking URL"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdateOrder(order.orderId)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedOrder(null);
                          setTrackingNumber('');
                          setTrackingUrl('');
                          setStatus('');
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setSelectedOrder(order);
                      setStatus(order.status);
                      setTrackingNumber(order.trackingNumber || '');
                      setTrackingUrl(order.trackingUrl || '');
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    Update Order
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {viewOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Order Details</h2>
              <button
                onClick={() => setViewOrderDetails(null)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Order Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Order ID</p>
                    <p className="font-semibold">{viewOrderDetails.orderId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(viewOrderDetails.status)}`}>
                      {viewOrderDetails.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600">Order Date</p>
                    <p className="font-semibold">{formatDate(viewOrderDetails.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Amount</p>
                    <p className="font-semibold text-green-600 text-lg">₹{viewOrderDetails.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold">{viewOrderDetails.customerInfo.firstName} {viewOrderDetails.customerInfo.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>{viewOrderDetails.customerInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span>{viewOrderDetails.customerInfo.phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 mt-1" />
                    <div>
                      <p>{viewOrderDetails.customerInfo.address}</p>
                      <p>{viewOrderDetails.customerInfo.city}, {viewOrderDetails.customerInfo.state} {viewOrderDetails.customerInfo.zipCode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Items Purchased</h3>
                <div className="space-y-2">
                  {viewOrderDetails.items.map((item, index) => (
                    <div key={index} className="bg-amber-50 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.size && `Size: ${item.size} • `}
                          Unit Price: ₹{item.price.toFixed(2)} • Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-amber-700 text-lg">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t-2 mt-4 pt-4 flex justify-between items-center">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold text-green-600">₹{viewOrderDetails.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Tracking Info */}
              {viewOrderDetails.trackingNumber && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">Tracking Information</h3>
                  <p className="text-sm text-gray-700">
                    <strong>Tracking Number:</strong> {viewOrderDetails.trackingNumber}
                  </p>
                  {viewOrderDetails.trackingUrl && (
                    <a
                      href={viewOrderDetails.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Track Package →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Download, Package, Truck, MapPin, RefreshCw, Database, Search, Trash2 } from 'lucide-react';
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
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    fetchOrders();
  }, []);

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
        // Sort orders by creation date (newest first)
        const sortedOrders = data.orders.sort(
          (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders);
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

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`Are you sure you want to delete order ${orderId}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/orders/${orderId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Order deleted successfully');
        fetchOrders();
      } else {
        toast.error(data.error || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Error deleting order');
    }
  };

  const handleDeleteAllOrders = async () => {
    if (!confirm(`⚠️ WARNING: Delete ALL ${orders.length} orders? This action CANNOT be undone!`)) {
      return;
    }

    if (!confirm(`Are you ABSOLUTELY SURE? This will permanently delete all ${orders.length} orders!`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/orders/delete-all`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Successfully deleted ${data.count} orders`);
        fetchOrders();
      } else {
        toast.error(data.error || 'Failed to delete all orders');
      }
    } catch (error) {
      console.error('Error deleting all orders:', error);
      toast.error('Error deleting all orders');
    }
  };

  const handleExportToExcel = () => {
    window.open(
      `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/orders/export/csv`,
      '_blank'
    );
    toast.success('Downloading orders export...');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderId.toLowerCase().includes(query) ||
      order.customerInfo.firstName.toLowerCase().includes(query) ||
      order.customerInfo.lastName.toLowerCase().includes(query) ||
      order.customerInfo.email.toLowerCase().includes(query) ||
      order.customerInfo.phone.includes(query) ||
      order.status.toLowerCase().includes(query)
    );
  });

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl mb-2">Order Management</h1>
            <p className="text-gray-600">Manage and track all customer orders</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchOrders}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            {orders.length > 0 && (
              <Button
                onClick={handleDeleteAllOrders}
                variant="outline"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
              >
                <Trash2 className="w-4 h-4" />
                Delete All Orders
              </Button>
            )}
            <Button
              onClick={handleExportToExcel}
              className="bg-green-700 hover:bg-green-800 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-blue-900">{orders.length}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-900">
                {orders.filter(o => o.status === 'pending').length}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-600 mb-1">Processing</p>
              <p className="text-3xl font-bold text-orange-900">
                {orders.filter(o => o.status === 'processing').length}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">Shipped</p>
              <p className="text-3xl font-bold text-green-900">
                {orders.filter(o => o.status === 'shipped').length}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-purple-900">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by Order ID, Customer Name, Email, Phone, or Status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery('')}
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

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl text-gray-600 mb-2">No orders yet</h2>
            <p className="text-gray-500">Orders will appear here once customers start placing them.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl text-gray-600 mb-2">No orders found</h2>
            <p className="text-gray-500">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.orderId} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                  <div className="mb-4 lg:mb-0">
                    <h3 className="font-semibold text-lg mb-1">{order.orderId}</h3>
                    <p className="text-sm text-gray-600">
                      {order.customerInfo.firstName} {order.customerInfo.lastName} • {formatDate(order.createdAt)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.customerInfo.email} • {order.customerInfo.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className="text-lg font-bold">${order.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="font-medium mb-2">Items</h4>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <p key={index} className="text-sm text-gray-700">
                          {item.name} {item.size && `(${item.size})`} x{item.quantity} - ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Shipping Address</h4>
                    <p className="text-sm text-gray-700">{order.customerInfo.address}</p>
                    <p className="text-sm text-gray-700">
                      {order.customerInfo.city}, {order.customerInfo.state} {order.customerInfo.zipCode}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{order.customerInfo.phone}</p>
                  </div>
                </div>

                {order.trackingNumber && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-900">
                      <strong>Tracking Number:</strong> {order.trackingNumber}
                    </p>
                  </div>
                )}

                {selectedOrder?.orderId === order.orderId ? (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-3">Update Order</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                        className="bg-amber-700 hover:bg-amber-800"
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
                  <div className="flex gap-2">
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
                    <Button
                      onClick={() => handleDeleteOrder(order.orderId)}
                      variant="outline"
                      className="mt-4 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
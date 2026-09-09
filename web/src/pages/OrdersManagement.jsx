import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, Eye, Trash2, AlertCircle } from 'lucide-react';
import ShippingAddressDisplay from '@/components/ShippingAddressDisplay.jsx';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch ALL orders without userId filtering
      const records = await pb.collection('orders').getFullList({ 
        sort: '-created', 
        $autoCancel: false 
      });
      
      console.log('Fetched orders:', records);
      setOrders(records);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchOrders(); 
  }, []);

  const handleStatusChange = async (orderId, field, value) => {
    try {
      await pb.collection('orders').update(orderId, { [field]: value }, { $autoCancel: false });
      toast.success(`Order ${field.replace('_', ' ')} updated`);
      
      // Update local state to reflect changes immediately
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, [field]: value } : o));
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, [field]: value }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      await pb.collection('orders').delete(orderId, { $autoCancel: false });
      toast.success('Order deleted successfully');
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const handleViewOrder = (order) => {
    console.log('[DEBUG] Viewing order details for:', order.orderNumber);
    console.log('[DEBUG] Full order object:', order);
    console.log('[DEBUG] Shipping address raw data:', order.shipping_address);
    
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <Helmet><title>Orders Management - Admin</title></Helmet>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Orders Management</h1>
          <p className="text-muted-foreground mt-1">View and manage all customer orders across the store.</p>
        </div>
        <Button onClick={fetchOrders} variant="outline" disabled={loading}>
          Refresh Orders
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by order number, name, or email..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-muted/30"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-8 text-center bg-destructive/10 rounded-xl border border-destructive/20 my-4">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
              <p className="text-destructive font-medium mb-4">{error}</p>
              <Button onClick={fetchOrders} variant="outline">Try Again</Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Order #</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold text-right">Total</TableHead>
                    <TableHead className="font-semibold">Payment</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 rounded-md" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-28 rounded-md" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        {searchTerm ? 'No orders found matching your search.' : 'No orders have been placed yet.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map(order => (
                      <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium tabular-nums">
                          {order.orderNumber || order.id.slice(0,8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{order.customer_name}</span>
                            <span className="text-xs text-muted-foreground">{order.customer_email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {new Date(order.created).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          ₹{order.total_amount?.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <select 
                            className={`text-xs border rounded-md p-1.5 font-medium outline-none focus:ring-2 focus:ring-ring transition-colors ${
                              order.payment_status === 'completed' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800/30' :
                              order.payment_status === 'failed' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                              'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800/30'
                            }`}
                            value={order.payment_status || 'pending'}
                            onChange={(e) => handleStatusChange(order.id, 'payment_status', e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <select 
                            className="text-xs border border-input bg-background rounded-md p-1.5 font-medium outline-none focus:ring-2 focus:ring-ring transition-colors"
                            value={order.order_status || 'pending'}
                            onChange={(e) => handleStatusChange(order.id, 'order_status', e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye className="w-4 h-4 mr-1.5" /> View
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(order.id)}
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Order Details: {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="p-5 bg-muted/30 border border-border/50 rounded-xl">
                  <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                    Customer Information
                  </h3>
                  <div className="space-y-2.5 text-muted-foreground">
                    <p className="flex justify-between"><span className="font-medium text-foreground">Name:</span> <span>{selectedOrder.customer_name}</span></p>
                    <p className="flex justify-between"><span className="font-medium text-foreground">Email:</span> <span>{selectedOrder.customer_email}</span></p>
                    <p className="flex justify-between"><span className="font-medium text-foreground">Phone:</span> <span>{selectedOrder.customer_phone}</span></p>
                    <p className="flex justify-between"><span className="font-medium text-foreground">Date:</span> <span>{new Date(selectedOrder.created).toLocaleString()}</span></p>
                  </div>
                </div>
                <div className="p-5 bg-muted/30 border border-border/50 rounded-xl">
                  <h3 className="font-semibold mb-4 text-foreground">Shipping Address</h3>
                  {selectedOrder.shipping_address ? (
                    <ShippingAddressDisplay 
                      address={selectedOrder.shipping_address} 
                      className="!p-0 !bg-transparent !border-none"
                    />
                  ) : (
                    <div className="text-muted-foreground italic">No shipping details provided</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-foreground">Order Items</h3>
                <div className="border rounded-xl overflow-hidden bg-card">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-medium">Item</TableHead>
                        <TableHead className="text-center font-medium">Qty</TableHead>
                        <TableHead className="text-right font-medium">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : selectedOrder.items || []).map((item, i) => (
                        <TableRow key={i} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{item.quantity}</TableCell>
                          <TableCell className="text-right tabular-nums">₹{item.price?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-full sm:w-80 space-y-2.5 text-sm bg-muted/30 border border-border/50 p-5 rounded-xl">
                  <div className="flex justify-between"><span className="text-muted-foreground">Products Total (Incl. Tax):</span> <span className="font-medium tabular-nums">₹{((selectedOrder.subtotal || 0) + (selectedOrder.tax_amount || 0)).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground pl-4">Subtotal (Excl. Tax):</span> <span className="tabular-nums">₹{(selectedOrder.subtotal || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground pl-4">Extracted Tax:</span> <span className="tabular-nums">₹{(selectedOrder.tax_amount || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Shipping:</span> <span className="font-medium tabular-nums">₹{(selectedOrder.shipping_cost || 0).toFixed(2)}</span></div>
                  {selectedOrder.coupon_discount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>Discount:</span> <span className="font-medium tabular-nums">-₹{selectedOrder.coupon_discount.toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-border mt-3 text-foreground">
                    <span>Total:</span> <span className="tabular-nums text-primary">₹{selectedOrder.total_amount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManagement;
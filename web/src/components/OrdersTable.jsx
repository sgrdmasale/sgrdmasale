import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Search, ChevronLeft, ChevronRight, AlertCircle, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { formatCurrency } from '@/api/EcommerceApi.js';
import ShippingAddressDisplay from '@/components/ShippingAddressDisplay.jsx';
import OrderStatusUpdateModal from '@/components/OrderStatusUpdateModal.jsx';

const OrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const pageSize = 10;

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      let filterStr = '';
      const filters = [];
      
      if (search) {
        filters.push(`(orderNumber ~ "${search}" || customer_name ~ "${search}" || customer_id ~ "${search}")`);
      }
      if (statusFilter !== 'all') {
        filters.push(`order_status = "${statusFilter}"`);
      }
      
      if (filters.length > 0) {
        filterStr = filters.join(' && ');
      }

      const result = await pb.collection('orders').getList(page, pageSize, {
        sort: '-created',
        filter: filterStr,
        $autoCancel: false
      });

      setOrders(result.items);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
    } catch (err) {
      console.error('[OrdersTable] Error fetching orders:', err);
      setError(`Failed to load orders: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(debounce);
  }, [page, search, statusFilter]);

  const toggleRow = (orderId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(orderId)) {
      newExpandedRows.delete(orderId);
    } else {
      newExpandedRows.add(orderId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleEditStatus = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    const style = styles[status?.toLowerCase()] || 'bg-muted text-muted-foreground';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize tracking-wide ${style}`}>{status}</span>;
  };

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/10 rounded-xl border border-destructive/20">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <p className="text-destructive font-medium mb-4">{error}</p>
        <Button onClick={fetchOrders} variant="outline">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="admin-table-container border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12"></TableHead>
              <TableHead className="font-semibold">Order ID</TableHead>
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">Total Amount</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                    <p>No orders found matching your criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <React.Fragment key={order.id}>
                  <TableRow className="hover:bg-muted/30 transition-colors group">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleRow(order.id)}
                      >
                        {expandedRows.has(order.id) ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">{order.orderNumber || order.id.slice(0,8)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.customer_name}</span>
                        <span className="text-xs text-muted-foreground">{order.customer_email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{new Date(order.created).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(order.order_status)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency((order.total_amount || 0) * 100, { symbol: '₹' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEditStatus(order)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Status
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(order.id) && (
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={7} className="p-0 border-b">
                        <div className="p-4 md:pl-16">
                          <div className="max-w-md bg-background p-4 rounded-lg border shadow-sm">
                            <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">Shipping Details</h4>
                            <ShippingAddressDisplay address={order.shipping_address} />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {orders.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalItems)} of {totalItems} orders
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-2 font-medium">Page {page} of {totalPages || 1}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading || totalPages === 0}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <OrderStatusUpdateModal 
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchOrders}
      />
    </div>
  );
};

export default OrdersTable;
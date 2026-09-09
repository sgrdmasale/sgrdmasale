import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/api/EcommerceApi.js';

const PaymentsTable = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const pageSize = 10;

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      let filterStr = '';
      const filters = [];
      
      if (search) {
        filters.push(`(id ~ "${search}" || orderNumber ~ "${search}")`);
      }
      if (statusFilter !== 'all') {
        filters.push(`payment_status = "${statusFilter}"`);
      }
      
      if (filters.length > 0) {
        filterStr = filters.join(' && ');
      }

      const result = await pb.collection('orders').getList(page, pageSize, {
        sort: '-created',
        filter: filterStr,
        $autoCancel: false
      });

      setPayments(result.items);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchPayments();
    }, 300);
    return () => clearTimeout(debounce);
  }, [page, search, statusFilter]);

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    };
    const style = styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>{status || 'Unknown'}</span>;
  };

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/10 rounded-xl border border-destructive/20">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <p className="text-destructive font-medium mb-4">{error}</p>
        <Button onClick={fetchPayments} variant="outline">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="admin-table-container">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No payment records found.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(payment.created).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{payment.orderNumber || payment.id.slice(0,8)}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {payment.payment_method || 'Razorpay'}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency((payment.total_amount || 0) * 100, { symbol: '₹' })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {payments.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalItems)} of {totalItems} payments
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
          <span className="px-2">Page {page} of {totalPages || 1}</span>
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
    </div>
  );
};

export default PaymentsTable;
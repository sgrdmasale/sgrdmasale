import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Package, ChevronRight, AlertCircle, ShoppingBag, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet';

const MyOrdersPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await pb.collection('orders').getList(1, 50, {
        filter: `userId="${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false
      });
      setOrders(result.items);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load your orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800';
      case 'pending': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border-amber-200 dark:border-amber-800';
      case 'failed': return 'bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 border-red-200 dark:border-red-800';
      default: return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 hover:bg-slate-500/20 border-slate-200 dark:border-slate-800';
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800';
      case 'processing': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 border-blue-200 dark:border-blue-800';
      case 'shipped': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20 border-orange-200 dark:border-orange-800';
      case 'cancelled': return 'bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 border-red-200 dark:border-red-800';
      case 'pending': default: return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 hover:bg-slate-500/20 border-slate-200 dark:border-slate-800';
    }
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div className="min-h-[100dvh] bg-muted/30 py-12 md:py-20">
      <Helmet>
        <title>My Orders | SGRD Masale</title>
        <meta name="description" content="View your order history and track current shipments." />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">My Orders</h1>
          <p className="text-muted-foreground text-lg">Track, return, or purchase items again.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border shadow-sm">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="space-y-3 flex-1 md:text-right">
                    <Skeleton className="h-6 w-24 md:ml-auto" />
                    <Skeleton className="h-6 w-32 md:ml-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 text-center max-w-md mx-auto mt-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-destructive mb-2">Unable to load orders</h3>
            <p className="text-destructive/80 mb-6">{error}</p>
            <Button onClick={fetchOrders} variant="outline" className="border-destructive/30 hover:bg-destructive/10">
              Try Again
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card border rounded-3xl p-12 text-center max-w-2xl mx-auto mt-12 shadow-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">You haven't placed any orders yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Discover our premium collection of authentic spices and blends to start your culinary journey.
            </p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const itemCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
              const displayId = order.orderNumber ? order.orderNumber : `Order #${order.id.substring(0, 8).toUpperCase()}`;

              return (
                <Link 
                  key={order.id} 
                  to={`/my-orders/${order.id}`}
                  className="block group"
                >
                  <div className="bg-card hover:bg-accent/5 border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      
                      {/* Order Info */}
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {displayId}
                          </h3>
                          <Badge variant="outline" className={getOrderStatusColor(order.order_status)}>
                            {order.order_status?.toUpperCase() || 'PENDING'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(order.created)}</span>
                          </div>
                          <div className="hidden sm:block w-1 h-1 rounded-full bg-border"></div>
                          <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4" />
                            <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Price & Payment */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 md:gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                        <div className="text-xl font-bold text-foreground">
                          {formatCurrency(order.total_amount)}
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground hidden md:block" />
                          <Badge variant="outline" className={getPaymentStatusColor(order.payment_status)}>
                            {order.payment_status?.toUpperCase() || 'PENDING'}
                          </Badge>
                        </div>
                      </div>

                      {/* Chevron */}
                      <div className="hidden md:flex items-center justify-center pl-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1 duration-200">
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
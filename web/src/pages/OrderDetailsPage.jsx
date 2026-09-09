import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { ArrowLeft, Package, Truck, CheckCircle2, MapPin, CreditCard, Receipt, AlertCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!currentUser || !id) return;
      
      setLoading(true);
      try {
        const record = await pb.collection('orders').getOne(id, {
          $autoCancel: false
        });
        
        // Verify ownership
        if (record.userId !== currentUser.id) {
          throw new Error("Unauthorized access to order");
        }
        
        setOrder(record);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Order not found or you do not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, currentUser]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString, includeTime = false) => {
    const options = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      ...(includeTime && { hour: 'numeric', minute: '2-digit' })
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusBadge = (status, type = 'order') => {
    const s = status?.toLowerCase() || 'pending';
    let classes = '';
    
    if (type === 'payment') {
      if (s === 'completed') classes = 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      else if (s === 'failed') classes = 'bg-red-500/10 text-red-700 border-red-200';
      else classes = 'bg-amber-500/10 text-amber-700 border-amber-200';
    } else {
      if (s === 'delivered') classes = 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      else if (s === 'processing') classes = 'bg-blue-500/10 text-blue-700 border-blue-200';
      else if (s === 'shipped') classes = 'bg-orange-500/10 text-orange-700 border-orange-200';
      else if (s === 'cancelled') classes = 'bg-red-500/10 text-red-700 border-red-200';
      else classes = 'bg-slate-500/10 text-slate-700 border-slate-200';
    }
    
    return <Badge variant="outline" className={classes}>{status?.toUpperCase() || 'PENDING'}</Badge>;
  };

  const copyOrderId = () => {
    const textToCopy = order?.orderNumber || order?.id;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success('Order ID copied to clipboard');
    }
  };

  // Timeline logic
  const statuses = ['pending', 'processing', 'shipped', 'delivered'];
  const currentStatusIndex = statuses.indexOf(order?.order_status?.toLowerCase() || 'pending');
  const isCancelled = order?.order_status?.toLowerCase() === 'cancelled';

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-muted/30 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-64 w-full rounded-2xl md:col-span-2" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[100dvh] bg-muted/30 py-20 flex items-center justify-center">
        <div className="bg-card border rounded-2xl p-8 text-center max-w-md mx-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link to="/my-orders">Back to My Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const displayId = order.orderNumber ? order.orderNumber : `Order #${order.id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-[100dvh] bg-muted/30 py-8 md:py-12">
      <Helmet>
        <title>{`${displayId} | SGRD Masale`}</title>
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
            <Link to="/my-orders">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  {displayId}
                </h1>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyOrderId}
                  className="h-8 text-xs bg-muted/50 hover:bg-muted font-semibold rounded-lg"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy ID
                </Button>
              </div>
              <p className="text-muted-foreground">
                Placed on {formatDate(order.created, true)}
              </p>
            </div>
            <div className="flex gap-3">
              {getStatusBadge(order.order_status, 'order')}
              {getStatusBadge(order.payment_status, 'payment')}
            </div>
          </div>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div className="bg-card border rounded-2xl p-6 md:p-8 mb-8 shadow-sm overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="relative flex justify-between items-center">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full"></div>
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(Math.max(0, currentStatusIndex) / (statuses.length - 1)) * 100}%` }}
                ></div>

                {[
                  { id: 'pending', label: 'Order Placed', icon: Receipt },
                  { id: 'processing', label: 'Processing', icon: Package },
                  { id: 'shipped', label: 'Shipped', icon: Truck },
                  { id: 'delivered', label: 'Delivered', icon: CheckCircle2 }
                ].map((step, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-3 bg-card px-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isCompleted 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'bg-card border-muted-foreground/30 text-muted-foreground'
                      } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                        {isCurrent && <p className="text-xs text-muted-foreground mt-1">{formatDate(order.updated)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-500/10 border border-red-200 rounded-2xl p-6 mb-8 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Order Cancelled</h3>
              <p className="text-red-600/80 text-sm">This order was cancelled on {formatDate(order.updated, true)}.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Items */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="text-lg font-semibold">Order Items</h2>
              </div>
              <div className="divide-y">
                {items.length > 0 ? items.map((item, index) => (
                  <div key={index} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    {item.image ? (
                      <div className="w-20 h-20 rounded-xl bg-muted flex-shrink-0 overflow-hidden border">
                        <img src={item.image} alt={item.name || 'Product'} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 border">
                        <Package className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-medium text-foreground truncate">{item.name || 'Unknown Product'}</h4>
                      {item.variant && <p className="text-sm text-muted-foreground mt-1">Variant: {item.variant}</p>}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">Qty: <span className="font-medium text-foreground">{item.quantity || 1}</span></span>
                        <span className="text-muted-foreground">Price: <span className="font-medium text-foreground">{formatCurrency(item.price)}</span></span>
                      </div>
                    </div>
                    
                    <div className="text-right sm:ml-auto">
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency((item.price || 0) * (item.quantity || 1))}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No items found in this order.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Summary & Details */}
          <div className="space-y-8">
            {/* Order Summary */}
            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="text-lg font-semibold">Order Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{formatCurrency(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatCurrency(order.tax_amount)}</span>
                </div>
                {order.coupon_discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount ({order.coupon_code})</span>
                    <span className="font-medium">-{formatCurrency(order.coupon_discount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h2 className="text-lg font-semibold">Customer Details</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Shipping Address
                  </h3>
                  <div className="text-sm space-y-1 text-foreground">
                    <p className="font-medium">{order.customer_name}</p>
                    {order.shipping_address ? (
                      <>
                        <p>{order.shipping_address.street}</p>
                        <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
                        <p>{order.shipping_address.country || 'India'}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground italic">Address details unavailable</p>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Info</h3>
                  <div className="text-sm space-y-1 text-foreground">
                    <p>{order.customer_email}</p>
                    <p>{order.customer_phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
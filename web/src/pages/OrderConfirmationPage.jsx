import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient.js';
import { formatCurrency } from '@/api/EcommerceApi.js';
import { toast } from 'sonner';
import { 
  CheckCircle2, Package, MapPin, CreditCard, Truck, FileText, ShoppingBag, RefreshCw, Home, ListOrdered, Copy
} from 'lucide-react';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (order) return;
      try {
        const orderData = await pb.collection('orders').getOne(orderId, { $autoCancel: false });
        setOrder(orderData);
      } catch (err) {
        setError('Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId, order]);

  const getStatusBadgeClass = (status) => {
    const statusMap = { 
      pending: 'bg-yellow-500/10 text-yellow-700', 
      processing: 'bg-blue-500/10 text-blue-700', 
      shipped: 'bg-purple-500/10 text-purple-700', 
      delivered: 'bg-emerald-500/10 text-emerald-700', 
      cancelled: 'bg-destructive/10 text-destructive' 
    };
    return `px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${statusMap[status?.toLowerCase()] || 'bg-slate-500/10 text-slate-700'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Processing...';
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const calculateEstimatedDelivery = (orderDate) => {
    if (!orderDate) return 'Processing...';
    let currentDate = new Date(orderDate);
    let businessDays = 0;
    while (businessDays < 6) {
      currentDate.setDate(currentDate.getDate() + 1);
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) businessDays++;
    }
    return currentDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatPrice = (amount) => {
    return formatCurrency(amount * 100, { symbol: '₹' });
  };

  const copyOrderId = () => {
    if (displayOrderNumber) {
      navigator.clipboard.writeText(displayOrderNumber);
      toast.success('Order ID copied to clipboard');
    }
  };

  if (loading) {
    return (
      <main className="min-h-[80vh] bg-muted/30 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-[80vh] bg-muted/30 py-16 flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <Card className="border-destructive/30 shadow-sm overflow-hidden">
            <div className="bg-destructive/10 p-6 flex justify-center">
              <RefreshCw className="w-12 h-12 text-destructive" />
            </div>
            <CardContent className="py-8 text-center space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Order Not Found</h2>
              <p className="text-muted-foreground">{error || 'Unable to display order details.'}</p>
              <Button onClick={() => window.location.reload()} variant="default" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  let orderItems = [];
  try {
    if (typeof order.items === 'string') {
      orderItems = JSON.parse(order.items);
    } else if (Array.isArray(order.items)) {
      orderItems = order.items;
    } else if (order.cartItems) {
      orderItems = typeof order.cartItems === 'string' ? JSON.parse(order.cartItems) : order.cartItems;
    }
  } catch (err) {
    console.error('Failed to parse order items', err);
  }
  
  if (!Array.isArray(orderItems)) {
    orderItems = [];
  }
  
  let shippingAddressObj = null;
  try {
    if (typeof order.shipping_address === 'string') {
      shippingAddressObj = JSON.parse(order.shipping_address);
    } else if (typeof order.shipping_address === 'object' && order.shipping_address !== null) {
      shippingAddressObj = order.shipping_address;
    }
  } catch (err) {
    console.error('Failed to parse shipping address', err);
  }

  const displayOrderNumber = order.orderNumber || order.order_number || `Order #${order.id?.substring(0,8).toUpperCase()}`;
  const displaySubtotal = Number(order.subtotal || order.subtotal_amount || 0);
  const displayTax = Number(order.tax_amount || 0);
  const displayInclusiveTotal = displaySubtotal + displayTax;
  const displayDiscount = Number(order.coupon_discount || order.discount_amount || 0);
  const displayStatus = order.order_status || order.status || 'pending';

  return (
    <>
      <Helmet>
        <title>{`Order Confirmation - ${displayOrderNumber} | SGRD Masale`}</title>
      </Helmet>
      
      <main className="min-h-screen bg-muted/30 py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Success Header */}
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-500/5">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground tracking-tight">
              Thank you for your order!
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Hi {order.customer_name}, we've received your order and are getting it ready. A confirmation email has been sent.
            </p>
            <div className="inline-flex items-center gap-4 bg-card px-8 py-5 rounded-2xl border shadow-sm mx-auto">
              <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Order ID</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-extrabold text-foreground leading-none block">{displayOrderNumber}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={copyOrderId} 
                    className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
                    title="Copy Order ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Order Information */}
            <Card className="shadow-sm border-border/50 rounded-2xl">
              <CardHeader className="bg-muted/30 border-b pb-4 rounded-t-2xl">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Order Date</span>
                  <span className="text-sm font-semibold">{formatDate(order.created)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Order Status</span>
                  <span className={getStatusBadgeClass(displayStatus)}>{displayStatus}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Payment Status</span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700">
                    {(order.payment_status || 'completed')}
                  </span>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-6">
                  <p className="text-sm font-semibold text-primary flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Estimated Delivery: {calculateEstimatedDelivery(order.created)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Details */}
            <Card className="shadow-sm border-border/50 rounded-2xl">
              <CardHeader className="bg-muted/30 border-b pb-4 rounded-t-2xl">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                  Shipping Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {shippingAddressObj ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Recipient Name</span>
                      <p className="font-semibold text-foreground">{shippingAddressObj.name || order.customer_name}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Contact Info</span>
                      <p className="text-sm text-foreground">{shippingAddressObj.email || order.customer_email}</p>
                      <p className="text-sm text-foreground">{shippingAddressObj.phone || order.customer_phone}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Delivery Address</span>
                      <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-lg border border-border/50">
                        {shippingAddressObj.address}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Customer</span>
                      <p className="font-semibold text-foreground">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Raw Address Data</span>
                      <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg border border-border/50">
                        {typeof order.shipping_address === 'string' ? order.shipping_address : 'Address not provided'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <Card className="mb-8 shadow-sm border-border/50 rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/10">
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Name</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</th>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit Price</th>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orderItems.length > 0 ? (
                      orderItems.map((item, index) => (
                        <tr key={index} className="hover:bg-muted/5 transition-colors">
                          <td className="py-4 px-6 font-medium text-foreground">
                            {item.name || 'Unknown Product'}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center justify-center bg-muted w-8 h-8 rounded-md text-sm font-medium">
                              {item.quantity || 1}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right text-muted-foreground font-medium">{formatPrice(item.price || 0)}</td>
                          <td className="py-4 px-6 text-right font-bold text-foreground">
                            {formatPrice((item.price || 0) * (item.quantity || 1))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 px-6 text-center text-muted-foreground">
                          No items found for this order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="mb-8 shadow-sm border-border/50 rounded-2xl">
            <CardHeader className="bg-muted/30 border-b pb-4 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-primary" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Products Total (Incl. Tax)</span>
                  <span className="font-semibold text-foreground">{formatPrice(displayInclusiveTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground pl-4">Subtotal (Excl. Tax)</span>
                  <span className="font-medium">{formatPrice(displaySubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground pl-4">Extracted Tax</span>
                  <span className="font-medium">{formatPrice(displayTax)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground font-medium">Shipping ({order.shipping_method || 'Standard'})</span>
                  <span className="font-semibold text-foreground">{formatPrice(order.shipping_cost || 0)}</span>
                </div>
                {displayDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({order.coupon_code})</span>
                    <span>-{formatPrice(displayDiscount)}</span>
                  </div>
                )}
                <Separator className="my-5" />
                <div className="flex justify-between items-center bg-muted rounded-xl px-6 py-5">
                  <span className="text-foreground font-bold text-lg">Total Amount Paid</span>
                  <span className="text-primary text-3xl font-extrabold">{formatPrice(order.total_amount || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 mb-8">
            <Button 
              onClick={() => navigate('/')} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-xl text-base font-semibold shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5"
            >
              <Home className="w-5 h-5 mr-2.5" />
              Return to Homepage
            </Button>
            <Button 
              onClick={() => navigate('/my-orders')} 
              variant="outline" 
              className="px-8 py-6 rounded-xl text-base font-semibold border-2 hover:bg-muted transition-all hover:-translate-y-0.5"
            >
              <ListOrdered className="w-5 h-5 mr-2.5" />
              View Order History
            </Button>
          </div>

        </div>
      </main>
    </>
  );
};

export default OrderConfirmationPage;
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useCoupon } from '@/hooks/useCoupon.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { formatCurrency } from '@/api/EcommerceApi.js';
import { ShoppingBag, MapPin, User, CreditCard, Tag, X, ChevronDown, ChevronUp, Percent, DollarSign, Loader2 } from 'lucide-react';
import { calculateExtractedTax, calculateSubtotal, calculateOrderTotal, calculateInclusiveSum } from '@/utils/taxCalculations.js';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { isAuthenticated, currentUser } = useAuth();
  const { appliedCoupon, isValidating, validateCoupon, calculateDiscount, clearCoupon } = useCoupon();

  const paymentSuccessRef = useRef(false);

  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    gst_number: '',
    shippingMethod: 'Standard'
  });

  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const shippingCost = 50;

  useEffect(() => {
    if (paymentSuccessRef.current) return;

    if (!isAuthenticated) {
      toast.error('Please login to proceed with checkout');
      navigate('/login', { replace: true });
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty');
      navigate('/shop', { replace: true });
      return;
    }

    const loadUserData = async () => {
      try {
        const user = pb.authStore.model;
        
        setCustomerDetails(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || ''
        }));

        const addresses = await pb.collection('addresses').getFullList({
          filter: `userId = "${user.id}"`,
          sort: '-is_default',
          $autoCancel: false
        });

        if (addresses.length > 0) {
          const defaultAddress = addresses[0];
          const fullAddress = [
            defaultAddress.street,
            defaultAddress.city,
            defaultAddress.state,
            defaultAddress.pincode
          ].filter(Boolean).join(', ');

          setShippingAddress({
            name: defaultAddress.name || user.name || '',
            email: user.email || '',
            phone: defaultAddress.phone || '',
            address: fullAddress || ''
          });
        } else {
          setShippingAddress({
            name: user.name || '',
            email: user.email || '',
            phone: '',
            address: ''
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [isAuthenticated, currentUser, cartItems, navigate]);

  const loadAvailableCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const coupons = await pb.collection('coupons').getFullList({
        filter: `is_active = true && expiry_date >= "${today}"`,
        sort: '-discount_value',
        $autoCancel: false
      });
      setAvailableCoupons(coupons);
    } catch (error) {
      toast.error('Failed to load available offers');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleToggleOffers = () => {
    if (!showOffers && availableCoupons.length === 0) {
      loadAvailableCoupons();
    }
    setShowOffers(!showOffers);
  };

  const formatPrice = (amount) => {
    return formatCurrency(amount * 100, { symbol: '₹' });
  };

  const inclusiveSum = calculateInclusiveSum(cartItems);
  const exclusiveSubtotal = calculateSubtotal(cartItems);
  const extractedTax = calculateExtractedTax(cartItems);
  const couponDiscount = appliedCoupon ? Number(calculateDiscount(appliedCoupon, inclusiveSum)) || 0 : 0;
  const totalAmount = calculateOrderTotal(exclusiveSubtotal, extractedTax, shippingCost, couponDiscount);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = async () => {
    await validateCoupon(couponCode, inclusiveSum);
  };

  const handleRemoveCoupon = () => {
    clearCoupon();
    setCouponCode('');
  };

  const handleQuickApplyCoupon = async (code) => {
    setCouponCode(code);
    await validateCoupon(code, inclusiveSum);
  };

  const validateForm = () => {
    const errors = [];
    if (!customerDetails.name.trim()) errors.push('Billing name is required');
    if (!customerDetails.email.trim()) errors.push('Billing email is required');
    if (!customerDetails.phone.trim()) errors.push('Billing phone is required');
    
    if (!shippingAddress.name.trim()) errors.push('Shipping recipient name is required');
    if (!shippingAddress.phone.trim()) errors.push('Shipping phone number is required');
    if (!shippingAddress.email.trim()) errors.push('Shipping email is required');
    if (!shippingAddress.address.trim()) errors.push('Shipping address is required');
    return errors;
  };

  const handleRazorpayPayment = async () => {
    setSubmitted(true);
    
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      toast.error('Your cart is empty. Please add items to proceed.');
      return;
    }

    const hasInvalidItems = cartItems.some(item => 
      !item.id || 
      !item.name || 
      isNaN(Number(item.price)) || 
      isNaN(Number(item.quantity)) || 
      Number(item.quantity) <= 0
    );

    if (hasInvalidItems) {
      toast.error('Some items in your cart have invalid details. Please refresh your cart and try again.');
      return;
    }

    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setProcessingPayment(true);

    try {
      const formattedCartItems = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        category: item.category || '',
        tax_type: item.tax_type || '0%',
        image: item.image || item.imageUrl || ''
      }));

      const requestData = {
        cartItems: formattedCartItems,
        subtotal: exclusiveSubtotal, 
        shippingCost: shippingCost,
        taxAmount: extractedTax,
        totalAmount: totalAmount,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        billingDetails: {
          gst_number: customerDetails.gst_number
        },
        shippingAddress: shippingAddress,
        shippingMethod: customerDetails.shippingMethod || 'Standard',
        couponCode: appliedCoupon?.code || '',
        couponDiscount: couponDiscount
      };

      const response = await apiServerClient.fetch('/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // 503 => payment gateway not configured yet (Razorpay test/live keys missing).
        if (response.status === 503 || errorData.error === 'INTEGRATION_NOT_CONFIGURED') {
          throw new Error('Online payment is not available right now — the store owner needs to finish setting up the payment gateway. Please try again later or contact support.');
        }
        throw new Error(errorData.message || errorData.error || 'Failed to create your order. Please try again.');
      }

      const orderData = await response.json();

      // The Razorpay checkout script is loaded in index.html. If an ad-blocker or
      // a network problem stopped it, window.Razorpay will be undefined — surface a
      // clear message instead of leaving the button stuck on "Processing...".
      if (typeof window.Razorpay !== 'function') {
        throw new Error('Payment gateway could not load. Please disable any ad-blocker, refresh the page, and try again.');
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SGRD Masale',
        description: 'Premium Spices Order',
        order_id: orderData.orderId,
        prefill: {
          name: customerDetails.name,
          email: customerDetails.email,
          contact: customerDetails.phone
        },
        theme: {
          color: '#f97316'
        },
        handler: async (razorpayResponse) => {
          await verifyPayment(razorpayResponse, requestData);
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      // Reset the button and inform the user if Razorpay reports a failed payment.
      razorpay.on('payment.failed', (resp) => {
        toast.error(resp?.error?.description || 'Payment failed. Please try again.');
        setProcessingPayment(false);
      });
      razorpay.open();

    } catch (error) {
      toast.error(error.message || 'Failed to initiate payment');
      setProcessingPayment(false);
    }
  };

  const verifyPayment = async (razorpayResponse, requestData) => {
    try {
      const verifyData = {
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        userId: pb.authStore.model?.id || null,
        cartItems: requestData.cartItems,
        items: requestData.cartItems,
        subtotal_amount: requestData.subtotal,
        shipping_cost: requestData.shippingCost,
        tax_amount: requestData.taxAmount,
        total_amount: requestData.totalAmount,
        coupon_code: requestData.couponCode,
        discount_amount: requestData.couponDiscount,
        customer_name: requestData.customerName,
        customer_email: requestData.customerEmail,
        customer_phone: requestData.customerPhone,
        billing_details: requestData.billingDetails,
        shipping_address: requestData.shippingAddress,
        shipping_method: requestData.shippingMethod
      };

      const verifyResponse = await apiServerClient.fetch('/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyData)
      });

      const responseData = await verifyResponse.json();

      if (!verifyResponse.ok || !responseData.success) {
        console.error('[Checkout] Razorpay payment verification failed', {
          status: verifyResponse.status,
          response: responseData,
        });
        throw new Error(responseData.error || 'Payment verification failed');
      }

      if (responseData.orderId) {
        paymentSuccessRef.current = true;
        const generatedOrderNumber = responseData.order_number || responseData.orderNumber;
        
        toast.success(`Payment successful! Order ${generatedOrderNumber ? `(${generatedOrderNumber}) ` : ''}confirmed.`);
        
        const orderDataToPass = {
          id: responseData.orderId,
          orderNumber: generatedOrderNumber,
          created: new Date().toISOString(),
          order_status: 'pending',
          payment_status: 'completed',
          items: verifyData.items,
          ...verifyData
        };

        clearCart();
        
        navigate(`/order-confirmation/${responseData.orderId}`, { 
          state: { order: orderDataToPass },
          replace: true
        });
      } else {
        throw new Error('Payment verification succeeded but orderId was missing from response');
      }

    } catch (error) {
      toast.error(error.message || 'Payment verification failed. Please contact support.');
      setProcessingPayment(false);
    }
  };

  const isFieldInvalid = (fieldName, value) => {
    if (!submitted) return false;
    if (fieldName === 'email') {
      return !value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
    return !value.trim();
  };

  if (loading) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm w-full px-4">
          <Skeleton className="h-12 w-full rounded-2xl mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-32 w-full rounded-2xl mx-auto mt-8" />
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout - SGRD Masale</title>
        <meta name="description" content="Complete your order for premium spices from SGRD Masale" />
      </Helmet>

      <main className="min-h-screen bg-muted/30 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-3">Checkout</h1>
            <p className="text-muted-foreground text-lg font-medium">Complete your details to place the order.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2 space-y-8">
              <Card className="shadow-sm border-border/60 rounded-2xl overflow-hidden">
                <CardHeader className="bg-card border-b border-border/50 pb-5 pt-6 px-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <User className="w-5 h-5" />
                    </div>
                    Billing Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6 bg-card">
                  <div>
                    <Label htmlFor="billing-name" className="text-sm font-bold mb-2 block text-foreground">Full Name *</Label>
                    <Input
                      id="billing-name"
                      name="name"
                      value={customerDetails.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className={`h-12 rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:ring-primary ${
                        isFieldInvalid('name', customerDetails.name) ? 'border-destructive focus-visible:ring-destructive' : ''
                      }`}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="billing-email" className="text-sm font-bold mb-2 block text-foreground">Email *</Label>
                      <Input
                        id="billing-email"
                        name="email"
                        type="email"
                        value={customerDetails.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        className={`h-12 rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:ring-primary ${
                          isFieldInvalid('email', customerDetails.email) ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing-phone" className="text-sm font-bold mb-2 block text-foreground">Phone Number *</Label>
                      <Input
                        id="billing-phone"
                        name="phone"
                        value={customerDetails.phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                        className={`h-12 rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:ring-primary ${
                          isFieldInvalid('phone', customerDetails.phone) ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="billing-gst" className="text-sm font-bold mb-2 block text-foreground">GST Number (Optional)</Label>
                    <Input
                      id="billing-gst"
                      name="gst_number"
                      value={customerDetails.gst_number}
                      onChange={handleInputChange}
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      className="h-12 rounded-xl text-foreground placeholder:text-muted-foreground uppercase focus-visible:ring-primary"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/60 rounded-2xl overflow-hidden">
                <CardHeader className="bg-card border-b border-border/50 pb-5 pt-6 px-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <MapPin className="w-5 h-5" />
                    </div>
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6 bg-card">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="shipping-name" className="text-sm font-bold mb-2 block text-foreground">Recipient Name *</Label>
                      <Input
                        id="shipping-name"
                        name="name"
                        value={shippingAddress.name}
                        onChange={handleAddressChange}
                        placeholder="Recipient's full name"
                        className={`h-12 rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:ring-primary ${
                          isFieldInvalid('name', shippingAddress.name) ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="shipping-phone" className="text-sm font-bold mb-2 block text-foreground">Recipient Phone *</Label>
                      <Input
                        id="shipping-phone"
                        name="phone"
                        value={shippingAddress.phone}
                        onChange={handleAddressChange}
                        placeholder="Recipient's phone number"
                        className={`h-12 rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:ring-primary ${
                          isFieldInvalid('phone', shippingAddress.phone) ? 'border-destructive focus-visible:ring-destructive' : ''
                        }`}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="shipping-email" className="text-sm font-bold mb-2 block text-foreground">Recipient Email *</Label>
                    <Input
                      id="shipping-email"
                      name="email"
                      type="email"
                      value={shippingAddress.email}
                      onChange={handleAddressChange}
                      placeholder="Recipient's email"
                      className={`h-12 rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:ring-primary ${
                        isFieldInvalid('email', shippingAddress.email) ? 'border-destructive focus-visible:ring-destructive' : ''
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="shipping-address" className="text-sm font-bold mb-2 block text-foreground">Full Address *</Label>
                    <Textarea
                      id="shipping-address"
                      name="address"
                      value={shippingAddress.address}
                      onChange={handleAddressChange}
                      placeholder="Enter your full address (street, city, state, postal code)"
                      className={`min-h-[120px] rounded-xl text-foreground placeholder:text-muted-foreground resize-y focus-visible:ring-primary ${
                        isFieldInvalid('address', shippingAddress.address) ? 'border-destructive focus-visible:ring-destructive' : ''
                      }`}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20 shadow-sm rounded-2xl">
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-primary font-bold text-lg">
                      <Tag className="w-5 h-5" />
                      Available Offers
                    </CardTitle>
                    <Button
                      onClick={handleToggleOffers}
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 hover:bg-primary/10 -mr-2 rounded-lg font-semibold"
                    >
                      {showOffers ? (
                        <>Hide <ChevronUp className="w-4 h-4 ml-1" /></>
                      ) : (
                        <>View Offers <ChevronDown className="w-4 h-4 ml-1" /></>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {showOffers && (
                  <CardContent className="pt-0 px-5 pb-5">
                    {loadingCoupons ? (
                      <div className="text-center py-4">
                        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                        <p className="text-sm text-primary font-medium">Loading offers...</p>
                      </div>
                    ) : availableCoupons.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4 font-medium">No active offers available</p>
                    ) : (
                      <div className="space-y-3">
                        {availableCoupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="bg-card border border-border/50 rounded-xl p-3 shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-extrabold text-foreground text-sm uppercase tracking-wider">
                                    {coupon.code}
                                  </span>
                                  {coupon.discount_type === 'percentage' ? (
                                    <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-md font-bold">
                                      <Percent className="w-3 h-3" />
                                      {coupon.discount_value}% OFF
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-md font-bold">
                                      <DollarSign className="w-3 h-3" />
                                      {formatPrice(coupon.discount_value)} OFF
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                onClick={() => handleQuickApplyCoupon(coupon.code)}
                                size="sm"
                                variant={appliedCoupon?.code === coupon.code ? 'secondary' : 'outline'}
                                className="ml-2 text-xs h-8 rounded-lg font-bold"
                                disabled={isValidating || appliedCoupon?.code === coupon.code}
                              >
                                {appliedCoupon?.code === coupon.code ? 'Applied' : 'Apply'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              <Card className="shadow-sm border-border/60 rounded-2xl">
                <CardHeader className="pb-3 pt-5 px-5">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <Tag className="w-5 h-5 text-primary" />
                    Have a promo code?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-5 pb-5">
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="h-12 rounded-xl text-foreground placeholder:text-muted-foreground uppercase focus-visible:ring-primary"
                        disabled={isValidating}
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={isValidating || !couponCode.trim()}
                        className="h-12 rounded-xl px-6 font-bold whitespace-nowrap"
                      >
                        {isValidating ? 'Checking...' : 'Apply'}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-success/10 border border-success/20 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                            <Tag className="w-4 h-4 text-success" />
                          </div>
                          <div>
                            <p className="font-bold text-success">
                              {appliedCoupon.code}
                            </p>
                            <p className="text-xs font-medium text-success/80">
                              Coupon applied successfully
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleRemoveCoupon}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-success hover:bg-success/20 hover:text-success rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-success font-bold">
                        You are saving {formatPrice(couponDiscount)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="sticky top-28 shadow-sm border-border/60 rounded-2xl overflow-hidden">
                <CardHeader className="bg-card border-b border-border/50 pb-4 pt-5 px-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-6 px-6 bg-card">
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-2 font-medium">
                          <span className="font-bold text-foreground">{item.quantity}x</span> {item.name}
                        </span>
                        <span className="font-bold whitespace-nowrap text-foreground">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-border/60" />

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-muted-foreground font-medium">
                      <span>Subtotal (Excl. Tax)</span>
                      <span>{formatPrice(exclusiveSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground font-medium">
                      <span>Tax Amount</span>
                      <span>{formatPrice(extractedTax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-foreground">
                      <span>Products Total (Incl. Tax)</span>
                      <span>{formatPrice(inclusiveSum)}</span>
                    </div>
                    <div className="flex justify-between pt-1 font-medium">
                      <span className="text-muted-foreground">Shipping Cost</span>
                      <span className="text-foreground">{formatPrice(shippingCost)}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-success font-bold">Discount</span>
                        <span className="font-extrabold text-success">-{formatPrice(couponDiscount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/50 rounded-xl p-5 mt-4 border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-foreground">Total</span>
                      <span className="text-3xl font-extrabold text-primary">{formatPrice(totalAmount)}</span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground mt-1 text-right">
                      Final price to pay
                    </p>
                  </div>

                  <Button
                    onClick={handleRazorpayPayment}
                    disabled={processingPayment}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-4"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay {formatPrice(totalAmount)}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/cart')}
                    className="w-full h-12 rounded-xl font-bold text-muted-foreground hover:text-foreground"
                    disabled={processingPayment}
                  >
                    Back to Cart
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default CheckoutPage;

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, Truck } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/useCart.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';

const ShoppingCart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    getCartTotal
  } = useCart();

  const [shippingRates, setShippingRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [shippingMethod, setShippingMethod] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);

  const setShippingSelection = (method, cost) => {
    setShippingMethod(method);
    setShippingCost(cost);
  };

  const subtotal = getCartTotal();

  useEffect(() => {
    fetchShippingRates();
  }, []);

  const fetchShippingRates = async () => {
    try {
      const rates = await pb.collection('shipping_rates').getFullList({
        filter: 'is_active=true',
        sort: 'cost',
        $autoCancel: false
      });
      setShippingRates(rates);
    } catch (error) {
      console.error('Failed to fetch shipping rates:', error);
    } finally {
      setRatesLoading(false);
    }
  };

  // Automatically reset invalid shipping selection if subtotal drops below minimum
  useEffect(() => {
    if (shippingMethod && shippingRates.length > 0) {
      const selectedRate = shippingRates.find(r => r.name === shippingMethod);
      if (selectedRate && selectedRate.min_order_amount && subtotal < selectedRate.min_order_amount) {
        setShippingSelection(null, 0);
      }
    }
  }, [subtotal, shippingMethod, shippingRates]);

  // Tax calculation per item
  let exclusiveTaxTotal = 0;
  let inclusiveTaxTotal = 0;

  cartItems.forEach(item => {
    const taxPercent = item.tax_percentage || 0;
    const isIncluded = item.tax_included || false;
    const itemTotal = item.price * item.quantity;
    const itemTax = itemTotal * (taxPercent / 100);
    
    if (isIncluded) {
      inclusiveTaxTotal += itemTax;
    } else {
      exclusiveTaxTotal += itemTax;
    }
  });

  const total = subtotal + exclusiveTaxTotal + shippingCost;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <>
        <Helmet>
          <title>Shopping Cart - SGRD</title>
          <meta name="description" content="View and manage your shopping cart." />
        </Helmet>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Add some premium spices to get started</p>
            <Button size="lg" onClick={() => navigate('/shop')}>
              Continue Shopping
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Shopping Cart - SGRD</title>
        <meta name="description" content="Review your cart and proceed to checkout." />
      </Helmet>

      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8" style={{ letterSpacing: '-0.02em' }}>
          Shopping cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={item.photos && item.photos.length > 0 ? pb.files.getUrl(item, item.photos[0]) : (item.image ? pb.files.getUrl(item, item.image) : 'https://images.unsplash.com/photo-1596040033229-a0b3b7d1f4f8')}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 line-clamp-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border rounded-lg">
                          <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock_quantity}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-xl font-bold block">₹{(item.price * item.quantity).toFixed(2)}</span>
                            {item.tax_percentage > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {item.tax_included ? '(Tax incl.)' : `(+${item.tax_percentage}% Tax)`}
                              </span>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-primary" /> 
                  Shipping Estimate
                </h2>
                
                {ratesLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : shippingRates.length > 0 ? (
                  <RadioGroup 
                    value={shippingMethod || ''} 
                    onValueChange={(val) => {
                      const rate = shippingRates.find(r => r.name === val);
                      if (rate) setShippingSelection(rate.name, rate.cost);
                    }}
                    className="space-y-3"
                  >
                    {shippingRates.map((rate) => {
                      const isDisabled = rate.min_order_amount && subtotal < rate.min_order_amount;
                      return (
                        <div 
                          key={rate.id} 
                          className={`flex items-start justify-between p-3 border rounded-lg transition-colors ${shippingMethod === rate.name ? 'border-primary bg-primary/5' : 'hover:border-primary/50'} ${isDisabled ? 'opacity-50 grayscale' : ''}`}
                        >
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value={rate.name} id={rate.id} disabled={isDisabled} className="mt-1" />
                            <Label htmlFor={rate.id} className={isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}>
                              <p className="font-medium">{rate.name}</p>
                              <p className="text-xs text-muted-foreground">{rate.delivery_days}</p>
                              {isDisabled && (
                                <p className="text-xs text-destructive mt-1">
                                  Requires ₹{rate.min_order_amount} min. order
                                </p>
                              )}
                            </Label>
                          </div>
                          <span className="font-medium">{rate.cost === 0 ? 'Free' : `₹${rate.cost}`}</span>
                        </div>
                      );
                    })}
                  </RadioGroup>
                ) : (
                  <p className="text-sm text-muted-foreground">No shipping options available at the moment.</p>
                )}
              </CardContent>
            </Card>

            <Card className="sticky top-20">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-6">Order summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <span>Tax</span>
                      {inclusiveTaxTotal > 0 && (
                        <span className="ml-1 text-xs opacity-80">(₹{inclusiveTaxTotal.toFixed(2)} included)</span>
                      )}
                    </div>
                    <span className="font-medium">
                      {exclusiveTaxTotal > 0 ? `+ ₹${exclusiveTaxTotal.toFixed(2)}` : '₹0.00'}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shippingMethod ? `₹${shippingCost.toFixed(2)}` : 'Select shipping'}
                    </span>
                  </div>
                  
                  <div className="border-t pt-4 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-primary">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full mb-3" size="lg" onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/shop')}>
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ShoppingCart;
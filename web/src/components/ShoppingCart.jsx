import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart as ShoppingCartIcon, X, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart.jsx';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { calculateExtractedTax, calculateSubtotal, calculateInclusiveSum } from '@/utils/taxCalculations.js';

const ShoppingCart = ({ isCartOpen, setIsCartOpen }) => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartItemCount } = useCart();

  const cartItemCount = getCartItemCount() || 0;

  const handleCheckout = useCallback(() => {
    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!pb.authStore.isValid) {
      toast.error('Please login to proceed to checkout');
      setIsCartOpen(false);
      navigate('/login');
      return;
    }

    setIsCartOpen(false);
    navigate('/checkout');
  }, [cartItems, navigate, setIsCartOpen]);

  const handleUpdateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  }, [updateQuantity, removeFromCart]);

  const handleRemoveItem = useCallback((productId) => {
    removeFromCart(productId);
    toast.success('Item removed from cart');
  }, [removeFromCart]);

  const handleClearCart = useCallback(() => {
    clearCart();
    toast.success('Cart cleared');
  }, [clearCart]);

  const inclusiveSum = calculateInclusiveSum(cartItems) || 0;
  const extractedTax = calculateExtractedTax(cartItems) || 0;
  const exclusiveSubtotal = calculateSubtotal(cartItems) || 0;

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          onClick={() => setIsCartOpen(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl flex flex-col border-l border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/10">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-foreground">
                Your Cart
                {cartItemCount > 0 && (
                  <span className="text-sm font-bold text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full shadow-sm">
                    {cartItemCount}
                  </span>
                )}
              </h2>
              <Button 
                onClick={() => setIsCartOpen(false)} 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Cart Items */}
            <div className="flex-grow p-6 overflow-y-auto bg-muted/5">
              {!cartItems || cartItems.length === 0 ? (
                <div className="text-center h-full flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <ShoppingCartIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Your cart is empty</h3>
                  <p className="text-muted-foreground mb-8">Add some delicious spices to get started</p>
                  <Button 
                    onClick={() => setIsCartOpen(false)}
                    className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-8 shadow-sm transition-transform active:scale-95"
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div 
                      key={item.id} 
                      className="flex gap-4 bg-card border border-border/60 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
                    >
                      {item.image && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-border/50">
                          <img 
                            src={item.image.startsWith('http') ? item.image : pb.files.getUrl(item, item.image)} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex-grow min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-foreground truncate text-base">{item.name}</h3>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{item.category}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm font-bold text-primary">
                            ₹{(Number(item.price) || 0).toFixed(2)}
                          </p>
                          
                          <div className="flex items-center bg-muted/50 rounded-lg border border-border/50 p-0.5">
                            <Button 
                              onClick={() => handleUpdateQuantity(item.id, Number(item.quantity) - 1)} 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 rounded-md hover:bg-background hover:shadow-sm text-foreground"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-semibold">{Number(item.quantity) || 1}</span>
                            <Button 
                              onClick={() => handleUpdateQuantity(item.id, Number(item.quantity) + 1)} 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 rounded-md hover:bg-background hover:shadow-sm text-foreground"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button 
                          onClick={() => handleRemoveItem(item.id)} 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems && cartItems.length > 0 && (
              <div className="p-6 border-t border-border/50 bg-card shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between items-center text-muted-foreground font-medium">
                    <span>Subtotal (Excl. Tax)</span>
                    <span>₹{exclusiveSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground font-medium">
                    <span>Tax Amount</span>
                    <span>₹{extractedTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border/50">
                    <span className="text-lg font-bold text-foreground">Total</span>
                    <span className="text-2xl font-extrabold text-primary">₹{inclusiveSum.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleCheckout} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] group"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button
                  onClick={handleClearCart}
                  variant="ghost"
                  className="w-full mt-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl font-medium"
                >
                  Clear Cart
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShoppingCart;
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart.jsx';
import { toast } from 'sonner';
import { ShoppingCart, Loader2, ArrowLeft, CheckCircle, Minus, Plus, XCircle, Info, PackageX, Scale } from 'lucide-react';
import { calculateTaxFromPrice } from '@/utils/taxCalculations.js';
import ProductImageCarousel from '@/components/ProductImageCarousel.jsx';

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedProduct = await pb.collection('products').getOne(id, { $autoCancel: false });
        
        if (fetchedProduct.isDeleted) {
          throw new Error('Product Unavailable');
        }
        
        setProduct(fetchedProduct);
      } catch (err) {
        if (err.message === 'Product Unavailable' || err.status === 404) {
          setError('Product Unavailable');
        } else {
          setError(err.message || 'Failed to load product');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  const handleAddToCart = useCallback(async () => {
    if (product) {
      try {
        await addToCart(product, product, quantity, product.stock_quantity);
        toast.success(`${quantity} x ${product.name} added to cart.`);
      } catch (error) {
        toast.error(error.message || 'Failed to add item to cart');
      }
    }
  }, [product, quantity, addToCart]);

  const handleQuantityChange = useCallback((amount) => {
    setQuantity(prevQuantity => {
        const newQuantity = prevQuantity + amount;
        if (newQuantity < 1) return 1;
        return newQuantity;
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="bg-card border rounded-3xl p-12 flex flex-col items-center shadow-sm">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <PackageX className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-foreground">Product Unavailable</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            {error === 'Product Unavailable' 
              ? "This product has been removed or is no longer available in our catalog." 
              : "We couldn't load the details for this product. Please try again later."}
          </p>
          <Button asChild size="lg" className="rounded-xl">
            <Link to="/shop">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Shop
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const price = product.price || 0;
  const availableStock = product.stock_quantity || 0;
  const canAddToCart = quantity <= availableStock && product.status !== false;
  
  const taxRateStr = product.tax_type || '0%';
  const extractedTax = calculateTaxFromPrice(price, taxRateStr);
  const basePrice = price - extractedTax;

  return (
    <>
      <Helmet>
        <title>{product.name} - SGRD Masale</title>
        <meta name="description" content={product.description?.substring(0, 160) || product.name} />
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.3 }}
        >
          <Link to="/shop" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 font-medium bg-muted/50 px-4 py-2 rounded-full hover:bg-primary/10">
            <ArrowLeft size={16} />
            Back to Shop
          </Link>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }} 
            className="relative"
          >
            <ProductImageCarousel product={product} />
          </motion.div>

          {/* Details Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }} 
            className="flex flex-col h-full"
          >
            <div className="mb-3">
              <span className="text-sm font-bold tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
                {product.category}
              </span>
            </div>
            
            {/* Product Name - Plain text without background stripes */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 text-balance leading-tight">
              {product.name}
            </h1>

            {/* Price Card */}
            <div className="mb-8 bg-card p-6 rounded-2xl border border-border shadow-sm">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-extrabold text-primary">₹{price.toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-5 flex items-center gap-1.5 font-medium">
                <Info className="w-4 h-4 text-primary/70" /> Price includes {taxRateStr} tax
              </p>
              
              <div className="space-y-3 text-sm pt-5 border-t border-border/60">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Price Before Tax</span>
                  <span>₹{basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Tax Amount ({taxRateStr})</span>
                  <span>₹{extractedTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground pt-2 text-base">
                  <span>Final Price</span>
                  <span>₹{price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Weight Information */}
            {(product.item_weight || product.net_weight) && (
              <div className="mb-8 bg-muted/30 p-5 rounded-2xl border border-border/50">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4 uppercase tracking-wider">
                  <Scale className="w-4 h-4 text-primary" /> Weight Specifications
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {product.item_weight && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground font-medium">Item Weight</span>
                      <span className="font-bold text-foreground text-base">{product.item_weight}</span>
                    </div>
                  )}
                  {product.net_weight && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground font-medium">Net Weight</span>
                      <span className="font-bold text-foreground text-base">{product.net_weight}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="prose prose-slate dark:prose-invert text-muted-foreground mb-10 text-base leading-relaxed max-w-none" dangerouslySetInnerHTML={{ __html: product.description || 'No description available.' }} />

            <div className="mt-auto space-y-8 bg-muted/30 p-6 rounded-2xl border border-border/50">
              <div className="flex items-center gap-6">
                <div className="flex items-center border border-border/60 rounded-xl p-1 bg-background shadow-sm">
                  <Button onClick={() => handleQuantityChange(-1)} variant="ghost" size="icon" className="rounded-lg h-12 w-12 hover:bg-muted text-foreground"><Minus size={18} /></Button>
                  <span className="w-14 text-center font-bold text-lg">{quantity}</span>
                  <Button onClick={() => handleQuantityChange(1)} variant="ghost" size="icon" className="rounded-lg h-12 w-12 hover:bg-muted text-foreground"><Plus size={18} /></Button>
                </div>
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quantity</span>
              </div>

              <div>
                <Button 
                  onClick={handleAddToCart} 
                  size="lg" 
                  className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] hover:bg-primary/90" 
                  disabled={!canAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>

                {product.status !== false && canAddToCart && (
                  <p className="text-sm text-success mt-4 flex items-center justify-center gap-2 font-semibold bg-success/10 py-2 rounded-lg">
                    <CheckCircle size={16} /> {availableStock} in stock and ready to ship
                  </p>
                )}

                {product.status !== false && !canAddToCart && availableStock > 0 && (
                   <p className="text-sm text-accent mt-4 flex items-center justify-center gap-2 font-semibold bg-accent/10 py-2 rounded-lg">
                    <XCircle size={16} /> Not enough stock. Only {availableStock} left.
                  </p>
                )}

                {(product.status === false || availableStock <= 0) && (
                    <p className="text-sm text-destructive mt-4 flex items-center justify-center gap-2 font-semibold bg-destructive/10 py-2 rounded-lg">
                      <XCircle size={16} /> Currently unavailable
                    </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default ProductDetailPage;
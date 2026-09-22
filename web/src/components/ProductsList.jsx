import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, PackageX } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import ProductCard from '@/components/ProductCard.jsx';
import { useCart } from '@/hooks/useCart.jsx';

const EmptyState = ({ message }) => (
  <div className="text-center bg-muted/50 text-muted-foreground p-12 rounded-2xl border border-border border-dashed">
    <PackageX className="w-12 h-12 mx-auto mb-4 opacity-40" />
    <p className="text-lg font-medium">{message}</p>
  </div>
);

const ProductsList = ({ selectedCategory = 'all', limit }) => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      try {
        setLoading(true);
        const records = await pb.collection('products').getFullList({
          filter: '(isDeleted = false || isDeleted = null) && status = true',
          sort: '-created',
        });
        if (active) setProducts(records);
      } catch (loadError) {
        if (active) setError(loadError.message || 'Failed to load products');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProducts();
    return () => { active = false; };
  }, []);

  const visibleProducts = useMemo(() => (
    selectedCategory === 'all'
      ? products
      : products.filter((product) => product.category_id === selectedCategory || product.category === selectedCategory)
  ), [products, selectedCategory]);

  // Apply limit if provided
  const limitedVisibleProducts = useMemo(() => {
    if (limit && typeof limit === 'number' && limit > 0) {
      return visibleProducts.slice(0, limit);
    }
    return visibleProducts;
  }, [visibleProducts, limit]);

  const handleAddToCart = async (product, price) => {
    try {
      await addToCart(product, { ...product, price }, 1, product.stock_quantity);
    } catch (addError) {
      setError(addError.message || 'Unable to add this product to the cart');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>;
  if (error) return <div className="text-center bg-destructive/10 text-destructive p-8 rounded-2xl border border-destructive/20"><p className="font-medium">{error}</p></div>;
  if (!products.length) return <EmptyState message="No products available at the moment." />;
  if (!visibleProducts.length) return <EmptyState message="No products found in this category." />;

  return (
    <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      <AnimatePresence mode="popLayout">
        {limitedVisibleProducts.map((product) => <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />)}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductsList;

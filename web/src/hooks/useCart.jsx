import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { formatCurrency } from '@/api/EcommerceApi.js';
import { calculateTaxFromPrice, calculateExtractedTax, calculateSubtotal, calculateInclusiveSum } from '@/utils/taxCalculations.js';

const CartContext = createContext();

const CART_STORAGE_KEY = 'sgrd-masale-cart';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
      console.error('[CartProvider] Error loading cart from localStorage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('[CartProvider] Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  const addToCart = useCallback((product, variant, quantity, availableQuantity) => {
    return new Promise((resolve, reject) => {
      if (!product || !variant) {
        reject(new Error('Product and variant are required'));
        return;
      }

      // Ensure price and quantity are safely parsed to numbers
      const parsedPrice = Number(variant?.price ?? product?.price ?? 0);
      const parsedQuantity = Number(quantity) || 1;
      
      const itemToAdd = {
        id: variant.id || product.id,
        name: product.name || product.title,
        price: isNaN(parsedPrice) ? 0 : parsedPrice,
        tax_type: variant.tax_type || product.tax_type || '0%',
        category: product.category,
        image: product.image || (product.images && product.images[0]?.url) || null
      };

      if (variant.manage_inventory || product.manage_inventory) {
        const existingItem = cartItems.find(item => item.id === itemToAdd.id);
        const currentCartQuantity = existingItem ? Number(existingItem.quantity) : 0;
        if ((currentCartQuantity + parsedQuantity) > availableQuantity) {
          const error = new Error(`Not enough stock for ${itemToAdd.name}. Only ${availableQuantity} left.`);
          reject(error);
          return;
        }
      }

      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === itemToAdd.id);
        if (existingItem) {
          return prevItems.map(item =>
            item.id === itemToAdd.id
              ? { ...item, quantity: Number(item.quantity) + parsedQuantity }
              : item
          );
        }
        return [...prevItems, { ...itemToAdd, quantity: parsedQuantity }];
      });
      resolve();
    });
  }, [cartItems]);

  const removeFromCart = useCallback((itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    const parsedQuantity = Number(quantity) || 0;
    if (parsedQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: parsedQuantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Calculate the monetary total of the cart
  const getCartTotal = useCallback(() => {
    return calculateInclusiveSum(cartItems);
  }, [cartItems]);

  // Legacy method for counting items
  const getCartCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + (Number(item.quantity) || 0), 0);
  }, [cartItems]);

  // New strict method for counting items as requested
  const getCartItemCount = useCallback(() => {
    if (!cartItems || !Array.isArray(cartItems)) return 0;
    return cartItems.reduce((count, item) => count + (Number(item.quantity) || 0), 0);
  }, [cartItems]);

  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getCartItemCount,
    calculateTaxFromPrice,
  }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount, getCartItemCount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [shippingMethod, setShippingMethod] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);

  // Load cart and shipping from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('sgrd_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
    
    const savedShipping = localStorage.getItem('sgrd_shipping');
    if (savedShipping) {
      try {
        const parsed = JSON.parse(savedShipping);
        setShippingMethod(parsed.method);
        setShippingCost(parsed.cost);
      } catch (error) {
        console.error('Failed to load shipping:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sgrd_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save shipping to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sgrd_shipping', JSON.stringify({ method: shippingMethod, cost: shippingCost }));
  }, [shippingMethod, shippingCost]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevItems, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setShippingMethod(null);
    setShippingCost(0);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalPrice = () => {
    const subtotal = getCartTotal();
    return `₹${(subtotal + shippingCost).toFixed(2)}`;
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const setShippingSelection = (method, cost) => {
    setShippingMethod(method);
    setShippingCost(cost);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getTotalPrice,
    getCartCount,
    shippingMethod,
    shippingCost,
    setShippingSelection
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
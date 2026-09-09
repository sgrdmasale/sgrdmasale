import React, { createContext, useContext, useState } from 'react';

const CartSidebarContext = createContext();

export const useCartSidebar = () => {
  const context = useContext(CartSidebarContext);
  if (!context) {
    throw new Error('useCartSidebar must be used within CartSidebarProvider');
  }
  return context;
};

export const CartSidebarProvider = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const toggleCart = () => setIsCartOpen(prev => !prev);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartSidebarContext.Provider value={{ isCartOpen, setIsCartOpen, toggleCart, openCart, closeCart }}>
      {children}
    </CartSidebarContext.Provider>
  );
};
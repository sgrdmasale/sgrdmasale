import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { AdminAuthProvider } from './contexts/AdminAuthContext.jsx';
import { CartSidebarProvider } from './contexts/CartSidebarContext.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminProtectedRoute from './components/AdminProtectedRoute.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import ShoppingCartSidebar from './components/ShoppingCart.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

// Pages
import HomePage from './pages/HomePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import PartnershipsPage from './pages/PartnershipsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ProductCatalog from './pages/ProductCatalog.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import ShoppingCart from './pages/ShoppingCart.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import PaymentConfirmationPage from './pages/PaymentConfirmationPage.jsx';
import SuccessPage from './pages/SuccessPage.jsx';
import UserProfilePage from './pages/UserProfilePage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import OrderDetailsPage from './pages/OrderDetailsPage.jsx';

// Admin Pages
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ProductsManagement from './pages/ProductsManagement.jsx';
import CategoriesManagement from './pages/CategoriesManagement.jsx';
import TaxesManagement from './pages/TaxesManagement.jsx';
import OrdersManagement from './pages/OrdersManagement.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import CompanyDetailsPage from './pages/CompanyDetailsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import BannersManagement from './pages/BannersManagement.jsx';
import ShippingChannelsManagement from './pages/ShippingChannelsManagement.jsx';
import PaymentGatewaysManagement from './pages/PaymentGatewaysManagement.jsx';
import CollectionsOverview from './pages/CollectionsOverview.jsx';
import CouponsManagement from './pages/CouponsManagement.jsx';
import EnquiriesManagement from './pages/EnquiriesManagement.jsx';
import OffersManagement from './pages/OffersManagement.jsx';
import ShippingRatesManagement from './pages/ShippingRatesManagement.jsx';
import PartnershipsManagement from './pages/PartnershipsManagement.jsx';

// Policy Pages
import ReturnPolicyPage from './pages/ReturnPolicyPage.jsx';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx';
import ShippingPolicyPage from './pages/ShippingPolicyPage.jsx';
import TermsConditionsPage from './pages/TermsConditionsPage.jsx';

import { Toaster } from '@/components/ui/sonner';
import { useCartSidebar } from './contexts/CartSidebarContext.jsx';

// Layout wrapper for public pages to include Header/Footer
const PublicLayout = ({ children }) => (
  <div className="flex min-w-0 min-h-screen flex-col overflow-x-clip">
    <Header />
    <main className="flex-grow">{children}</main>
    <Footer />
  </div>
);

function AppContent() {
  const { isCartOpen, setIsCartOpen } = useCartSidebar();

  return (
    <>
      {/* Public Routes */}
      <Routes>
        <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/partnerships" element={<PartnershipsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/shop" element={<ProductCatalog />} />
        <Route path="/product/:id" element={<PublicLayout><ProductDetailPage /></PublicLayout>} />
        <Route path="/cart" element={<ShoppingCart />} />
        <Route path="/success" element={<PublicLayout><SuccessPage /></PublicLayout>} />
        <Route path="/order-confirmation/:orderId" element={<PublicLayout><OrderConfirmationPage /></PublicLayout>} />
        <Route path="/payment-confirmation/:orderId" element={<PublicLayout><PaymentConfirmationPage /></PublicLayout>} />

        {/* Policy Routes (Public) */}
        <Route path="/return-policy" element={<ReturnPolicyPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
        <Route path="/terms-conditions" element={<TermsConditionsPage />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="collections-overview" element={<CollectionsOverview />} />
          <Route path="products" element={<ProductsManagement />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="banners" element={<BannersManagement />} />
          <Route path="taxes" element={<TaxesManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="coupons" element={<CouponsManagement />} />
          <Route path="enquiries" element={<EnquiriesManagement />} />
          <Route path="partnerships" element={<PartnershipsManagement />} />
          <Route path="offers" element={<OffersManagement />} />
          <Route path="shipping-rates" element={<ShippingRatesManagement />} />
          <Route path="shipping-channels" element={<ShippingChannelsManagement />} />
          <Route path="payment-gateways" element={<PaymentGatewaysManagement />} />
          <Route path="company" element={<CompanyDetailsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Missing route placeholders that might be linked in sidebar - mapped to common components if missing, or user can expand */}
          <Route path="email-templates" element={<div className="p-8 text-center text-muted-foreground font-medium border-2 border-dashed rounded-xl m-8">Email Templates Placeholder</div>} />
        </Route>

        {/* Protected User Routes */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <PublicLayout><CheckoutPage /></PublicLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute>
              <PublicLayout><MyOrdersPage /></PublicLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-orders/:id"
          element={
            <ProtectedRoute>
              <PublicLayout><OrderDetailsPage /></PublicLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch-all 404 */}
        <Route path="*" element={<PublicLayout><div className="min-h-[70vh] flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold mb-4">404</h1><p className="text-muted-foreground">Page not found</p></div></div></PublicLayout>} />
      </Routes>

      {/* Shopping Cart Sidebar */}
      <ShoppingCartSidebar isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />

      <Toaster position="bottom-right" richColors />
    </>
  );
}

function App() {
  console.log('[App] Initializing SGRD Masale application...');

  return (
    <CartProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <CartSidebarProvider>
            <Router>
              <ScrollToTop />
              <AppContent />
            </Router>
          </CartSidebarProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </CartProvider>
  );
}

export default App;

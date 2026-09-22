import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import {
  LayoutDashboard, Package, Tags, Receipt, ShoppingCart, Users,
  Building2, Settings, LogOut, Menu, Database, Image as ImageIcon,
  Truck, Navigation, CreditCard, Mail, MessageSquare, ChevronDown, ChevronRight, Handshake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

const menuGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
      { name: 'Collections Overview', path: '/admin/collections-overview', icon: Database },
    ]
  },
  {
    title: 'Catalog',
    items: [
      { name: 'Products', path: '/admin/products', icon: Package },
      { name: 'Categories', path: '/admin/categories', icon: Tags },
      { name: 'Banners', path: '/admin/banners', icon: ImageIcon },
    ]
  },
  {
    title: 'Sales & Customers',
    items: [
      { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
      { name: 'Customers', path: '/admin/customers', icon: Users },
      { name: 'Enquiries', path: '/admin/enquiries', icon: MessageSquare },
      { name: 'Partnerships', path: '/admin/partnerships', icon: Handshake },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { name: 'Taxes', path: '/admin/taxes', icon: Receipt },
      { name: 'Shipping Rates', path: '/admin/shipping-rates', icon: Truck },
      { name: 'Shipping Channels', path: '/admin/shipping-channels', icon: Navigation },
      { name: 'Payment Gateways', path: '/admin/payment-gateways', icon: CreditCard },
      { name: 'Email Templates', path: '/admin/email-templates', icon: Mail },
      { name: 'Company Details', path: '/admin/company', icon: Building2 },
      { name: 'Settings', path: '/admin/settings', icon: Settings },
    ]
  }
];

const SidebarContent = ({ adminUser, handleLogout }) => {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState(
    menuGroups.map(g => g.title)
  );

  const toggleGroup = (title) => {
    setExpandedGroups(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground border-r border-border/50">
      <div className="p-6 border-b border-border/50 bg-muted/20">
        <h2 className="text-lg font-semibold tracking-tight text-primary">SGRD Admin</h2>
      </div>

      <nav className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <button
              onClick={() => toggleGroup(group.title)}
              className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {group.title}
              {expandedGroups.includes(group.title) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {expandedGroups.includes(group.title) && (
              <div className="space-y-1 pt-1">
                {group.items.map((item) => {
                  const isActive = item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.exact}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border/50 bg-muted/10">
        <div className="mb-4 px-2">
          <p className="text-sm font-medium truncate text-foreground">{adminUser?.email}</p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 rounded-lg transition-colors text-sm"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

const AdminSidebar = () => {
  const { adminUser, logoutAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <>
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 shadow-sm z-30">
        <SidebarContent adminUser={adminUser} handleLogout={handleLogout} />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border/50 flex items-center px-4 z-50 shadow-sm">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-3 text-foreground hover:bg-muted">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r-0">
            <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
            <SidebarContent adminUser={adminUser} handleLogout={handleLogout} />
          </SheetContent>
        </Sheet>
        <h2 className="font-semibold text-base text-primary tracking-tight">SGRD Admin</h2>
      </div>
    </>
  );
};

export default AdminSidebar;
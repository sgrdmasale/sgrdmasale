import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, Package, Tags, ShoppingCart, Users, FileImage as ImageIcon, Navigation, CreditCard, Ticket, Percent, Receipt, Truck, Mail, ArrowRight } from 'lucide-react';

const collectionDefinitions = [
  { id: 'products', name: 'Products', icon: Package, path: '/admin/products', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'categories', name: 'Categories', icon: Tags, path: '/admin/categories', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'orders', name: 'Orders', icon: ShoppingCart, path: '/admin/orders', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'users', name: 'Customers', icon: Users, path: '/admin/customers', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'banners', name: 'Banners', icon: ImageIcon, path: '/admin/banners', color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { id: 'shipping_channels', name: 'Shipping Channels', icon: Navigation, path: '/admin/shipping-channels', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { id: 'payment_gateways', name: 'Payment Gateways', icon: CreditCard, path: '/admin/payment-gateways', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { id: 'coupons', name: 'Coupons', icon: Ticket, path: '/admin/coupons', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'offers', name: 'Offers', icon: Percent, path: '/admin/offers', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'taxes', name: 'Taxes', icon: Receipt, path: '/admin/taxes', color: 'text-slate-500', bg: 'bg-slate-500/10' },
  { id: 'shipping_rates', name: 'Shipping Rates', icon: Truck, path: '/admin/shipping-rates', color: 'text-teal-500', bg: 'bg-teal-500/10' },
  { id: 'email_templates', name: 'Email Templates', icon: Mail, path: '/admin/email-templates', color: 'text-sky-500', bg: 'bg-sky-500/10' }
];

const CollectionsOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollectionStats = async () => {
      setLoading(true);
      const newStats = {};
      
      try {
        await Promise.all(
          collectionDefinitions.map(async (def) => {
            try {
              const res = await pb.collection(def.id).getList(1, 1, { $autoCancel: false });
              newStats[def.id] = res.totalItems;
            } catch (err) {
              newStats[def.id] = 0; // Fallback for empty or restricted collections
            }
          })
        );
        setStats(newStats);
      } catch (error) {
        console.error("Error fetching collection stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionStats();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <Helmet><title>Collections Overview - Admin</title></Helmet>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <Database className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Database Collections</h1>
        </div>
        <p className="text-muted-foreground ml-12 font-medium">System-wide record counts and quick access.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {collectionDefinitions.map((def) => (
          <Card 
            key={def.id} 
            className="group rounded-2xl border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 overflow-hidden cursor-pointer"
            onClick={() => navigate(def.path)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${def.bg} ${def.color} group-hover:scale-110 transition-transform duration-300`}>
                  <def.icon className="w-6 h-6" />
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground group-hover:text-primary">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">{def.name}</p>
                {loading ? (
                  <Skeleton className="h-10 w-24 rounded-lg mt-1" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-foreground tracking-tight">
                      {stats[def.id] !== undefined ? stats[def.id].toLocaleString() : 0}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">records</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CollectionsOverview;
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { ShoppingCart, Users, MessageSquare, DollarSign, RefreshCw, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/api/EcommerceApi.js';

import SummaryCard from '@/components/SummaryCard.jsx';
import OrdersTable from '@/components/OrdersTable.jsx';
import InquiriesTable from '@/components/InquiriesTable.jsx';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalInquiries: 0,
    totalRevenue: 0,
    recentOrders: 0,
    paymentSuccessRate: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const [ordersRes, inquiriesRes] = await Promise.all([
        pb.collection('orders').getFullList({ fields: 'id,total_amount,payment_status,customer_email,created', $autoCancel: false }),
        pb.collection('contact_submissions').getList(1, 1, { $autoCancel: false })
      ]);

      const uniqueCustomers = new Set();
      let revenue = 0;
      let completedPayments = 0;
      let recentCount = 0;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      ordersRes.forEach(order => {
        if (order.customer_email) uniqueCustomers.add(order.customer_email.toLowerCase());
        if (order.payment_status === 'completed') {
          revenue += (order.total_amount || 0);
          completedPayments++;
        }
        if (new Date(order.created) >= sevenDaysAgo) {
          recentCount++;
        }
      });

      const successRate = ordersRes.length > 0 ? Math.round((completedPayments / ordersRes.length) * 100) : 0;

      setStats({
        totalOrders: ordersRes.length,
        totalCustomers: uniqueCustomers.size,
        totalInquiries: inquiriesRes.totalItems,
        totalRevenue: revenue,
        recentOrders: recentCount,
        paymentSuccessRate: successRate
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <Helmet><title>Dashboard - Admin Portal</title></Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">Dashboard Overview</h1>
          <p className="text-muted-foreground font-medium">Welcome back. Here's what's happening with your store today.</p>
        </div>
        <Button variant="outline" onClick={fetchDashboardStats} disabled={loading} className="bg-card rounded-xl shadow-sm hover:text-primary hover:border-primary/50 transition-colors">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Total Revenue" 
          value={loading ? '...' : formatCurrency(stats.totalRevenue * 100, { symbol: '₹' })} 
          icon={DollarSign} 
          className="bg-primary text-primary-foreground border-transparent shadow-lg shadow-primary/20"
        />
        <SummaryCard 
          title="Recent Orders (7d)" 
          value={loading ? '...' : stats.recentOrders} 
          icon={TrendingUp} 
          description={`${stats.paymentSuccessRate}% success rate`}
          className="bg-card shadow-sm border-border/50"
        />
        <SummaryCard 
          title="Total Customers" 
          value={loading ? '...' : stats.totalCustomers} 
          icon={Users} 
          className="bg-card shadow-sm border-border/50"
        />
        <SummaryCard 
          title="Total Inquiries" 
          value={loading ? '...' : stats.totalInquiries} 
          icon={MessageSquare} 
          className="bg-card shadow-sm border-border/50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden flex flex-col h-full">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Recent Orders
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Latest transactions awaiting fulfillment</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/orders')} className="text-primary hover:bg-primary/10">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="p-4">
                <OrdersTable limit={5} hideFilters={true} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden flex flex-col h-full">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  New Inquiries
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Recent contact form submissions</p>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="p-4">
                <InquiriesTable limit={5} hideFilters={true} compact={true} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
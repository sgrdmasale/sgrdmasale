import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <Helmet><title>Settings - Admin</title></Helmet>
      
      <h1 className="admin-page-title">Store Settings</h1>

      <Tabs defaultValue="shipping" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="shipping">Shipping Methods</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="policies">Store Policies</TabsTrigger>
          <TabsTrigger value="emails">Email Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shipping">
          <Card>
            <CardHeader><CardTitle>Shipping Configuration</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">Manage shipping rates and delivery options.</p>
              <div className="p-8 text-center border rounded-lg bg-muted/20">
                <p>Shipping settings module coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader><CardTitle>Payment Gateways</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">Configure active payment providers.</p>
              <div className="p-8 text-center border rounded-lg bg-muted/20">
                <p>Payment settings module coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader><CardTitle>Legal Policies</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">Update terms, privacy, and return policies.</p>
              <div className="p-8 text-center border rounded-lg bg-muted/20">
                <p>Policy editor module coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails">
          <Card>
            <CardHeader><CardTitle>Email Templates</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">Customize automated email notifications.</p>
              <div className="p-8 text-center border rounded-lg bg-muted/20">
                <p>Email template editor coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
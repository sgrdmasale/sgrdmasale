import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Package, Plus, Trash2, Loader2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    is_default: false
  });

  useEffect(() => {
    if (currentUser) {
      setProfile({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      });
      fetchAddresses();
      fetchOrders();
    }
  }, [currentUser]);

  const fetchAddresses = async () => {
    try {
      const result = await pb.collection('addresses').getFullList({
        filter: `userId = "${currentUser.id}"`,
        sort: '-is_default,-created',
        $autoCancel: false
      });
      setAddresses(result);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      toast.error('Failed to load addresses');
    }
  };

  const fetchOrders = async () => {
    try {
      const result = await pb.collection('orders').getList(1, 50, {
        filter: `userId = "${currentUser.id}" || customer_email = "${currentUser.email}"`,
        sort: '-created',
        $autoCancel: false
      });
      
      const filteredOrders = result.items.filter(order => 
        order.customer_email === currentUser.email || order.userId === currentUser.id
      );
      
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await pb.collection('users').update(currentUser.id, {
        name: profile.name,
        phone: profile.phone
      }, { $autoCancel: false });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newAddress.name || !newAddress.phone || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingAddress(true);

    try {
      // If setting as default, unset other defaults first
      if (newAddress.is_default) {
        const existingDefaults = addresses.filter(a => a.is_default);
        for (const addr of existingDefaults) {
          await pb.collection('addresses').update(addr.id, { is_default: false }, { $autoCancel: false });
        }
      }

      // Create new address
      await pb.collection('addresses').create({
        ...newAddress,
        userId: currentUser.id
      }, { $autoCancel: false });

      toast.success('Address added successfully');
      setIsAddressModalOpen(false);
      
      // Reset form
      setNewAddress({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        is_default: false
      });
      
      // Refresh list
      fetchAddresses();
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error(error.message || 'Failed to add address. Please try again.');
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      await pb.collection('addresses').delete(addressId, { $autoCancel: false });
      toast.success('Address deleted successfully');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Helmet>
        <title>My Profile - SGRD</title>
        <meta name="description" content="Manage your profile, addresses, and orders." />
      </Helmet>

      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[80vh]">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight text-foreground">
          My Account
        </h1>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="profile" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="addresses" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <MapPin className="w-4 h-4 mr-2" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Package className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="bg-muted/20 border-b pb-4">
                <CardTitle className="text-xl">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleProfileUpdate} className="space-y-5 max-w-xl">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-medium">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      required
                      className="text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="mt-2">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b pb-4">
                <CardTitle className="text-xl">Saved Addresses</CardTitle>
                <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Address</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddAddress} className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="addr-name">Recipient Name *</Label>
                          <Input
                            id="addr-name"
                            value={newAddress.name}
                            onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="addr-phone">Phone Number *</Label>
                          <Input
                            id="addr-phone"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="addr-street">Street Address *</Label>
                        <Input
                          id="addr-street"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          placeholder="House No, Building, Street, Area"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="addr-city">City *</Label>
                          <Input
                            id="addr-city"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="addr-state">State *</Label>
                          <Input
                            id="addr-state"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="addr-pincode">PIN Code *</Label>
                          <Input
                            id="addr-pincode"
                            value={newAddress.pincode}
                            onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="addr-country">Country</Label>
                          <Input
                            id="addr-country"
                            value={newAddress.country}
                            onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                          id="addr-default" 
                          checked={newAddress.is_default}
                          onCheckedChange={(checked) => setNewAddress({ ...newAddress, is_default: checked })}
                        />
                        <Label htmlFor="addr-default" className="text-sm font-normal cursor-pointer">
                          Set as default shipping address
                        </Label>
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsAddressModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmittingAddress}>
                          {isSubmittingAddress && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Save Address
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="pt-6">
                {addresses.length === 0 ? (
                  <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                    <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground mb-4 font-medium">No saved addresses found</p>
                    <Button onClick={() => setIsAddressModalOpen(true)} variant="outline">
                      Add Your First Address
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="p-5 border rounded-xl bg-card relative group hover:border-primary/30 transition-colors">
                        {address.is_default && (
                          <span className="absolute top-4 right-4 px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                            Default
                          </span>
                        )}
                        <div className="pr-16">
                          <p className="font-semibold text-foreground mb-1">{address.name}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {address.street}<br />
                            {address.city}, {address.state} {address.pincode}<br />
                            {address.country}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {address.phone}
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-3"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="focus-visible:outline-none focus-visible:ring-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="bg-muted/20 border-b pb-4">
                <CardTitle className="text-xl">Order History</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {orders.length === 0 ? (
                  <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                    <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground mb-4 font-medium">You haven't placed any orders yet</p>
                    <Button onClick={() => navigate('/shop')} variant="outline">
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="font-semibold">Order ID</TableHead>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Items</TableHead>
                          <TableHead className="font-semibold">Total</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => {
                          let itemsCount = 0;
                          try {
                            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                            itemsCount = Array.isArray(items) ? items.length : 0;
                          } catch (e) {
                            itemsCount = 0;
                          }

                          return (
                            <TableRow key={order.id} className="hover:bg-muted/30">
                              <TableCell className="font-mono text-sm font-medium">
                                {order.orderNumber || order.id.slice(0, 8)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{formatDate(order.created)}</TableCell>
                              <TableCell className="text-muted-foreground">{itemsCount} items</TableCell>
                              <TableCell className="font-semibold text-foreground">
                                ₹{(order.total_amount || 0).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                                  order.order_status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                                  order.order_status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                  order.order_status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {order.order_status || 'pending'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => navigate(`/order-confirmation/${order.id}`)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </>
  );
};

export default UserProfilePage;
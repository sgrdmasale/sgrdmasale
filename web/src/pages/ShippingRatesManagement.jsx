import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { useToast } from '@/hooks/use-toast.js';
import { Plus, Edit, Trash2, Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const ShippingRatesManagement = () => {
  const { toast } = useToast();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: '',
    delivery_days: '',
    min_order_amount: '',
    is_active: true
  });

  const fetchRates = async (pageNum = 1) => {
    setLoading(true);
    try {
      const result = await pb.collection('shipping_rates').getList(pageNum, 20, {
        sort: '-created',
        $autoCancel: false
      });
      setRates(result.items);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shipping rates.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleOpenDialog = (rate = null) => {
    if (rate) {
      setEditingId(rate.id);
      setFormData({
        name: rate.name,
        description: rate.description || '',
        cost: rate.cost,
        delivery_days: rate.delivery_days || '',
        min_order_amount: rate.min_order_amount || '',
        is_active: rate.is_active
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        cost: '',
        delivery_days: '',
        min_order_amount: '',
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const dataToSubmit = {
        ...formData,
        cost: Number(formData.cost),
        min_order_amount: formData.min_order_amount ? Number(formData.min_order_amount) : 0
      };

      if (editingId) {
        await pb.collection('shipping_rates').update(editingId, dataToSubmit, { $autoCancel: false });
        toast({ title: 'Success', description: 'Shipping rate updated successfully.' });
      } else {
        await pb.collection('shipping_rates').create(dataToSubmit, { $autoCancel: false });
        toast({ title: 'Success', description: 'Shipping rate created successfully.' });
      }
      
      setIsDialogOpen(false);
      fetchRates(page);
    } catch (error) {
      console.error('Error saving shipping rate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save shipping rate.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shipping rate?')) return;
    
    try {
      await pb.collection('shipping_rates').delete(id, { $autoCancel: false });
      toast({ title: 'Success', description: 'Shipping rate deleted successfully.' });
      fetchRates(page);
    } catch (error) {
      console.error('Error deleting shipping rate:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete shipping rate.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Shipping Rates - Admin</title></Helmet>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="w-8 h-8 text-primary" />
            Shipping Rates
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Manage delivery options and costs.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Rate
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Delivery Days</TableHead>
              <TableHead>Min Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : rates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No shipping rates found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              rates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-bold">{rate.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {rate.description || '-'}
                  </TableCell>
                  <TableCell className="font-medium">₹{rate.cost}</TableCell>
                  <TableCell>{rate.delivery_days || '-'}</TableCell>
                  <TableCell>{rate.min_order_amount ? `₹${rate.min_order_amount}` : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={rate.is_active ? 'default' : 'secondary'} className={rate.is_active ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}>
                      {rate.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(rate)}>
                        <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rate.id)}>
                        <Trash2 className="w-4 h-4 text-destructive hover:text-destructive/80" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-border/50 flex justify-between items-center bg-muted/10">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchRates(page - 1)} 
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchRates(page + 1)} 
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Shipping Rate' : 'Add Shipping Rate'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rate Name *</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
                placeholder="e.g. Standard Delivery"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="e.g. 3-5 business days"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (₹) *</Label>
                <Input 
                  id="cost" 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={formData.cost} 
                  onChange={(e) => setFormData({...formData, cost: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_days">Delivery Days</Label>
                <Input 
                  id="delivery_days" 
                  value={formData.delivery_days} 
                  onChange={(e) => setFormData({...formData, delivery_days: e.target.value})} 
                  placeholder="e.g. 3-5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_order_amount">Minimum Order Amount (₹)</Label>
              <Input 
                id="min_order_amount" 
                type="number" 
                min="0"
                value={formData.min_order_amount} 
                onChange={(e) => setFormData({...formData, min_order_amount: e.target.value})} 
                placeholder="Leave empty if none"
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">Enable or disable this shipping rate</p>
              </div>
              <Switch 
                checked={formData.is_active} 
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})} 
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? 'Update Rate' : 'Create Rate'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShippingRatesManagement;
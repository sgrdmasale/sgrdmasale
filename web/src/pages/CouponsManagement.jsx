import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { useToast } from '@/hooks/use-toast.js';
import { Plus, Edit, Trash2, Ticket, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CouponsManagement = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    expiry_date: '',
    max_usage_limit: '',
    minimum_purchase_amount: '',
    is_active: true,
    current_usage_count: 0
  });

  const fetchCoupons = async (pageNum = 1) => {
    setLoading(true);
    try {
      const result = await pb.collection('coupons').getList(pageNum, 20, {
        sort: '-created',
        $autoCancel: false
      });
      setCoupons(result.items);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load coupons.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenDialog = (coupon = null) => {
    if (coupon) {
      setEditingId(coupon.id);
      setFormData({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        expiry_date: coupon.expiry_date ? coupon.expiry_date.split(' ')[0] : '',
        max_usage_limit: coupon.max_usage_limit || '',
        minimum_purchase_amount: coupon.minimum_purchase_amount || '',
        is_active: coupon.is_active,
        current_usage_count: coupon.current_usage_count || 0
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        expiry_date: '',
        max_usage_limit: '',
        minimum_purchase_amount: '',
        is_active: true,
        current_usage_count: 0
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
        discount_value: Number(formData.discount_value),
        max_usage_limit: formData.max_usage_limit ? Number(formData.max_usage_limit) : 0,
        minimum_purchase_amount: formData.minimum_purchase_amount ? Number(formData.minimum_purchase_amount) : 0,
        expiry_date: formData.expiry_date ? `${formData.expiry_date} 23:59:59.000Z` : null
      };

      if (editingId) {
        await pb.collection('coupons').update(editingId, dataToSubmit, { $autoCancel: false });
        toast({ title: 'Success', description: 'Coupon updated successfully.' });
      } else {
        await pb.collection('coupons').create(dataToSubmit, { $autoCancel: false });
        toast({ title: 'Success', description: 'Coupon created successfully.' });
      }
      
      setIsDialogOpen(false);
      fetchCoupons(page);
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save coupon.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      await pb.collection('coupons').delete(id, { $autoCancel: false });
      toast({ title: 'Success', description: 'Coupon deleted successfully.' });
      fetchCoupons(page);
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete coupon.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Coupons Management - Admin</title></Helmet>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Ticket className="w-8 h-8 text-primary" />
            Coupons Management
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Create and manage discount codes.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Coupon
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No coupons found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-bold">{coupon.code}</TableCell>
                  <TableCell>
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                  </TableCell>
                  <TableCell>
                    {coupon.current_usage_count} / {coupon.max_usage_limit || '∞'}
                  </TableCell>
                  <TableCell>
                    {coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.is_active ? 'default' : 'secondary'} className={coupon.is_active ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(coupon)}>
                        <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)}>
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
              onClick={() => fetchCoupons(page - 1)} 
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchCoupons(page + 1)} 
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
            <DialogTitle>{editingId ? 'Edit Coupon' : 'Add New Coupon'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  required 
                  placeholder="e.g. SUMMER20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_type">Discount Type *</Label>
                <Select 
                  value={formData.discount_type} 
                  onValueChange={(val) => setFormData({...formData, discount_type: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_value">Discount Value *</Label>
                <Input 
                  id="discount_value" 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={formData.discount_value} 
                  onChange={(e) => setFormData({...formData, discount_value: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date *</Label>
                <Input 
                  id="expiry_date" 
                  type="date" 
                  value={formData.expiry_date} 
                  onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_usage_limit">Max Usage Limit</Label>
                <Input 
                  id="max_usage_limit" 
                  type="number" 
                  min="0"
                  value={formData.max_usage_limit} 
                  onChange={(e) => setFormData({...formData, max_usage_limit: e.target.value})} 
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum_purchase_amount">Min Purchase Amount</Label>
                <Input 
                  id="minimum_purchase_amount" 
                  type="number" 
                  min="0"
                  value={formData.minimum_purchase_amount} 
                  onChange={(e) => setFormData({...formData, minimum_purchase_amount: e.target.value})} 
                  placeholder="e.g. 500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">Enable or disable this coupon</p>
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
                {editingId ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsManagement;
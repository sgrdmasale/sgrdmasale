import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { useToast } from '@/hooks/use-toast.js';
import { Plus, Edit, Trash2, Percent, Loader2 } from 'lucide-react';
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

const OffersManagement = () => {
  const { toast } = useToast();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    product_id: '',
    discount_type: 'percentage',
    discount_value: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  const fetchOffers = async (pageNum = 1) => {
    setLoading(true);
    try {
      const result = await pb.collection('offers').getList(pageNum, 20, {
        sort: '-created',
        $autoCancel: false
      });
      setOffers(result.items);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load offers.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleOpenDialog = (offer = null) => {
    if (offer) {
      setEditingId(offer.id);
      setFormData({
        product_id: offer.product_id,
        discount_type: offer.discount_type,
        discount_value: offer.discount_value,
        start_date: offer.start_date ? offer.start_date.split(' ')[0] : '',
        end_date: offer.end_date ? offer.end_date.split(' ')[0] : '',
        is_active: offer.is_active
      });
    } else {
      setEditingId(null);
      setFormData({
        product_id: '',
        discount_type: 'percentage',
        discount_value: '',
        start_date: '',
        end_date: '',
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
        discount_value: Number(formData.discount_value),
        start_date: formData.start_date ? `${formData.start_date} 00:00:00.000Z` : null,
        end_date: formData.end_date ? `${formData.end_date} 23:59:59.000Z` : null
      };

      if (editingId) {
        await pb.collection('offers').update(editingId, dataToSubmit, { $autoCancel: false });
        toast({ title: 'Success', description: 'Offer updated successfully.' });
      } else {
        await pb.collection('offers').create(dataToSubmit, { $autoCancel: false });
        toast({ title: 'Success', description: 'Offer created successfully.' });
      }
      
      setIsDialogOpen(false);
      fetchOffers(page);
    } catch (error) {
      console.error('Error saving offer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save offer.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    
    try {
      await pb.collection('offers').delete(id, { $autoCancel: false });
      toast({ title: 'Success', description: 'Offer deleted successfully.' });
      fetchOffers(page);
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete offer.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Offers Management - Admin</title></Helmet>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Percent className="w-8 h-8 text-primary" />
            Offers Management
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Manage product-specific discounts and sales.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Offer
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead>Product ID</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
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
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : offers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No offers found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium text-xs font-mono">{offer.product_id}</TableCell>
                  <TableCell className="font-bold">
                    {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `₹${offer.discount_value}`}
                  </TableCell>
                  <TableCell>
                    {offer.start_date ? new Date(offer.start_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    {offer.end_date ? new Date(offer.end_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={offer.is_active ? 'default' : 'secondary'} className={offer.is_active ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : ''}>
                      {offer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(offer)}>
                        <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(offer.id)}>
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
              onClick={() => fetchOffers(page - 1)} 
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchOffers(page + 1)} 
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
            <DialogTitle>{editingId ? 'Edit Offer' : 'Add New Offer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="product_id">Product ID *</Label>
              <Input 
                id="product_id" 
                value={formData.product_id} 
                onChange={(e) => setFormData({...formData, product_id: e.target.value})} 
                required 
                placeholder="Enter PocketBase Product ID"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input 
                  id="start_date" 
                  type="date" 
                  value={formData.start_date} 
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input 
                  id="end_date" 
                  type="date" 
                  value={formData.end_date} 
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">Enable or disable this offer</p>
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
                {editingId ? 'Update Offer' : 'Create Offer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OffersManagement;
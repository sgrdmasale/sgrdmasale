import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const BulkEditProductsModal = ({ isOpen, onClose, selectedIds, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: '', // '' = no change, 'true' = active, 'false' = inactive
    category: '',
    tax_type: '',
    stock_quantity: '',
    price_adjustment_type: '', // '', 'increase_pct', 'decrease_pct', 'fixed_amount'
    price_adjustment_value: ''
  });

  useEffect(() => {
    if (isOpen) {
      pb.collection('categories').getFullList({ sort: 'name', $autoCancel: false })
        .then(setCategories)
        .catch(console.error);
    }
  }, [isOpen]);

  const handleApply = async () => {
    if (selectedIds.length === 0) return;

    if (!window.confirm(`Are you sure you want to apply these changes to ${selectedIds.length} products?`)) {
      return;
    }

    setLoading(true);
    let successCount = 0;

    try {
      // We process sequentially to avoid overloading the server, or in small batches
      for (const id of selectedIds) {
        const product = await pb.collection('products').getOne(id, { $autoCancel: false });
        const updates = {};

        if (formData.status !== '') updates.status = formData.status === 'true';
        if (formData.category !== '') updates.category = formData.category;
        if (formData.tax_type !== '') updates.tax_type = formData.tax_type;
        if (formData.stock_quantity !== '') updates.stock_quantity = parseInt(formData.stock_quantity, 10);
        
        if (formData.price_adjustment_type && formData.price_adjustment_value) {
          const val = parseFloat(formData.price_adjustment_value);
          const currentPrice = product.price || 0;
          if (formData.price_adjustment_type === 'increase_pct') {
            updates.price = currentPrice + (currentPrice * (val / 100));
          } else if (formData.price_adjustment_type === 'decrease_pct') {
            updates.price = currentPrice - (currentPrice * (val / 100));
          } else if (formData.price_adjustment_type === 'fixed_amount') {
            updates.price = val;
          }
        }

        if (Object.keys(updates).length > 0) {
          await pb.collection('products').update(id, updates, { $autoCancel: false });
          successCount++;
        }
      }

      toast.success(`Successfully updated ${successCount} products`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('An error occurred during bulk update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Bulk Edit {selectedIds.length} Products</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <p className="text-muted-foreground mb-4">Leave fields blank to keep their current values.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="">-- No Change --</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="">-- No Change --</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Tax Rate</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                value={formData.tax_type} onChange={e => setFormData({...formData, tax_type: e.target.value})}
              >
                <option value="">-- No Change --</option>
                <option value="none">None</option>
                <option value="5%">5%</option>
                <option value="12%">12%</option>
                <option value="18%">18%</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Set Stock Quantity</Label>
              <Input 
                type="number" 
                placeholder="-- No Change --" 
                value={formData.stock_quantity} 
                onChange={e => setFormData({...formData, stock_quantity: e.target.value})} 
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Label className="mb-2 block">Price Adjustment</Label>
            <div className="grid grid-cols-2 gap-4">
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                value={formData.price_adjustment_type} 
                onChange={e => setFormData({...formData, price_adjustment_type: e.target.value})}
              >
                <option value="">-- No Change --</option>
                <option value="increase_pct">Increase by %</option>
                <option value="decrease_pct">Decrease by %</option>
                <option value="fixed_amount">Set to Fixed Amount</option>
              </select>
              <Input 
                type="number" step="0.01" 
                placeholder="Value..." 
                disabled={!formData.price_adjustment_type}
                value={formData.price_adjustment_value} 
                onChange={e => setFormData({...formData, price_adjustment_value: e.target.value})} 
              />
            </div>
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleApply} disabled={loading || selectedIds.length === 0}>
            {loading ? 'Applying...' : 'Apply Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditProductsModal;
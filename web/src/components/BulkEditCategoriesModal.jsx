import React, { useState } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const BulkEditCategoriesModal = ({ isOpen, onClose, selectedIds, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: '', // '' = no change, 'true' = active, 'false' = inactive
    description: ''
  });

  const handleApply = async () => {
    if (selectedIds.length === 0) return;

    if (!window.confirm(`Are you sure you want to apply these changes to ${selectedIds.length} categories?`)) {
      return;
    }

    setLoading(true);
    let successCount = 0;

    try {
      for (const id of selectedIds) {
        const updates = {};
        if (formData.status !== '') updates.status = formData.status === 'true';
        if (formData.description !== '') updates.description = formData.description;

        if (Object.keys(updates).length > 0) {
          await pb.collection('categories').update(id, updates, { $autoCancel: false });
          successCount++;
        }
      }

      toast.success(`Successfully updated ${successCount} categories`);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit {selectedIds.length} Categories</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm">
          <p className="text-muted-foreground mb-4">Leave fields blank to keep their current values.</p>
          
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
            <Label>Append to Description (Optional)</Label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="Will replace existing description if provided..."
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
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

export default BulkEditCategoriesModal;
import React, { useState, useEffect } from 'react';
import apiServerClient from '@/lib/apiServerClient.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const OrderStatusUpdateModal = ({ order, isOpen, onClose, onSuccess }) => {
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      setStatus(order.order_status || 'pending');
      setNotes('');
    }
  }, [order, isOpen]);

  const handleUpdate = async () => {
    if (!order) return;
    setLoading(true);
    
    console.log(`[OrderStatusUpdateModal] Initiating update for order ID: ${order.id} to new status: ${status}`);
    
    try {
      const response = await apiServerClient.fetch(`/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_status: status
        })
      });

      console.log(`[OrderStatusUpdateModal] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[OrderStatusUpdateModal] Error payload received:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to update order status');
      }

      const updatedOrder = await response.json();
      console.log('[OrderStatusUpdateModal] Successfully updated order payload:', updatedOrder);
      
      toast.success('Order status updated successfully');
      
      if (onSuccess) {
        console.log('[OrderStatusUpdateModal] Calling onSuccess callback to refresh list');
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('[OrderStatusUpdateModal] Caught exception during update:', error);
      toast.error(error.message || 'Failed to update order status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Change the fulfillment status for order #{order?.orderNumber}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Order Number</Label>
            <div className="font-medium text-foreground">{order?.orderNumber}</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-select">New Status</Label>
            <Select value={status} onValueChange={setStatus} disabled={loading}>
              <SelectTrigger id="status-select" className="w-full">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="internal-notes">Notes (Optional)</Label>
            <textarea 
              id="internal-notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add internal notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading} className="min-w-[120px]">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Apply Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderStatusUpdateModal;
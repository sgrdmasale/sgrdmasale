import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Save, Edit2, X } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';

const UserLimitsManager = ({ currentLimits, usage, onLimitsUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    max_products: 100,
    max_coupons: 50,
    max_orders: 1000,
    max_storage_mb: 500
  });

  useEffect(() => {
    if (currentLimits) {
      setFormData({
        max_products: currentLimits.max_products || 100,
        max_coupons: currentLimits.max_coupons || 50,
        max_orders: currentLimits.max_orders || 1000,
        max_storage_mb: currentLimits.max_storage_mb || 500
      });
    }
  }, [currentLimits]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (currentLimits?.id) {
        await pb.collection('user_limits').update(currentLimits.id, formData, { $autoCancel: false });
      } else {
        await pb.collection('user_limits').create({
          ...formData,
          userId: pb.authStore.model.id
        }, { $autoCancel: false });
      }
      toast.success('Limits updated successfully');
      setIsEditing(false);
      if (onLimitsUpdated) onLimitsUpdated();
    } catch (error) {
      console.error('Failed to update limits:', error);
      toast.error('Failed to update limits');
    } finally {
      setLoading(false);
    }
  };

  const renderLimitCard = (title, key, usageValue, format = (v) => v) => {
    const limit = formData[key];
    const percent = Math.min(100, Math.max(0, (usageValue / limit) * 100)) || 0;
    const isWarning = percent >= 80;
    const isCritical = percent >= 95;

    return (
      <Card className={isCritical ? 'border-destructive/50 bg-destructive/5' : ''}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h4 className="text-2xl font-bold mt-1">
                {format(usageValue)} <span className="text-sm font-normal text-muted-foreground">/ {format(limit)}</span>
              </h4>
            </div>
            {isWarning && (
              <div className={`p-2 rounded-full ${isCritical ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-600'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
          </div>
          
          <Progress 
            value={percent} 
            className={`h-2 ${isCritical ? 'bg-destructive/20' : isWarning ? 'bg-amber-500/20' : ''}`}
            indicatorClassName={isCritical ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-primary'}
          />
          
          {isEditing && (
            <div className="mt-4 pt-4 border-t">
              <Label className="text-xs mb-1 block">New Limit</Label>
              <Input 
                type="number" 
                min={usageValue}
                value={formData[key]} 
                onChange={(e) => setFormData({...formData, [key]: parseInt(e.target.value) || 0})}
                className="h-8 text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">System Usage & Limits</h3>
          <p className="text-sm text-muted-foreground">Monitor your current usage against allocated limits.</p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={loading}>
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" /> {loading ? 'Saving...' : 'Save Limits'}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" /> Edit Limits
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderLimitCard('Products', 'max_products', usage?.products || 0)}
        {renderLimitCard('Active Coupons', 'max_coupons', usage?.coupons || 0)}
        {renderLimitCard('Total Orders', 'max_orders', usage?.orders || 0)}
        {renderLimitCard('Storage Space', 'max_storage_mb', usage?.storage || 0, (v) => `${v} MB`)}
      </div>
    </div>
  );
};

export default UserLimitsManager;
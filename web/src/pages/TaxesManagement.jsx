import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';

const TaxesManagement = () => {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [formData, setFormData] = useState({
    tax_name: '', tax_percentage: '', tax_type: 'percentage', applicable_to: 'all_products', status: true
  });

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('taxes').getFullList({ sort: '-created', $autoCancel: false });
      setTaxes(records);
    } catch (error) {
      toast.error('Failed to load taxes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTaxes(); }, []);

  const handleOpenModal = (tax = null) => {
    if (tax) {
      setEditingTax(tax);
      setFormData({
        tax_name: tax.tax_name,
        tax_percentage: tax.tax_percentage,
        tax_type: tax.tax_type,
        applicable_to: tax.applicable_to,
        status: tax.status !== false
      });
    } else {
      setEditingTax(null);
      setFormData({ tax_name: '', tax_percentage: '', tax_type: 'percentage', applicable_to: 'all_products', status: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTax) {
        await pb.collection('taxes').update(editingTax.id, formData, { $autoCancel: false });
        toast.success('Tax updated');
      } else {
        await pb.collection('taxes').create(formData, { $autoCancel: false });
        toast.success('Tax created');
      }
      setIsModalOpen(false);
      fetchTaxes();
    } catch (error) {
      toast.error(error.message || 'Failed to save tax');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tax rule?')) {
      try {
        await pb.collection('taxes').delete(id, { $autoCancel: false });
        toast.success('Tax deleted');
        fetchTaxes();
      } catch (error) {
        toast.error('Failed to delete tax');
      }
    }
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Taxes - Admin</title></Helmet>
      
      <div className="flex justify-between items-center">
        <h1 className="admin-page-title mb-0">Tax Management</h1>
        <Button onClick={() => handleOpenModal()}><Plus className="w-4 h-4 mr-2" /> Add Tax Rule</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="admin-table-container border-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Value</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Applies To</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
                ) : taxes.length === 0 ? (
                  <tr><td colSpan="6" className="p-4 text-center text-muted-foreground">No tax rules found</td></tr>
                ) : (
                  taxes.map(tax => (
                    <tr key={tax.id} className="border-t">
                      <td className="p-4 font-medium">{tax.tax_name}</td>
                      <td className="p-4">{tax.tax_percentage}{tax.tax_type === 'percentage' ? '%' : ' (Fixed)'}</td>
                      <td className="p-4 capitalize">{tax.tax_type.replace('_', ' ')}</td>
                      <td className="p-4 capitalize">{tax.applicable_to.replace('_', ' ')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${tax.status !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {tax.status !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(tax)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(tax.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTax ? 'Edit Tax Rule' : 'Add New Tax Rule'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Tax Name *</Label>
              <Input required placeholder="e.g., GST 18%" value={formData.tax_name} onChange={e => setFormData({...formData, tax_name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input type="number" step="0.01" required value={formData.tax_percentage} onChange={e => setFormData({...formData, tax_percentage: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.tax_type} 
                  onChange={e => setFormData({...formData, tax_type: e.target.value})}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_amount">Fixed Amount</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Applies To</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.applicable_to} 
                onChange={e => setFormData({...formData, applicable_to: e.target.value})}
              >
                <option value="all_products">All Products</option>
                <option value="specific_categories">Specific Categories</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value === 'true'})}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Tax Rule</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaxesManagement;
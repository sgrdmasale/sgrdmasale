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
import BulkEditCategoriesModal from '@/components/BulkEditCategoriesModal.jsx';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  const [formData, setFormData] = useState({ name: '', description: '', status: true });
  const [imageFile, setImageFile] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('categories').getFullList({ sort: 'name', $autoCancel: false });
      setCategories(records);
      setSelectedCategories([]);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, description: category.description || '', status: category.status !== false });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', status: true });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (imageFile) data.append('category_image', imageFile);

      if (editingCategory) {
        await pb.collection('categories').update(editingCategory.id, data, { $autoCancel: false });
        toast.success('Category updated');
      } else {
        await pb.collection('categories').create(data, { $autoCancel: false });
        toast.success('Category created');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await pb.collection('categories').delete(id, { $autoCancel: false });
        toast.success('Category deleted');
        fetchCategories();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Categories - Admin</title></Helmet>
      
      <div className="flex justify-between items-center">
        <h1 className="admin-page-title mb-0">Categories Management</h1>
        <div className="flex gap-2">
          {selectedCategories.length > 0 && (
            <Button variant="secondary" onClick={() => setBulkModalOpen(true)}>
              Bulk Edit ({selectedCategories.length})
            </Button>
          )}
          <Button onClick={() => handleOpenModal()}><Plus className="w-4 h-4 mr-2" /> Add Category</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="admin-table-container border-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300"
                      checked={categories.length > 0 && selectedCategories.length === categories.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan="5" className="p-4 text-center text-muted-foreground">No categories found</td></tr>
                ) : (
                  categories.map(cat => (
                    <tr key={cat.id} className={`border-t ${selectedCategories.includes(cat.id) ? 'bg-primary/5' : ''}`}>
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300"
                          checked={selectedCategories.includes(cat.id)}
                          onChange={() => toggleSelect(cat.id)}
                        />
                      </td>
                      <td className="p-4 font-medium">{cat.name}</td>
                      <td className="p-4 text-muted-foreground truncate max-w-xs">{cat.description}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${cat.status !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {cat.status !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(cat)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(cat.id)}>
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
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
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
            <div className="space-y-2">
              <Label>Category Image (Max 20MB)</Label>
              <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Category</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BulkEditCategoriesModal 
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        selectedIds={selectedCategories}
        onSuccess={fetchCategories}
      />
    </div>
  );
};

export default CategoriesManagement;
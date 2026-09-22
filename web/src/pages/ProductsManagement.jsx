import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, ArrowUpDown, RotateCcw, AlertCircle, Image as ImageIcon } from 'lucide-react';
import BulkEditProductsModal from '@/components/BulkEditProductsModal.jsx';
import ProductImageManager from '@/components/ProductImageManager.jsx';

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'deleted'
  const [sortConfig, setSortConfig] = useState({ key: 'created', direction: 'desc' });

  // Modals & Selection
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', stock_quantity: '', sku: '', status: true, tax_type: 'none', item_weight: '', net_weight: ''
  });
  
  // Image Manager State
  const [imageData, setImageData] = useState({
    newFiles: [],
    orderedImages: [],
    primaryIndex: 0,
    deletedServerImages: []
  });

  const fetchCategories = async () => {
    try {
      const cats = await pb.collection('categories').getFullList({ sort: 'name', $autoCancel: false });
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let filterArr = [];
      
      // 1. View Mode Filter (Active vs Deleted)
      filterArr.push(viewMode === 'active' ? '(isDeleted = false || isDeleted = null)' : 'isDeleted = true');
      
      // 2. Category Filter
      if (selectedCategory !== 'all') {
        filterArr.push(`category_id='${selectedCategory}'`);
      }
      
      // 3. Status Filter (Active/Inactive toggle)
      if (selectedStatus !== 'all') {
        filterArr.push(`status=${selectedStatus}`);
      }
      
      // 4. Search Filter
      if (searchTerm) {
        filterArr.push(`(name ~ "${searchTerm}" || sku ~ "${searchTerm}")`);
      }

      const filterString = filterArr.join(' && ');
      
      let sortString = sortConfig.direction === 'asc' ? sortConfig.key : `-${sortConfig.key}`;
      if (sortConfig.key === 'tax_type') sortString = '-created'; 

      const prods = await pb.collection('products').getFullList({ 
        filter: filterString,
        sort: sortString,
        $autoCancel: false 
      });
      
      setProducts(prods);
      setSelectedProducts([]);
    } catch (error) {
      toast.error('Failed to load products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCategory, selectedStatus, viewMode, sortConfig]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category,
        stock_quantity: product.stock_quantity,
        sku: product.sku || '',
        status: product.status !== false,
        tax_type: product.tax_type || 'none',
        item_weight: product.item_weight || '',
        net_weight: product.net_weight || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', category: '', stock_quantity: '', sku: '', status: true, tax_type: 'none', item_weight: '', net_weight: '' });
    }
    
    // Reset image data
    setImageData({
      newFiles: [],
      orderedImages: [],
      primaryIndex: 0,
      deletedServerImages: []
    });
    
    setIsModalOpen(true);
  };

  const handleImagesChange = useCallback((data) => {
    setImageData(data);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key !== 'status') data.append(key, formData[key]);
      });
      data.append('status', formData.status);
      
      const selectedCat = categories.find(c => c.name === formData.category);
      if (selectedCat) {
        data.append('category_id', selectedCat.id);
      }

      // Handle Images
      if (imageData.newFiles.length > 0) {
        imageData.newFiles.forEach(file => {
          data.append('images', file);
        });
      }

      // Handle image ordering and primary index
      data.append('primary_image_index', imageData.primaryIndex);
      
      const orderArray = imageData.orderedImages.map(img => img.id);
      data.append('images_order', JSON.stringify(orderArray));

      if (editingProduct) {
        await pb.collection('products').update(editingProduct.id, data, { $autoCancel: false });
        toast.success('Product updated');
      } else {
        data.append('isDeleted', 'false');
        await pb.collection('products').create(data, { $autoCancel: false });
        toast.success('Product created');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product? It will be moved to the Deleted tab.')) {
      try {
        await pb.collection('products').update(id, { isDeleted: true }, { $autoCancel: false });
        toast.success('Product moved to deleted');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const handleRestore = async (id) => {
    try {
      await pb.collection('products').update(id, { isDeleted: false }, { $autoCancel: false });
      toast.success('Product restored successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to restore product');
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getTaxPercentage = (taxType) => {
    if (!taxType || taxType === 'none') return 0;
    return parseInt(taxType.replace('%', ''), 10) || 0;
  };

  const currentPrice = parseFloat(formData.price) || 0;
  const currentTaxPct = getTaxPercentage(formData.tax_type);
  const taxAmount = currentPrice * (currentTaxPct / 100);

  // Helper to get primary image for table display
  const getPrimaryImage = (product) => {
    if (product.images && product.images.length > 0) {
      let imgToUse = product.images[0];
      
      if (product.primary_image_index !== undefined && 
          product.primary_image_index >= 0 && 
          product.primary_image_index < product.images.length) {
        
        if (product.images_order && Array.isArray(product.images_order) && product.images_order.length > 0) {
           const primaryId = product.images_order[product.primary_image_index];
           const found = product.images.find(img => img === primaryId || img.includes(primaryId));
           if (found) imgToUse = found;
        } else {
          imgToUse = product.images[product.primary_image_index];
        }
      }
      return pb.files.getUrl(product, imgToUse, { thumb: '100x100' });
    }
    if (product.photos && product.photos.length > 0) {
      return pb.files.getUrl(product, product.photos[0], { thumb: '100x100' });
    }
    if (product.image) {
      return pb.files.getUrl(product, product.image, { thumb: '100x100' });
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Products - Admin</title></Helmet>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="admin-page-title mb-0">Products Management</h1>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && viewMode === 'active' && (
            <Button variant="secondary" onClick={() => setBulkModalOpen(true)}>
              Bulk Edit ({selectedProducts.length})
            </Button>
          )}
          <Button onClick={() => handleOpenModal()}><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <Tabs value={viewMode} onValueChange={setViewMode} className="w-full sm:w-auto mb-6">
            <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
              <TabsTrigger value="active">Active Products</TabsTrigger>
              <TabsTrigger value="deleted">Deleted Products</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search products by name or SKU..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="true">Active Only</SelectItem>
                  <SelectItem value="false">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300"
                      checked={products.length > 0 && selectedProducts.length === products.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-3 font-medium cursor-pointer hover:bg-muted/80" onClick={() => handleSort('name')}>
                    Name <ArrowUpDown className="w-3 h-3 inline ml-1 text-muted-foreground" />
                  </th>
                  <th className="p-3 font-medium cursor-pointer hover:bg-muted/80" onClick={() => handleSort('category')}>
                    Category <ArrowUpDown className="w-3 h-3 inline ml-1 text-muted-foreground" />
                  </th>
                  <th className="p-3 font-medium cursor-pointer hover:bg-muted/80" onClick={() => handleSort('price')}>
                    Price <ArrowUpDown className="w-3 h-3 inline ml-1 text-muted-foreground" />
                  </th>
                  <th className="p-3 font-medium cursor-pointer hover:bg-muted/80" onClick={() => handleSort('tax_type')}>
                    Tax Rate <ArrowUpDown className="w-3 h-3 inline ml-1 text-muted-foreground" />
                  </th>
                  <th className="p-3 font-medium cursor-pointer hover:bg-muted/80" onClick={() => handleSort('stock_quantity')}>
                    Stock <ArrowUpDown className="w-3 h-3 inline ml-1 text-muted-foreground" />
                  </th>
                  <th className="p-3 font-medium cursor-pointer hover:bg-muted/80" onClick={() => handleSort('status')}>
                    Status <ArrowUpDown className="w-3 h-3 inline ml-1 text-muted-foreground" />
                  </th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="p-4 text-center">Loading...</td></tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                        <p>No products match the selected filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map(product => {
                    const primaryImgUrl = getPrimaryImage(product);
                    
                    return (
                      <tr key={product.id} className={`border-t ${selectedProducts.includes(product.id) ? 'bg-primary/5' : ''} ${product.isDeleted ? 'opacity-60 bg-muted/30' : ''}`}>
                        <td className="p-3">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleSelect(product.id)}
                          />
                        </td>
                        <td className="p-3 font-medium">
                          <div className="flex items-center gap-3">
                            {primaryImgUrl ? (
                              <img 
                                src={primaryImgUrl} 
                                alt={product.name}
                                className="w-10 h-10 rounded-md object-cover border bg-background"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md border bg-muted flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                              </div>
                            )}
                            <div>
                              <span className={product.isDeleted ? 'line-through text-muted-foreground' : ''}>
                                {product.name}
                              </span>
                              {product.isDeleted && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive uppercase tracking-wider">
                                  Deleted
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">{product.category}</td>
                        <td className="p-3">₹{product.price}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground`}>
                            {product.tax_type === 'none' || !product.tax_type ? 'No Tax' : product.tax_type}
                          </span>
                        </td>
                        <td className="p-3">{product.stock_quantity}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${product.status !== false ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                            {product.status !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {viewMode === 'active' ? (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenModal(product)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" className="text-primary hover:text-primary" onClick={() => handleRestore(product.id)}>
                              <RotateCcw className="w-4 h-4 mr-2" /> Restore
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (₹) *</Label>
                    <Input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tax Rate</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.tax_type} 
                      onChange={e => setFormData({...formData, tax_type: e.target.value})}
                    >
                      <option value="none">None</option>
                      <option value="5%">5%</option>
                      <option value="12%">12%</option>
                      <option value="18%">18%</option>
                    </select>
                    {currentTaxPct > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tax Amount: ₹{taxAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item Weight (e.g., 500g)</Label>
                    <Input value={formData.item_weight} onChange={e => setFormData({...formData, item_weight: e.target.value})} placeholder="e.g., 500g, 1kg" />
                  </div>
                  <div className="space-y-2">
                    <Label>Net Weight (e.g., 600g)</Label>
                    <Input value={formData.net_weight} onChange={e => setFormData({...formData, net_weight: e.target.value})} placeholder="e.g., 600g, 1.2kg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stock Quantity *</Label>
                    <Input type="number" required value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.status.toString()} 
                      onChange={e => setFormData({...formData, status: e.target.value === 'true'})}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea 
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-base">Product Images</Label>
                <ProductImageManager 
                  existingImages={editingProduct?.images || editingProduct?.photos || (editingProduct?.image ? [editingProduct.image] : [])}
                  existingOrder={editingProduct?.images_order || []}
                  existingPrimaryIndex={editingProduct?.primary_image_index || 0}
                  onImagesChange={handleImagesChange}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Product</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BulkEditProductsModal 
        isOpen={bulkModalOpen} 
        onClose={() => setBulkModalOpen(false)} 
        selectedIds={selectedProducts} 
        onSuccess={fetchProducts} 
      />
    </div>
  );
};

export default ProductsManagement;
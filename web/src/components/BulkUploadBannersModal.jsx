import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { UploadCloud, X, CheckCircle2, AlertCircle, FileImage as ImageIcon, Trash2, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import pb from '@/lib/pocketbaseClient';

const VALID_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const BulkUploadBannersModal = ({ isOpen, onOpenChange, onSuccess }) => {
  const [files, setFiles] = useState([]);
  const [products, setProducts] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // Fetch products for the dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const records = await pb.collection('products').getFullList({
          sort: 'name',
          fields: 'id,name',
          $autoCancel: false
        });
        setProducts(records);
      } catch (error) {
        console.error('Error fetching products for banner linking:', error);
      }
    };
    
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, [files]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateAndAddFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter(file => {
      if (!VALID_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid image. Allowed: JPG, PNG, GIF, WEBP.`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    }).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending', // pending, uploading, success, error
      errorMsg: '',
      productId: 'none' // 'none' represents no product linked
    }));

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeFile = (id) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const updateFileProduct = (id, productId) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, productId } : f
    ));
  };

  const clearSelection = () => {
    files.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    setOverallProgress(0);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    const filesToUpload = files.filter(f => f.status === 'pending' || f.status === 'error');
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setOverallProgress(0);
    
    let successCount = 0;
    let failCount = 0;

    try {
      // Get max display_order to auto-calculate sequence
      const existingBanners = await pb.collection('banners').getFullList({
        sort: '-display_order',
        limit: 1,
        $autoCancel: false
      });
      
      let nextOrder = existingBanners.length > 0 ? existingBanners[0].display_order + 1 : 1;

      for (let i = 0; i < files.length; i++) {
        if (files[i].status === 'success') {
          successCount++;
          continue; // Skip already uploaded
        }

        // Update status to uploading
        setFiles(prev => prev.map((f, index) => 
          index === i ? { ...f, status: 'uploading' } : f
        ));

        try {
          const formData = new FormData();
          formData.append('image', files[i].file);
          // Use filename without extension as title
          formData.append('title', files[i].file.name.replace(/\.[^/.]+$/, ""));
          formData.append('display_order', nextOrder++);
          formData.append('is_active', true);
          
          if (files[i].productId && files[i].productId !== 'none') {
            formData.append('product_id', files[i].productId);
          }

          await pb.collection('banners').create(formData, { $autoCancel: false });
          
          successCount++;
          setFiles(prev => prev.map((f, index) => 
            index === i ? { ...f, status: 'success', errorMsg: '' } : f
          ));
        } catch (error) {
          console.error(`Error uploading ${files[i].file.name}:`, error);
          failCount++;
          setFiles(prev => prev.map((f, index) => 
            index === i ? { ...f, status: 'error', errorMsg: error.message || 'Upload failed' } : f
          ));
        }

        // Update overall progress
        setOverallProgress(Math.round(((i + 1) / files.length) * 100));
      }

      if (failCount === 0) {
        toast({
          title: "Upload Complete",
          description: `Successfully uploaded ${successCount} banner${successCount !== 1 ? 's' : ''}.`,
        });
        setTimeout(() => {
          onOpenChange(false);
          clearSelection();
          if (onSuccess) onSuccess();
        }, 1000);
      } else {
        toast({
          title: "Upload Finished with Errors",
          description: `${successCount} succeeded, ${failCount} failed. Check the list to retry.`,
          variant: "destructive"
        });
        if (successCount > 0 && onSuccess) {
          onSuccess(); // Refresh list to show partial successes
        }
      }
    } catch (error) {
      toast({
        title: "Upload Process Failed",
        description: "A critical error occurred while initializing the upload process.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'uploading': return <RefreshCw className="w-5 h-5 text-primary animate-spin" />;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isUploading && onOpenChange(open)}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Bulk Upload Banners</DialogTitle>
          <DialogDescription>
            Drag and drop multiple images to upload them as banners. You can optionally link each banner to a specific product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4 flex-1 overflow-hidden flex flex-col">
          {/* Dropzone */}
          <div 
            className={`shrink-0 border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
              isDragging 
                ? 'border-primary bg-primary/5 scale-[1.02]' 
                : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              accept={VALID_TYPES.join(',')}
              onChange={handleFileSelect}
            />
            <div className="w-14 h-14 bg-background shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-3 text-primary">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold mb-1">Click or drag images here</h3>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, GIF, WEBP up to 20MB per file.
            </p>
          </div>

          {/* Progress Tracking */}
          {isUploading && (
            <div className="shrink-0 space-y-2 bg-muted/30 p-4 rounded-xl border">
              <div className="flex justify-between text-sm font-medium">
                <span>Uploading files...</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[200px]">
              <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm pb-2 z-10 pt-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {files.length} File{files.length !== 1 ? 's' : ''} Selected
                </span>
                {!isUploading && (
                  <Button variant="ghost" size="sm" onClick={clearSelection} className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Selection
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {files.map((f) => (
                  <div 
                    key={f.id} 
                    className={`flex flex-col sm:flex-row sm:items-center gap-4 p-3 border rounded-xl bg-card transition-colors relative overflow-hidden ${
                      f.status === 'error' ? 'border-destructive/50 bg-destructive/5' : ''
                    }`}
                  >
                    {/* Status Background Overlay */}
                    {f.status === 'success' && (
                      <div className="absolute inset-0 bg-success/5 pointer-events-none"></div>
                    )}
                    
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative w-16 h-12 bg-muted rounded-lg overflow-hidden shrink-0 border">
                        {f.preview ? (
                          <img src={f.preview} alt={f.file.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={f.file.name}>
                          {f.file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {formatSize(f.file.size)}
                          </span>
                          {f.status === 'error' && (
                            <span className="text-xs text-destructive truncate flex-1">
                              • {f.errorMsg}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:w-[240px] shrink-0">
                      <div className="flex-1">
                        <Select 
                          disabled={isUploading || f.status === 'success'} 
                          value={f.productId} 
                          onValueChange={(val) => updateFileProduct(f.id, val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <LinkIcon className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {f.productId === 'none' ? 'No product link' : products.find(p => p.id === f.productId)?.name || 'Select product...'}
                              </span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-muted-foreground italic">No product link</SelectItem>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="shrink-0 flex items-center justify-end w-8">
                        {getStatusIcon(f.status)}
                        {!isUploading && f.status !== 'success' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                            onClick={() => removeFile(f.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="shrink-0 flex justify-end gap-3 pt-4 border-t mt-auto">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || files.length === 0 || files.every(f => f.status === 'success')}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  {files.some(f => f.status === 'error') ? 'Retry Failed' : 'Upload Files'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadBannersModal;
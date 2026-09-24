import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient.js';

const ProductImageManager = ({ 
  existingImages = [], 
  existingOrder = [], 
  existingPrimaryIndex = 0,
  onImagesChange,
  maxImages = 20,
  maxSizeMB = 20
}) => {
  // State for new files to upload
  const [newFiles, setNewFiles] = useState([]);
  // State for existing images from server
  const [serverImages, setServerImages] = useState(existingImages || []);
  // Combined ordered list of images (mix of server IDs and local file objects)
  const [orderedImages, setOrderedImages] = useState([]);
  const [primaryIndex, setPrimaryIndex] = useState(existingPrimaryIndex || 0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize ordered images
  useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      let initialOrder = [];
      
      // If we have a saved order, use it
      if (existingOrder && existingOrder.length > 0) {
        // Map the saved order to the actual image filenames
        initialOrder = existingOrder.map(id => {
          const img = existingImages.find(img => img === id || img.includes(id));
          return img ? { type: 'server', id: img, url: pb.files.getUrl({ collectionId: 'pbc_9751530902', id: 'dummy' }, img, { thumb: '100x100' }) } : null;
        }).filter(Boolean);
        
        // Add any images that aren't in the order array
        const orderedIds = initialOrder.map(item => item.id);
        const missingImages = existingImages.filter(img => !orderedIds.includes(img));
        
        missingImages.forEach(img => {
          initialOrder.push({ type: 'server', id: img, url: pb.files.getUrl({ collectionId: 'pbc_9751530902', id: 'dummy' }, img, { thumb: '100x100' }) });
        });
      } else {
        // No order saved, just use the array as is
        initialOrder = existingImages.map(img => ({ 
          type: 'server', 
          id: img, 
          url: pb.files.getUrl({ collectionId: 'pbc_9751530902', id: 'dummy' }, img, { thumb: '100x100' }) 
        }));
      }
      
      setOrderedImages(initialOrder);
      setServerImages(existingImages);
      setPrimaryIndex(existingPrimaryIndex || 0);
    }
  }, [existingImages, existingOrder, existingPrimaryIndex]);

  // Notify parent of changes
  useEffect(() => {
    onImagesChange({
      newFiles: newFiles.map(f => f.file),
      orderedImages: orderedImages,
      primaryIndex,
      deletedServerImages: serverImages.filter(img => !orderedImages.find(o => o.type === 'server' && o.id === img))
    });
  }, [newFiles, orderedImages, primaryIndex, serverImages, onImagesChange]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFiles = (files) => {
    const validFiles = [];
    const currentTotal = orderedImages.length;
    
    if (currentTotal + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images in total.`);
      return [];
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`);
        continue;
      }
      
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${file.name} exceeds the ${maxSizeMB}MB size limit.`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    return validFiles;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (files) => {
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    const newFileObjects = validFiles.map(file => ({
      type: 'local',
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      url: URL.createObjectURL(file)
    }));

    setNewFiles(prev => [...prev, ...newFileObjects]);
    setOrderedImages(prev => [...prev, ...newFileObjects]);
  };

  const removeImage = (indexToRemove) => {
    const imageToRemove = orderedImages[indexToRemove];
    
    // If it's a local file, revoke the object URL to prevent memory leaks
    if (imageToRemove.type === 'local') {
      URL.revokeObjectURL(imageToRemove.url);
      setNewFiles(prev => prev.filter(f => f.id !== imageToRemove.id));
    }
    
    setOrderedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    
    // Adjust primary index if needed
    if (primaryIndex === indexToRemove) {
      setPrimaryIndex(0);
    } else if (primaryIndex > indexToRemove) {
      setPrimaryIndex(primaryIndex - 1);
    }
  };

  const setAsPrimary = (index) => {
    setPrimaryIndex(index);
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      newFiles.forEach(f => URL.revokeObjectURL(f.url));
    };
  }, []);

  return (
    <div className="space-y-4">
      <div 
        className={`image-dropzone ${isDragging ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInput} 
          className="hidden" 
          multiple 
          accept="image/jpeg,image/png,image/gif,image/webp" 
        />
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <UploadCloud className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Click to upload or drag and drop</p>
          <p className="text-sm text-muted-foreground mt-1">SVG, PNG, JPG or GIF (max. {maxSizeMB}MB)</p>
        </div>
        <p className="text-xs font-medium text-muted-foreground mt-2">
          {orderedImages.length} / {maxImages} images uploaded
        </p>
      </div>

      {orderedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {orderedImages.map((image, index) => (
            <div 
              key={image.id} 
              className={`image-grid-item ${index === primaryIndex ? 'primary' : ''}`}
            >
              <img 
                src={image.url} 
                alt={`Product image ${index + 1}`} 
                className="w-full h-full object-cover"
              />
              
              {index === primaryIndex && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Primary
                </div>
              )}
              
              <div className="image-grid-item-overlay">
                <div className="flex justify-end">
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="h-7 w-7 rounded-full opacity-90 hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                
                <div className="flex justify-center bg-background/90 backdrop-blur-sm p-1.5 rounded-lg">
                  {index !== primaryIndex && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-7 px-3 text-xs font-semibold rounded-md"
                      onClick={(e) => { e.stopPropagation(); setAsPrimary(index); }}
                    >
                      <Star className="w-3.5 h-3.5 mr-1.5" /> Set as primary
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageManager;

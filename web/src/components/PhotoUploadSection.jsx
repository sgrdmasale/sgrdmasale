import React, { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import pb from '@/lib/pocketbaseClient.js';

const PhotoUploadSection = ({ 
  newPhotos, 
  setNewPhotos, 
  existingPhotos = [], 
  setExistingPhotos, 
  productRecord = null 
}) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const totalPhotosCount = existingPhotos.length + newPhotos.length;
  const isOverLimit = totalPhotosCount > 10;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(file => 
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
    );
    
    if (validFiles.length + totalPhotosCount > 10) {
      alert("You can only upload a maximum of 10 photos in total.");
      const allowedCount = 10 - totalPhotosCount;
      setNewPhotos(prev => [...prev, ...validFiles.slice(0, allowedCount)]);
    } else {
      setNewPhotos(prev => [...prev, ...validFiles]);
    }
  };

  const removeNewPhoto = (index) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (filename) => {
    setExistingPhotos(prev => prev.filter(name => name !== filename));
  };

  return (
    <div className="space-y-4">
      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium">Drag & drop your photos here</p>
            <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, GIF, WEBP up to 20MB (optional)</p>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
          >
            Browse Files
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Uploaded Photos ({totalPhotosCount}/10)</span>
        {isOverLimit && (
          <span className="text-destructive text-xs font-medium">
            Maximum 10 photos allowed
          </span>
        )}
      </div>

      {totalPhotosCount > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {/* Existing Photos (if editing) */}
          {existingPhotos.map((filename, index) => (
            <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden border group bg-muted">
              <img 
                src={productRecord ? pb.files.getUrl(productRecord, filename, { thumb: '100x100' }) : ''} 
                alt={`Product photo ${index + 1}`} 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeExistingPhoto(filename)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                Saved
              </div>
            </div>
          ))}

          {/* New Photos */}
          {newPhotos.map((file, index) => (
            <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border group bg-muted">
              <img 
                src={URL.createObjectURL(file)} 
                alt={`New upload ${index + 1}`} 
                className="w-full h-full object-cover"
                onLoad={(e) => URL.revokeObjectURL(e.target.src)}
              />
              <button
                type="button"
                onClick={() => removeNewPhoto(index)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-primary text-primary-foreground text-[10px] text-center py-0.5">
                New
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoUploadSection;
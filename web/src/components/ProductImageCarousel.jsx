import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';

const ProductImageCarousel = ({ product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const images = product.images || product.photos || [];
  
  let primaryImageUrl = 'https://images.unsplash.com/photo-1596040033229-a0b3b7d1f4f8';
  
  if (images.length > 0) {
    let imgToUse = images[0];
    
    if (product.primary_image_index !== undefined && 
        product.primary_image_index >= 0 && 
        product.primary_image_index < images.length) {
      
      if (product.images_order && Array.isArray(product.images_order) && product.images_order.length > 0) {
        const primaryId = product.images_order[product.primary_image_index];
        const found = images.find(img => img === primaryId || img.includes(primaryId));
        if (found) imgToUse = found;
      } else {
        imgToUse = images[product.primary_image_index];
      }
    }
    primaryImageUrl = pb.files.getUrl(product, imgToUse, { thumb: '800x800' });
  } else if (product.image) {
    primaryImageUrl = pb.files.getUrl(product, product.image, { thumb: '800x800' });
  }

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  const currentImage = images.length > 0 
    ? pb.files.getUrl(product, images[currentImageIndex], { thumb: '800x800' })
    : primaryImageUrl;

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-muted aspect-square border border-border shadow-sm group">
        <img
          src={currentImage}
          alt=""
          className={`w-full h-full object-cover transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={() => setIsZoomed(!isZoomed)}
        />
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        
        {images.length > 1 && (
          <>
            <Button
              onClick={handlePrevious}
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ChevronLeft size={20} />
            </Button>
            <Button
              onClick={handleNext}
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ChevronRight size={20} />
            </Button>
          </>
        )}

        <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm text-foreground px-3 py-2 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5">
          <ZoomIn size={14} /> Click to zoom
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => {
            const thumbUrl = pb.files.getUrl(product, image, { thumb: '100x100' });
            return (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  currentImageIndex === index
                    ? 'border-primary ring-2 ring-primary/20 ring-offset-1'
                    : 'border-border hover:border-primary/50 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={thumbUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductImageCarousel;
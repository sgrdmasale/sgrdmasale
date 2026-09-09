import React, { useState } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { cn } from '@/lib/utils.js';

const PhotoGallery = ({ product }) => {
  // Combine legacy 'image' field with new 'photos' array if available
  const allPhotos = [];
  
  if (product?.photos && product.photos.length > 0) {
    allPhotos.push(...product.photos);
  } else if (product?.image) {
    allPhotos.push(product.image);
  }

  const [activeIndex, setActiveIndex] = useState(0);
  const [transformOrigin, setTransformOrigin] = useState('center center');

  if (allPhotos.length === 0) {
    return (
      <div className="gallery-main-view flex items-center justify-center bg-muted">
        <span className="text-muted-foreground">No photos available</span>
      </div>
    );
  }

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setTransformOrigin(`${x}% ${y}%`);
  };

  const activePhotoUrl = pb.files.getUrl(product, allPhotos[activeIndex]);

  return (
    <div className="flex flex-col space-y-4">
      {/* Main Image with Zoom */}
      <div className="gallery-main-view">
        <img
          src={activePhotoUrl}
          alt={`${product?.name} view ${activeIndex + 1}`}
          className="gallery-zoom-image"
          style={{ transformOrigin }}
          onMouseMove={handleMouseMove}
        />
      </div>

      {/* Thumbnails */}
      {allPhotos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
          {allPhotos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all snap-start",
                activeIndex === index 
                  ? "border-primary shadow-sm" 
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img
                src={pb.files.getUrl(product, photo, { thumb: '100x100' })}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
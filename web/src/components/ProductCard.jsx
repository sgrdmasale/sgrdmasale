import React from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useOfferPrice } from '@/hooks/useOfferPrice.js';
import { Scale } from 'lucide-react';

const ProductCard = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const { salePrice, isOnSale, loading } = useOfferPrice(product.id, product.price);

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    onAddToCart(product, isOnSale ? salePrice : product.price);
  };

  // Get primary image
  let primaryImageUrl = 'https://images.unsplash.com/photo-1596040033229-a0b3b7d1f4f8';
  
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
    primaryImageUrl = pb.files.getUrl(product, imgToUse, { thumb: '500x500' });
  } else if (product.photos && product.photos.length > 0) {
    primaryImageUrl = pb.files.getUrl(product, product.photos[0], { thumb: '500x500' });
  } else if (product.image) {
    primaryImageUrl = pb.files.getUrl(product, product.image, { thumb: '500x500' });
  }

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full relative cursor-pointer border-border/50 bg-card text-card-foreground" 
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden aspect-[4/3] bg-muted shrink-0">
        <img
          src={primaryImageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>
      
      <CardContent className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            {isOnSale && !loading ? (
              <>
                <span className="text-xs font-medium text-muted-foreground line-through">₹{product.price}</span>
                <span className="text-xl font-extrabold text-primary">₹{salePrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-xl font-extrabold text-foreground">₹{product.price}</span>
            )}
          </div>
          <span className="text-xs font-semibold tracking-wide px-2.5 py-1 bg-muted rounded-md text-muted-foreground truncate max-w-[120px]">
            {product.expand?.category_id?.name || product.category}
          </span>
        </div>

        {(product.item_weight || product.net_weight) ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/40 w-fit px-2 py-1 rounded-md">
            <Scale className="w-3 h-3" />
            {product.item_weight && <span>Item: {product.item_weight}</span>}
            {product.item_weight && product.net_weight && <span className="mx-1 opacity-50">|</span>}
            {product.net_weight && <span>Net: {product.net_weight}</span>}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground/60 italic">Weight not specified</div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1 mt-1">
          {product.description}
        </p>
        
        <div className="mt-auto flex flex-col gap-4 pt-2">
          <h3 className="font-bold text-lg line-clamp-2 text-foreground leading-snug">
            {product.name}
          </h3>
          <Button
            className="w-full font-semibold shadow-sm hover:shadow transition-all active:scale-[0.98]"
            onClick={handleAddToCartClick}
            disabled={product.stock_quantity === 0}
            variant={product.stock_quantity === 0 ? "secondary" : "default"}
          >
            {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
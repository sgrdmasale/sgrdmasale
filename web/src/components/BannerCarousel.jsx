import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import AutoScroll from 'embla-carousel-auto-scroll';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem
} from '@/components/ui/carousel.jsx';

const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Setup Embla AutoScroll plugin for continuous, smooth, linear movement
  const autoScrollPlugin = useRef(
    AutoScroll({ 
      playOnInit: true, 
      speed: 1.5, // Slow, gradual continuous scroll
      stopOnInteraction: false, 
      stopOnMouseEnter: false, // We will handle hover manually
      direction: 'forward'
    })
  );

  useEffect(() => {
    const fetchBanners = async () => {
      console.log('[BannerCarousel] Starting to fetch banners...');
      try {
        const result = await pb.collection('banners').getList(1, 50, {
          filter: 'is_active = true',
          sort: 'display_order',
          $autoCancel: false
        });
        
        console.log('[BannerCarousel] Successfully fetched banner records:', result.items);

        const processedBanners = result.items.map(record => {
          const url = pb.files.getUrl(record, record.image);
          // Handle product_id whether it's a single string or an array
          let productId = null;
          if (record.product_id) {
            productId = Array.isArray(record.product_id) ? record.product_id[0] : record.product_id;
          }
          
          return {
            id: record.id,
            url,
            productId,
            title: record.title
          };
        });

        if (processedBanners.length > 0) {
          setBanners(processedBanners);
        } else {
          console.log('[BannerCarousel] No active banners found in the collection.');
        }
      } catch (err) {
        console.error('[BannerCarousel] Error fetching banner images:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const handleBannerClick = (productId) => {
    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  const handleMouseEnter = () => {
    if (autoScrollPlugin.current) {
      autoScrollPlugin.current.stop();
    }
  };

  const handleMouseLeave = () => {
    if (autoScrollPlugin.current) {
      autoScrollPlugin.current.play();
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[350px] bg-muted/30 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse font-medium">Loading banners...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[350px] bg-destructive/10 flex items-center justify-center">
        <div className="text-destructive font-medium">Error loading banners: {error}</div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="w-full h-[350px] bg-muted/30 flex items-center justify-center">
        <div className="text-muted-foreground font-medium">No banners available</div>
      </div>
    );
  }

  // Embla requires enough slides to loop seamlessly. 
  // If we have too few banners, duplicate them to ensure the loop works perfectly.
  const displayBanners = banners.length > 0 && banners.length < 4 
    ? [...banners, ...banners, ...banners, ...banners].slice(0, Math.max(banners.length * 3, 6))
    : banners;

  return (
    <div 
      className="w-full relative bg-background py-4 overflow-hidden border-b border-border/50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Carousel
        plugins={[autoScrollPlugin.current]}
        opts={{
          align: "center",
          loop: true,
          dragFree: true, // Allows smooth arbitrary drag release
        }}
        className="w-full max-w-[100vw]"
      >
        <CarouselContent className="-ml-2 items-center">
          {displayBanners.map((banner, index) => (
            <CarouselItem 
              key={`${banner.id}-${index}`} 
              className="pl-2 basis-auto"
            >
              <div 
                className={`relative h-[250px] sm:h-[300px] md:h-[400px] lg:h-[450px] flex items-center justify-center ${banner.productId ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''}`}
                onClick={() => handleBannerClick(banner.productId)}
                role={banner.productId ? "button" : "img"}
                tabIndex={banner.productId ? 0 : undefined}
                onKeyDown={(e) => {
                  if (banner.productId && (e.key === 'Enter' || e.key === ' ')) {
                    handleBannerClick(banner.productId);
                  }
                }}
              >
                <img 
                  src={banner.url} 
                  alt={banner.title || `Banner ${index + 1}`}
                  className="h-full w-auto max-w-full object-contain block rounded-xl shadow-sm"
                  onError={(e) => {
                    console.error(`[BannerCarousel] Failed to load image at index ${index}:`, banner.url);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default BannerCarousel;
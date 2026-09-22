import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel.jsx';

const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // ---------------------------------------------------------
  // FETCH BANNERS
  // ---------------------------------------------------------

  useEffect(() => {
    const fetchBannersAPI = async () => {
      try {
        const result = await pb.collection('banners').getList(1, 50, {
          filter: 'is_active = true',
          sort: 'display_order',
          $autoCancel: false,
        });

        if (!result || typeof result !== 'object') {
          console.error(
            '[BannerCarousel] Invalid response:',
            result
          );

          return {
            data: [],
            error: 'Invalid API response format',
          };
        }

        const items = result.items;

        if (!Array.isArray(items)) {
          console.warn(
            '[BannerCarousel] Response missing items array:',
            result
          );

          return {
            data: [],
            error: null,
          };
        }

        return {
          data: items,
          error: null,
        };
      } catch (err) {
        console.error(
          '[BannerCarousel] API error:',
          err
        );

        return {
          data: [],
          error:
            err?.message ||
            'Failed to fetch banners',
        };
      }
    };

    const fetchBanners = async () => {
      console.log(
        '[BannerCarousel] Starting to fetch banners...'
      );

      const { data, error } =
        await fetchBannersAPI();

      if (error) {
        console.error(
          '[BannerCarousel] Error fetching banners:',
          error
        );

        setError(error);
        setLoading(false);

        return;
      }

      console.log(
        '[BannerCarousel] Successfully fetched banner records:',
        data
      );

      try {
        const processedBanners = (data || [])
          .map((record) => {
            if (!record || !record.image) {
              return null;
            }

            const url = pb.files.getUrl(
              record,
              record.image
            );

            // product_id can be string or array
            let productId = null;

            if (record.product_id) {
              productId = Array.isArray(
                record.product_id
              )
                ? record.product_id[0]
                : record.product_id;
            }

            return {
              id: record.id,
              url,
              productId,
              title: record.title || '',
            };
          })
          .filter(Boolean);

        if (processedBanners.length > 0) {
          setBanners(processedBanners);
        } else {
          console.log(
            '[BannerCarousel] No active banners found.'
          );
        }
      } catch (processingError) {
        console.error(
          '[BannerCarousel] Error processing banners:',
          processingError
        );

        setError('Failed to process banners');
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // ---------------------------------------------------------
  // BANNER CLICK
  // ---------------------------------------------------------

  const handleBannerClick = (productId) => {
    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="w-full h-[250px] sm:h-[300px] md:h-[400px] bg-muted/30 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse font-medium">
          Loading banners...
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (error) {
    return (
      <div className="w-full h-[250px] sm:h-[300px] md:h-[400px] bg-destructive/10 flex items-center justify-center px-4 text-center">
        <div className="text-destructive font-medium">
          Error loading banners: {error}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // NO BANNERS
  // ---------------------------------------------------------

  if (banners.length === 0) {
    return (
      <div className="w-full h-[250px] sm:h-[300px] md:h-[400px] bg-muted/30 flex items-center justify-center">
        <div className="text-muted-foreground font-medium">
          No banners available
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // CAROUSEL
  // ---------------------------------------------------------

  return (
    <div
      className="
        w-full
        relative
        bg-background
        py-2
        sm:py-3
        overflow-hidden
        border-b
        border-border/50
      "
    >
      <Carousel
        opts={{
          align: 'start',

          // Important:
          // Each swipe moves exactly one banner
          containScroll: 'trimSnaps',

          // Prevent free/infinite dragging
          dragFree: false,

          // Normal looping
          loop: banners.length > 1,

          // Enable autoplay
          autoplay: true,

          // One snap point per banner
          skipSnaps: false,
        }}
        className="w-full"
      >
        <CarouselContent
          className="
            -ml-0
            items-stretch
          "
        >
          {banners.map((banner, index) => (
            <CarouselItem
              key={banner.id || index}
              className="
                pl-0
                basis-full
                min-w-0
              "
            >
              <div
                className={`
                  relative
                  w-full
                  h-[210px]
                  sm:h-[280px]
                  md:h-[380px]
                  lg:h-[450px]

                  flex
                  items-center
                  justify-center

                  overflow-hidden

                  ${
                    banner.productId
                      ? 'cursor-pointer'
                      : ''
                  }
                `}
                onClick={() =>
                  handleBannerClick(
                    banner.productId
                  )
                }
                role={
                  banner.productId
                    ? 'button'
                    : 'img'
                }
                tabIndex={
                  banner.productId
                    ? 0
                    : undefined
                }
                onKeyDown={(e) => {
                  if (
                    banner.productId &&
                    (e.key === 'Enter' ||
                      e.key === ' ')
                  ) {
                    e.preventDefault();

                    handleBannerClick(
                      banner.productId
                    );
                  }
                }}
              >
                <img
                  src={banner.url}
                  alt={
                    banner.title ||
                    `Banner ${index + 1}`
                  }
                  className="
                    block
                    w-full
                    h-full
                    object-cover
                    object-center
                    select-none
                    rounded-none
                  "
                  draggable={false}
                  loading={
                    index === 0
                      ? 'eager'
                      : 'lazy'
                  }
                  onError={(e) => {
                    console.error(
                      `[BannerCarousel] Failed to load image at index ${index}:`,
                      banner.url
                    );

                    e.currentTarget.style.display =
                      'none';
                  }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* ---------------------------------------------------
            PREVIOUS BUTTON
            --------------------------------------------------- */}

        {banners.length > 1 && (
          <CarouselPrevious
            className="
              left-2
              sm:left-4

              w-8
              h-8
              sm:w-10
              sm:h-10

              bg-white/80
              hover:bg-white

              border-none

              shadow-md
            "
          />
        )}

        {/* ---------------------------------------------------
            NEXT BUTTON
            --------------------------------------------------- */}

        {banners.length > 1 && (
          <CarouselNext
            className="
              right-2
              sm:right-4

              w-8
              h-8
              sm:w-10
              sm:h-10

              bg-white/80
              hover:bg-white

              border-none

              shadow-md
            "
          />
        )}
      </Carousel>
    </div>
  );
};

export default BannerCarousel;
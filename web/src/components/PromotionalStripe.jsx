import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient.js';
import { Tag, Sparkles, Gift, TrendingUp } from 'lucide-react';

export default function PromotionalStripe({ onStateChange }) {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchOffersAPI = async () => {
      try {
        const offersRes = await pb.collection('offers').getList(1, 10, {
          filter: 'is_active = true',
          $autoCancel: false
        });
        
        if (!offersRes || typeof offersRes !== 'object') {
          console.error('Failed to fetch promotional offers: Invalid response', offersRes);
          return { data: [], error: 'Invalid API response format' };
        }
        
        const items = offersRes.items;
        if (!Array.isArray(items)) {
          console.warn('Failed to fetch promotional offers: Response missing items array', offersRes);
          return { data: [], error: null };
        }
        
        return { data: items, error: null };
      } catch (error) {
        return { data: [], error: error.message || 'Unknown error' };
      }
    };

    const fetchOffers = async () => {
      const { data, error } = await fetchOffersAPI();
      
      if (error) {
        console.error('Failed to fetch promotional offers:', error);
      }
      
      if (isMounted) {
        const displayableOffers = (data || []).filter(
          (offer) => offer.title || offer.description
        );
        setOffers(displayableOffers);
        if (onStateChange) onStateChange(displayableOffers.length > 0);
        setIsLoading(false);
      }
    };

    fetchOffers();

    return () => {
      isMounted = false;
    };
  }, [onStateChange]);

  const handleClick = (link) => {
    if (!link) return;
    
    if (link.startsWith('http')) {
      window.location.href = link;
    } else {
      navigate(link);
    }
  };

  // Return null if loading, failed, or no active offers (hides strip completely)
  if (isLoading || !offers || offers.length === 0) {
    return null;
  }

  // Create scrolling content dynamically from fetched offers
  const scrollingContent = (offers || []).map((offer, idx) => {
    // Only display title and description
    const textParts = [
      offer.title,
      offer.description
    ].filter(Boolean).join(' - ');

    return (
      <span 
        key={offer.id}
        className={`promo-strip-item flex items-center gap-2 ${offer.link ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={() => handleClick(offer.link)}
      >
        {idx % 4 === 0 && <Tag className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />}
        {idx % 4 === 1 && <Sparkles className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />}
        {idx % 4 === 2 && <Gift className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />}
        {idx % 4 === 3 && <TrendingUp className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />}
        <span className="font-medium tracking-wide">{textParts}</span>
      </span>
    );
  });

  return (
    <div className="promo-strip bg-primary text-primary-foreground py-2.5 overflow-hidden relative z-50 shadow-md">
      <div className="promo-strip-marquee flex whitespace-nowrap animate-marquee">
        <div className="promo-strip-content flex items-center gap-8 px-4">
          {/* Duplicate content 3 times for seamless loop */}
          {scrollingContent}
          <span className="opacity-50">•</span>
          {scrollingContent}
          <span className="opacity-50">•</span>
          {scrollingContent}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Tag } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';

const formatDiscount = (offer) => (
  offer.discount_type === 'percentage'
    ? `${offer.discount_value}% off`
    : `₹${offer.discount_value} off`
);

const formatEndDate = (endDate) => {
  if (!endDate) return 'Limited time';

  return `Ends ${new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(endDate))}`;
};

const OfferItem = ({ offer }) => {
  const content = (
    <>
      <span className="offer-marquee-badge">
        <Tag aria-hidden="true" className="h-3.5 w-3.5" />
        {formatDiscount(offer)}
      </span>
      <span className="font-semibold text-primary-foreground">
        {offer.product?.name || 'Selected products'}
      </span>
      <span className="text-primary-foreground/65">
        {formatEndDate(offer.end_date)}
      </span>
      {offer.product && (
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#f4d789]">
          Shop now
        </span>
      )}
    </>
  );

  return offer.product ? (
    <Link
      to={`/product/${offer.product.id}`}
      className="offer-marquee-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d789] focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
    >
      {content}
    </Link>
  ) : (
    <span className="offer-marquee-item">{content}</span>
  );
};

const OfferGroup = ({ offers, duplicate = false }) => (
  <div className="offer-marquee-group" aria-hidden={duplicate || undefined}>
    {offers.map((offer) => (
      <React.Fragment key={`${duplicate ? 'duplicate-' : ''}${offer.id}`}>
        <OfferItem offer={offer} />
        <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-[#d6aa55]" />
      </React.Fragment>
    ))}
  </div>
);

const OfferStrip = () => {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchActiveOffers = async () => {
      try {
        const now = new Date().toISOString();
        const records = await pb.collection('offers').getFullList({
          filter: `is_active = true && (start_date = '' || start_date <= '${now}') && (end_date = '' || end_date >= '${now}')`,
          sort: '-created',
          $autoCancel: false,
        });

        const enrichedOffers = await Promise.all(records.map(async (offer) => {
          if (!offer.product_id) return offer;

          try {
            const product = await pb.collection('products').getOne(offer.product_id, {
              $autoCancel: false,
            });
            return { ...offer, product };
          } catch (error) {
            console.warn(`[OfferStrip] Product not found for offer ${offer.id}:`, error);
            return offer;
          }
        }));

        if (isMounted) setOffers(enrichedOffers);
      } catch (error) {
        console.error('[OfferStrip] Failed to load offers:', error);
      }
    };

    fetchActiveOffers();

    return () => {
      isMounted = false;
    };
  }, []);

  if (offers.length === 0) return null;

  return (
    <aside className="offer-marquee" aria-label="Current offers">
      <div className="offer-marquee-track">
        <OfferGroup offers={offers} />
        <OfferGroup offers={offers} duplicate />
      </div>
    </aside>
  );
};

export default OfferStrip;

import React, { useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Link } from 'react-router-dom';

const OfferStrip = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActiveOffers = async () => {
      try {
        setLoading(true);
        // Fetch active offers that are within date range
        const now = new Date().toISOString();
        const records = await pb.collection('offers').getFullList({
          filter: `is_active = true && (start_date = '' || start_date <= '${now}') && (end_date = '' || end_date >= '${now}')`,
          sort: '-created'
        });

        // Enrich offers with product details
        const enrichedOffers = await Promise.all(
          records.map(async (offer) => {
            try {
              // Try to get product details if product_id exists
              if (offer.product_id) {
                const product = await pb.collection('products').getOne(offer.product_id, {
                  $autoCancel: false
                });
                return { ...offer, product };
              }
              return offer;
            } catch (productError) {
              // If product not found, still return offer without product details
              console.warn(`Product not found for offer ${offer.id}:`, productError);
              return offer;
            }
          })
        );

        setOffers(enrichedOffers);
      } catch (err) {
        console.error('Error fetching offers:', err);
        setError('Failed to load offers');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOffers();
  }, []);

  if (loading) return <div className="h-4 animate-pulse bg-gradient-to-r from-primary/20 to-primary/10" />;
  if (error) return <div className="h-4 bg-destructive/20 text-destructive text-center items-center">{error}</div>;
  if (offers.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center gap-4">
          {offers.map((offer, index) => (
            <div
              key={offer.id}
              className="flex flex-col sm:flex-row sm:items-center sm:gap-3 bg-primary/5 px-4 py-2 rounded-lg border border-primary/10 hover:border-primary/20 transition-all duration-200"
            >
              {offer.product ? (
                <>
                  <div className="flex-shrink-0">
                    <img
                      src={pb.files.getUrl(offer.product, Array.isArray(offer.product.images) ? offer.product.images[0] : offer.product.image, { width: 40 })}
                      alt={offer.product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      <Link to={`/product/${offer.product.id}`} className="hover:underline">
                        {offer.product.name}
                      </Link>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {offer.discount_type === 'percentage'
                        ? `-${offer.discount_value}% OFF`
                        : `-₹${offer.discount_value} OFF`}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    Product ID: {offer.product_id}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {offer.discount_type === 'percentage'
                      ? `-${offer.discount_value}% OFF`
                      : `-₹${offer.discount_value} OFF`}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground w-full">
                {offer.start_date || offer.end_date ? (
                  <>
                    {offer.start_date && (
                      <span>From: {new Date(offer.start_date).toLocaleDateString()}</span>
                    )}
                    {offer.start_date && offer.end_date ? ' • ' : ''}
                    {offer.end_date && (
                      <span>To: {new Date(offer.end_date).toLocaleDateString()}</span>
                    )}
                  </>
                ) : (
                  'Limited Time Offer'
                )}
              </div>

              {offer.product ? (
                <div className="flex-shrink-0 text-right">
                  <Link
                    to={`/product/${offer.product.id}`}
                    className="text-sm font-medium text-primary hover:text-primary/80"
                  >
                    View Product
                  </Link>
                </div>
              ) : (
                <div className="flex-shrink-0 text-right">
                  <button
                    className="text-sm font-medium text-primary hover:text-primary/80"
                    onClick={() => {
                      // This would ideally open a modal to manage the offer
                      alert('Offer management coming soon');
                    }}
                  >
                    Manage
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Show count if multiple offers */}
          {offers.length > 1 && (
            <div className="text-xs text-primary/60">
              +{offers.length - 1} more offers
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferStrip;
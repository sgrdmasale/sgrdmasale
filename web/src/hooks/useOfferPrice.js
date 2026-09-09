import { useState, useEffect } from 'react';

// Product pricing.
//
// NOTE: the `offers` collection holds STORE-WIDE promotions (title, description,
// discount_percentage, free_shipping, minimum_purchase_amount) that are shown in
// the promo strip. It has no link to individual products, and products have no
// sale-price field, so there is no data model for a per-product sale price.
//
// This hook previously queried `offers` with `product_id = "<id>"` — a field that
// does not exist — which made every product card fire a request that failed with
// HTTP 400. It now reports the product's own price directly (no request at all).
//
// To support real per-product sales later: add a `product` relation field to the
// `offers` collection (plus a picker in Offers Management), then query it here and
// set isOnSale/salePrice from the matching offer.
export const useOfferPrice = (productId, originalPrice) => {
  const [offerData, setOfferData] = useState({
    originalPrice: originalPrice || 0,
    salePrice: originalPrice || 0,
    discountPercentage: 0,
    isOnSale: false,
    offerEndDate: null,
    loading: false
  });

  useEffect(() => {
    const price = originalPrice || 0;
    setOfferData({
      originalPrice: price,
      salePrice: price,
      discountPercentage: 0,
      isOnSale: false,
      offerEndDate: null,
      loading: false
    });
  }, [productId, originalPrice]);

  return offerData;
};

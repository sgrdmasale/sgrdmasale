import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink, RefreshCcw, AlertCircle } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient.js';
import ReviewCard from '@/components/ReviewCard.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const GoogleReviewsWidget = () => {
  const [data, setData] = useState({ reviews: [], rating: 0, totalReviews: 0, businessName: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const googleMapsUrl = 'https://www.google.com/maps/place/SGRD+Masale+Amritsar';

  const fetchReviews = async () => {
    console.log('[GoogleReviewsWidget] Fetch started...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('[GoogleReviewsWidget] Calling apiServerClient.fetch("/google-reviews")');
      const response = await apiServerClient.fetch('/google-reviews');
      console.log('[GoogleReviewsWidget] Response received. Status:', response.status);
      
      const json = await response.json();
      console.log('[GoogleReviewsWidget] Data parsed. Full response:', json);
      
      if (!response.ok) {
        throw new Error(json.message || json.error || 'Failed to fetch reviews');
      }

      if (json.error) {
        throw new Error(json.message || json.error || 'API returned an error');
      }
      
      setData({
        reviews: json.reviews || [],
        rating: json.rating || 0,
        totalReviews: json.totalReviews || 0,
        businessName: json.businessName || 'SGRD Masale'
      });
    } catch (err) {
      console.error('[GoogleReviewsWidget] Error fetching reviews:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[GoogleReviewsWidget] Component mounted.');
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="rounded-2xl">
              <CardContent className="p-6">
                <Skeleton className="h-5 w-24 mb-4" />
                <Skeleton className="h-16 w-full mb-6" />
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-destructive/5 border-destructive/20">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Could not load reviews</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchReviews} variant="outline" size="sm">
            <RefreshCcw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data.reviews || data.reviews.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <Star className="w-8 h-8 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reviews available</h3>
          <p className="text-sm text-muted-foreground mb-6">Check back later or leave a review yourself.</p>
          <Button onClick={() => window.open(googleMapsUrl, '_blank')} size="sm">
            Leave a Review
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h3 className="text-2xl font-bold mb-2">Google Reviews</h3>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < Math.round(data.rating) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} 
                />
              ))}
            </div>
            <span className="text-sm font-medium">{data.rating.toFixed(1)} out of 5</span>
            <span className="text-sm text-muted-foreground">({data.totalReviews} reviews)</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.open(googleMapsUrl, '_blank')}
          className="shrink-0"
        >
          View all on Google
          <ExternalLink className="w-3 h-3 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.reviews.slice(0, 2).map((review, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="h-full"
          >
            <ReviewCard review={review} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GoogleReviewsWidget;
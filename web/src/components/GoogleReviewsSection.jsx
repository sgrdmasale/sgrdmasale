import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, RefreshCcw, AlertCircle, Star } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient.js';
import ReviewCard from '@/components/ReviewCard.jsx';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const GoogleReviewsSection = () => {
  const [data, setData] = useState({ reviews: [], rating: 0, totalReviews: 0, businessName: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = async () => {
    console.log('[GoogleReviewsSection] Fetch started...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('[GoogleReviewsSection] Calling apiServerClient.fetch("/google-reviews")');
      const response = await apiServerClient.fetch('/google-reviews');
      console.log('[GoogleReviewsSection] Response received. Status:', response.status);
      
      const json = await response.json();
      console.log('[GoogleReviewsSection] Data parsed completely. Full response object:', json);

      if (!response.ok) {
        throw new Error(json.message || json.error || 'Failed to fetch reviews');
      }

      if (json.error) {
        throw new Error(json.message || json.error || 'Google Reviews API returned an error');
      }
      
      setData({
        reviews: json.reviews || [],
        rating: json.rating || 0,
        totalReviews: json.totalReviews || 0,
        businessName: json.businessName || 'SGRD Masale'
      });
    } catch (err) {
      console.error('[GoogleReviewsSection] Error caught during fetch:', err);
      setError(err.message || 'Failed to load reviews. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[GoogleReviewsSection] Component mounted.');
    fetchReviews();
  }, []);

  if (loading) {
    return (
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-64 mx-auto mb-6" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <Card key={i} className="rounded-2xl border-none shadow-md bg-card">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-20 w-full mb-6" />
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-md mx-auto p-8 rounded-3xl bg-card shadow-sm border border-border/50">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Unable to load reviews</h3>
            <p className="text-muted-foreground mb-8">{error}</p>
            <Button onClick={fetchReviews} variant="default" className="rounded-xl">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!data.reviews || data.reviews.length === 0) {
    return (
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-md mx-auto">
            <h3 className="text-2xl font-semibold mb-3">No reviews yet</h3>
            <p className="text-muted-foreground mb-8">
              Be the first to share your experience with {data.businessName || 'us'}.
            </p>
            <Button 
              size="lg"
              onClick={() => window.open('https://www.google.com/maps/place/SGRD+Masale+Amritsar', '_blank')}
              className="rounded-xl shadow-lg shadow-primary/20"
            >
              Write a Review
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-balance" style={{ letterSpacing: '-0.02em' }}>
            Loved by our customers
          </h2>
          
          {data.rating > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-6 bg-background px-8 py-4 rounded-2xl shadow-sm border border-border/50"
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-primary mb-1">
                  <span className="font-bold text-3xl">{data.rating.toFixed(1)}</span>
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Average Rating</span>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-3xl text-foreground mb-1">{data.totalReviews}</span>
                <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Total Reviews</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {data.reviews.slice(0, 6).map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <ReviewCard review={review} />
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg"
            onClick={() => window.open('https://www.google.com/maps/place/SGRD+Masale+Amritsar', '_blank')}
            className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground px-8 w-full sm:w-auto"
          >
            Write a Review
            <ExternalLink className="ml-2 w-4 h-4" />
          </Button>
          <Button 
            size="lg"
            variant="outline"
            onClick={() => window.open('https://www.google.com/maps/place/SGRD+Masale+Amritsar', '_blank')}
            className="rounded-xl px-8 border-border/60 hover:bg-background shadow-sm w-full sm:w-auto"
          >
            View All {data.totalReviews} Reviews
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviewsSection;
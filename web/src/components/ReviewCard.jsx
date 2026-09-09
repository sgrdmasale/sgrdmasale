import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ReviewCard = ({ review }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const authorName = review.customerName || 'Customer';
  const text = review.reviewText || '';
  const rating = review.rating || 5;
  const dateStr = review.reviewDate || '';

  const maxLength = 150;
  const shouldTruncate = text.length > maxLength;
  const displayText = isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`;

  return (
    <Card className="h-full rounded-2xl border-none shadow-md bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center mb-4">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`w-5 h-5 ${
                i < rating 
                  ? 'fill-primary text-primary' 
                  : 'text-muted-foreground/30'
              }`} 
            />
          ))}
        </div>
        
        <div className="text-muted-foreground mb-6 leading-relaxed flex-grow">
          <p>"{displayText}"</p>
          {shouldTruncate && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary text-sm font-medium mt-2 hover:underline focus:outline-none"
            >
              {isExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-3 pt-4 border-t border-border/50 mt-auto">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
            {authorName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{authorName}</p>
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
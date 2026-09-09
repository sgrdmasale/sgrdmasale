import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router(); 

// Google Place ID for SGRD Masale Amritsar
// This should be obtained from Google Places API search or configured in .env
const PLACE_ID = process.env.GOOGLE_PLACE_ID || 'ChIJN1blFLsV4kgRrqqaeNYW2IQ';

router.get('/', async (req, res) => {  
  logger.info('===== GET /google-reviews CALLED =====');
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;  

  // Step 1: Check if API key is configured
  logger.info('Step 1: Checking GOOGLE_PLACES_API_KEY configuration...');
  if (!apiKey || apiKey.trim() === '') {
    logger.error('GOOGLE_PLACES_API_KEY is not configured in .env file');
    return res.status(400).json({
      error: 'GOOGLE_PLACES_API_KEY not configured',
      message: 'Please add GOOGLE_PLACES_API_KEY to apps/api/.env file',
      instructions: 'Get your API key from Google Cloud Console (https://console.cloud.google.com/) and add it to .env as: GOOGLE_PLACES_API_KEY=your_key_here',
      reviews: [],
      rating: 0,
      totalReviews: 0,
    });
  }
  logger.info('✅ GOOGLE_PLACES_API_KEY is configured');

  // Step 2: Prepare API request
  logger.info('Step 2: Preparing Google Places API request...');
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total,name&key=${apiKey}`;
  logger.info(`API Endpoint: ${detailsUrl.replace(apiKey, '***REDACTED***')}`);

  // Step 3: Fetch data from Google Places API
  logger.info('Step 3: Fetching reviews from Google Places API...');
  const detailsResponse = await fetch(detailsUrl);
  logger.info(`Response status: ${detailsResponse.status} ${detailsResponse.statusText}`);

  if (!detailsResponse.ok) {
    logger.error(`Google Places API error: ${detailsResponse.status} ${detailsResponse.statusText}`);
    throw new Error(`Google Places API error: ${detailsResponse.status} ${detailsResponse.statusText}`);
  }

  const detailsData = await detailsResponse.json();
  logger.info(`API Response status: ${detailsData.status}`);

  // Step 4: Validate API response
  logger.info('Step 4: Validating API response...');
  if (detailsData.status !== 'OK') {
    logger.error(`Google Places API returned status: ${detailsData.status}`);
    if (detailsData.error_message) {
      logger.error(`Error message: ${detailsData.error_message}`);
    }
    throw new Error(`Google Places API error: ${detailsData.status} - ${detailsData.error_message || 'Unknown error'}`);
  }

  // Step 5: Extract and format reviews
  logger.info('Step 5: Extracting and formatting reviews...');
  const result = detailsData.result || {};
  const reviews = (result.reviews || []).map((review) => {
    const formattedReview = {
      authorName: review.author_name || 'Anonymous',
      rating: review.rating || 0,
      text: review.text || '',
      publishedAtDate: review.time ? new Date(review.time * 1000).toISOString() : null,
      profilePhotoUrl: review.profile_photo_url || null,
    };
    logger.info(`  Review: ${formattedReview.authorName} (${formattedReview.rating}★)`);
    return formattedReview;
  });

  const rating = result.rating || 0;
  const totalReviews = result.user_ratings_total || reviews.length;
  const businessName = result.name || 'SGRD Masale';

  logger.info(`✅ Successfully fetched ${reviews.length} reviews`);
  logger.info(`Business: ${businessName}`);
  logger.info(`Overall rating: ${rating}★ (${totalReviews} total reviews)`);
  logger.info('===== END /google-reviews =====\n');

  // Step 6: Return formatted response
  res.json({
    reviews, 
    rating,
    totalReviews,
    businessName,
  });
});

export default router;
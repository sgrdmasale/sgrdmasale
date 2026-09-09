import { useState } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';

export const useCoupon = () => {
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateCoupon = async (code, subtotal) => {
    if (!code || !code.trim()) {
      console.log('[useCoupon] Validation failed: Empty coupon code');
      toast.error('Please enter a coupon code');
      return null;
    }

    setIsValidating(true);

    try {
      const trimmedCode = code.trim().toUpperCase();
      console.log('[useCoupon] ===== COUPON VALIDATION STARTED =====');
      console.log('[useCoupon] Searching for coupon code:', trimmedCode);
      console.log('[useCoupon] Current subtotal:', subtotal);

      // Fetch coupon from PocketBase
      const coupon = await pb.collection('coupons').getFirstListItem(
        `code="${trimmedCode}"`,
        { $autoCancel: false }
      );

      console.log('[useCoupon] ===== COUPON RECORD FOUND =====');
      console.log('[useCoupon] Full coupon record:', JSON.stringify(coupon, null, 2));
      console.log('[useCoupon] Coupon details:');
      console.log('  - ID:', coupon.id);
      console.log('  - Code:', coupon.code);
      console.log('  - Discount Type:', coupon.discount_type);
      console.log('  - Discount Value:', coupon.discount_value);
      console.log('  - Expiry Date:', coupon.expiry_date);
      console.log('  - Is Active:', coupon.is_active);
      console.log('  - Current Usage Count:', coupon.current_usage_count);
      console.log('  - Max Usage Limit:', coupon.max_usage_limit);
      console.log('  - Minimum Purchase Amount:', coupon.minimum_purchase_amount);

      // Validation 1: Check is_active
      console.log('[useCoupon] ===== VALIDATION 1: IS_ACTIVE CHECK =====');
      if (!coupon.is_active) {
        console.log('[useCoupon] ❌ VALIDATION FAILED: Coupon is inactive');
        console.log('[useCoupon] is_active value:', coupon.is_active);
        toast.error('This coupon is no longer active');
        return null;
      }
      console.log('[useCoupon] ✅ PASSED: Coupon is active');

      // Validation 2: Check expiry_date
      console.log('[useCoupon] ===== VALIDATION 2: EXPIRY DATE CHECK =====');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(coupon.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);

      console.log('[useCoupon] Today (normalized):', today.toISOString());
      console.log('[useCoupon] Expiry Date (normalized):', expiryDate.toISOString());
      console.log('[useCoupon] Comparison: expiryDate >= today?', expiryDate >= today);

      if (expiryDate < today) {
        console.log('[useCoupon] ❌ VALIDATION FAILED: Coupon has expired');
        console.log('[useCoupon] Expiry date:', coupon.expiry_date);
        console.log('[useCoupon] Days expired:', Math.floor((today - expiryDate) / (1000 * 60 * 60 * 24)));
        toast.error('This coupon has expired');
        return null;
      }
      console.log('[useCoupon] ✅ PASSED: Coupon is not expired');

      // Validation 3: Check usage limit
      console.log('[useCoupon] ===== VALIDATION 3: USAGE LIMIT CHECK =====');
      console.log('[useCoupon] Max Usage Limit:', coupon.max_usage_limit);
      console.log('[useCoupon] Current Usage Count:', coupon.current_usage_count);

      // Only check usage limit if max_usage_limit is set (not null/undefined/0)
      if (coupon.max_usage_limit && coupon.max_usage_limit > 0) {
        const usageCount = coupon.current_usage_count || 0;
        console.log('[useCoupon] Usage limit is set, checking...');
        console.log('[useCoupon] Comparison: current_usage_count >= max_usage_limit?', usageCount >= coupon.max_usage_limit);
        
        if (usageCount >= coupon.max_usage_limit) {
          console.log('[useCoupon] ❌ VALIDATION FAILED: Usage limit reached');
          console.log('[useCoupon] Current usage:', usageCount);
          console.log('[useCoupon] Max allowed:', coupon.max_usage_limit);
          toast.error('This coupon has reached its usage limit');
          return null;
        }
        console.log('[useCoupon] ✅ PASSED: Usage limit not reached');
        console.log('[useCoupon] Remaining uses:', coupon.max_usage_limit - usageCount);
      } else {
        console.log('[useCoupon] ✅ PASSED: No usage limit set (unlimited uses)');
      }

      // Validation 4: Check minimum purchase amount
      console.log('[useCoupon] ===== VALIDATION 4: MINIMUM PURCHASE CHECK =====');
      console.log('[useCoupon] Minimum Purchase Amount:', coupon.minimum_purchase_amount);
      console.log('[useCoupon] Current Subtotal:', subtotal);

      // Only check minimum purchase if minimum_purchase_amount is set (not null/undefined/0)
      if (coupon.minimum_purchase_amount && coupon.minimum_purchase_amount > 0) {
        console.log('[useCoupon] Minimum purchase requirement is set, checking...');
        console.log('[useCoupon] Comparison: subtotal >= minimum_purchase_amount?', subtotal >= coupon.minimum_purchase_amount);
        
        if (subtotal < coupon.minimum_purchase_amount) {
          console.log('[useCoupon] ❌ VALIDATION FAILED: Minimum purchase amount not met');
          console.log('[useCoupon] Required:', coupon.minimum_purchase_amount);
          console.log('[useCoupon] Current:', subtotal);
          console.log('[useCoupon] Shortfall:', coupon.minimum_purchase_amount - subtotal);
          toast.error(`Minimum purchase of ₹${coupon.minimum_purchase_amount.toFixed(2)} required for this coupon`);
          return null;
        }
        console.log('[useCoupon] ✅ PASSED: Minimum purchase requirement met');
      } else {
        console.log('[useCoupon] ✅ PASSED: No minimum purchase requirement');
      }

      console.log('[useCoupon] ===== ALL VALIDATIONS PASSED =====');
      console.log('[useCoupon] Coupon is valid and ready to apply');
      toast.success('Coupon applied successfully');
      setAppliedCoupon(coupon);
      return coupon;

    } catch (error) {
      console.error('[useCoupon] ===== COUPON VALIDATION ERROR =====');
      console.error('[useCoupon] Error type:', error.constructor.name);
      console.error('[useCoupon] Error status:', error.status);
      console.error('[useCoupon] Error message:', error.message);
      console.error('[useCoupon] Full error object:', error);
      
      if (error.status === 404) {
        console.log('[useCoupon] ❌ Coupon code not found in database');
        toast.error('Invalid coupon code');
      } else {
        console.log('[useCoupon] ❌ Unexpected error during validation');
        toast.error('Failed to validate coupon. Please try again.');
      }
      
      return null;
    } finally {
      setIsValidating(false);
      console.log('[useCoupon] ===== VALIDATION PROCESS COMPLETE =====');
    }
  };

  const calculateDiscount = (coupon, subtotal) => {
    if (!coupon) {
      console.log('[useCoupon] calculateDiscount: No coupon provided, returning 0');
      return 0;
    }

    console.log('[useCoupon] ===== CALCULATING DISCOUNT =====');
    console.log('[useCoupon] Coupon code:', coupon.code);
    console.log('[useCoupon] Discount type:', coupon.discount_type);
    console.log('[useCoupon] Discount value:', coupon.discount_value);
    console.log('[useCoupon] Subtotal:', subtotal);

    let discount = 0;

    if (coupon.discount_type === 'percentage') {
      discount = (subtotal * coupon.discount_value) / 100;
      console.log('[useCoupon] Percentage discount calculation:');
      console.log('  - Formula: (subtotal × percentage) / 100');
      console.log('  - Calculation: (', subtotal, '×', coupon.discount_value, ') / 100');
      console.log('  - Raw discount:', discount);
    } else if (coupon.discount_type === 'fixed_amount') {
      discount = coupon.discount_value;
      console.log('[useCoupon] Fixed amount discount:', discount);
    } else {
      console.warn('[useCoupon] ⚠️ Unknown discount type:', coupon.discount_type);
    }

    // Ensure discount doesn't exceed subtotal
    const originalDiscount = discount;
    discount = Math.min(discount, subtotal);
    
    if (originalDiscount > subtotal) {
      console.log('[useCoupon] ⚠️ Discount capped to subtotal');
      console.log('  - Original discount:', originalDiscount);
      console.log('  - Capped discount:', discount);
    }

    console.log('[useCoupon] Final discount amount:', discount);
    console.log('[useCoupon] ===== DISCOUNT CALCULATION COMPLETE =====');

    return discount;
  };

  const clearCoupon = () => {
    console.log('[useCoupon] ===== CLEARING COUPON =====');
    console.log('[useCoupon] Previously applied coupon:', appliedCoupon?.code || 'none');
    setAppliedCoupon(null);
    toast.success('Coupon removed');
    console.log('[useCoupon] Coupon cleared successfully');
  };

  return {
    appliedCoupon,
    isValidating,
    validateCoupon,
    calculateDiscount,
    clearCoupon
  };
};
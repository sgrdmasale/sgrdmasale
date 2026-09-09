import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import apiServerClient from '@/lib/apiServerClient.js';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext.jsx';

const RazorpayButton = ({ 
  amount, 
  currency = 'INR', 
  description = 'Order Payment',
  cartItems = [],
  shippingCost = 0,
  customerDetails = {},
  shippingAddress = {},
  onSuccess,
  onError,
  disabled = false,
  className = '',
  children = 'Pay Now'
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { clearCart } = useCart();

  useEffect(() => {
    console.log('[RazorpayButton] Component mounted with props:', {
      amount,
      currency,
      description,
      cartItemsCount: cartItems.length,
      shippingCost,
      customerDetails,
      shippingAddress
    });
  }, []);

  const serializeCartItems = (items) => {
    console.log('[RazorpayButton] Serializing cart items, count:', items.length);
    const serialized = items.map(item => {
      const cleanItem = {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        image: item.image || null
      };
      console.log('[RazorpayButton] Serialized item:', cleanItem);
      return cleanItem;
    });
    console.log('[RazorpayButton] All items serialized successfully:', serialized);
    return serialized;
  };

  const handlePayment = async () => {
    console.log('[RazorpayButton] ========== PAYMENT FLOW STARTED ==========');
    console.log('[RazorpayButton] Step 1: Checking Razorpay SDK availability');
    
    if (!window.Razorpay) {
      console.error('[RazorpayButton] ERROR: Razorpay SDK not found on window object');
      toast.error('Razorpay SDK not loaded. Please refresh the page.');
      return;
    }
    console.log('[RazorpayButton] ✓ Razorpay SDK is available');

    console.log('[RazorpayButton] Step 2: Checking user authentication');
    if (!pb.authStore.isValid) {
      console.error('[RazorpayButton] ERROR: User not authenticated');
      toast.error('Please login to proceed with payment');
      navigate('/login');
      return;
    }
    const userId = pb.authStore.model.id;
    const userEmail = pb.authStore.model.email;
    console.log('[RazorpayButton] ✓ User is authenticated:', userEmail, 'ID:', userId);

    setLoading(true);
    console.log('[RazorpayButton] Step 3: Payment button loading state set to true');

    try {
      console.log('[RazorpayButton] Step 4: Serializing cart items');
      const serializedItems = serializeCartItems(cartItems);
      console.log('[RazorpayButton] ✓ Cart items serialized:', serializedItems);

      console.log('[RazorpayButton] Step 5: Generating receipt ID');
      const receiptId = `receipt_${Date.now()}_${userId}`;
      console.log('[RazorpayButton] ✓ Receipt ID generated:', receiptId);

      console.log('[RazorpayButton] Step 6: Calculating amount in paise');
      console.log('[RazorpayButton] Amount in rupees:', amount);
      console.log('[RazorpayButton] Shipping cost:', shippingCost);
      const amountInPaise = Math.round(amount * 100);
      console.log('[RazorpayButton] ✓ Amount in paise:', amountInPaise);

      // CRITICAL FIX: Match backend expected payload structure
      const orderPayload = {
        amount: amountInPaise,
        currency,
        receipt: receiptId,
        userId: userId,  // REQUIRED by backend
        notes: {  // Optional metadata
          customer_email: customerDetails.email || userEmail,
          customer_phone: customerDetails.phone || '',
          customer_name: customerDetails.name || pb.authStore.model.name || '',
          items: serializedItems,
          shipping_address: shippingAddress,
          shipping_cost: shippingCost
        }
      };

      console.log('[RazorpayButton] Step 7: Creating Razorpay order');
      console.log('[RazorpayButton] ========== REQUEST PAYLOAD ==========');
      console.log('[RazorpayButton] Full payload:', JSON.stringify(orderPayload, null, 2));
      console.log('[RazorpayButton] Payload details:');
      console.log('[RazorpayButton]   - amount:', orderPayload.amount, '(type:', typeof orderPayload.amount, ')');
      console.log('[RazorpayButton]   - currency:', orderPayload.currency, '(type:', typeof orderPayload.currency, ')');
      console.log('[RazorpayButton]   - receipt:', orderPayload.receipt, '(type:', typeof orderPayload.receipt, ')');
      console.log('[RazorpayButton]   - userId:', orderPayload.userId, '(type:', typeof orderPayload.userId, ')');
      console.log('[RazorpayButton]   - notes:', orderPayload.notes);
      console.log('[RazorpayButton] =====================================');

      const fetchUrl = '/razorpay/create-order';
      const fetchMethod = 'POST';
      const fetchHeaders = { 'Content-Type': 'application/json' };
      
      console.log('[RazorpayButton] ========== FETCH REQUEST DETAILS ==========');
      console.log('[RazorpayButton] Fetch URL:', fetchUrl);
      console.log('[RazorpayButton] Full URL will be: /hcgi/api' + fetchUrl);
      console.log('[RazorpayButton] Fetch Method:', fetchMethod);
      console.log('[RazorpayButton] Fetch Headers:', fetchHeaders);
      console.log('[RazorpayButton] Request Body (stringified):', JSON.stringify(orderPayload));
      console.log('[RazorpayButton] =====================================');

      console.log('[RazorpayButton] Sending POST request to', fetchUrl);
      
      let response;
      try {
        response = await apiServerClient.fetch(fetchUrl, {
          method: fetchMethod,
          headers: fetchHeaders,
          body: JSON.stringify(orderPayload)
        });
        console.log('[RazorpayButton] ✓ Fetch completed successfully');
      } catch (fetchError) {
        console.error('[RazorpayButton] ========== NETWORK/FETCH ERROR ==========');
        console.error('[RazorpayButton] Fetch failed with error:', fetchError);
        console.error('[RazorpayButton] Error name:', fetchError.name);
        console.error('[RazorpayButton] Error message:', fetchError.message);
        console.error('[RazorpayButton] Error stack:', fetchError.stack);
        console.error('[RazorpayButton] =====================================');
        
        setLoading(false);
        toast.error(`Network error: ${fetchError.message || 'Failed to connect to payment server'}`);
        if (onError) onError(fetchError);
        return;
      }

      console.log('[RazorpayButton] Step 8: Received response from backend');
      console.log('[RazorpayButton] ========== RESPONSE DETAILS ==========');
      console.log('[RazorpayButton] Response status:', response.status);
      console.log('[RazorpayButton] Response statusText:', response.statusText);
      console.log('[RazorpayButton] Response ok:', response.ok);
      console.log('[RazorpayButton] Response type:', response.type);
      console.log('[RazorpayButton] Response URL:', response.url);
      console.log('[RazorpayButton] Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('[RazorpayButton] =====================================');

      let responseText;
      let responseData;
      
      try {
        responseText = await response.text();
        console.log('[RazorpayButton] ========== RAW RESPONSE BODY ==========');
        console.log('[RazorpayButton] Raw response text:', responseText);
        console.log('[RazorpayButton] Response text length:', responseText.length);
        console.log('[RazorpayButton] =====================================');
        
        if (!responseText || responseText.trim() === '') {
          console.error('[RazorpayButton] ERROR: Empty response body');
          setLoading(false);
          toast.error(`Server returned empty response (Status ${response.status})`);
          if (onError) onError(new Error('Empty response from server'));
          return;
        }

        try {
          responseData = JSON.parse(responseText);
          console.log('[RazorpayButton] ✓ Response JSON parsed successfully');
          console.log('[RazorpayButton] Parsed response data:', responseData);
        } catch (parseError) {
          console.error('[RazorpayButton] ========== JSON PARSE ERROR ==========');
          console.error('[RazorpayButton] Failed to parse response JSON');
          console.error('[RazorpayButton] Parse error:', parseError);
          console.error('[RazorpayButton] Parse error message:', parseError.message);
          console.error('[RazorpayButton] Parse error stack:', parseError.stack);
          console.error('[RazorpayButton] Raw text that failed to parse:', responseText);
          console.error('[RazorpayButton] =====================================');
          
          setLoading(false);
          toast.error(`Invalid response format: ${parseError.message}`);
          if (onError) onError(parseError);
          return;
        }
      } catch (textError) {
        console.error('[RazorpayButton] ========== RESPONSE TEXT READ ERROR ==========');
        console.error('[RazorpayButton] Failed to read response text');
        console.error('[RazorpayButton] Error:', textError);
        console.error('[RazorpayButton] Error message:', textError.message);
        console.error('[RazorpayButton] =====================================');
        
        setLoading(false);
        toast.error(`Failed to read server response: ${textError.message}`);
        if (onError) onError(textError);
        return;
      }

      if (!response.ok) {
        console.error('[RazorpayButton] ========== ERROR RESPONSE ==========');
        console.error('[RazorpayButton] HTTP Status:', response.status);
        console.error('[RazorpayButton] Status Text:', response.statusText);
        console.error('[RazorpayButton] Response data:', responseData);
        console.error('[RazorpayButton] Full error object:', JSON.stringify(responseData, null, 2));
        
        // Extract error message with priority: error > message > details > statusText
        let errorMessage = 'Unknown error';
        
        if (responseData?.error) {
          errorMessage = responseData.error;
          console.error('[RazorpayButton] Error extracted from responseData.error:', errorMessage);
        } else if (responseData?.message) {
          errorMessage = responseData.message;
          console.error('[RazorpayButton] Error extracted from responseData.message:', errorMessage);
        } else if (responseData?.details) {
          errorMessage = responseData.details;
          console.error('[RazorpayButton] Error extracted from responseData.details:', errorMessage);
        } else if (response.statusText) {
          errorMessage = response.statusText;
          console.error('[RazorpayButton] Error extracted from response.statusText:', errorMessage);
        }
        
        console.error('[RazorpayButton] Final error message to display:', errorMessage);
        console.error('[RazorpayButton] =====================================');
        
        setLoading(false);
        toast.error(`Payment error: ${errorMessage}`);
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.responseData = responseData;
        if (onError) onError(error);
        return;
      }

      const orderData = responseData;
      console.log('[RazorpayButton] ✓ Order created successfully');
      console.log('[RazorpayButton] ========== ORDER DATA ==========');
      console.log('[RazorpayButton] Full order data:', orderData);
      console.log('[RazorpayButton] Order ID:', orderData.orderId);
      console.log('[RazorpayButton] Order amount:', orderData.amount, 'rupees');
      console.log('[RazorpayButton] Order currency:', orderData.currency);
      console.log('[RazorpayButton] Razorpay Key:', orderData.key);
      console.log('[RazorpayButton] =====================================');

      // Verify required fields in response
      if (!orderData.orderId) {
        console.error('[RazorpayButton] ERROR: Missing orderId in response');
        setLoading(false);
        toast.error('Invalid response from payment server: missing order ID');
        return;
      }

      if (!orderData.key) {
        console.warn('[RazorpayButton] WARNING: Missing Razorpay key in response, using fallback');
      }

      console.log('[RazorpayButton] Step 9: Preparing Razorpay modal options');
      const options = {
        key: orderData.key || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummy',
        amount: orderData.amount * 100, // Convert back to paise for Razorpay modal
        currency: orderData.currency,
        name: 'SGRD Masale',
        description,
        order_id: orderData.orderId,
        handler: async function (razorpayResponse) {
          console.log('[RazorpayButton] ========== PAYMENT SUCCESS HANDLER ==========');
          console.log('[RazorpayButton] Razorpay response:', razorpayResponse);
          console.log('[RazorpayButton] Payment ID:', razorpayResponse.razorpay_payment_id);
          console.log('[RazorpayButton] Order ID:', razorpayResponse.razorpay_order_id);
          console.log('[RazorpayButton] Signature:', razorpayResponse.razorpay_signature);

          try {
            console.log('[RazorpayButton] Step 10: Verifying payment with backend');
            const verifyPayload = {
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature
            };
            console.log('[RazorpayButton] Verify payload:', verifyPayload);

            const verifyResponse = await apiServerClient.fetch('/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(verifyPayload)
            });

            console.log('[RazorpayButton] Verify response status:', verifyResponse.status);
            console.log('[RazorpayButton] Verify response ok:', verifyResponse.ok);

            const verifyData = await verifyResponse.json();
            console.log('[RazorpayButton] Verification response:', verifyData);

            if (!verifyResponse.ok || !verifyData.success) {
              console.error('[RazorpayButton] ERROR: Payment verification failed');
              console.error('[RazorpayButton] Verification message:', verifyData.message || verifyData.error);
              throw new Error(verifyData.message || verifyData.error || 'Payment verification failed');
            }
            console.log('[RazorpayButton] ✓ Payment verified successfully');

            console.log('[RazorpayButton] Step 11: Creating order in PocketBase');
            const orderRecord = {
              userId: userId,
              items: serializedItems,
              subtotal: amount - shippingCost,
              shipping_cost: shippingCost,
              tax_amount: 0,
              total_amount: amount,
              customer_name: customerDetails.name || pb.authStore.model.name || '',
              customer_email: customerDetails.email || userEmail || '',
              customer_phone: customerDetails.phone || '',
              shipping_address: shippingAddress,
              shipping_method: customerDetails.shippingMethod || 'Standard',
              payment_status: 'completed',
              order_status: 'pending',
              orderNumber: receiptId
            };
            console.log('[RazorpayButton] Order record to create:', orderRecord);

            const createdOrder = await pb.collection('orders').create(orderRecord, { $autoCancel: false });
            console.log('[RazorpayButton] ✓ Order created in PocketBase');
            console.log('[RazorpayButton] Order ID:', createdOrder.id);
            console.log('[RazorpayButton] Order details:', createdOrder);

            console.log('[RazorpayButton] Step 12: Clearing cart');
            clearCart();
            console.log('[RazorpayButton] ✓ Cart cleared');

            toast.success('Payment successful! Your order has been placed.');

            console.log('[RazorpayButton] Step 13: Redirecting to order confirmation');
            if (onSuccess) {
              console.log('[RazorpayButton] Calling onSuccess callback');
              onSuccess(createdOrder);
            } else {
              console.log('[RazorpayButton] Navigating to /order-confirmation/' + createdOrder.id);
              navigate(`/order-confirmation/${createdOrder.id}`);
            }
            console.log('[RazorpayButton] ========== PAYMENT FLOW COMPLETED SUCCESSFULLY ==========');
          } catch (error) {
            console.error('[RazorpayButton] ========== ERROR IN POST-PAYMENT PROCESSING ==========');
            console.error('[RazorpayButton] Error:', error);
            console.error('[RazorpayButton] Error message:', error.message);
            console.error('[RazorpayButton] Error stack:', error.stack);
            toast.error(`Post-payment error: ${error.message}`);
            if (onError) onError(error);
          }
        },
        prefill: {
          name: customerDetails.name || pb.authStore.model.name || '',
          email: customerDetails.email || userEmail || '',
          contact: customerDetails.phone || ''
        },
        theme: {
          color: '#D97706'
        },
        modal: {
          ondismiss: function() {
            console.log('[RazorpayButton] ========== PAYMENT MODAL DISMISSED ==========');
            console.log('[RazorpayButton] User closed the payment modal');
            setLoading(false);
            toast.error('Payment cancelled');
          }
        }
      };

      console.log('[RazorpayButton] ========== RAZORPAY MODAL OPTIONS ==========');
      console.log('[RazorpayButton] Full options:', options);
      console.log('[RazorpayButton] Key:', options.key);
      console.log('[RazorpayButton] Amount:', options.amount);
      console.log('[RazorpayButton] Currency:', options.currency);
      console.log('[RazorpayButton] Order ID:', options.order_id);
      console.log('[RazorpayButton] Prefill:', options.prefill);
      console.log('[RazorpayButton] =====================================');

      console.log('[RazorpayButton] Step 10: Creating Razorpay instance');
      const razorpayInstance = new window.Razorpay(options);
      console.log('[RazorpayButton] ✓ Razorpay instance created');
      
      razorpayInstance.on('payment.failed', function (response) {
        console.error('[RazorpayButton] ========== PAYMENT FAILED ==========');
        console.error('[RazorpayButton] Error:', response.error);
        console.error('[RazorpayButton] Error code:', response.error.code);
        console.error('[RazorpayButton] Error description:', response.error.description);
        console.error('[RazorpayButton] Error source:', response.error.source);
        console.error('[RazorpayButton] Error step:', response.error.step);
        console.error('[RazorpayButton] Error reason:', response.error.reason);
        console.error('[RazorpayButton] Full error object:', JSON.stringify(response.error, null, 2));
        console.error('[RazorpayButton] =====================================');
        setLoading(false);
        toast.error(`Payment failed: ${response.error.description || 'Unknown error'}`);
        if (onError) onError(response.error);
      });

      console.log('[RazorpayButton] Step 11: Opening Razorpay modal');
      razorpayInstance.open();
      console.log('[RazorpayButton] ✓ Razorpay modal opened');
      setLoading(false);

    } catch (error) {
      console.error('[RazorpayButton] ========== ERROR IN PAYMENT INITIALIZATION ==========');
      console.error('[RazorpayButton] Error:', error);
      console.error('[RazorpayButton] Error name:', error.name);
      console.error('[RazorpayButton] Error message:', error.message);
      console.error('[RazorpayButton] Error stack:', error.stack);
      console.error('[RazorpayButton] Error toString:', error.toString());
      console.error('[RazorpayButton] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('[RazorpayButton] =====================================');
      setLoading(false);
      toast.error(`Payment error: ${error.message || 'Failed to initialize payment'}`);
      if (onError) onError(error);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading || !pb.authStore.isValid}
      className={className}
    >
      {loading ? 'Processing...' : children}
    </Button>
  );
};

export default RazorpayButton;
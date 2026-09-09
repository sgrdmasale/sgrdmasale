import React, { useEffect, useState } from 'react';
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
  children = 'Pay Now',
}) => {
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { clearCart } = useCart();

  useEffect(() => {
    console.log('[RazorpayButton] Mounted:', {
      amount,
      currency,
      cartItemsCount: Array.isArray(cartItems) ? cartItems.length : 0,
      shippingCost,
    });
  }, [amount, currency, cartItems, shippingCost]);

  /*
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  const getAuthenticatedUser = () => {
    if (!pb?.authStore?.isValid || !pb?.authStore?.model) {
      return null;
    }

    return pb.authStore.model;
  };

  const getErrorMessage = (
    data,
    fallback = 'Payment request failed.'
  ) => {
    if (!data) {
      return fallback;
    }

    if (typeof data === 'string') {
      return data;
    }

    return (
      data.error ||
      data.message ||
      data.details ||
      data.reason ||
      fallback
    );
  };

  const safeNumber = (value, fallback = 0) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  };

  const serializeCartItems = (items) => {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => {
        const price = safeNumber(
          item?.price ??
            item?.unit_price ??
            item?.unitPrice ??
            item?.sale_price ??
            item?.product?.price ??
            0
        );

        const quantity = safeNumber(
          item?.quantity ??
            item?.qty ??
            item?.count ??
            1,
          1
        );

        const name =
          item?.name ||
          item?.title ||
          item?.product_name ||
          item?.productName ||
          item?.item_name ||
          item?.product?.name ||
          '';

        return {
          id:
            item?.id ||
            item?.product_id ||
            item?.productId ||
            item?.product?.id ||
            null,

          name: String(name).trim(),

          category:
            item?.category ||
            item?.product?.category ||
            '',

          price,

          quantity,

          image:
            item?.image ||
            item?.image_url ||
            item?.imageUrl ||
            null,

          sku:
            item?.sku ||
            item?.product?.sku ||
            null,

          description:
            item?.description ||
            item?.product?.description ||
            '',

          tax_type:
            item?.tax_type ??
            item?.taxType ??
            null,

          tax_percentage:
            item?.tax_percentage ??
            item?.taxPercentage ??
            null,
        };
      })
      .filter((item) => {
        return (
          item.name &&
          item.quantity > 0 &&
          item.price >= 0
        );
      });
  };

  const getSubtotal = (
    numericAmount,
    numericShippingCost
  ) => {
    const possibleSubtotal =
      customerDetails?.subtotal ??
      customerDetails?.subtotal_amount ??
      customerDetails?.subtotalAmount;

    if (
      possibleSubtotal !== undefined &&
      possibleSubtotal !== null &&
      possibleSubtotal !== ''
    ) {
      return safeNumber(possibleSubtotal);
    }

    return Math.max(
      0,
      numericAmount - numericShippingCost
    );
  };

  const getTaxAmount = () => {
    return safeNumber(
      customerDetails?.taxAmount ??
        customerDetails?.tax_amount ??
        customerDetails?.tax ??
        0
    );
  };

  const getDiscountAmount = () => {
    return safeNumber(
      customerDetails?.discountAmount ??
        customerDetails?.discount_amount ??
        customerDetails?.couponDiscount ??
        customerDetails?.coupon_discount ??
        0
    );
  };

  const getCouponCode = () => {
    return (
      customerDetails?.couponCode ||
      customerDetails?.coupon_code ||
      ''
    );
  };

  const getShippingMethod = () => {
    return (
      customerDetails?.shippingMethod ||
      customerDetails?.shipping_method ||
      'standard'
    );
  };

  /*
   * ---------------------------------------------------------
   * PAYMENT FLOW
   * ---------------------------------------------------------
   */

  const handlePayment = async () => {
    if (loading) {
      return;
    }

    console.log(
      '[RazorpayButton] ======================================='
    );

    console.log(
      '[RazorpayButton] PAYMENT FLOW STARTED'
    );

    /*
     * -------------------------------------------------------
     * STEP 1
     * Check Razorpay SDK
     * -------------------------------------------------------
     */

    if (!window.Razorpay) {
      const error = new Error(
        'Razorpay SDK is not loaded. Please refresh the page.'
      );

      console.error(
        '[RazorpayButton]',
        error
      );

      toast.error(error.message);

      onError?.(error);

      return;
    }

    /*
     * -------------------------------------------------------
     * STEP 2
     * Check authentication
     * -------------------------------------------------------
     */

    const user = getAuthenticatedUser();

    if (!user) {
      const error = new Error(
        'Please login before making a payment.'
      );

      console.error(
        '[RazorpayButton]',
        error
      );

      toast.error(error.message);

      onError?.(error);

      navigate('/login');

      return;
    }

    const userId = user.id;

    const userEmail =
      user.email ||
      '';

    console.log(
      '[RazorpayButton] Authenticated user:',
      {
        id: userId,
        email: userEmail,
      }
    );

    /*
     * -------------------------------------------------------
     * STEP 3
     * Validate amount
     * -------------------------------------------------------
     */

    const numericAmount = safeNumber(amount);

    const numericShippingCost =
      safeNumber(shippingCost);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      const error = new Error(
        'Invalid payment amount.'
      );

      console.error(
        '[RazorpayButton]',
        error
      );

      toast.error(error.message);

      onError?.(error);

      return;
    }

    /*
     * -------------------------------------------------------
     * STEP 4
     * Serialize cart
     * -------------------------------------------------------
     */

    const serializedItems =
      serializeCartItems(cartItems);

    if (
      serializedItems.length === 0
    ) {
      const error = new Error(
        'Your cart is empty or contains invalid products.'
      );

      console.error(
        '[RazorpayButton]',
        error
      );

      toast.error(error.message);

      onError?.(error);

      return;
    }

    console.log(
      '[RazorpayButton] Cart items:',
      serializedItems
    );

    /*
     * -------------------------------------------------------
     * STEP 5
     * Customer information
     * -------------------------------------------------------
     */

    const customerName =
      String(
        customerDetails?.name ||
          customerDetails?.customer_name ||
          user?.name ||
          ''
      ).trim();

    const customerEmail =
      String(
        customerDetails?.email ||
          customerDetails?.customer_email ||
          userEmail ||
          ''
      ).trim();

    const customerPhone =
      String(
        customerDetails?.phone ||
          customerDetails?.mobile ||
          customerDetails?.customer_phone ||
          user?.phone ||
          ''
      ).trim();

    if (!customerName) {
      toast.error(
        'Customer name is required.'
      );
      return;
    }

    if (!customerEmail) {
      toast.error(
        'Customer email is required.'
      );
      return;
    }

    if (!customerPhone) {
      toast.error(
        'Customer phone number is required.'
      );
      return;
    }

    /*
     * -------------------------------------------------------
     * STEP 6
     * Calculate order values
     * -------------------------------------------------------
     */

    const subtotal =
      getSubtotal(
        numericAmount,
        numericShippingCost
      );

    const taxAmount =
      getTaxAmount();

    const discountAmount =
      getDiscountAmount();

    const couponCode =
      getCouponCode();

    const shippingMethod =
      getShippingMethod();

    const billingDetails =
      customerDetails?.billingDetails ||
      customerDetails?.billing_details ||
      {};

    /*
     * -------------------------------------------------------
     * STEP 7
     * Create Razorpay order
     *
     * IMPORTANT:
     *
     * Backend expects:
     *
     * cartItems
     * subtotal
     * shippingCost
     * taxAmount
     * totalAmount
     * customerName
     * customerEmail
     * customerPhone
     *
     * -------------------------------------------------------
     */

    setLoading(true);

    try {
      const createOrderPayload = {
        cartItems: serializedItems,

        subtotal,

        shippingCost:
          numericShippingCost,

        taxAmount,

        totalAmount:
          numericAmount,

        customerName,

        customerEmail,

        customerPhone,

        userId,

        couponCode,

        couponDiscount:
          discountAmount,

        currency,
      };

      console.log(
        '[RazorpayButton] Creating Razorpay order:',
        {
          amountRupees:
            numericAmount,

          amountPaise:
            Math.round(
              numericAmount * 100
            ),

          currency,

          items:
            serializedItems.length,

          subtotal,

          shippingCost:
            numericShippingCost,

          taxAmount,

          discountAmount,
        }
      );

      const createResponse =
        await apiServerClient.fetch(
          '/razorpay/create-order',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                createOrderPayload
              ),
          }
        );

      let createData = null;

      try {
        createData =
          await createResponse.json();
      } catch {
        createData = null;
      }

      console.log(
        '[RazorpayButton] Create order response:',
        {
          status:
            createResponse.status,

          ok:
            createResponse.ok,

          data:
            createData,
        }
      );

      if (!createResponse.ok) {
        throw new Error(
          getErrorMessage(
            createData,
            `Unable to create payment order (${createResponse.status}).`
          )
        );
      }

      if (!createData?.orderId) {
        throw new Error(
          'Payment server did not return a Razorpay order ID.'
        );
      }

      if (!createData?.key) {
        throw new Error(
          'Payment server did not return a Razorpay key.'
        );
      }

      const razorpayAmount =
        safeNumber(
          createData.amount
        );

      if (
        !razorpayAmount ||
        razorpayAmount <= 0
      ) {
        throw new Error(
          'Payment server returned an invalid Razorpay amount.'
        );
      }

      console.log(
        '[RazorpayButton] Razorpay order created:',
        {
          orderId:
            createData.orderId,

          amountPaise:
            razorpayAmount,

          currency:
            createData.currency,

          receipt:
            createData.receipt,
        }
      );

      /*
       * -------------------------------------------------------
       * STEP 8
       * Razorpay checkout
       * -------------------------------------------------------
       */

      const options = {
        key:
          createData.key,

        amount:
          razorpayAmount,

        currency:
          createData.currency ||
          currency,

        name:
          'SGRD Masale',

        description,

        order_id:
          createData.orderId,

        prefill: {
          name:
            customerName,

          email:
            customerEmail,

          contact:
            customerPhone,
        },

        notes: {
          customer_name:
            customerName,

          customer_email:
            customerEmail,

          customer_phone:
            customerPhone,

          user_id:
            userId,
        },

        theme: {
          color:
            '#D97706',
        },

        modal: {
          ondismiss: () => {
            console.log(
              '[RazorpayButton] Payment modal dismissed.'
            );

            setLoading(false);

            toast.error(
              'Payment cancelled.'
            );
          },
        },

        handler:
          async (
            razorpayResponse
          ) => {
            console.log(
              '[RazorpayButton] ======================================='
            );

            console.log(
              '[RazorpayButton] RAZORPAY PAYMENT SUCCESS'
            );

            console.log(
              '[RazorpayButton] Razorpay response:',
              {
                orderId:
                  razorpayResponse?.razorpay_order_id,

                paymentId:
                  razorpayResponse?.razorpay_payment_id,

                hasSignature:
                  Boolean(
                    razorpayResponse?.razorpay_signature
                  ),
              }
            );

            try {
              /*
               * -------------------------------------------------
               * STEP 9
               * Validate Razorpay response
               * -------------------------------------------------
               */

              const razorpayOrderId =
                razorpayResponse?.razorpay_order_id;

              const razorpayPaymentId =
                razorpayResponse?.razorpay_payment_id;

              const razorpaySignature =
                razorpayResponse?.razorpay_signature;

              if (!razorpayOrderId) {
                throw new Error(
                  'Razorpay order ID is missing.'
                );
              }

              if (!razorpayPaymentId) {
                throw new Error(
                  'Razorpay payment ID is missing.'
                );
              }

              if (!razorpaySignature) {
                throw new Error(
                  'Razorpay payment signature is missing.'
                );
              }

              /*
               * -------------------------------------------------
               * STEP 10
               * Prepare verification payload
               *
               * These names MUST match backend.
               * -------------------------------------------------
               */

              const verifyPayload = {
                razorpay_order_id:
                  razorpayOrderId,

                razorpay_payment_id:
                  razorpayPaymentId,

                razorpay_signature:
                  razorpaySignature,

                userId,

                cartItems:
                  serializedItems,

                subtotal_amount:
                  subtotal,

                shipping_cost:
                  numericShippingCost,

                tax_amount:
                  taxAmount,

                total_amount:
                  numericAmount,

                coupon_code:
                  couponCode || null,

                discount_amount:
                  discountAmount,

                customer_name:
                  customerName,

                customer_email:
                  customerEmail,

                customer_phone:
                  customerPhone,

                billing_details:
                  billingDetails,

                shipping_address:
                  shippingAddress || {},

                shipping_method:
                  shippingMethod,
              };

              console.log(
                '[RazorpayButton] Sending verification request:',
                {
                  orderId:
                    razorpayOrderId,

                  paymentId:
                    razorpayPaymentId,

                  hasSignature:
                    Boolean(
                      razorpaySignature
                    ),

                  items:
                    serializedItems.length,

                  total:
                    numericAmount,

                  customer:
                    customerEmail,
                }
              );

              /*
               * -------------------------------------------------
               * STEP 11
               * Verify payment on backend
               * -------------------------------------------------
               */

              const verifyResponse =
                await apiServerClient.fetch(
                  '/razorpay/verify-payment',
                  {
                    method: 'POST',

                    headers: {
                      'Content-Type':
                        'application/json',
                    },

                    body:
                      JSON.stringify(
                        verifyPayload
                      ),
                  }
                );

              let verifyData = null;

              try {
                verifyData =
                  await verifyResponse.json();
              } catch {
                verifyData = null;
              }

              console.log(
                '[RazorpayButton] Verification response:',
                {
                  status:
                    verifyResponse.status,

                  ok:
                    verifyResponse.ok,

                  data:
                    verifyData,
                }
              );

              /*
               * -------------------------------------------------
               * IMPORTANT DEBUGGING
               * -------------------------------------------------
               *
               * If backend returns 400, show the REAL backend
               * message instead of only:
               *
               * "Payment verification failed"
               *
               * -------------------------------------------------
               */

              if (!verifyResponse.ok) {
                const backendMessage =
                  getErrorMessage(
                    verifyData,
                    `Payment verification failed (${verifyResponse.status}).`
                  );

                console.error(
                  '[RazorpayButton] Backend verification failed:',
                  {
                    status:
                      verifyResponse.status,

                    message:
                      backendMessage,

                    response:
                      verifyData,
                  }
                );

                throw new Error(
                  backendMessage
                );
              }

              if (
                verifyData?.success !== true
              ) {
                throw new Error(
                  getErrorMessage(
                    verifyData,
                    'Payment verification failed.'
                  )
                );
              }

              /*
               * -------------------------------------------------
               * STEP 12
               * Payment verified
               * -------------------------------------------------
               */

              const createdOrder = {
                id:
                  verifyData.orderId,

                orderNumber:
                  verifyData.orderNumber,

                payment_status:
                  'completed',

                order_status:
                  'pending',
              };

              console.log(
                '[RazorpayButton] ======================================='
              );

              console.log(
                '[RazorpayButton] PAYMENT VERIFIED SUCCESSFULLY'
              );

              console.log(
                '[RazorpayButton] MongoDB order:',
                createdOrder
              );

              /*
               * -------------------------------------------------
               * STEP 13
               * Clear cart
               * -------------------------------------------------
               */

              clearCart();

              /*
               * -------------------------------------------------
               * STEP 14
               * Success message
               * -------------------------------------------------
               */

              if (
                verifyData.orderNumber
              ) {
                toast.success(
                  `Payment successful! Order ${verifyData.orderNumber} has been placed.`
                );
              } else {
                toast.success(
                  'Payment successful! Your order has been placed.'
                );
              }

              /*
               * -------------------------------------------------
               * STEP 15
               * Callback / redirect
               * -------------------------------------------------
               */

              if (onSuccess) {
                onSuccess(
                  createdOrder
                );
              } else if (
                createdOrder.id
              ) {
                navigate(
                  `/order-confirmation/${createdOrder.id}`
                );
              }
            } catch (error) {
              console.error(
                '[RazorpayButton] ======================================='
              );

              console.error(
                '[RazorpayButton] PAYMENT VERIFICATION ERROR:',
                error
              );

              console.error(
                '[RazorpayButton] Error message:',
                error?.message
              );

              const message =
                error?.message ||
                'Payment verification failed.';

              toast.error(
                message
              );

              onError?.(
                error
              );
            } finally {
              setLoading(false);
            }
          },
      };

      /*
       * -------------------------------------------------------
       * STEP 9
       * Open Razorpay
       * -------------------------------------------------------
       */

      console.log(
        '[RazorpayButton] Opening Razorpay checkout:',
        {
          orderId:
            options.order_id,

          amountPaise:
            options.amount,

          currency:
            options.currency,
        }
      );

      const razorpay =
        new window.Razorpay(
          options
        );

      razorpay.on(
        'payment.failed',
        (response) => {
          console.error(
            '[RazorpayButton] Razorpay payment failed:',
            response?.error
          );

          const message =
            response?.error?.description ||
            'Payment failed. Please try again.';

          setLoading(false);

          toast.error(
            message
          );

          onError?.(
            response?.error ||
              new Error(
                message
              )
          );
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        '[RazorpayButton] Payment initialization failed:',
        error
      );

      const message =
        error?.message ||
        'Unable to initialize payment.';

      toast.error(
        message
      );

      onError?.(
        error
      );

      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={
        handlePayment
      }
      disabled={
        disabled ||
        loading ||
        !pb?.authStore?.isValid
      }
      className={
        className
      }
    >
      {loading
        ? 'Processing...'
        : children}
    </Button>
  );
};

export default RazorpayButton;
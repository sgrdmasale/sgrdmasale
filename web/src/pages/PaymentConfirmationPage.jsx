import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

const PaymentConfirmationPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPaymentStatus = async () => {
      try {
        const order = await pb.collection('orders').getOne(orderId, { $autoCancel: false });
        
        // If payment is completed, immediately route to the standard order confirmation page
        if (order.payment_status === 'completed') {
          navigate(`/order-confirmation/${orderId}`, { replace: true });
        } else if (order.payment_status === 'failed') {
          setError('Your payment failed or was declined. Please try again.');
        } else {
          setError('Payment status is still pending. If you just paid, please check your order history in a few minutes.');
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('Could not verify payment status. The order may not exist or you lack permissions.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      verifyPaymentStatus();
    } else {
      setError('Invalid order identifier provided.');
      setLoading(false);
    }
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
          <h2 className="text-xl font-medium text-foreground">Verifying your payment...</h2>
          <p className="text-muted-foreground">Please do not close this window.</p>
        </div>
      </div>
    );
  }

  // If we reach here, there is an error or payment is not completed
  return (
    <>
      <Helmet>
        <title>Payment Status - SGRD Masale</title>
      </Helmet>
      
      <div className="min-h-[80vh] flex items-center justify-center bg-muted/30 py-12 px-4">
        <Card className="max-w-md w-full shadow-lg border-border/50 overflow-hidden">
          <div className="bg-destructive/10 p-8 flex justify-center">
            <AlertCircle className="w-16 h-16 text-destructive" />
          </div>
          <CardContent className="p-8 text-center space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Payment Verification Failed</h1>
            <p className="text-muted-foreground leading-relaxed">
              {error || 'We could not confirm a successful payment for this order.'}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/checkout')} className="w-full sm:w-auto">
                Return to Checkout
              </Button>
              <Button onClick={() => navigate('/my-orders')} variant="outline" className="w-full sm:w-auto">
                View My Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PaymentConfirmationPage;
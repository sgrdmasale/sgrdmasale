import React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  return (
    <>
      <Helmet>
        <title>Order Confirmed - SGRD Masale</title>
        <meta name="description" content="Your order has been successfully placed. Thank you for shopping with SGRD Masale." />
      </Helmet>

      <Header />

      <div className="min-h-screen bg-background py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="rounded-2xl border-none shadow-xl bg-card overflow-hidden">
              <CardContent className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8"
                >
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </motion.div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance" style={{ letterSpacing: '-0.02em' }}>
                  Order confirmed!
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                  Thank you for your purchase. Your order has been successfully placed and will be processed shortly.
                </p>

                {(sessionId || orderId) && (
                  <div className="bg-muted/50 rounded-xl p-6 mb-8 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">Order Reference</p>
                    <p className="font-mono text-lg font-semibold text-foreground">
                      {orderId || sessionId}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    You will receive an email confirmation with your order details shortly.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                    <Button
                      size="lg"
                      onClick={() => window.location.href = '/shop'}
                      className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 px-8"
                    >
                      <ShoppingBag className="mr-2 w-5 h-5" />
                      Continue Shopping
                    </Button>
                    
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => window.location.href = '/profile'}
                      className="rounded-xl border-border/60 hover:bg-muted px-8"
                    >
                      View Orders
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-12 text-center"
            >
              <p className="text-muted-foreground mb-4">
                Need help with your order?
              </p>
              <Link to="/contact" className="text-primary hover:text-primary/80 font-medium underline">
                Contact our support team
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default SuccessPage;
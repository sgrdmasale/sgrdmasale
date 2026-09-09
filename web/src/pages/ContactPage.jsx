import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    console.log('[ContactPage] Submitting contact form data:', formData);

    try {
      // Submit to contact_submissions collection
      const record = await pb.collection('contact_submissions').create(formData, { $autoCancel: false });
      console.log('[ContactPage] Submission successful:', record);
      
      toast.success('Thank you! We will get back to you soon.');
      
      // Clear the form fields after successful submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('[ContactPage] Error submitting form:', error);
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Contact Us | Harjinder Singh and Sons - SGRD</title>
        <meta name="description" content="Get in touch with Harjinder Singh and Sons. We are here to answer your questions about our premium spices." />
      </Helmet>

      <Header />

      <main className="flex-grow">
        {/* Header Section */}
        <section className="bg-muted/30 py-16 md:py-24 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance" style={{ letterSpacing: '-0.02em' }}>
                Get in touch
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Whether you have a question about our spices, need help with an order, or just want to share a recipe, we'd love to hear from you.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
              
              {/* Company Information Section */}
              <motion.div 
                className="lg:col-span-5 space-y-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div>
                  <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    Our team is available to assist you with any inquiries. Reach out to us through any of the following channels.
                  </p>
                </div>

                <div className="space-y-6">
                  <Card className="border-none shadow-sm bg-muted/50">
                    <CardContent className="p-6 flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Visit Us</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          915/8, Chhan Gali, Laxmansar Bazar,<br />
                          Chowk Baba Sahib, Amritsar,<br />
                          Punjab, India
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-muted/50">
                    <CardContent className="p-6 flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Call Us</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          +91 9878601397
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-muted/50">
                    <CardContent className="p-6 flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Email Us</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          sgrdmasale@gmail.com
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-muted/50">
                    <CardContent className="p-6 flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Business Hours</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Monday - Saturday: 9:00 AM - 8:00 PM<br />
                          Sunday: Closed
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>

              {/* Contact Form Section */}
              <motion.div 
                className="lg:col-span-7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="shadow-lg border-border/50 rounded-2xl overflow-hidden">
                  <CardContent className="p-8 md:p-10">
                    <h2 className="text-2xl font-bold mb-8">Send us a message</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input 
                            id="name" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            required 
                            placeholder="John Doe"
                            className="text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                            placeholder="john@example.com"
                            className="text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input 
                            id="phone" 
                            name="phone" 
                            type="tel" 
                            value={formData.phone} 
                            onChange={handleChange} 
                            required 
                            placeholder="+91 98765 43210"
                            className="text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input 
                            id="subject" 
                            name="subject" 
                            value={formData.subject} 
                            onChange={handleChange} 
                            required 
                            placeholder="How can we help?"
                            className="text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea 
                          id="message" 
                          name="message" 
                          value={formData.message} 
                          onChange={handleChange} 
                          required 
                          placeholder="Write your message here..."
                          className="min-h-[150px] resize-y text-foreground placeholder:text-muted-foreground"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full py-6 text-lg rounded-xl" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Sending...' : (
                          <>
                            Send Message
                            <Send className="ml-2 w-5 h-5" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
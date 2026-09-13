import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  Tag,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

import pb from '@/lib/pocketbaseClient.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { toast } from 'sonner';

const EMPTY_FORM = {
  business_type: '',
  company_name: '',
  contact_person_name: '',
  email: '',
  phone: '',
  requirements: '',
};

const PartnershipsPage = () => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      business_type: value,
    }));
  };

  const validateForm = () => {
    if (!formData.business_type) {
      toast.error('Please select a business type.');
      return false;
    }

    if (!formData.company_name.trim()) {
      toast.error('Please enter your company name.');
      return false;
    }

    if (!formData.contact_person_name.trim()) {
      toast.error('Please enter the contact person name.');
      return false;
    }

    if (!formData.email.trim()) {
      toast.error('Please enter your email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Please enter a valid email address.');
      return false;
    }

    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number.');
      return false;
    }

    if (!formData.requirements.trim()) {
      toast.error('Please describe your requirements.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);

    /*
     * Send only the fields that belong to the
     * partnership_inquiries MongoDB collection.
     */
    const payload = {
      business_type: formData.business_type.trim(),
      company_name: formData.company_name.trim(),
      contact_person_name: formData.contact_person_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      requirements: formData.requirements.trim(),
    };

    console.log(
      '[PartnershipsPage] Sending partnership inquiry:',
      payload
    );

    try {
      const record = await pb
        .collection('partnership_inquiries')
        .create(payload);

      console.log(
        '[PartnershipsPage] Inquiry submitted successfully:',
        record
      );

      toast.success(
        'Thank you for your interest! We will contact you shortly.'
      );

      setFormData(EMPTY_FORM);
    } catch (error) {
      console.error(
        '[PartnershipsPage] Error submitting inquiry:',
        error
      );

      /*
       * Show useful backend validation information.
       */
      if (error?.status === 400) {
        const backendMessage =
          error?.data?.error ||
          error?.data?.message ||
          error?.message;

        toast.error(
          backendMessage || 'Please check the information you entered.'
        );
      } else if (error?.status === 401) {
        toast.error(
          'Authentication is required to submit this inquiry.'
        );
      } else if (error?.status === 403) {
        toast.error(
          'You are not authorized to submit this inquiry.'
        );
      } else if (error?.status >= 500) {
        toast.error(
          'Server error. Please try again later.'
        );
      } else if (
        error?.message === 'Failed to fetch' ||
        error?.name === 'TypeError'
      ) {
        toast.error(
          'Unable to connect to the server. Please try again.'
        );
      } else {
        toast.error(
          error?.message ||
            'Failed to send inquiry. Please try again later.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = (type = '') => {
    setFormData((prev) => ({
      ...prev,
      business_type: type,
    }));

    setTimeout(() => {
      document
        .getElementById('inquiry-form')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>
          Partner With Us | Harjinder Singh and Sons - SGRD
        </title>

        <meta
          name="description"
          content="Explore business opportunities with SGRD. We offer bulk buying, distributorship, and white label packaging for our premium spices."
        />
      </Helmet>

      <Header />

      <main className="flex-grow">

        {/* =====================================================
            HERO
        ====================================================== */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1685450186047-42c619545481"
              alt="Spice market sacks"
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-black/70" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <h1
                className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6"
                style={{ letterSpacing: '-0.02em' }}
              >
                Partner With Us
              </h1>

              <p className="text-xl text-gray-300 leading-relaxed mb-10">
                Join hands with Harjinder Singh and Sons to bring
                authentic, premium Indian spices to a wider audience.
                Explore our tailored business opportunities.
              </p>

              <Button
                size="lg"
                onClick={() => scrollToForm('')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-xl"
              >
                Start a Conversation
              </Button>
            </motion.div>
          </div>
        </section>

        {/* =====================================================
            OPPORTUNITIES
        ====================================================== */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">

            {/* BULK BUYERS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: '-100px' }}
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <Package className="w-7 h-7 text-primary" />
                </div>

                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
                  Bulk Buyers
                </h2>

                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Perfect for restaurants, hotels, caterers, and food
                  manufacturers who require consistent, high-quality
                  spices in large volumes. We ensure that every batch
                  meets our rigorous standards for aroma, flavor, and
                  purity.
                </p>

                <ul className="space-y-4 mb-8">
                  {[
                    'Competitive wholesale pricing',
                    'Consistent quality across batches',
                    'Priority processing and dispatch',
                    'Custom blend creation available',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="w-6 h-6 text-primary mr-3 flex-shrink-0" />
                      <span className="text-foreground font-medium">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  onClick={() => scrollToForm('Bulk Buyer')}
                  className="rounded-xl"
                >
                  Inquire for Bulk Orders
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: '-100px' }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-muted rounded-[2rem] -z-10 transform rotate-3" />

                <img
                  src="https://images.unsplash.com/photo-1672702959512-af149104c388"
                  alt="Bulk spices"
                  className="rounded-2xl shadow-xl w-full object-cover h-[500px]"
                />
              </motion.div>
            </div>

            {/* DISTRIBUTORS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: '-100px' }}
                className="relative order-2 lg:order-1"
              >
                <div className="absolute -inset-4 bg-primary/10 rounded-[2rem] -z-10 transform -rotate-3" />

                <img
                  src="https://images.unsplash.com/photo-1636924271402-d639875aa2bb"
                  alt="Spice distribution"
                  className="rounded-2xl shadow-xl w-full object-cover h-[500px]"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: '-100px' }}
                className="order-1 lg:order-2"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <Truck className="w-7 h-7 text-primary" />
                </div>

                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
                  Distributors
                </h2>

                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Expand your product portfolio with a trusted heritage
                  brand. We are actively looking for regional and national
                  distributors to bring SGRD spices to retail shelves
                  across the country and beyond.
                </p>

                <ul className="space-y-4 mb-8">
                  {[
                    'Exclusive territorial rights',
                    'Marketing and promotional support',
                    'Attractive profit margins',
                    'Reliable supply chain logistics',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="w-6 h-6 text-primary mr-3 flex-shrink-0" />
                      <span className="text-foreground font-medium">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  onClick={() => scrollToForm('Distributor')}
                  className="rounded-xl"
                >
                  Become a Distributor
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            </div>

            {/* WHITE LABEL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: '-100px' }}
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <Tag className="w-7 h-7 text-primary" />
                </div>

                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">
                  White Label Customers
                </h2>

                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Launch your own spice brand without the hassle of
                  sourcing and processing. We provide end-to-end white
                  label solutions, delivering our premium spices in your
                  custom packaging.
                </p>

                <ul className="space-y-4 mb-8">
                  {[
                    'Premium quality under your brand name',
                    'Custom packaging and labeling options',
                    'Flexible minimum order quantities',
                    'Quality certification assistance',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="w-6 h-6 text-primary mr-3 flex-shrink-0" />
                      <span className="text-foreground font-medium">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  onClick={() => scrollToForm('White Label')}
                  className="rounded-xl"
                >
                  Explore White Label
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: '-100px' }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-muted rounded-[2rem] -z-10 transform rotate-3" />

                <img
                  src="https://images.unsplash.com/photo-1672702959512-af149104c388"
                  alt="Premium vibrant raw spices"
                  className="rounded-2xl shadow-xl w-full object-cover h-[500px]"
                />
              </motion.div>
            </div>

          </div>
        </section>

        {/* =====================================================
            INQUIRY FORM
        ====================================================== */}
        <section
          id="inquiry-form"
          className="py-24 bg-muted/30 border-t"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Submit an Inquiry
              </h2>

              <p className="text-lg text-muted-foreground">
                Fill out the form below and our partnership team will get
                back to you within 24 hours.
              </p>
            </div>

            <Card className="shadow-lg border-border/50 rounded-2xl overflow-hidden">
              <CardContent className="p-8 md:p-10">

                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >

                  {/* BUSINESS TYPE */}
                  <div className="space-y-2">
                    <Label htmlFor="business_type">
                      Business Type
                    </Label>

                    <Select
                      value={formData.business_type}
                      onValueChange={handleSelectChange}
                    >
                      <SelectTrigger
                        id="business_type"
                        className="w-full text-foreground"
                      >
                        <SelectValue placeholder="Select partnership type" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="Bulk Buyer">
                          Bulk Buyer
                        </SelectItem>

                        <SelectItem value="Distributor">
                          Distributor
                        </SelectItem>

                        <SelectItem value="White Label">
                          White Label
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* COMPANY + CONTACT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="space-y-2">
                      <Label htmlFor="company_name">
                        Company Name
                      </Label>

                      <Input
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        required
                        placeholder="Your Company Ltd."
                        className="text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_person_name">
                        Contact Person Name
                      </Label>

                      <Input
                        id="contact_person_name"
                        name="contact_person_name"
                        value={formData.contact_person_name}
                        onChange={handleChange}
                        required
                        placeholder="Jane Doe"
                        className="text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                  </div>

                  {/* EMAIL + PHONE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email Address
                      </Label>

                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="jane@company.com"
                        className="text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone Number
                      </Label>

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

                  </div>

                  {/* REQUIREMENTS */}
                  <div className="space-y-2">
                    <Label htmlFor="requirements">
                      Requirements / Message
                    </Label>

                    <Textarea
                      id="requirements"
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleChange}
                      required
                      placeholder="Please describe your requirements, expected volumes, or any specific questions..."
                      className="min-h-[150px] resize-y text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* SUBMIT */}
                  <Button
                    type="submit"
                    className="w-full py-6 text-lg rounded-xl"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Submitting...'
                      : 'Submit Inquiry'}
                  </Button>

                </form>
              </CardContent>
            </Card>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default PartnershipsPage;
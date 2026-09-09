import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Award, Truck, Shield, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductsList from '@/components/ProductsList.jsx';
import ReviewCard from '@/components/ReviewCard.jsx';
import BannerCarousel from '@/components/BannerCarousel.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import pb from '@/lib/pocketbaseClient.js';
const dummyReviews = [];
const HomePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  useEffect(() => {
    console.log('[HomePage] Mounted');
    const fetchCategories = async () => {
      try {
        const records = await pb.collection('categories').getFullList({
          filter: 'status = true',
          sort: 'name',
        });
        setCategories(records);
      } catch (error) {
        console.error('[HomePage] Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);
  return <>
      <Helmet>
        <title>SGRD - Premium Indian Spices | Harjinder Singh and Sons</title>
        <meta name="description" content="Shop authentic Indian spices from Harjinder Singh and Sons. Premium quality saffron, turmeric, cardamom, and more delivered to your doorstep." />
      </Helmet>

      {/* Banner Carousel Section */}
      <ErrorBoundary>
        <BannerCarousel />
      </ErrorBoundary>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[{
            icon: Award,
            title: 'Premium Quality',
            desc: 'Handpicked spices from trusted sources'
          }, {
            icon: Shield,
            title: 'Pure & Natural',
            desc: 'No additives or preservatives'
          }, {
            icon: Truck,
            title: 'Fast Delivery',
            desc: 'Delivered fresh to your doorstep'
          }, {
            icon: Star,
            title: 'Trusted Since 1947',
            desc: 'Three generations of expertise'
          }].map((feature, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: index * 0.1
          }} viewport={{
            once: true
          }} className="h-full">
                <div className="p-8 text-center rounded-3xl bg-card border border-border/60 hover:border-primary/30 transition-all duration-300 h-full flex flex-col justify-center shadow-sm hover:shadow-md group">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed font-medium">{feature.desc}</p>
                </div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-24 bg-muted/30 overflow-hidden border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="text-center mb-8">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5
          }} viewport={{
            once: true
          }}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-balance">
                Featured Products
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                Discover our most popular premium spices, loved by home cooks and professional chefs alike.
              </p>
            </motion.div>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && <motion.div initial={{
          opacity: 0,
          y: 10
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.4,
          delay: 0.2
        }} viewport={{
          once: true
        }} className="flex overflow-x-auto pb-4 gap-3 no-scrollbar justify-start md:justify-center -mx-4 px-4 md:mx-0 md:px-0">
              <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} onClick={() => setSelectedCategory('all')} className={`rounded-full whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'shadow-md shadow-primary/20 bg-primary text-primary-foreground font-bold' : 'bg-background hover:bg-muted font-medium'}`}>
                All Spices
              </Button>
              {categories.map(category => <Button key={category.id} variant={selectedCategory === category.id ? 'default' : 'outline'} onClick={() => setSelectedCategory(category.id)} className={`rounded-full whitespace-nowrap transition-all ${selectedCategory === category.id ? 'shadow-md shadow-primary/20 bg-primary text-primary-foreground font-bold' : 'bg-background hover:bg-muted font-medium'}`}>
                  {category.name || category.title}
                </Button>)}
            </motion.div>}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[400px]">
          <ProductsList selectedCategory={selectedCategory} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center">
          <Button size="lg" variant="outline" onClick={() => navigate('/shop')} className="rounded-full px-10 h-14 text-lg border-border/60 shadow-sm hover:bg-primary hover:text-primary-foreground hover:border-primary font-bold transition-all active:scale-95 group bg-background">
            View All Products
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Premium Sorting & Quality Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{
            opacity: 0,
            scale: 0.95
          }} whileInView={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.6
          }} viewport={{
            once: true,
            margin: "-100px"
          }} className="relative">
              <div className="absolute -inset-4 bg-muted rounded-[2.5rem] -z-10 transform rotate-3"></div>
              <img src="https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/quality-7Im23.jpg" alt="Premium spice sorting and quality control" className="rounded-3xl shadow-xl w-full object-cover aspect-[4/3]" />
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            x: 30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.6
          }} viewport={{
            once: true,
            margin: "-100px"
          }}>
              <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-full mb-6 border border-primary/20">
                <span className="text-sm font-bold text-primary tracking-wider uppercase">Quality Assurance</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight text-balance">
                Premium sorting & quality control
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed font-medium">
                Every spice undergoes rigorous inspection and sorting to ensure only the finest grains make it to your kitchen. Our quality control process is meticulous and uncompromising.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-medium">
                We employ traditional methods combined with modern technology to guarantee that each batch meets our exacting standards for aroma, color, and potency.
              </p>
              <ul className="space-y-4">
                {['Hand-sorted for purity', 'Tested for aroma and flavor', 'Zero defects policy', 'Certified quality standards'].map((item, i) => <li key={i} className="flex items-center text-foreground font-bold text-lg">
                    <span className="w-2.5 h-2.5 bg-primary rounded-full mr-4"></span>
                    {item}
                  </li>)}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Heritage & Roots Section */}
      <section className="py-24 bg-muted/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{
            opacity: 0,
            x: -20
          }} whileInView={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.6
          }} viewport={{
            once: true
          }} className="order-2 lg:order-1">
              <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-full mb-6 border border-primary/20">
                <span className="text-sm font-bold text-primary tracking-wider uppercase">Our Heritage</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight text-balance">
                Three generations of spice expertise
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed font-medium">
                Established in 2017 in the heart of Amritsar, Harjinder Singh and Sons has been a trusted name in premium Indian spices for years. What started as a small family business has grown into a beloved brand.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-medium">
                We source our spices directly from farmers, ensuring the highest quality and supporting local communities. Every product is carefully selected, tested, and packaged to preserve its natural aroma and flavor.
              </p>
              <Button size="lg" onClick={() => navigate('/about')} className="rounded-xl h-14 px-8 text-lg font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-transform active:scale-95 group">
                Discover Our Story
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            scale: 0.95
          }} whileInView={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.6
          }} viewport={{
            once: true
          }} className="relative order-1 lg:order-2">
              <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] -z-10 transform -rotate-3"></div>
              <img src="https://images.unsplash.com/photo-1685450186047-42c619545481" alt="Amritsar spice market heritage and atmosphere" className="rounded-3xl shadow-2xl object-cover h-[500px] w-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5
          }} viewport={{
            once: true
          }}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-balance">
                What our customers say
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                Join thousands of satisfied customers who trust SGRD for their spice needs.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {dummyReviews.map((review, index) => <motion.div key={review.id} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.5,
            delay: index * 0.1
          }} viewport={{
            once: true
          }} className="h-full">
                <ReviewCard review={review} />
              </motion.div>)}
          </div>

          <div className="text-center">
            <Button size="lg" asChild className="rounded-xl h-14 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground px-10 text-lg font-bold transition-transform active:scale-95 group">
              <a href="https://search.google.com/local/reviews?placeid=ChIJR5YGONx9GTkRrmw3UxcX4eU" target="_blank" rel="noopener noreferrer">
                View All Reviews
                <ExternalLink className="ml-2 w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </Button>
          </div>
        </div>
      </section>

    </>;
};
export default HomePage;

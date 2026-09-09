import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Award, Leaf, Users, ShieldCheck, HeartHandshake, History } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
const AboutPage = () => {
  return <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>About Us | Harjinder Singh and Sons - SGRD</title>
        <meta name="description" content="Learn about Harjinder Singh and Sons (SGRD), established in 2018 in Amritsar. We bring you premium quality spices with a commitment to authenticity and heritage." />
      </Helmet>

      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden bg-primary/5">
          <div className="absolute inset-0 z-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6
          }} className="max-w-3xl mx-auto">
              <img src="https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/fd86f6287aeec79dae55a25e55821f3f.png" alt="SGRD Logo" className="w-24 h-24 md:w-32 md:h-32 object-contain mx-auto mb-8 drop-shadow-xl" />
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance mb-6">
                The essence of <span className="text-primary">authentic</span> flavor.
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Harjinder Singh and Sons (SGRD) is dedicated to sourcing and delivering the finest, premium quality spices from the heart of Amritsar to your kitchen.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Company Story - Zig-zag 1 */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div initial={{
              opacity: 0,
              x: -30
            }} whileInView={{
              opacity: 1,
              x: 0
            }} transition={{
              duration: 0.6
            }} viewport={{
              once: true,
              margin: "-100px"
            }}>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Our Heritage & Roots</h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Established in 2017 in the culturally rich city of Amritsar, India, Harjinder Singh and Sons was born out of a deep-rooted passion for authentic Indian cuisine. We recognized a growing gap between mass-produced spices and the pure, unadulterated flavors our grandparents used.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  The brand SGRD stands as a testament to our commitment to purity. Every blend, every whole spice, and every powder is sourced with meticulous attention to detail, ensuring that the legacy of true Indian cooking is preserved for generations to come.
                </p>
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
              once: true,
              margin: "-100px"
            }} className="relative">
                <div className="absolute -inset-4 bg-muted rounded-[2rem] -z-10 transform rotate-3"></div>
                <img src="https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/3-IYFh2.jpg" alt="Traditional spice market heritage in Amritsar" className="rounded-2xl shadow-xl w-full object-cover aspect-[4/3]" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Heritage Atmosphere Section */}
        <section className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6
            }} viewport={{
              once: true
            }} className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden group">
                <img src="https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/4-XmbXh.jpg" alt="Traditional spice bowls" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8">
                  <p className="text-white font-medium tracking-wider uppercase text-sm">A Legacy in Every Grain</p>
                </div>
              </motion.div>

              <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6,
              delay: 0.2
            }} viewport={{
              once: true
            }} className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden group md:mt-16">
                <img src="https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/5-uxR2Z.jpg" alt="Vibrant spice market" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8">
                  <p className="text-white font-medium tracking-wider uppercase text-sm">The Colors of Amritsar</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* What Makes Us Special - Zig-zag 2 */}
        <section className="py-24 bg-muted/40">
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
            }} className="relative order-2 lg:order-1">
                <div className="absolute -inset-4 bg-primary/10 rounded-[2rem] -z-10 transform -rotate-3"></div>
                <img src="https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/compare-tN2E6.jpg" alt="Premium sorting of spices" className="rounded-2xl shadow-xl w-full object-cover aspect-[4/3]" />
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
            }} className="order-1 lg:order-2">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">The SGRD Difference</h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  We are not just distributors; we are curators of flavor. Our expertise lies in the rigorous selection process that guarantees only the most potent and aromatic spices make it to your table.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mt-1">
                      <Leaf className="w-6 h-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold mb-2">Direct Sourcing</h3>
                      <p className="text-muted-foreground leading-relaxed">We work closely with trusted farmers across India, eliminating middlemen to ensure freshness and fair trade.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mt-1">
                      <ShieldCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold mb-2">Uncompromised Quality</h3>
                      <p className="text-muted-foreground leading-relaxed">Zero artificial colors, fillers, or preservatives. You get exactly what nature intended.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Core Values - Bento Grid */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Our Core Values</h2>
              <p className="text-lg text-muted-foreground">
                The principles that guide every decision we make at Harjinder Singh and Sons.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: 0.1
            }} viewport={{
              once: true
            }} className="col-span-1 md:col-span-2 bg-muted rounded-3xl p-8 md:p-12 flex flex-col justify-center">
                <Award className="w-10 h-10 text-primary mb-6" />
                <h3 className="text-2xl font-bold mb-4">Excellence in Every Batch</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  From the moment a spice is harvested to the minute it's sealed in our packaging, we maintain strict quality control standards. We believe that premium ingredients are the foundation of extraordinary meals.
                </p>
              </motion.div>

              <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: 0.2
            }} viewport={{
              once: true
            }} className="col-span-1 bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 flex flex-col justify-center">
                <HeartHandshake className="w-10 h-10 mb-6 opacity-80" />
                <h3 className="text-2xl font-bold mb-4">Customer Trust</h3>
                <p className="text-primary-foreground/80 text-lg leading-relaxed">
                  Your trust is our most valued asset. We are fully transparent about our sourcing and processing.
                </p>
              </motion.div>

              <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: 0.3
            }} viewport={{
              once: true
            }} className="col-span-1 bg-secondary text-secondary-foreground rounded-3xl p-8 md:p-12 flex flex-col justify-center">
                <History className="w-10 h-10 mb-6 text-primary" />
                <h3 className="text-2xl font-bold mb-4">Preserving Tradition</h3>
                <p className="text-secondary-foreground/80 text-lg leading-relaxed">
                  Honoring the ancient Indian science of spice blending for modern kitchens.
                </p>
              </motion.div>

              <motion.div initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: 0.4
            }} viewport={{
              once: true
            }} className="col-span-1 md:col-span-2 border border-border bg-card rounded-3xl p-8 md:p-12 flex flex-col justify-center shadow-sm">
                <Users className="w-10 h-10 text-primary mb-6" />
                <h3 className="text-2xl font-bold mb-4">Community Focused</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Born in Amritsar, serving all of India. We are deeply connected to our local roots while embracing the diversity of culinary traditions nationwide. We support ethical farming practices that uplift rural communities.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>;
};
export default AboutPage;
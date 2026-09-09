import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const products = [
  { 
    title: "Green Cardamom", 
    src: "https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/148dd4193190a1b41d4535b59e704e11.png" 
  },
  { 
    title: "Haldi Powder", 
    src: "https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/e26b8ac916a895dee11a66eba06a984e.png" 
  },
  { 
    title: "Dal Makhni Masala", 
    src: "https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/1a444274f5428fa7b49365052d0eddab.png" 
  },
  { 
    title: "Garam Masala", 
    src: "https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/7bdacfc4dc93afafeb05dcbdcec60968.png" 
  },
  { 
    title: "Dhania Powder", 
    src: "https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/56e0c926b9936c957d2ee25cb8d44c67.png" 
  },
  { 
    title: "Chat Masala", 
    src: "https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/e0fe77b1d427f98db935fd45ac484d3f.png" 
  }
];

export default function ProductCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll functionality
  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [isHovered]);

  return (
    <div
      className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square max-h-[600px] bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden group shadow-2xl flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-0"></div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 1.05 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 flex flex-col items-center justify-center p-8 pb-20 z-10"
        >
          <img
            src={products[currentIndex].src}
            alt={`${products[currentIndex].title} - Premium Spice`}
            className="w-full h-full object-contain filter drop-shadow-2xl"
            loading="eager"
          />
          <div className="absolute bottom-16 left-0 right-0 text-center">
            <h3 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg tracking-wide">
              {products[currentIndex].title}
            </h3>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2.5 z-20">
        {products.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              idx === currentIndex
                ? "bg-primary w-8 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                : "bg-white/40 hover:bg-white/80 w-2"
            )}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
      
      {/* Pause indicator tooltip */}
      <div className={cn(
        "absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white/80 text-xs px-3 py-1.5 rounded-full z-20 transition-opacity duration-300",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        Paused
      </div>
    </div>
  );
}
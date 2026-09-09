import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-zinc-950 text-zinc-300 pt-20 pb-10 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-1.5 rounded-xl">
                <img 
                  src="https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/fd86f6287aeec79dae55a25e55821f3f.png" 
                  alt="SGRD Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <h3 className="font-bold text-white text-xl tracking-tight">SGRD Masale</h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Premium Indian spices, carefully sourced and masterfully blended since 1947. Experience the authentic taste of tradition in every pinch.
            </p>
            <div className="space-y-4 text-sm text-zinc-400 pt-2">
              <div className="flex items-start space-x-3 group">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary group-hover:text-accent transition-colors" />
                <span className="leading-relaxed">915/8, Chhan Gali, Laxmansar Bazar, Chowk Baba Sahib, Amritsar</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <Phone className="w-5 h-5 flex-shrink-0 text-primary group-hover:text-accent transition-colors" />
                <span>+91 9878601397</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <Mail className="w-5 h-5 flex-shrink-0 text-primary group-hover:text-accent transition-colors" />
                <span>sgrdmasale@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Quick Links</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/" className="text-zinc-400 hover:text-primary transition-colors font-medium flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary/50"></span> Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-zinc-400 hover:text-primary transition-colors font-medium flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary/50"></span> About SGRD
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-zinc-400 hover:text-primary transition-colors font-medium flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary/50"></span> Shop Spices
                </Link>
              </li>
              <li>
                <Link to="/partnerships" className="text-zinc-400 hover:text-primary transition-colors font-medium flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary/50"></span> Partner With Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-zinc-400 hover:text-primary transition-colors font-medium flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary/50"></span> Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Policies */}
          <div>
            <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Legal & Policies</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/return-policy" className="text-zinc-400 hover:text-primary transition-colors font-medium flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary/50"></span> Return Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-zinc-400 hover:text-primary transition-colors font-medium flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary/50"></span> Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="text-zinc-400 hover:text-primary transition-colors font-medium flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary/50"></span> Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-conditions" className="text-zinc-400 hover:text-primary transition-colors font-medium flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary/50"></span> Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Follow Us</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">Stay updated with our latest spices, authentic recipes, and exclusive seasonal offers.</p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com/sgrdmasale"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-zinc-900 text-zinc-400 rounded-full flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all duration-300 hover:-translate-y-1"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/sgrdmasale"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-zinc-900 text-zinc-400 rounded-full flex items-center justify-center hover:bg-[#E4405F] hover:text-white transition-all duration-300 hover:-translate-y-1"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com/@sgrdmasale"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-zinc-900 text-zinc-400 rounded-full flex items-center justify-center hover:bg-[#FF0000] hover:text-white transition-all duration-300 hover:-translate-y-1"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} Harjinder Singh and Sons. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
             <span className="font-medium text-zinc-400">Premium Indian Spices</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
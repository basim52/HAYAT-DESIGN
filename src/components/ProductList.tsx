import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { PRODUCTS } from '../constants';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
}

export default function ProductList({ 
  products, 
  onAddToCart, 
  title = "مجموعة مختارة",
  subtitle = "لعشاق التميز",
  showFilters = true
}: ProductListProps) {
  const [activeTab, setActiveTab] = useState('الكل');
  
  const categories = ['الكل', ...new Set(products.map(p => p.category))];
  
  const filteredProducts = activeTab === 'الكل' 
    ? products 
    : products.filter(p => p.category === activeTab);

  if (products.length === 0) return null;

  return (
    <section className="py-12 md:py-24 bg-gold-light/20 border-b border-gold/5 last:border-0 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-16 gap-6 md:gap-8 text-right">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-5xl font-extrabold mb-3 md:mb-4 tracking-tighter"
            >
              {title} <br />
              <span className="text-gold">{subtitle}</span>
            </motion.h2>
            <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-relaxed">أحدث ما أنتجته ورشنا الفنية بدقة وحب</p>
          </div>
          
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 md:gap-3 flex-row-reverse bg-white/50 p-1.5 md:p-2 rounded-[28px] border border-border-subtle lux-shadow backdrop-blur-sm self-center md:self-end overflow-x-auto no-scrollbar max-w-full"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`relative px-4 md:px-8 py-2 md:py-3 rounded-[22px] text-[9px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 z-10 whitespace-nowrap ${
                    activeTab === cat 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-brand-purple'
                  }`}
                >
                  {activeTab === cat && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-brand-purple rounded-[20px] -z-10 shadow-lg shadow-brand-purple/30"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-20">{cat}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <motion.div 
          layout
          className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8"
        >
          <AnimatePresence mode="popLayout">
            {(showFilters ? filteredProducts : products).map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.05
                }}
              >
                <ProductCard 
                  product={product} 
                  onAddToCart={onAddToCart} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

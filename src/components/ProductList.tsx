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
    <section className="py-24 bg-gold-light/20 border-b border-gold/5 last:border-0">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 text-right">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tighter"
            >
              {title} <br />
              <span className="text-gold">{subtitle}</span>
            </motion.h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">أحدث ما أنتجته ورشنا الفنية بدقة وحب</p>
          </div>
          
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-wrap gap-2 md:gap-3 flex-row-reverse bg-white/50 p-2 rounded-[28px] border border-border-subtle lux-shadow backdrop-blur-sm self-center md:self-end"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`relative px-6 md:px-8 py-3 rounded-[22px] text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 z-10 ${
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
                  {activeTab === cat && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-2 h-2 bg-brand-teal rounded-full border-2 border-white"
                    />
                  )}
                  <span className="relative z-20 whitespace-nowrap">{cat}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <motion.div 
          layout
          className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8"
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

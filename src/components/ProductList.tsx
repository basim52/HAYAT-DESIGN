import { motion } from 'motion/react';
import { useState } from 'react';
import { PRODUCTS } from '../constants';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export default function ProductList({ products, onAddToCart }: ProductListProps) {
  const [activeTab, setActiveTab] = useState('الكل');
  
  const categories = ['الكل', ...new Set(products.map(p => p.category))];
  
  const filteredProducts = activeTab === 'الكل' 
    ? products 
    : products.filter(p => p.category === activeTab);

  return (
    <section id="products" className="py-24 bg-gold-light/20">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 text-right">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tighter"
            >
              مجموعة مختارة <br />
              <span className="text-gold">لعشاق التميز</span>
            </motion.h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">أحدث ما أنتجته ورشنا الفنية بدقة وحب</p>
          </div>
          
          <div className="flex flex-wrap gap-3 flex-row-reverse">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-8 py-3 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all duration-300 border ${
                  activeTab === cat 
                    ? 'bg-charcoal text-white border-charcoal' 
                    : 'bg-white text-gray-500 border-border-subtle hover:border-gold hover:text-gold'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {filteredProducts.map((product) => (
            <div key={product.id}>
              <ProductCard 
                product={product} 
                onAddToCart={onAddToCart} 
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

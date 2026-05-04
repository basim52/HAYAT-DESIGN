import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-border-subtle rounded-[24px] md:rounded-3xl p-3 md:p-5 flex flex-col group hover:shadow-lg transition-all duration-500"
    >
      <div className="h-32 sm:h-48 md:h-64 bg-gold-light rounded-[18px] md:rounded-2xl mb-3 md:mb-5 flex items-center justify-center overflow-hidden relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-[10px] font-extrabold text-gold border border-border-subtle uppercase tracking-widest">
          {product.category}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 md:gap-4">
        <div className="flex-1 w-full">
          <h3 className="font-extrabold text-[11px] md:text-base mb-0.5 md:mb-1 text-[#2C2C2C] line-clamp-1">{product.name}</h3>
          <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-2 md:mb-4">{product.category}</span>
          
          <div className="text-[#008077] font-black text-sm md:text-lg flex items-center gap-1">
            <span>{product.price}</span>
            <span className="text-[9px] font-bold text-gray-500">ر.س</span>
          </div>
        </div>
        
        <button
          onClick={() => onAddToCart(product)}
          className="px-6 py-2 bg-brand-purple text-white rounded-xl text-[10px] md:text-xs font-extrabold hover:bg-brand-purple/90 transition-all whitespace-nowrap flex items-center justify-center gap-1 md:gap-2 group/btn w-full md:w-fit shadow-md shadow-brand-purple/20"
        >
          أضف للسلة
          <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

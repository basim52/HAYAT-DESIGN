import { Plus } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-white border border-border-subtle rounded-[24px] md:rounded-3xl p-3 md:p-5 flex flex-col group hover:shadow-lg transition-all duration-500 h-full">
      <div className="h-40 sm:h-48 md:h-64 bg-gold-light rounded-[18px] md:rounded-2xl mb-3 md:mb-5 flex items-center justify-center overflow-hidden relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-extrabold text-gold border border-border-subtle uppercase tracking-widest">
          {product.category}
        </div>
      </div>
      
      <div className="flex flex-col justify-between h-full gap-4">
        <div className="w-full">
          <h3 className="font-extrabold text-[11px] md:text-base mb-0.5 md:mb-1 text-[#2C2C2C] line-clamp-1">{product.name}</h3>
          <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1 md:mb-2">{product.category}</span>
          
          <div className="text-[#008077] font-black text-base md:text-xl flex items-center gap-1">
            <span>{product.price}</span>
            <span className="text-[9px] font-bold text-gray-500">ر.س</span>
          </div>
        </div>
        
        <button
          onClick={() => onAddToCart(product)}
          className="px-6 py-3 bg-brand-purple text-white rounded-xl text-[10px] md:text-xs font-black hover:bg-brand-purple/90 transition-all whitespace-nowrap flex items-center justify-center gap-1 md:gap-3 group/btn w-full shadow-md shadow-brand-purple/20 active:scale-95"
        >
          أضف للسلة
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
        </button>
      </div>
    </div>
  );
}

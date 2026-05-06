import { Category } from '../types';
import { motion } from 'motion/react';

interface MobileCategoryBarProps {
  categories: Category[];
  onCategoryClick: (slug: string) => void;
}

export default function MobileCategoryBar({ categories, onCategoryClick }: MobileCategoryBarProps) {
  if (categories.length === 0) return null;

  return (
    <div className="md:hidden relative z-30 bg-white border-b border-border-subtle overflow-hidden">
      <div className="flex overflow-x-auto no-scrollbar scroll-smooth py-4 px-4 gap-3 bg-white">
        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCategoryClick(category.slug)}
            className={`flex-none px-5 py-2.5 bg-muted-bg border border-border-subtle rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${
              index % 2 === 0 ? 'text-brand-purple border-brand-purple/10' : 'text-brand-teal border-brand-teal/10'
            }`}
          >
            {category.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

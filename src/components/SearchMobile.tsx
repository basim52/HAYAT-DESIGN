import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchMobileProps {
  onSearch: (query: string) => void;
}

export default function SearchMobile({ onSearch }: SearchMobileProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query, onSearch]);

  return (
    <div className="md:hidden px-4 pt-4 pb-2 bg-white sticky top-[80px] z-[35]">
      <div className={`relative flex items-center transition-all duration-300 ${isFocused ? 'ring-2 ring-brand-teal/20' : ''}`}>
        <div className="absolute right-4 text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="ابحث عن منتجك المفضل..."
          className="w-full h-12 pr-11 pl-4 bg-muted-bg border border-border-subtle rounded-2xl text-xs font-bold text-charcoal outline-none focus:border-brand-teal/30 focus:bg-white transition-all"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setQuery('')}
              className="absolute left-4 p-1 rounded-full bg-gray-200 text-gray-500"
            >
              <X className="w-3 h-3" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

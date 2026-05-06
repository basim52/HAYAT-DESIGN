import { Home, LayoutGrid, ShoppingBag, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  onNavClick: (id: string) => void;
  onCartClick: () => void;
  cartCount: number;
}

export default function BottomNav({ onNavClick, onCartClick, cartCount }: BottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-t border-border-subtle pb-safe">
      <div className="flex items-center justify-around py-3 px-2">
        <button
          onClick={() => onNavClick('home')}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="p-2 rounded-xl group-active:bg-brand-purple/10 transition-colors">
            <Home className="w-5 h-5 text-gray-500 group-hover:text-brand-purple transition-colors" />
          </div>
          <span className="text-[10px] font-bold text-gray-400 group-hover:text-brand-purple">الرئيسية</span>
        </button>

        <button
          onClick={() => onNavClick('categories')}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="p-2 rounded-xl group-active:bg-brand-purple/10 transition-colors">
            <LayoutGrid className="w-5 h-5 text-gray-500 group-hover:text-brand-purple transition-colors" />
          </div>
          <span className="text-[10px] font-bold text-gray-400 group-hover:text-brand-purple">الأقسام</span>
        </button>

        <button
          onClick={onCartClick}
          className="flex flex-col items-center gap-1 group relative"
        >
          <div className="p-2 rounded-xl group-active:bg-brand-teal/10 transition-colors">
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-gray-500 group-hover:text-brand-teal transition-colors" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-brand-purple text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border border-white font-bold"
                >
                  {cartCount}
                </motion.span>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 group-hover:text-brand-teal">السلة</span>
        </button>

        <button
          onClick={() => onNavClick('contact')}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="p-2 rounded-xl group-active:bg-gold/10 transition-colors">
            <MessageSquare className="w-5 h-5 text-gray-500 group-hover:text-gold transition-colors" />
          </div>
          <span className="text-[10px] font-bold text-gray-400 group-hover:text-gold">تواصل</span>
        </button>
      </div>
    </div>
  );
}

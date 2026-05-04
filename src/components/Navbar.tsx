import { ShoppingBag, Menu, X, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { useAuth } from '../AuthContext';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onNavClick: (sectionId: string) => void;
  onLoginClick: () => void;
}

export default function Navbar({ cartCount, onCartClick, onNavClick, onLoginClick }: NavbarProps) {
  const { user, profile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'الرئيسية', id: 'home' },
    { name: 'أقسامنا', id: 'categories' },
    { name: 'منتجاتنا', id: 'products' },
    { name: 'تواصل معنا', id: 'contact' },
  ];

  const handleLinkClick = (id: string) => {
    onNavClick(id);
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism py-4 px-8 flex items-center justify-between">
      <div className="flex items-center gap-10">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => onNavClick('home')}
        >
          <div className="flex flex-col items-start leading-none group">
            <span className="text-2xl font-bold tracking-tighter text-brand-purple">
              حياة <span className="text-brand-teal">ديزاين</span>
            </span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em] mr-0.5 group-hover:text-brand-teal transition-colors">HAYAT DESIGN</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className="text-xs font-bold text-gray-500 hover:text-brand-purple transition-all duration-300 relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-brand-teal transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-4">
        <button 
          onClick={onLoginClick}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-muted-bg text-charcoal rounded-full hover:bg-brand-purple hover:text-white transition-all group"
        >
          <span className="text-[9px] sm:text-[10px] font-bold hidden xs:inline uppercase tracking-widest">
            {user ? (profile?.fullName?.split(' ')[0] || 'حسابي') : 'دخول'}
          </span>
          <UserIcon className="w-3.5 h-3.5 sm:w-4 h-4" />
        </button>

        <button
          onClick={onCartClick}
          className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-muted-bg text-charcoal rounded-full hover:bg-brand-teal hover:text-white transition-all group"
        >
          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          {cartCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-brand-purple text-white text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full border-2 border-white font-bold"
            >
              {cartCount}
            </motion.span>
          )}
        </button>

        <button 
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden p-2 hover:bg-muted-bg rounded-full transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[280px] bg-white z-[70] p-8 lux-shadow"
            >
              <div className="flex justify-between items-center mb-12">
                <span className="text-xl font-bold font-display">القائمة</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleLinkClick(link.id)}
                    className="text-lg font-medium text-right hover:text-gold transition-colors"
                  >
                    {link.name}
                  </button>
                ))}
              </div>
              <div className="absolute bottom-12 left-8 right-8">
                <div className="p-4 bg-gold-light rounded-2xl border border-gold/10">
                  <p className="text-xs text-charcoal/60 mb-2">تواصل معنا</p>
                  <p className="font-bold text-sm">Hayat.Design@contact.com</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

import { ArrowLeft, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

interface Banner {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
}

interface HeroProps {
  onShopClick: () => void;
  heroImage: string;
  banners?: Banner[];
}

export default function Hero({ onShopClick, heroImage, banners = [] }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const currentBanner = banners[currentIndex];

  return (
    <section id="home" className="py-12 md:py-20 lg:py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white p-8 md:p-16 rounded-[40px] border border-border-subtle flex flex-col md:flex-row items-center gap-12 shadow-sm relative overflow-hidden min-h-[500px]"
        >
          {/* Subtle background flair */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex-1 relative z-10 text-right">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-brand-teal font-bold text-xs uppercase tracking-[0.2em] mb-4 block">
                  {currentBanner?.subtitle || 'تصميم وإنتاج فني'}
                </span>
                <h1 className="text-3xl md:text-6xl font-extrabold leading-[1.1] mb-6 text-brand-purple">
                  {currentBanner?.title ? (
                    <>
                      {currentBanner.title.split(' ').slice(0, 2).join(' ')} <br />
                      <span className="text-brand-teal">{currentBanner.title.split(' ').slice(2).join(' ')}</span>
                    </>
                  ) : (
                    <>
                      لمسات إبداعية <br />
                      <span className="text-brand-teal">تصنع الفرق</span>
                    </>
                  )}
                </h1>
                <p className="text-gray-500 text-xs md:text-lg mb-8 max-w-md ml-0 mr-auto leading-relaxed">
                  نحن نجمع بين تكنولوجيا قص الليزر وفن العمل اليدوي لننتج قطعاً فنية فريدة من الأكريليك والخشب تعكس هويتك وتلهم خيالك.
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row-reverse items-center gap-4 sm:gap-6">
              <button
                onClick={onShopClick}
                className="w-full sm:w-auto bg-brand-purple text-white px-10 py-4 rounded-full text-sm font-extrabold hover:bg-brand-teal transition-all duration-300 transform hover:scale-105 shadow-lg shadow-brand-purple/20"
              >
                تسوق الآن
              </button>
              <button 
                onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-[10px] sm:text-xs font-bold text-gray-400 hover:text-charcoal transition-colors uppercase tracking-widest"
              >
                اكتشف الأقسام
              </button>
            </div>
            
            {banners.length > 1 && (
              <div className="flex gap-2 justify-end mt-12">
                {banners.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${currentIndex === idx ? 'w-8 bg-brand-purple' : 'w-2 bg-gray-200'}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-full md:w-[320px] lg:w-[400px] aspect-square bg-muted-bg rounded-3xl flex items-center justify-center border border-dashed border-gold/40 relative group overflow-hidden">
             <AnimatePresence mode="wait">
               <motion.img 
                  key={currentIndex}
                  src={currentBanner?.image || heroImage} 
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700" 
               />
             </AnimatePresence>
             <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

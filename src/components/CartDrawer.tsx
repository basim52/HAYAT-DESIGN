import { X, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  onContinueShopping
}: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col border-l border-border-subtle"
          >
            <div className="p-8 flex justify-between items-center border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold tracking-tighter">مراجعة الطلب</h2>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-muted-bg px-2 py-0.5 rounded-full">
                  {items.length} منتجات
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-muted-bg rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                  <ShoppingBag className="w-12 h-12 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest mb-8">السلة فارغة</p>
                  <button
                    onClick={onContinueShopping}
                    className="px-8 py-3 bg-brand-purple text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-purple/20 hover:scale-105 transition-all active:scale-95"
                  >
                    متابعة التسوق
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-5 p-4 rounded-2xl bg-body-bg border border-border-subtle"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white border border-border-subtle">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-extrabold text-[13px] text-[#2C2C2C] leading-tight">{item.name}</h3>
                        <button 
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا المنتج من السلة؟')) {
                              onRemove(item.id);
                            }
                          }}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 bg-white rounded-lg px-2 py-1 border border-border-subtle">
                          <button 
                            onClick={() => {
                              if (item.quantity === 1) {
                                if (confirm('هل أنت متأكد من حذف هذا المنتج من السلة؟')) {
                                  onUpdateQuantity(item.id, -1);
                                }
                              } else {
                                onUpdateQuantity(item.id, -1);
                              }
                            }} 
                            className="p-1 hover:bg-muted-bg rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[11px] font-extrabold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:bg-muted-bg rounded">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-sm font-extrabold text-gold">
                          {item.price * item.quantity} ر.س
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-8 bg-body-bg border-t border-border-subtle">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-400 text-xs font-extrabold uppercase tracking-widest">الإجمالي</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-charcoal">{total}</span>
                    <span className="text-xs font-bold text-gray-400">ر.س</span>
                  </div>
                </div>
                <button
                  onClick={onCheckout}
                  className="w-full py-5 bg-[#2C2C2C] text-white rounded-2xl font-extrabold shadow-lg hover:bg-gold transition-all duration-300 transform active:scale-95 mb-3"
                >
                  إتمام الطلب
                </button>
                <button
                  onClick={onContinueShopping}
                  className="w-full py-4 bg-white text-gray-400 border border-gray-100 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-muted-bg transition-all"
                >
                  متابعة التسوق
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

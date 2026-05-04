import { X, Send, Landmark, Copy, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, FormEvent, useEffect } from 'react';
import { BANK_DETAILS } from '../constants';
import { CartItem, UserProfile } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  userProfile: UserProfile | null;
}

export default function CheckoutModal({ isOpen, onClose, cartItems, userProfile }: CheckoutModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        customerName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
      });
    }
  }, [userProfile, isOpen]);

  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCopyIban = () => {
    navigator.clipboard.writeText(BANK_DETAILS.iban);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleWhatsAppOrder = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Save to Firestore first
      if (userProfile) {
        await addDoc(collection(db, 'orders'), {
          userId: userProfile.id,
          ...formData,
          items: cartItems,
          total,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }

      const itemsList = cartItems
        .map(item => `• ${item.name} (الكمية: ${item.quantity}) - السعر: ${item.price * item.quantity} ر.س`)
        .join('\n');

      const message = `*طلب جديد من حياة ديزاين*\n\n` +
        `*بيانات العميل:*\n` +
        `الاسم: ${formData.customerName}\n` +
        `رقم الجوال: ${formData.phone}\n` +
        `العنوان: ${formData.address}\n\n` +
        `*تفاصيل الطلب:*\n${itemsList}\n\n` +
        `*الإجمالي: ${total} ر.س*\n\n` +
        `سأقوم بإرسال صورة إيصال التحويل البنكي الآن.`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${BANK_DETAILS.whatsappNumber}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      onClose();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تسجيل الطلب، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] overflow-y-auto bg-white z-[160] rounded-[48px] lux-shadow p-8 md:p-12"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-display font-bold">تأكيد الطلب</h2>
              <button 
                onClick={onClose}
                className="p-3 bg-gold-light hover:bg-gold/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Bank Details */}
              <div className="space-y-8">
                <div className="p-6 bg-gold-light/40 rounded-3xl border border-gold/10 relative overflow-hidden">
                  <div className="absolute -top-4 -left-4 w-24 h-24 bg-gold/5 rounded-full" />
                  <div className="flex items-center gap-3 mb-6">
                    <Landmark className="w-6 h-6 text-gold" />
                    <h3 className="font-bold">بيانات التحويل البنكي</h3>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-charcoal/40 mb-1">اسم البنك</p>
                      <p className="font-bold">{BANK_DETAILS.bankName}</p>
                    </div>
                    <div>
                      <p className="text-charcoal/40 mb-1">اسم الحساب</p>
                      <p className="font-bold">{BANK_DETAILS.accountName}</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-charcoal/40 mb-1">رقم الآيبان (IBAN)</p>
                      <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-gold/10">
                        <code className="text-xs font-mono font-bold tracking-wider">{BANK_DETAILS.iban}</code>
                        <button 
                          onClick={handleCopyIban}
                          className="p-2 hover:bg-gold-light rounded-lg transition-colors flex-shrink-0"
                          title="نسخ الآيبان"
                        >
                          {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gold" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-green-800 leading-relaxed">
                    يرجى تحويل مبلغ <span className="font-bold">{total} ر.س</span> ثم تعبئة بياناتك لإرسال الطلب عبر الواتساب مع إرفاق صورة التحويل.
                  </p>
                </div>
              </div>

              {/* Customer Form */}
              <form onSubmit={handleWhatsAppOrder} className="space-y-5">
                <h3 className="font-bold mb-4">بيانات التوصيل</h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold mr-2 text-charcoal/60">الاسم الكامل</label>
                    <input
                      required
                      type="text"
                      placeholder="أدخل اسمك الثلاثي"
                      className="w-full px-5 py-4 bg-body-bg border border-gold/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all"
                      value={formData.customerName}
                      onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold mr-2 text-charcoal/60">رقم الجوال</label>
                    <input
                      required
                      type="tel"
                      placeholder="05xxxxxxx"
                      className="w-full px-5 py-4 bg-body-bg border border-gold/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold mr-2 text-charcoal/60">عنوان التوصيل / الاستلام</label>
                    <textarea
                      required
                      placeholder="المدينة، الحي، اسم الشارع، تفاصيل أخرى"
                      rows={3}
                      className="w-full px-5 py-4 bg-body-bg border border-gold/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all resize-none"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-green-600 text-white rounded-[24px] font-bold text-lg hover:bg-green-700 transition-all duration-300 shadow-xl shadow-green-600/10 flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Send className="w-5 h-5 -rotate-45" />
                      <span>إرسال الطلب وإيصال التحويل</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
